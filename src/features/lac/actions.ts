'use server';

/**
 * LAC Documentation Hub — Server Actions
 *
 * CRUD for LAC records, placement plans, and status change audit trail.
 * Includes overdue placement plan detection.
 *
 * Flow: Zod validate -> auth -> RBAC (ofsted resource) -> tenant -> audit.
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, eq, desc, lte, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  lacRecords,
  placementPlans,
  lacStatusChanges,
  organisations,
  users,
  childrensRegister,
  persons,
} from '@/lib/db/schema';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import type { LacRecord } from '@/lib/db/schema/lac';
import type { PlacementPlan } from '@/lib/db/schema/lac';
import type { LacStatusChange } from '@/lib/db/schema/lac';
import type { EmergencyContact } from '@/lib/db/schema/persons';
import {
  createLacRecordSchema,
  updateLacRecordSchema,
  createPlacementPlanSchema,
  updatePlacementPlanSchema,
  createStatusChangeSchema,
} from './schema';
import type {
  CreateLacRecordInput,
  UpdateLacRecordInput,
  CreatePlacementPlanInput,
  UpdatePlacementPlanInput,
  CreateStatusChangeInput,
} from './schema';

// Re-export types for external use
export type {
  CreateLacRecordInput,
  UpdateLacRecordInput,
  CreatePlacementPlanInput,
  UpdatePlacementPlanInput,
  CreateStatusChangeInput,
} from './schema';

// ---------------------------------------------------------------------------
// Helper: get org slug for revalidation
// ---------------------------------------------------------------------------

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

async function syncRegisterEntryFromLacRecord(
  orgId: string,
  lacRecord: Pick<
    LacRecord,
    | 'personId'
    | 'admissionDate'
    | 'legalStatus'
    | 'placingAuthority'
    | 'socialWorkerName'
    | 'socialWorkerEmail'
    | 'socialWorkerPhone'
    | 'iroName'
  >,
) {
  const [person] = await db
    .select({ emergencyContacts: persons.emergencyContacts })
    .from(persons)
    .where(eq(persons.id, lacRecord.personId))
    .limit(1);

  const emergencyContact = [...((person?.emergencyContacts ?? []) as EmergencyContact[])]
    .sort((a, b) => a.priority - b.priority)[0];

  const payload = {
    organisationId: orgId,
    personId: lacRecord.personId,
    admissionDate: lacRecord.admissionDate,
    legalStatus: lacRecord.legalStatus,
    placingAuthority: lacRecord.placingAuthority,
    socialWorkerName: lacRecord.socialWorkerName ?? null,
    socialWorkerEmail: lacRecord.socialWorkerEmail ?? null,
    socialWorkerPhone: lacRecord.socialWorkerPhone ?? null,
    iroName: lacRecord.iroName ?? null,
    emergencyContact: emergencyContact
      ? {
          name: emergencyContact.name,
          relationship: emergencyContact.relationship,
          phone: emergencyContact.phone,
          email: emergencyContact.email ?? null,
        }
      : {
          name: 'Not recorded',
          relationship: 'Not recorded',
          phone: 'Not recorded',
          email: null,
        },
  };

  const [existing] = await db
    .select()
    .from(childrensRegister)
    .where(
      and(
        eq(childrensRegister.organisationId, orgId),
        eq(childrensRegister.personId, lacRecord.personId),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(childrensRegister).values(payload);
    return;
  }

  await db
    .update(childrensRegister)
    .set({
      admissionDate: payload.admissionDate,
      legalStatus: payload.legalStatus,
      placingAuthority: payload.placingAuthority,
      socialWorkerName: payload.socialWorkerName,
      socialWorkerEmail: payload.socialWorkerEmail,
      socialWorkerPhone: payload.socialWorkerPhone,
      iroName: payload.iroName,
      emergencyContact: payload.emergencyContact,
      updatedAt: new Date(),
    })
    .where(eq(childrensRegister.id, existing.id));
}

// ---------------------------------------------------------------------------
// LAC Records — CRUD
// ---------------------------------------------------------------------------

/**
 * List all LAC records for a specific person.
 */
export async function listLacRecords(personId: string): Promise<LacRecord[]> {
  const { orgId } = await requirePermission('read', 'ofsted');

  return db
    .select()
    .from(lacRecords)
    .where(
      and(
        eq(lacRecords.organisationId, orgId),
        eq(lacRecords.personId, personId),
      ),
    )
    .orderBy(desc(lacRecords.createdAt));
}

/**
 * Get a single LAC record by ID.
 */
export async function getLacRecord(
  lacRecordId: string,
): Promise<LacRecord | null> {
  const { orgId } = await requirePermission('read', 'ofsted');

  const [record] = await db
    .select()
    .from(lacRecords)
    .where(eq(lacRecords.id, lacRecordId))
    .limit(1);

  if (!record) return null;

  assertBelongsToOrg(record.organisationId, orgId);

  return record;
}

