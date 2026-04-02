'use server';

/**
 * End-of-Life Care Plan Server Actions
 *
 * CRUD for EoL care plans including DNACPR, ReSPECT, ADRT, LPA,
 * treatment escalation, spiritual needs, and anticipatory medications.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { eolCarePlans, organisations } from '@/lib/db/schema';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const keyContactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  phone: z.string().min(1),
  role: z.string().min(1),
});

const anticipatoryMedicationSchema = z.object({
  medication: z.string().min(1),
  dose: z.string().min(1),
  route: z.string().min(1),
  indication: z.string().min(1),
  prescribedBy: z.string().min(1),
});

const createEolCarePlanSchema = z.object({
  personId: z.string().uuid(),
  preferredPlaceOfDeath: z.string().optional(),
  dnacprInPlace: z.boolean().default(false),
  dnacprFormReference: z.string().optional(),
  dnacprReviewDate: z.string().optional(),
  respectFormCompleted: z.boolean().default(false),
  respectFormReference: z.string().optional(),
  respectPrioritySummary: z.string().optional(),
  adrtInPlace: z.boolean().default(false),
  adrtDetails: z.string().optional(),
  adrtReviewDate: z.string().optional(),
  lpaHealthWelfareInPlace: z.boolean().default(false),
  lpaAttorneyName: z.string().optional(),
  lpaAttorneyContact: z.string().optional(),
  lpaRegistrationReference: z.string().optional(),
  treatmentEscalationPreferences: z.string().optional(),
  spiritualNeeds: z.string().optional(),
  religiousPreferences: z.string().optional(),
  culturalNeeds: z.string().optional(),
  keyContacts: z.array(keyContactSchema).optional(),
  anticipatoryMedications: z.array(anticipatoryMedicationSchema).optional(),
});

// ---------------------------------------------------------------------------
// List / Get
// ---------------------------------------------------------------------------

export async function listEolCarePlans({
  personId,
  page = 1,
  pageSize = 20,
  status,
}: {
  personId?: string;
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const { orgId } = await requirePermission('read', 'clinical');

  const conditions = [eq(eolCarePlans.organisationId, orgId)];
  if (personId) conditions.push(eq(eolCarePlans.personId, personId));
  if (status) conditions.push(eq(eolCarePlans.status, status));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(eolCarePlans)
      .where(whereClause)
      .orderBy(desc(eolCarePlans.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(eolCarePlans).where(whereClause),
  ]);

  return {
    plans: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getEolCarePlan(id: string) {
  const { orgId } = await requirePermission('read', 'clinical');

  const [row] = await db
    .select()
    .from(eolCarePlans)
    .where(eq(eolCarePlans.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createEolCarePlan(
  input: z.infer<typeof createEolCarePlanSchema>,
): Promise<ActionResult<typeof eolCarePlans.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    const parsed = createEolCarePlanSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(eolCarePlans)
      .values({
        organisationId: orgId,
        personId: data.personId,
        preferredPlaceOfDeath: data.preferredPlaceOfDeath ?? null,
        dnacprInPlace: data.dnacprInPlace,
        dnacprFormReference: data.dnacprFormReference ?? null,
        dnacprReviewDate: data.dnacprReviewDate ?? null,
        respectFormCompleted: data.respectFormCompleted,
        respectFormReference: data.respectFormReference ?? null,
        respectPrioritySummary: data.respectPrioritySummary ?? null,
        adrtInPlace: data.adrtInPlace,
        adrtDetails: data.adrtDetails ?? null,
        adrtReviewDate: data.adrtReviewDate ?? null,
        lpaHealthWelfareInPlace: data.lpaHealthWelfareInPlace,
        lpaAttorneyName: data.lpaAttorneyName ?? null,
        lpaAttorneyContact: data.lpaAttorneyContact ?? null,
        lpaRegistrationReference: data.lpaRegistrationReference ?? null,
        treatmentEscalationPreferences: data.treatmentEscalationPreferences ?? null,
        spiritualNeeds: data.spiritualNeeds ?? null,
        religiousPreferences: data.religiousPreferences ?? null,
        culturalNeeds: data.culturalNeeds ?? null,
        keyContacts: data.keyContacts ?? null,
        anticipatoryMedications: data.anticipatoryMedications ?? null,
        status: 'draft',
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    await auditLog('create', 'eol_care_plan', row.id, {
      before: null,
      after: { personId: data.personId, dnacprInPlace: data.dnacprInPlace },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/eol-care`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createEolCarePlan] Error:', error);
    return { success: false, error: 'Failed to create end-of-life care plan' };
  }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateEolCarePlan(
  id: string,
  input: Partial<z.infer<typeof createEolCarePlanSchema>>,
): Promise<ActionResult<typeof eolCarePlans.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'clinical');

    const [existing] = await db
      .select()
      .from(eolCarePlans)
      .where(eq(eolCarePlans.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'EoL care plan not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof eolCarePlans.$inferInsert> = {
      updatedAt: new Date(),
      updatedBy: userId,
    };

    if (input.preferredPlaceOfDeath !== undefined) updates.preferredPlaceOfDeath = input.preferredPlaceOfDeath ?? null;
    if (input.dnacprInPlace !== undefined) updates.dnacprInPlace = input.dnacprInPlace;
    if (input.dnacprFormReference !== undefined) updates.dnacprFormReference = input.dnacprFormReference ?? null;
    if (input.dnacprReviewDate !== undefined) updates.dnacprReviewDate = input.dnacprReviewDate ?? null;
    if (input.respectFormCompleted !== undefined) updates.respectFormCompleted = input.respectFormCompleted;
    if (input.respectFormReference !== undefined) updates.respectFormReference = input.respectFormReference ?? null;
    if (input.respectPrioritySummary !== undefined) updates.respectPrioritySummary = input.respectPrioritySummary ?? null;
    if (input.adrtInPlace !== undefined) updates.adrtInPlace = input.adrtInPlace;
    if (input.adrtDetails !== undefined) updates.adrtDetails = input.adrtDetails ?? null;
    if (input.adrtReviewDate !== undefined) updates.adrtReviewDate = input.adrtReviewDate ?? null;
    if (input.lpaHealthWelfareInPlace !== undefined) updates.lpaHealthWelfareInPlace = input.lpaHealthWelfareInPlace;
    if (input.lpaAttorneyName !== undefined) updates.lpaAttorneyName = input.lpaAttorneyName ?? null;
    if (input.lpaAttorneyContact !== undefined) updates.lpaAttorneyContact = input.lpaAttorneyContact ?? null;
    if (input.lpaRegistrationReference !== undefined) updates.lpaRegistrationReference = input.lpaRegistrationReference ?? null;
    if (input.treatmentEscalationPreferences !== undefined) updates.treatmentEscalationPreferences = input.treatmentEscalationPreferences ?? null;
    if (input.spiritualNeeds !== undefined) updates.spiritualNeeds = input.spiritualNeeds ?? null;
    if (input.religiousPreferences !== undefined) updates.religiousPreferences = input.religiousPreferences ?? null;
    if (input.culturalNeeds !== undefined) updates.culturalNeeds = input.culturalNeeds ?? null;
    if (input.keyContacts !== undefined) updates.keyContacts = input.keyContacts ?? null;
    if (input.anticipatoryMedications !== undefined) updates.anticipatoryMedications = input.anticipatoryMedications ?? null;

    const [updated] = await db
      .update(eolCarePlans)
      .set(updates)
      .where(eq(eolCarePlans.id, id))
      .returning();

    await auditLog('update', 'eol_care_plan', id, {
      before: { status: existing.status, dnacprInPlace: existing.dnacprInPlace },
      after: { status: updated.status, dnacprInPlace: updated.dnacprInPlace },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/eol-care`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateEolCarePlan] Error:', error);
    return { success: false, error: 'Failed to update end-of-life care plan' };
  }
}

// ---------------------------------------------------------------------------
// Activate / Archive
// ---------------------------------------------------------------------------

export async function activateEolCarePlan(
  id: string,
): Promise<ActionResult<typeof eolCarePlans.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('approve', 'clinical');

    const [existing] = await db
      .select()
      .from(eolCarePlans)
      .where(eq(eolCarePlans.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'EoL care plan not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'draft' && existing.status !== 'reviewed') {
      return { success: false, error: 'Only draft or reviewed plans can be activated' };
    }

    const [updated] = await db
      .update(eolCarePlans)
      .set({ status: 'active', updatedAt: new Date(), updatedBy: userId })
      .where(eq(eolCarePlans.id, id))
      .returning();

    await auditLog('activate', 'eol_care_plan', id, {
      before: { status: existing.status },
      after: { status: 'active' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/eol-care`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to activate EoL care plan' };
  }
}

export async function archiveEolCarePlan(
  id: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'clinical');

    const [existing] = await db
      .select()
      .from(eolCarePlans)
      .where(eq(eolCarePlans.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'EoL care plan not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    await db
      .update(eolCarePlans)
      .set({ status: 'archived', updatedAt: new Date(), updatedBy: userId })
      .where(eq(eolCarePlans.id, id));

    await auditLog('archive', 'eol_care_plan', id, {
      before: { status: existing.status },
      after: { status: 'archived' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/eol-care`);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to archive EoL care plan' };
  }
}
