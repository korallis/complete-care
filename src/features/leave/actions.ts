'use server';

/**
 * Leave Management Server Actions
 *
 * Full CRUD for leave requests and balance management.
 * Includes approval workflow, calendar queries, and balance tracking.
 *
 * Flow: Zod validate -> auth -> RBAC (staff resource) -> tenant -> audit.
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, gte, lte, asc, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  leaveRequests,
  leaveBalances,
  organisations,
  staffProfiles,
} from '@/lib/db/schema';
import type { LeaveRequest, LeaveBalance } from '@/lib/db/schema/leave';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  requestLeaveSchema,
  reviewLeaveSchema,
  updateLeaveBalanceSchema,
  currentYear,
} from './schema';
import type {
  RequestLeaveInput,
  ReviewLeaveInput,
  UpdateLeaveBalanceInput,
} from './schema';
import { DEFAULT_ANNUAL_ENTITLEMENT } from './constants';

// Re-export for external use
export type { RequestLeaveInput, ReviewLeaveInput, UpdateLeaveBalanceInput } from './schema';

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
// List leave requests
// ---------------------------------------------------------------------------

export type LeaveRequestListItem = {
  id: string;
  staffProfileId: string;
  staffName: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  reviewNote: string | null;
  createdAt: Date;
};

export type LeaveRequestListResult = {
  requests: LeaveRequestListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listLeaveRequests({
  staffProfileId,
  status,
  page = 1,
  pageSize = 20,
}: {
  staffProfileId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<LeaveRequestListResult> {
  const { orgId } = await requirePermission('read', 'staff');

  const conditions = [eq(leaveRequests.organisationId, orgId)];

  if (staffProfileId) {
    conditions.push(eq(leaveRequests.staffProfileId, staffProfileId));
  }

  if (status && status !== 'all') {
    conditions.push(eq(leaveRequests.status, status));
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: leaveRequests.id,
        staffProfileId: leaveRequests.staffProfileId,
        staffName: staffProfiles.fullName,
        type: leaveRequests.type,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        totalDays: leaveRequests.totalDays,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        reviewedByName: leaveRequests.reviewedByName,
        reviewedAt: leaveRequests.reviewedAt,
        reviewNote: leaveRequests.reviewNote,
        createdAt: leaveRequests.createdAt,
      })
      .from(leaveRequests)
      .innerJoin(
        staffProfiles,
        eq(leaveRequests.staffProfileId, staffProfiles.id),
      )
      .where(whereClause)
      .orderBy(desc(leaveRequests.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(leaveRequests).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    requests: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single leave request
// ---------------------------------------------------------------------------

export async function getLeaveRequest(
  leaveRequestId: string,
): Promise<LeaveRequest | null> {
  const { orgId } = await requirePermission('read', 'staff');

  const [record] = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.id, leaveRequestId))
    .limit(1);

  if (!record) return null;

  assertBelongsToOrg(record.organisationId, orgId);

  return record;
}

// ---------------------------------------------------------------------------
// Request leave (create)
// ---------------------------------------------------------------------------

export async function requestLeave(
  input: RequestLeaveInput,
): Promise<ActionResult<LeaveRequest>> {
  try {
    const { orgId, userId } = await requirePermission('read', 'staff');

    const parsed = requestLeaveSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify staff profile belongs to org
    const [staff] = await db
      .select({ id: staffProfiles.id, organisationId: staffProfiles.organisationId })
      .from(staffProfiles)
      .where(eq(staffProfiles.id, data.staffProfileId))
      .limit(1);

    if (!staff) {
      return { success: false, error: 'Staff profile not found' };
    }

    assertBelongsToOrg(staff.organisationId, orgId);

    const [record] = await db
      .insert(leaveRequests)
      .values({
        organisationId: orgId,
        staffProfileId: data.staffProfileId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays: data.totalDays,
        reason: data.reason ?? null,
        status: 'pending',
      })
      .returning();

    await auditLog(
      'create',
      'leave_request',
      record.id,
      {
        before: null,
        after: {
          staffProfileId: data.staffProfileId,
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          totalDays: data.totalDays,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${data.staffProfileId}/leave`);
      revalidatePath(`/${slug}/staff/leave`);
    }

    return { success: true, data: record };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[requestLeave] Error:', error);
    return { success: false, error: 'Failed to submit leave request' };
  }
}

// ---------------------------------------------------------------------------
// Review leave (approve/deny)
// ---------------------------------------------------------------------------

export async function reviewLeave(
  leaveRequestId: string,
  input: ReviewLeaveInput,
): Promise<ActionResult<LeaveRequest>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'staff');

    const parsed = reviewLeaveSchema.safeParse(input);
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
      .from(leaveRequests)
      .where(eq(leaveRequests.id, leaveRequestId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Leave request not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'pending') {
      return {
        success: false,
        error: `Cannot review a leave request that is already ${existing.status}`,
      };
    }

    const data = parsed.data;
    const now = new Date();

    // Get reviewer name
    const [reviewer] = await db
      .select({ fullName: staffProfiles.fullName })
      .from(staffProfiles)
      .where(
        and(
          eq(staffProfiles.organisationId, orgId),
          eq(staffProfiles.userId, userId),
        ),
      )
      .limit(1);

    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: data.status,
        reviewNote: data.reviewNote ?? null,
        reviewedById: reviewer ? undefined : undefined,
        reviewedByName: reviewer?.fullName ?? 'Manager',
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(leaveRequests.id, leaveRequestId))
      .returning();

    // Update leave balance if approved
    if (data.status === 'approved') {
      await updateBalanceForApproval(
        orgId,
        existing.staffProfileId,
        existing.type,
        existing.totalDays,
      );
    }

    await auditLog(
      data.status === 'approved' ? 'approve' : 'deny',
      'leave_request',
      leaveRequestId,
      {
        before: { status: existing.status },
        after: {
          status: data.status,
          reviewNote: data.reviewNote,
          reviewedByName: reviewer?.fullName ?? 'Manager',
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/leave`);
      revalidatePath(`/${slug}/staff/leave`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[reviewLeave] Error:', error);
    return { success: false, error: 'Failed to review leave request' };
  }
}

// ---------------------------------------------------------------------------
// Cancel leave
// ---------------------------------------------------------------------------

export async function cancelLeave(
  leaveRequestId: string,
): Promise<ActionResult<LeaveRequest>> {
  try {
    const { orgId, userId } = await requirePermission('read', 'staff');

    const [existing] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, leaveRequestId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Leave request not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status === 'cancelled') {
      return { success: false, error: 'Leave request is already cancelled' };
    }

    if (existing.status === 'denied') {
      return { success: false, error: 'Cannot cancel a denied leave request' };
    }

    const wasApproved = existing.status === 'approved';
    const now = new Date();

    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: 'cancelled',
        updatedAt: now,
      })
      .where(eq(leaveRequests.id, leaveRequestId))
      .returning();

    // Reverse balance if was approved
    if (wasApproved) {
      await reverseBalanceForCancellation(
        orgId,
        existing.staffProfileId,
        existing.type,
        existing.totalDays,
      );
    }

    await auditLog(
      'cancel',
      'leave_request',
      leaveRequestId,
      {
        before: { status: existing.status },
        after: { status: 'cancelled' },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/leave`);
      revalidatePath(`/${slug}/staff/leave`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[cancelLeave] Error:', error);
    return { success: false, error: 'Failed to cancel leave request' };
  }
}

// ---------------------------------------------------------------------------
// Get leave balance for a staff member
// ---------------------------------------------------------------------------

export async function getLeaveBalance(
  staffProfileId: string,
  year?: number,
): Promise<LeaveBalance> {
  const { orgId } = await requirePermission('read', 'staff');
  const targetYear = year ?? currentYear();

  const [existing] = await db
    .select()
    .from(leaveBalances)
    .where(
      and(
        eq(leaveBalances.organisationId, orgId),
        eq(leaveBalances.staffProfileId, staffProfileId),
        eq(leaveBalances.year, targetYear),
      ),
    )
    .limit(1);

  if (existing) return existing;

  // Auto-create balance for current year if not found
  const [created] = await db
    .insert(leaveBalances)
    .values({
      organisationId: orgId,
      staffProfileId,
      year: targetYear,
      annualEntitlement: DEFAULT_ANNUAL_ENTITLEMENT,
      annualUsed: 0,
      annualRemaining: DEFAULT_ANNUAL_ENTITLEMENT,
      sickDays: 0,
    })
    .returning();

  return created;
}

// ---------------------------------------------------------------------------
// Update leave balance entitlement (manager)
// ---------------------------------------------------------------------------

export async function updateLeaveBalance(
  staffProfileId: string,
  input: UpdateLeaveBalanceInput,
  year?: number,
): Promise<ActionResult<LeaveBalance>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'staff');

    const parsed = updateLeaveBalanceSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const targetYear = year ?? currentYear();
    const balance = await getLeaveBalance(staffProfileId, targetYear);

    const newEntitlement = parsed.data.annualEntitlement;
    const newRemaining = newEntitlement - balance.annualUsed;

    const [updated] = await db
      .update(leaveBalances)
      .set({
        annualEntitlement: newEntitlement,
        annualRemaining: Math.max(0, newRemaining),
        updatedAt: new Date(),
      })
      .where(eq(leaveBalances.id, balance.id))
      .returning();

    await auditLog(
      'update',
      'leave_balance',
      balance.id,
      {
        before: {
          annualEntitlement: balance.annualEntitlement,
          annualRemaining: balance.annualRemaining,
        },
        after: {
          annualEntitlement: newEntitlement,
          annualRemaining: Math.max(0, newRemaining),
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${staffProfileId}/leave`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateLeaveBalance] Error:', error);
    return { success: false, error: 'Failed to update leave balance' };
  }
}

// ---------------------------------------------------------------------------
// Get team leave calendar (date range)
// ---------------------------------------------------------------------------

export type CalendarLeaveEntry = {
  id: string;
  staffProfileId: string;
  staffName: string;
  type: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
};

export async function getTeamLeaveCalendar({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}): Promise<CalendarLeaveEntry[]> {
  const { orgId } = await requirePermission('read', 'staff');

  const rows = await db
    .select({
      id: leaveRequests.id,
      staffProfileId: leaveRequests.staffProfileId,
      staffName: staffProfiles.fullName,
      type: leaveRequests.type,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      totalDays: leaveRequests.totalDays,
      status: leaveRequests.status,
    })
    .from(leaveRequests)
    .innerJoin(
      staffProfiles,
      eq(leaveRequests.staffProfileId, staffProfiles.id),
    )
    .where(
      and(
        eq(leaveRequests.organisationId, orgId),
        or(
          eq(leaveRequests.status, 'approved'),
          eq(leaveRequests.status, 'pending'),
        ),
        // Overlapping date range: leave overlaps [startDate, endDate]
        lte(leaveRequests.startDate, endDate),
        gte(leaveRequests.endDate, startDate),
      ),
    )
    .orderBy(asc(leaveRequests.startDate))
    .limit(500);

  return rows;
}

// ---------------------------------------------------------------------------
// Get pending leave requests count (for badges)
// ---------------------------------------------------------------------------

export async function getPendingLeaveCount(): Promise<number> {
  const { orgId } = await requirePermission('read', 'staff');

  const [result] = await db
    .select({ count: count() })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.organisationId, orgId),
        eq(leaveRequests.status, 'pending'),
      ),
    );

  return result?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Internal: Update balance when leave is approved
// ---------------------------------------------------------------------------

async function updateBalanceForApproval(
  orgId: string,
  staffProfileId: string,
  leaveType: string,
  totalDays: number,
): Promise<void> {
  try {
    const year = currentYear();

    // Ensure balance exists
    const [existing] = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.organisationId, orgId),
          eq(leaveBalances.staffProfileId, staffProfileId),
          eq(leaveBalances.year, year),
        ),
      )
      .limit(1);

    if (!existing) {
      // Create with usage already applied
      const used = leaveType === 'annual' ? totalDays : 0;
      const sick = leaveType === 'sick' ? totalDays : 0;
      await db.insert(leaveBalances).values({
        organisationId: orgId,
        staffProfileId,
        year,
        annualEntitlement: DEFAULT_ANNUAL_ENTITLEMENT,
        annualUsed: used,
        annualRemaining: DEFAULT_ANNUAL_ENTITLEMENT - used,
        sickDays: sick,
      });
      return;
    }

    if (leaveType === 'annual') {
      const newUsed = existing.annualUsed + totalDays;
      const newRemaining = existing.annualEntitlement - newUsed;
      await db
        .update(leaveBalances)
        .set({
          annualUsed: newUsed,
          annualRemaining: Math.max(0, newRemaining),
          updatedAt: new Date(),
        })
        .where(eq(leaveBalances.id, existing.id));
    } else if (leaveType === 'sick') {
      await db
        .update(leaveBalances)
        .set({
          sickDays: existing.sickDays + totalDays,
          updatedAt: new Date(),
        })
        .where(eq(leaveBalances.id, existing.id));
    }
  } catch (error) {
    console.error('[updateBalanceForApproval] Error:', error);
  }
}

// ---------------------------------------------------------------------------
// Internal: Reverse balance when approved leave is cancelled
// ---------------------------------------------------------------------------

async function reverseBalanceForCancellation(
  orgId: string,
  staffProfileId: string,
  leaveType: string,
  totalDays: number,
): Promise<void> {
  try {
    const year = currentYear();

    const [existing] = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.organisationId, orgId),
          eq(leaveBalances.staffProfileId, staffProfileId),
          eq(leaveBalances.year, year),
        ),
      )
      .limit(1);

    if (!existing) return;

    if (leaveType === 'annual') {
      const newUsed = Math.max(0, existing.annualUsed - totalDays);
      const newRemaining = existing.annualEntitlement - newUsed;
      await db
        .update(leaveBalances)
        .set({
          annualUsed: newUsed,
          annualRemaining: Math.max(0, newRemaining),
          updatedAt: new Date(),
        })
        .where(eq(leaveBalances.id, existing.id));
    } else if (leaveType === 'sick') {
      await db
        .update(leaveBalances)
        .set({
          sickDays: Math.max(0, existing.sickDays - totalDays),
          updatedAt: new Date(),
        })
        .where(eq(leaveBalances.id, existing.id));
    }
  } catch (error) {
    console.error('[reverseBalanceForCancellation] Error:', error);
  }
}
