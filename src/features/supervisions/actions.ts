'use server';

/**
 * Supervision Server Actions
 *
 * Full CRUD for supervision scheduling and completion.
 * Includes overdue detection, upcoming queries, and calendar data.
 *
 * Flow: Zod validate -> auth -> RBAC (staff resource, manager+) -> tenant -> audit.
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, gte, lte, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { supervisions, organisations, staffProfiles } from '@/lib/db/schema';
import type { Supervision } from '@/lib/db/schema/supervisions';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  scheduleSupervisionSchema,
  completeSupervisionSchema,
  updateSupervisionSchema,
  calculateNextDueDate,
} from './schema';
import type {
  ScheduleSupervisionInput,
  CompleteSupervisionInput,
  UpdateSupervisionInput,
  SupervisionFrequency,
} from './schema';

import type { DevelopmentGoal, ActionAgreed } from '@/lib/db/schema/supervisions';

// Re-export for external use
export type {
  ScheduleSupervisionInput,
  CompleteSupervisionInput,
  UpdateSupervisionInput,
} from './schema';

// ---------------------------------------------------------------------------
// Helper: normalize JSONB arrays to match DB types
// ---------------------------------------------------------------------------

function normalizeGoals(goals: CompleteSupervisionInput['developmentGoals']): DevelopmentGoal[] {
  return (goals ?? []).map((g) => ({
    id: g.id,
    goal: g.goal,
    targetDate: g.targetDate ?? null,
    status: g.status,
    notes: g.notes ?? null,
  }));
}

function normalizeActions(actions: CompleteSupervisionInput['actionsAgreed']): ActionAgreed[] {
  return (actions ?? []).map((a) => ({
    id: a.id,
    action: a.action,
    assigneeId: a.assigneeId ?? null,
    assigneeName: a.assigneeName ?? null,
    deadline: a.deadline ?? null,
    completed: a.completed,
  }));
}

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

// ---------------------------------------------------------------------------
// List supervisions for a staff member
// ---------------------------------------------------------------------------

export type SupervisionListItem = {
  id: string;
  staffProfileId: string;
  supervisorId: string;
  scheduledDate: Date;
  completedDate: Date | null;
  type: string;
  frequency: string;
  status: string;
  nextDueDate: Date | null;
  createdAt: Date;
};

export type SupervisionListResult = {
  supervisions: SupervisionListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listSupervisions({
  staffProfileId,
  page = 1,
  pageSize = 20,
  status,
  type,
}: {
  staffProfileId?: string;
  page?: number;
  pageSize?: number;
  status?: string;
  type?: string;
} = {}): Promise<SupervisionListResult> {
  const { orgId } = await requirePermission('read', 'staff');

  const conditions = [
    eq(supervisions.organisationId, orgId),
  ];

  if (staffProfileId) {
    conditions.push(eq(supervisions.staffProfileId, staffProfileId));
  }

  if (status && status !== 'all') {
    conditions.push(eq(supervisions.status, status));
  }

  if (type && type !== 'all') {
    conditions.push(eq(supervisions.type, type));
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: supervisions.id,
        staffProfileId: supervisions.staffProfileId,
        supervisorId: supervisions.supervisorId,
        scheduledDate: supervisions.scheduledDate,
        completedDate: supervisions.completedDate,
        type: supervisions.type,
        frequency: supervisions.frequency,
        status: supervisions.status,
        nextDueDate: supervisions.nextDueDate,
        createdAt: supervisions.createdAt,
      })
      .from(supervisions)
      .where(whereClause)
      .orderBy(desc(supervisions.scheduledDate))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(supervisions).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    supervisions: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single supervision
// ---------------------------------------------------------------------------

export async function getSupervision(
  supervisionId: string,
): Promise<Supervision | null> {
  const { orgId } = await requirePermission('read', 'staff');

  const [record] = await db
    .select()
    .from(supervisions)
    .where(eq(supervisions.id, supervisionId))
    .limit(1);

  if (!record) return null;

  assertBelongsToOrg(record.organisationId, orgId);

  return record;
}

// ---------------------------------------------------------------------------
// Schedule a supervision
// ---------------------------------------------------------------------------

export async function scheduleSupervision(
  input: ScheduleSupervisionInput,
): Promise<ActionResult<Supervision>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'staff');

    const parsed = scheduleSupervisionSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;
    const nextDue = calculateNextDueDate(
      data.scheduledDate,
      data.frequency as SupervisionFrequency,
    );

    const [record] = await db
      .insert(supervisions)
      .values({
        organisationId: orgId,
        staffProfileId: data.staffProfileId,
        supervisorId: data.supervisorId,
        scheduledDate: new Date(data.scheduledDate),
        type: data.type,
        frequency: data.frequency,
        status: 'scheduled',
        nextDueDate: new Date(nextDue),
        developmentGoals: [],
        actionsAgreed: [],
      })
      .returning();

    await auditLog(
      'create',
      'supervision',
      record.id,
      {
        before: null,
        after: {
          staffProfileId: data.staffProfileId,
          supervisorId: data.supervisorId,
          scheduledDate: data.scheduledDate,
          type: data.type,
          frequency: data.frequency,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${data.staffProfileId}/supervision`);
      revalidatePath(`/${slug}/staff/supervisions`);
    }

    return { success: true, data: record };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[scheduleSupervision] Error:', error);
    return { success: false, error: 'Failed to schedule supervision' };
  }
}

// ---------------------------------------------------------------------------
// Complete a supervision
// ---------------------------------------------------------------------------

export async function completeSupervision(
  supervisionId: string,
  input: CompleteSupervisionInput,
): Promise<ActionResult<Supervision>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'staff');

    const parsed = completeSupervisionSchema.safeParse(input);
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
      .from(supervisions)
      .where(eq(supervisions.id, supervisionId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Supervision record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status === 'cancelled') {
      return { success: false, error: 'Cannot complete a cancelled supervision' };
    }

    const data = parsed.data;
    const now = new Date();

    const [updated] = await db
      .update(supervisions)
      .set({
        completedDate: now,
        status: 'completed',
        workloadDiscussion: data.workloadDiscussion ?? null,
        wellbeingCheck: data.wellbeingCheck ?? null,
        developmentGoals: normalizeGoals(data.developmentGoals),
        concernsRaised: data.concernsRaised ?? null,
        actionsAgreed: normalizeActions(data.actionsAgreed),
        updatedAt: now,
      })
      .where(eq(supervisions.id, supervisionId))
      .returning();

    await auditLog(
      'complete',
      'supervision',
      supervisionId,
      {
        before: { status: existing.status },
        after: {
          status: 'completed',
          completedDate: now.toISOString(),
          workloadDiscussion: data.workloadDiscussion,
          wellbeingCheck: data.wellbeingCheck,
          developmentGoals: data.developmentGoals,
          concernsRaised: data.concernsRaised,
          actionsAgreed: data.actionsAgreed,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/supervision`);
      revalidatePath(`/${slug}/staff/supervisions`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[completeSupervision] Error:', error);
    return { success: false, error: 'Failed to complete supervision' };
  }
}

// ---------------------------------------------------------------------------
// Update supervision
// ---------------------------------------------------------------------------

export async function updateSupervision(
  supervisionId: string,
  input: UpdateSupervisionInput,
): Promise<ActionResult<Supervision>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'staff');

    const parsed = updateSupervisionSchema.safeParse(input);
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
      .from(supervisions)
      .where(eq(supervisions.id, supervisionId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Supervision record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof supervisions.$inferInsert> = {};

    if (data.scheduledDate !== undefined) updates.scheduledDate = new Date(data.scheduledDate);
    if (data.supervisorId !== undefined) updates.supervisorId = data.supervisorId;
    if (data.type !== undefined) updates.type = data.type;
    if (data.frequency !== undefined) updates.frequency = data.frequency;
    if (data.status !== undefined) updates.status = data.status;
    if (data.workloadDiscussion !== undefined) updates.workloadDiscussion = data.workloadDiscussion ?? null;
    if (data.wellbeingCheck !== undefined) updates.wellbeingCheck = data.wellbeingCheck ?? null;
    if (data.developmentGoals !== undefined) updates.developmentGoals = normalizeGoals(data.developmentGoals);
    if (data.concernsRaised !== undefined) updates.concernsRaised = data.concernsRaised ?? null;
    if (data.actionsAgreed !== undefined) updates.actionsAgreed = normalizeActions(data.actionsAgreed);

    // Recalculate next due date if scheduled date or frequency changed
    if (data.scheduledDate || data.frequency) {
      const schedDate = data.scheduledDate ?? existing.scheduledDate.toISOString().slice(0, 10);
      const freq = (data.frequency ?? existing.frequency) as SupervisionFrequency;
      updates.nextDueDate = new Date(calculateNextDueDate(schedDate, freq));
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(supervisions)
      .set(updates)
      .where(eq(supervisions.id, supervisionId))
      .returning();

    await auditLog(
      'update',
      'supervision',
      supervisionId,
      {
        before: {
          ...Object.fromEntries(
            Object.keys(updates).map((k) => [
              k,
              existing[k as keyof typeof existing],
            ]),
          ),
        },
        after: updates,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/supervision`);
      revalidatePath(`/${slug}/staff/supervisions`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateSupervision] Error:', error);
    return { success: false, error: 'Failed to update supervision' };
  }
}

// ---------------------------------------------------------------------------
// Cancel supervision
// ---------------------------------------------------------------------------

export async function cancelSupervision(
  supervisionId: string,
): Promise<ActionResult<Supervision>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'staff');

    const [existing] = await db
      .select()
      .from(supervisions)
      .where(eq(supervisions.id, supervisionId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Supervision record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status === 'completed') {
      return { success: false, error: 'Cannot cancel a completed supervision' };
    }

    const now = new Date();

    const [updated] = await db
      .update(supervisions)
      .set({
        status: 'cancelled',
        updatedAt: now,
      })
      .where(eq(supervisions.id, supervisionId))
      .returning();

    await auditLog(
      'cancel',
      'supervision',
      supervisionId,
      {
        before: { status: existing.status },
        after: { status: 'cancelled' },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/supervision`);
      revalidatePath(`/${slug}/staff/supervisions`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[cancelSupervision] Error:', error);
    return { success: false, error: 'Failed to cancel supervision' };
  }
}

// ---------------------------------------------------------------------------
// Get overdue supervisions (org-wide compliance query)
// ---------------------------------------------------------------------------

export type OverdueSupervision = {
  id: string;
  staffProfileId: string;
  supervisorId: string;
  scheduledDate: Date;
  type: string;
  frequency: string;
  status: string;
};

export async function getOverdueSupervisions(): Promise<OverdueSupervision[]> {
  const { orgId } = await requirePermission('read', 'staff');

  const now = new Date();

  const rows = await db
    .select({
      id: supervisions.id,
      staffProfileId: supervisions.staffProfileId,
      supervisorId: supervisions.supervisorId,
      scheduledDate: supervisions.scheduledDate,
      type: supervisions.type,
      frequency: supervisions.frequency,
      status: supervisions.status,
    })
    .from(supervisions)
    .where(
      and(
        eq(supervisions.organisationId, orgId),
        eq(supervisions.status, 'scheduled'),
        lte(supervisions.scheduledDate, now),
      ),
    )
    .orderBy(asc(supervisions.scheduledDate))
    .limit(100);

  return rows;
}

// ---------------------------------------------------------------------------
// Get upcoming supervisions (next N days)
// ---------------------------------------------------------------------------

export async function getUpcomingSupervisions({
  withinDays = 30,
  staffProfileId,
}: {
  withinDays?: number;
  staffProfileId?: string;
} = {}): Promise<OverdueSupervision[]> {
  const { orgId } = await requirePermission('read', 'staff');

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + withinDays);

  const conditions = [
    eq(supervisions.organisationId, orgId),
    eq(supervisions.status, 'scheduled'),
    gte(supervisions.scheduledDate, now),
    lte(supervisions.scheduledDate, futureDate),
  ];

  if (staffProfileId) {
    conditions.push(eq(supervisions.staffProfileId, staffProfileId));
  }

  const rows = await db
    .select({
      id: supervisions.id,
      staffProfileId: supervisions.staffProfileId,
      supervisorId: supervisions.supervisorId,
      scheduledDate: supervisions.scheduledDate,
      type: supervisions.type,
      frequency: supervisions.frequency,
      status: supervisions.status,
    })
    .from(supervisions)
    .where(and(...conditions))
    .orderBy(asc(supervisions.scheduledDate))
    .limit(100);

  return rows;
}

// ---------------------------------------------------------------------------
// Get supervisions for calendar view (date range)
// ---------------------------------------------------------------------------

export type CalendarSupervision = {
  id: string;
  staffProfileId: string;
  staffName: string;
  supervisorId: string;
  supervisorName: string;
  scheduledDate: Date;
  completedDate: Date | null;
  type: string;
  status: string;
};

export async function getSupervisionsForCalendar({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}): Promise<CalendarSupervision[]> {
  const { orgId } = await requirePermission('read', 'staff');

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Aliased tables for staff and supervisor joins
  const staffAlias = staffProfiles;

  const rows = await db
    .select({
      id: supervisions.id,
      staffProfileId: supervisions.staffProfileId,
      staffName: staffAlias.fullName,
      supervisorId: supervisions.supervisorId,
      scheduledDate: supervisions.scheduledDate,
      completedDate: supervisions.completedDate,
      type: supervisions.type,
      status: supervisions.status,
    })
    .from(supervisions)
    .innerJoin(staffAlias, eq(supervisions.staffProfileId, staffAlias.id))
    .where(
      and(
        eq(supervisions.organisationId, orgId),
        gte(supervisions.scheduledDate, start),
        lte(supervisions.scheduledDate, end),
      ),
    )
    .orderBy(asc(supervisions.scheduledDate))
    .limit(500);

  // Fetch supervisor names separately to avoid alias complexity
  const supervisorIds = [...new Set(rows.map((r) => r.supervisorId))];
  const supervisorRows = supervisorIds.length > 0
    ? await db
        .select({ id: staffProfiles.id, fullName: staffProfiles.fullName })
        .from(staffProfiles)
        .where(
          and(
            eq(staffProfiles.organisationId, orgId),
          ),
        )
        .limit(500)
    : [];

  const supervisorMap = new Map(supervisorRows.map((s) => [s.id, s.fullName]));

  return rows.map((r) => ({
    ...r,
    supervisorName: supervisorMap.get(r.supervisorId) ?? 'Unknown',
  }));
}

// ---------------------------------------------------------------------------
// Get staff list for supervisor selection
// ---------------------------------------------------------------------------

export type StaffOption = {
  id: string;
  fullName: string;
  jobTitle: string;
};

export async function getStaffOptions(): Promise<StaffOption[]> {
  const { orgId } = await requirePermission('read', 'staff');

  const rows = await db
    .select({
      id: staffProfiles.id,
      fullName: staffProfiles.fullName,
      jobTitle: staffProfiles.jobTitle,
    })
    .from(staffProfiles)
    .where(
      and(
        eq(staffProfiles.organisationId, orgId),
        eq(staffProfiles.status, 'active'),
      ),
    )
    .orderBy(asc(staffProfiles.fullName))
    .limit(500);

  return rows;
}