/**
 * Create a LAC record.
 */
export async function createLacRecord(
  input: CreateLacRecordInput,
): Promise<ActionResult<LacRecord>> {
  try {
    const parsed = createLacRecordSchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const [record] = await db
      .insert(lacRecords)
      .values({
        organisationId: orgId,
        personId: parsed.personId,
        legalStatus: parsed.legalStatus,
        legalStatusDate: parsed.legalStatusDate,
        placingAuthority: parsed.placingAuthority,
        socialWorkerName: parsed.socialWorkerName ?? null,
        socialWorkerEmail: parsed.socialWorkerEmail ?? null,
        socialWorkerPhone: parsed.socialWorkerPhone ?? null,
        iroName: parsed.iroName ?? null,
        iroEmail: parsed.iroEmail ?? null,
        iroPhone: parsed.iroPhone ?? null,
        admissionDate: parsed.admissionDate,
      })
      .returning();

    await auditLog('create', 'lac_record', record.id, undefined, {
      userId,
      organisationId: orgId,
    });

    await syncRegisterEntryFromLacRecord(orgId, record);

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${parsed.personId}/lac`);
    }

    return { success: true, data: record };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createLacRecord] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create LAC record',
    };
  }
}

/**
 * Update a LAC record.
 */
export async function updateLacRecord(
  lacRecordId: string,
  input: UpdateLacRecordInput,
): Promise<ActionResult<LacRecord>> {
  try {
    const parsed = updateLacRecordSchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const [existing] = await db
      .select()
      .from(lacRecords)
      .where(eq(lacRecords.id, lacRecordId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'LAC record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(lacRecords)
      .set({
        ...parsed,
        updatedAt: new Date(),
      })
      .where(eq(lacRecords.id, lacRecordId))
      .returning();

    await auditLog(
      'update',
      'lac_record',
      updated.id,
      { before: existing, after: updated },
      { userId, organisationId: orgId },
    );

    await syncRegisterEntryFromLacRecord(orgId, updated);

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/lac`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateLacRecord] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update LAC record',
    };
  }
}

/**
 * Delete a LAC record.
 */
export async function deleteLacRecord(
  lacRecordId: string,
): Promise<ActionResult> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const [existing] = await db
      .select()
      .from(lacRecords)
      .where(eq(lacRecords.id, lacRecordId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'LAC record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(lacRecords).where(eq(lacRecords.id, lacRecordId));

    await auditLog('delete', 'lac_record', lacRecordId, undefined, {
      userId,
      organisationId: orgId,
    });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/lac`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteLacRecord] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete LAC record',
    };
  }
}

// ---------------------------------------------------------------------------
// Status change — records legal status transitions
// ---------------------------------------------------------------------------

/**
 * Change the legal status of a LAC record and create an audit trail entry.
 */
export async function changeLacStatus(
  input: CreateStatusChangeInput,
): Promise<ActionResult<LacStatusChange>> {
  try {
    const parsed = createStatusChangeSchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    // Verify the LAC record exists and belongs to this org
    const [lacRecord] = await db
      .select()
      .from(lacRecords)
      .where(eq(lacRecords.id, parsed.lacRecordId))
      .limit(1);

    if (!lacRecord) {
      return { success: false, error: 'LAC record not found' };
    }

    assertBelongsToOrg(lacRecord.organisationId, orgId);

    // Get the user's name for the audit trail
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Create the status change record
    const [change] = await db
      .insert(lacStatusChanges)
      .values({
        organisationId: orgId,
        lacRecordId: parsed.lacRecordId,
        previousStatus: parsed.previousStatus,
        newStatus: parsed.newStatus,
        changedDate: parsed.changedDate,
        reason: parsed.reason ?? null,
        changedById: userId,
        changedByName: user?.name ?? null,
      })
      .returning();

    // Update the LAC record's legal status
    await db
      .update(lacRecords)
      .set({
        legalStatus: parsed.newStatus,
        legalStatusDate: parsed.changedDate,
        updatedAt: new Date(),
      })
      .where(eq(lacRecords.id, parsed.lacRecordId));

    await auditLog(
      'status_change',
      'lac_record',
      parsed.lacRecordId,
      {
        before: { legalStatus: parsed.previousStatus },
        after: { legalStatus: parsed.newStatus },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${lacRecord.personId}/lac`);
    }

    return { success: true, data: change };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[changeLacStatus] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to change LAC status',
    };
  }
}

/**
 * List status change history for a LAC record.
 */
