'use server';

/**
 * Care Package Server Actions
 *
 * Full CRUD for care packages, visit types, and scheduled visits.
 * Includes schedule generation from recurring patterns and unassigned visit queue.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, isNull, gte, lte, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  carePackages,
  visitTypes,
  scheduledVisits,
  organisations,
} from '@/lib/db/schema';
import type {
  CarePackage,
  VisitType,
  ScheduledVisit,
} from '@/lib/db/schema/care-packages';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createCarePackageSchema,
  updateCarePackageSchema,
  createVisitTypeSchema,
  updateVisitTypeSchema,
  createScheduledVisitSchema,
  updateScheduledVisitSchema,
  generateScheduleSchema,
} from './schema';
import type {
  CreateCarePackageInput,
  UpdateCarePackageInput,
  CreateVisitTypeInput,
  UpdateVisitTypeInput,
  CreateScheduledVisitInput,
  UpdateScheduledVisitInput,
  GenerateScheduleInput,
} from './schema';
import { generateSchedule } from './scheduling';

// Re-export for external use
export type {
  CreateCarePackageInput,
  UpdateCarePackageInput,
  CreateVisitTypeInput,
  UpdateVisitTypeInput,
  CreateScheduledVisitInput,
  UpdateScheduledVisitInput,
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

// =========================================================================
// CARE PACKAGES
// =========================================================================

// ---------------------------------------------------------------------------
// List care packages for a person
// ---------------------------------------------------------------------------

export type CarePackageListItem = {
  id: string;
  personId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  reviewDate: string | null;
  fundingType: string;
  weeklyHours: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CarePackageListResult = {
  packages: CarePackageListItem[];
  totalCount: number;
};

export async function listCarePackages(
  personId: string,
): Promise<CarePackageListResult> {
  const { orgId } = await requirePermission('read', 'care_plans');

  const conditions = [
    eq(carePackages.organisationId, orgId),
    eq(carePackages.personId, personId),
    isNull(carePackages.deletedAt),
  ];

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: carePackages.id,
        personId: carePackages.personId,
        status: carePackages.status,
        startDate: carePackages.startDate,
        endDate: carePackages.endDate,
        reviewDate: carePackages.reviewDate,
        fundingType: carePackages.fundingType,
        weeklyHours: carePackages.weeklyHours,
        createdAt: carePackages.createdAt,
        updatedAt: carePackages.updatedAt,
      })
      .from(carePackages)
      .where(whereClause)
      .orderBy(desc(carePackages.createdAt)),
    db.select({ count: count() }).from(carePackages).where(whereClause),
  ]);

  return {
    packages: rows,
    totalCount: countResult[0]?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Get single care package (with visit types)
// ---------------------------------------------------------------------------

export type CarePackageWithVisitTypes = CarePackage & {
  visitTypesList: VisitType[];
};

export async function getCarePackage(
  carePackageId: string,
): Promise<CarePackageWithVisitTypes | null> {
  const { orgId } = await requirePermission('read', 'care_plans');

  const [pkg] = await db
    .select()
    .from(carePackages)
    .where(
      and(eq(carePackages.id, carePackageId), isNull(carePackages.deletedAt)),
    )
    .limit(1);

  if (!pkg) return null;

  assertBelongsToOrg(pkg.organisationId, orgId);

  const vtList = await db
    .select()
    .from(visitTypes)
    .where(eq(visitTypes.carePackageId, carePackageId))
    .orderBy(asc(visitTypes.timeWindowStart));

  return { ...pkg, visitTypesList: vtList };
}

// ---------------------------------------------------------------------------
// Create care package
// ---------------------------------------------------------------------------

export async function createCarePackage(
  input: CreateCarePackageInput,
): Promise<ActionResult<CarePackage>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');

    const parsed = createCarePackageSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [pkg] = await db
      .insert(carePackages)
      .values({
        organisationId: orgId,
        personId: data.personId,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        reviewDate: data.reviewDate ?? null,
        fundingType: data.fundingType,
        commissioners: data.commissioners,
        environmentNotes: data.environmentNotes,
        weeklyHours: data.weeklyHours ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    await auditLog('create', 'care_package', pkg.id, {
      before: null,
      after: { personId: data.personId, fundingType: data.fundingType },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/care-package`);
    }

    return { success: true, data: pkg };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createCarePackage] Error:', error);
    return { success: false, error: 'Failed to create care package' };
  }
}

// ---------------------------------------------------------------------------
// Update care package
// ---------------------------------------------------------------------------

export async function updateCarePackage(
  carePackageId: string,
  input: UpdateCarePackageInput,
): Promise<ActionResult<CarePackage>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');

    const parsed = updateCarePackageSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(carePackages)
      .where(
        and(eq(carePackages.id, carePackageId), isNull(carePackages.deletedAt)),
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Care package not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof carePackages.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.status !== undefined) updates.status = data.status;
    if (data.startDate !== undefined) updates.startDate = data.startDate;
    if (data.endDate !== undefined) updates.endDate = data.endDate;
    if (data.reviewDate !== undefined) updates.reviewDate = data.reviewDate;
    if (data.fundingType !== undefined) updates.fundingType = data.fundingType;
    if (data.commissioners !== undefined) updates.commissioners = data.commissioners;
    if (data.environmentNotes !== undefined) updates.environmentNotes = data.environmentNotes;
    if (data.weeklyHours !== undefined) updates.weeklyHours = data.weeklyHours;
    if (data.notes !== undefined) updates.notes = data.notes;

    const [updated] = await db
      .update(carePackages)
      .set(updates)
      .where(eq(carePackages.id, carePackageId))
      .returning();

    await auditLog('update', 'care_package', carePackageId, {
      before: { status: existing.status, fundingType: existing.fundingType },
      after: { status: updated.status, fundingType: updated.fundingType },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/care-package`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateCarePackage] Error:', error);
    return { success: false, error: 'Failed to update care package' };
  }
}

// ---------------------------------------------------------------------------
// Archive (soft delete) care package
// ---------------------------------------------------------------------------

export async function archiveCarePackage(
  carePackageId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');

    const [existing] = await db
      .select()
      .from(carePackages)
      .where(
        and(eq(carePackages.id, carePackageId), isNull(carePackages.deletedAt)),
      )
      .limit(1);

    if (!existing) return { success: false, error: 'Care package not found' };

    assertBelongsToOrg(existing.organisationId, orgId);

    await db
      .update(carePackages)
      .set({ status: 'ended', deletedAt: new Date() })
      .where(eq(carePackages.id, carePackageId));

    await auditLog('archive', 'care_package', carePackageId, {
      before: { status: existing.status },
      after: { status: 'ended' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/care-package`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to archive care package' };
  }
}

// =========================================================================
// VISIT TYPES
// =========================================================================

// ---------------------------------------------------------------------------
// Create visit type
// ---------------------------------------------------------------------------

export async function createVisitType(
  input: CreateVisitTypeInput,
): Promise<ActionResult<VisitType>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');

    const parsed = createVisitTypeSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify care package belongs to org
    const [pkg] = await db
      .select({ organisationId: carePackages.organisationId, personId: carePackages.personId })
      .from(carePackages)
      .where(eq(carePackages.id, data.carePackageId))
      .limit(1);

    if (!pkg) return { success: false, error: 'Care package not found' };
    assertBelongsToOrg(pkg.organisationId, orgId);

    const [vt] = await db
      .insert(visitTypes)
      .values({
        carePackageId: data.carePackageId,
        organisationId: orgId,
        name: data.name,
        duration: data.duration,
        timeWindowStart: data.timeWindowStart,
        timeWindowEnd: data.timeWindowEnd,
        taskList: data.taskList,
        frequency: data.frequency,
        customPattern: data.customPattern ?? null,
      })
      .returning();

    await auditLog('create', 'visit_type', vt.id, {
      before: null,
      after: { name: data.name, carePackageId: data.carePackageId },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${pkg.personId}/care-package`);
    }

    return { success: true, data: vt };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createVisitType] Error:', error);
    return { success: false, error: 'Failed to create visit type' };
  }
}

// ---------------------------------------------------------------------------
// Update visit type
// ---------------------------------------------------------------------------

export async function updateVisitType(
  visitTypeId: string,
  input: UpdateVisitTypeInput,
): Promise<ActionResult<VisitType>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');

    const parsed = updateVisitTypeSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(visitTypes)
      .where(eq(visitTypes.id, visitTypeId))
      .limit(1);

    if (!existing) return { success: false, error: 'Visit type not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof visitTypes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updates.name = data.name;
    if (data.duration !== undefined) updates.duration = data.duration;
    if (data.timeWindowStart !== undefined) updates.timeWindowStart = data.timeWindowStart;
    if (data.timeWindowEnd !== undefined) updates.timeWindowEnd = data.timeWindowEnd;
    if (data.taskList !== undefined) updates.taskList = data.taskList;
    if (data.frequency !== undefined) updates.frequency = data.frequency;
    if (data.customPattern !== undefined) updates.customPattern = data.customPattern;

    const [updated] = await db
      .update(visitTypes)
      .set(updates)
      .where(eq(visitTypes.id, visitTypeId))
      .returning();

    await auditLog('update', 'visit_type', visitTypeId, {
      before: { name: existing.name },
      after: { name: updated.name },
    }, { userId, organisationId: orgId });

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateVisitType] Error:', error);
    return { success: false, error: 'Failed to update visit type' };
  }
}

// ---------------------------------------------------------------------------
// Delete visit type
// ---------------------------------------------------------------------------

export async function deleteVisitType(
  visitTypeId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('delete', 'care_plans');

    const [existing] = await db
      .select()
      .from(visitTypes)
      .where(eq(visitTypes.id, visitTypeId))
      .limit(1);

    if (!existing) return { success: false, error: 'Visit type not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(visitTypes).where(eq(visitTypes.id, visitTypeId));

    await auditLog('delete', 'visit_type', visitTypeId, {
      before: { name: existing.name },
      after: null,
    }, { userId, organisationId: orgId });

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete visit type' };
  }
}

// =========================================================================
// SCHEDULED VISITS
// =========================================================================

// ---------------------------------------------------------------------------
// Generate schedule from recurring patterns
// ---------------------------------------------------------------------------

export async function generateVisitSchedule(
  input: GenerateScheduleInput,
): Promise<ActionResult<{ count: number }>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');

    const parsed = generateScheduleSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Get care package
    const [pkg] = await db
      .select()
      .from(carePackages)
      .where(
        and(
          eq(carePackages.id, data.carePackageId),
          isNull(carePackages.deletedAt),
        ),
      )
      .limit(1);

    if (!pkg) return { success: false, error: 'Care package not found' };
    assertBelongsToOrg(pkg.organisationId, orgId);

    // Get visit types
    const vtList = await db
      .select()
      .from(visitTypes)
      .where(eq(visitTypes.carePackageId, data.carePackageId));

    if (vtList.length === 0) {
      return { success: false, error: 'No visit types defined for this care package' };
    }

    // Generate planned visits
    const planned = generateSchedule({
      visitTypes: vtList,
      personId: pkg.personId,
      startDate: data.startDate,
      endDate: data.endDate,
      weekAStartDate: pkg.startDate,
    });

    if (planned.length === 0) {
      return { success: true, data: { count: 0 } };
    }

    // Batch insert
    await db.insert(scheduledVisits).values(
      planned.map((v) => ({
        visitTypeId: v.visitTypeId,
        carePackageId: v.carePackageId,
        personId: v.personId,
        organisationId: orgId,
        date: v.date,
        scheduledStart: v.scheduledStart,
        scheduledEnd: v.scheduledEnd,
        isAdHoc: false,
        status: 'scheduled' as const,
      })),
    );

    await auditLog('generate_schedule', 'care_package', data.carePackageId, {
      before: null,
      after: { startDate: data.startDate, endDate: data.endDate, visitCount: planned.length },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${pkg.personId}/care-package`);
      revalidatePath(`/${slug}/scheduling`);
    }

    return { success: true, data: { count: planned.length } };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[generateVisitSchedule] Error:', error);
    return { success: false, error: 'Failed to generate schedule' };
  }
}

// ---------------------------------------------------------------------------
// Create ad-hoc visit
// ---------------------------------------------------------------------------

export async function createScheduledVisit(
  input: CreateScheduledVisitInput,
): Promise<ActionResult<ScheduledVisit>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');

    const parsed = createScheduledVisitSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify care package belongs to org
    const [pkg] = await db
      .select({ organisationId: carePackages.organisationId })
      .from(carePackages)
      .where(eq(carePackages.id, data.carePackageId))
      .limit(1);

    if (!pkg) return { success: false, error: 'Care package not found' };
    assertBelongsToOrg(pkg.organisationId, orgId);

    const [visit] = await db
      .insert(scheduledVisits)
      .values({
        visitTypeId: data.visitTypeId ?? null,
        carePackageId: data.carePackageId,
        personId: data.personId,
        organisationId: orgId,
        assignedStaffId: data.assignedStaffId ?? null,
        date: data.date,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        isAdHoc: data.isAdHoc,
        notes: data.notes ?? null,
        status: 'scheduled',
      })
      .returning();

    await auditLog('create', 'scheduled_visit', visit.id, {
      before: null,
      after: { date: data.date, isAdHoc: data.isAdHoc },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/care-package`);
      revalidatePath(`/${slug}/scheduling`);
    }

    return { success: true, data: visit };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createScheduledVisit] Error:', error);
    return { success: false, error: 'Failed to create scheduled visit' };
  }
}

// ---------------------------------------------------------------------------
// Update scheduled visit (assign staff, change status, amend time)
// ---------------------------------------------------------------------------

export async function updateScheduledVisit(
  visitId: string,
  input: UpdateScheduledVisitInput,
): Promise<ActionResult<ScheduledVisit>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');

    const parsed = updateScheduledVisitSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(scheduledVisits)
      .where(eq(scheduledVisits.id, visitId))
      .limit(1);

    if (!existing) return { success: false, error: 'Visit not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof scheduledVisits.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.assignedStaffId !== undefined) updates.assignedStaffId = data.assignedStaffId;
    if (data.date !== undefined) updates.date = data.date;
    if (data.scheduledStart !== undefined) updates.scheduledStart = data.scheduledStart;
    if (data.scheduledEnd !== undefined) updates.scheduledEnd = data.scheduledEnd;
    if (data.status !== undefined) updates.status = data.status;
    if (data.notes !== undefined) updates.notes = data.notes;

    const [updated] = await db
      .update(scheduledVisits)
      .set(updates)
      .where(eq(scheduledVisits.id, visitId))
      .returning();

    await auditLog('update', 'scheduled_visit', visitId, {
      before: { status: existing.status, assignedStaffId: existing.assignedStaffId },
      after: { status: updated.status, assignedStaffId: updated.assignedStaffId },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/care-package`);
      revalidatePath(`/${slug}/scheduling`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateScheduledVisit] Error:', error);
    return { success: false, error: 'Failed to update visit' };
  }
}

// ---------------------------------------------------------------------------
// Get visits for a date range (person scope or org-wide)
// ---------------------------------------------------------------------------

export type ScheduledVisitWithStaff = ScheduledVisit & {
  staffName: string | null;
};

export async function getVisitsForDateRange({
  startDate,
  endDate,
  personId,
  carePackageId,
}: {
  startDate: string;
  endDate: string;
  personId?: string;
  carePackageId?: string;
}): Promise<ScheduledVisitWithStaff[]> {
  const { orgId } = await requirePermission('read', 'care_plans');

  const conditions = [
    eq(scheduledVisits.organisationId, orgId),
    gte(scheduledVisits.date, startDate),
    lte(scheduledVisits.date, endDate),
  ];

  if (personId) {
    conditions.push(eq(scheduledVisits.personId, personId));
  }
  if (carePackageId) {
    conditions.push(eq(scheduledVisits.carePackageId, carePackageId));
  }

  const rows = await db
    .select()
    .from(scheduledVisits)
    .where(and(...conditions))
    .orderBy(asc(scheduledVisits.date), asc(scheduledVisits.scheduledStart));

  // For now return without join — staff name resolved at component level
  return rows.map((r) => ({ ...r, staffName: null }));
}

// ---------------------------------------------------------------------------
// Get unassigned visits for an org
// ---------------------------------------------------------------------------

export async function getUnassignedVisits({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}): Promise<ScheduledVisit[]> {
  const { orgId } = await requirePermission('read', 'rota');

  return db
    .select()
    .from(scheduledVisits)
    .where(
      and(
        eq(scheduledVisits.organisationId, orgId),
        isNull(scheduledVisits.assignedStaffId),
        eq(scheduledVisits.status, 'scheduled'),
        gte(scheduledVisits.date, startDate),
        lte(scheduledVisits.date, endDate),
      ),
    )
    .orderBy(asc(scheduledVisits.date), asc(scheduledVisits.scheduledStart));
}

// ---------------------------------------------------------------------------
// Assign staff to visit
// ---------------------------------------------------------------------------

export async function assignStaffToVisit(
  visitId: string,
  staffId: string | null,
): Promise<ActionResult<ScheduledVisit>> {
  return updateScheduledVisit(visitId, { assignedStaffId: staffId });
}