export async function listStatusChanges(
  lacRecordId: string,
): Promise<LacStatusChange[]> {
  const { orgId } = await requirePermission('read', 'ofsted');

  // Verify the LAC record belongs to this org
  const [lacRecord] = await db
    .select({ organisationId: lacRecords.organisationId })
    .from(lacRecords)
    .where(eq(lacRecords.id, lacRecordId))
    .limit(1);

  if (!lacRecord) return [];
  assertBelongsToOrg(lacRecord.organisationId, orgId);

  return db
    .select()
    .from(lacStatusChanges)
    .where(
      and(
        eq(lacStatusChanges.organisationId, orgId),
        eq(lacStatusChanges.lacRecordId, lacRecordId),
      ),
    )
    .orderBy(desc(lacStatusChanges.changedDate));
}

// ---------------------------------------------------------------------------
// Placement Plans — CRUD
// ---------------------------------------------------------------------------

/**
 * List all placement plans for a specific person.
 */
export async function listPlacementPlans(
  personId: string,
): Promise<PlacementPlan[]> {
  const { orgId } = await requirePermission('read', 'ofsted');

  return db
    .select()
    .from(placementPlans)
    .where(
      and(
        eq(placementPlans.organisationId, orgId),
        eq(placementPlans.personId, personId),
      ),
    )
    .orderBy(desc(placementPlans.createdAt));
}

/**
 * Get a single placement plan by ID.
 */
export async function getPlacementPlan(
  planId: string,
): Promise<PlacementPlan | null> {
  const { orgId } = await requirePermission('read', 'ofsted');

  const [plan] = await db
    .select()
    .from(placementPlans)
    .where(eq(placementPlans.id, planId))
    .limit(1);

  if (!plan) return null;

  assertBelongsToOrg(plan.organisationId, orgId);

  return plan;
}

/**
 * Create a placement plan.
 */
export async function createPlacementPlan(
  input: CreatePlacementPlanInput,
): Promise<ActionResult<PlacementPlan>> {
  try {
    const parsed = createPlacementPlanSchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    // Verify the LAC record exists and belongs to this org
    const [lacRecord] = await db
      .select()
      .from(lacRecords)
      .where(
        and(
          eq(lacRecords.id, parsed.lacRecordId),
          eq(lacRecords.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!lacRecord) {
      return { success: false, error: 'LAC record not found' };
    }

    const [plan] = await db
      .insert(placementPlans)
      .values({
        organisationId: orgId,
        personId: parsed.personId,
        lacRecordId: parsed.lacRecordId,
        dueDate: parsed.dueDate,
        content: parsed.content,
        status: parsed.status,
        reviewDate: parsed.reviewDate ?? null,
      })
      .returning();

    await auditLog('create', 'placement_plan', plan.id, undefined, {
      userId,
      organisationId: orgId,
    });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(
        `/${slug}/persons/${parsed.personId}/lac/placement-plans`,
      );
    }

    return { success: true, data: plan };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createPlacementPlan] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create placement plan',
    };
  }
}

/**
 * Update a placement plan.
 */
export async function updatePlacementPlan(
  planId: string,
  input: UpdatePlacementPlanInput,
): Promise<ActionResult<PlacementPlan>> {
  try {
    const parsed = updatePlacementPlanSchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const [existing] = await db
      .select()
      .from(placementPlans)
      .where(eq(placementPlans.id, planId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Placement plan not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (parsed.content !== undefined) updateData.content = parsed.content;
    if (parsed.status !== undefined) updateData.status = parsed.status;
    if (parsed.completedDate !== undefined)
      updateData.completedDate = parsed.completedDate;
    if (parsed.reviewDate !== undefined)
      updateData.reviewDate = parsed.reviewDate;

    // If marking as completed, also set reviewedById
    if (parsed.status === 'completed') {
      updateData.reviewedById = userId;
      if (!parsed.completedDate) {
        updateData.completedDate = new Date().toISOString().slice(0, 10);
      }
    }

    const [updated] = await db
      .update(placementPlans)
      .set(updateData)
      .where(eq(placementPlans.id, planId))
      .returning();

    await auditLog(
      'update',
      'placement_plan',
      updated.id,
      { before: existing, after: updated },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(
        `/${slug}/persons/${existing.personId}/lac/placement-plans`,
      );
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updatePlacementPlan] Error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update placement plan',
    };
  }
}

/**
 * Get overdue placement plans across the organisation.
 * Finds plans that are pending/draft and past their due date.
 */
export async function getOverduePlacementPlans(): Promise<PlacementPlan[]> {
  const { orgId } = await requirePermission('read', 'ofsted');

  const today = new Date().toISOString().slice(0, 10);

  return db
    .select()
    .from(placementPlans)
    .where(
      and(
        eq(placementPlans.organisationId, orgId),
        lte(placementPlans.dueDate, today),
        isNull(placementPlans.completedDate),
      ),
    )
    .orderBy(placementPlans.dueDate);
}
