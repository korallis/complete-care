'use server';

/**
 * DBS Tracking Server Actions
 *
 * Full CRUD for DBS certificate records per staff member.
 * Includes expiry monitoring and compliance dashboard queries.
 *
 * Flow: Zod validate -> auth -> RBAC -> tenant isolation -> audit log
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, lte, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { dbsChecks, organisations, users, notifications } from '@/lib/db/schema';
import type { DbsCheck } from '@/lib/db/schema/dbs-checks';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createDbsCheckSchema,
  updateDbsCheckSchema,
  computeDbsStatus,
} from './schema';
import type { CreateDbsCheckInput, UpdateDbsCheckInput } from './schema';
import { getDbsAlertSeverity } from './alerts';

// Re-export for external use
export type { CreateDbsCheckInput, UpdateDbsCheckInput } from './schema';

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
// List DBS checks for a staff member
// ---------------------------------------------------------------------------

export type DbsCheckListItem = {
  id: string;
  staffProfileId: string;
  certificateNumber: string;
  issueDate: string;
  level: string;
  updateServiceSubscribed: boolean;
  recheckDate: string;
  status: string;
  notes: string | null;
  verifiedByName: string | null;
  createdAt: Date;
};

export type DbsCheckListResult = {
  checks: DbsCheckListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listDbsChecks({
  staffProfileId,
  page = 1,
  pageSize = 20,
}: {
  staffProfileId: string;
  page?: number;
  pageSize?: number;
}): Promise<DbsCheckListResult> {
  const { orgId } = await requirePermission('read', 'compliance');

  const conditions = [
    eq(dbsChecks.organisationId, orgId),
    eq(dbsChecks.staffProfileId, staffProfileId),
  ];

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: dbsChecks.id,
        staffProfileId: dbsChecks.staffProfileId,
        certificateNumber: dbsChecks.certificateNumber,
        issueDate: dbsChecks.issueDate,
        level: dbsChecks.level,
        updateServiceSubscribed: dbsChecks.updateServiceSubscribed,
        recheckDate: dbsChecks.recheckDate,
        status: dbsChecks.status,
        notes: dbsChecks.notes,
        verifiedByName: dbsChecks.verifiedByName,
        createdAt: dbsChecks.createdAt,
      })
      .from(dbsChecks)
      .where(whereClause)
      .orderBy(desc(dbsChecks.issueDate))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(dbsChecks).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    checks: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single DBS check
// ---------------------------------------------------------------------------

export async function getDbsCheck(
  dbsCheckId: string,
): Promise<DbsCheck | null> {
  const { orgId } = await requirePermission('read', 'compliance');

  const [check] = await db
    .select()
    .from(dbsChecks)
    .where(eq(dbsChecks.id, dbsCheckId))
    .limit(1);

  if (!check) return null;

  assertBelongsToOrg(check.organisationId, orgId);

  return check;
}

// ---------------------------------------------------------------------------
// Create DBS check
// ---------------------------------------------------------------------------

export async function createDbsCheck(
  input: CreateDbsCheckInput,
): Promise<ActionResult<DbsCheck>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'compliance');

    const parsed = createDbsCheckSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;
    const status = computeDbsStatus(data.recheckDate);

    // Get the current user's name for verification
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [check] = await db
      .insert(dbsChecks)
      .values({
        organisationId: orgId,
        staffProfileId: data.staffProfileId,
        certificateNumber: data.certificateNumber,
        issueDate: data.issueDate,
        level: data.level,
        updateServiceSubscribed: data.updateServiceSubscribed,
        recheckDate: data.recheckDate,
        status,
        notes: data.notes ?? null,
        verifiedById: userId,
        verifiedByName: data.verifiedByName ?? user?.name ?? null,
      })
      .returning();

    await auditLog(
      'create',
      'dbs_check',
      check.id,
      {
        before: null,
        after: {
          certificateNumber: data.certificateNumber,
          level: data.level,
          recheckDate: data.recheckDate,
          staffProfileId: data.staffProfileId,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${data.staffProfileId}/dbs`);
      revalidatePath(`/${slug}/staff/${data.staffProfileId}`);
    }

    return { success: true, data: check };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createDbsCheck] Error:', error);
    return { success: false, error: 'Failed to create DBS check record' };
  }
}

// ---------------------------------------------------------------------------
// Update DBS check
// ---------------------------------------------------------------------------

export async function updateDbsCheck(
  dbsCheckId: string,
  input: UpdateDbsCheckInput,
): Promise<ActionResult<DbsCheck>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'compliance');

    const parsed = updateDbsCheckSchema.safeParse(input);
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
      .from(dbsChecks)
      .where(eq(dbsChecks.id, dbsCheckId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'DBS check record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof dbsChecks.$inferInsert> = {};

    if (data.certificateNumber !== undefined) updates.certificateNumber = data.certificateNumber;
    if (data.issueDate !== undefined) updates.issueDate = data.issueDate;
    if (data.level !== undefined) updates.level = data.level;
    if (data.updateServiceSubscribed !== undefined)
      updates.updateServiceSubscribed = data.updateServiceSubscribed;
    if (data.recheckDate !== undefined) updates.recheckDate = data.recheckDate;
    if (data.notes !== undefined) updates.notes = data.notes ?? null;
    if (data.verifiedByName !== undefined) updates.verifiedByName = data.verifiedByName ?? null;

    // Recompute status if recheck date changed
    const recheckDate = data.recheckDate ?? existing.recheckDate;
    updates.status = computeDbsStatus(recheckDate);
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(dbsChecks)
      .set(updates)
      .where(eq(dbsChecks.id, dbsCheckId))
      .returning();

    await auditLog(
      'update',
      'dbs_check',
      dbsCheckId,
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
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/dbs`);
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateDbsCheck] Error:', error);
    return { success: false, error: 'Failed to update DBS check record' };
  }
}

// ---------------------------------------------------------------------------
// Delete DBS check
// ---------------------------------------------------------------------------

export async function deleteDbsCheck(
  dbsCheckId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('delete', 'compliance');

    const [existing] = await db
      .select()
      .from(dbsChecks)
      .where(eq(dbsChecks.id, dbsCheckId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'DBS check record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(dbsChecks).where(eq(dbsChecks.id, dbsCheckId));

    await auditLog(
      'delete',
      'dbs_check',
      dbsCheckId,
      {
        before: {
          certificateNumber: existing.certificateNumber,
          level: existing.level,
          staffProfileId: existing.staffProfileId,
        },
        after: null,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/dbs`);
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteDbsCheck] Error:', error);
    return { success: false, error: 'Failed to delete DBS check record' };
  }
}

// ---------------------------------------------------------------------------
// Get expiring DBS checks (compliance dashboard query)
// ---------------------------------------------------------------------------

export type ExpiringDbsCheck = {
  id: string;
  staffProfileId: string;
  certificateNumber: string;
  recheckDate: string;
  level: string;
  status: string;
};

/**
 * Returns DBS checks that are expiring within the given number of days.
 * Used by the compliance dashboard to flag upcoming rechecks.
 */
export async function getExpiringChecks({
  withinDays = 30,
}: {
  withinDays?: number;
} = {}): Promise<ExpiringDbsCheck[]> {
  const { orgId } = await requirePermission('read', 'compliance');

  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + withinDays);

  const todayStr = today.toISOString().slice(0, 10);
  const futureDateStr = futureDate.toISOString().slice(0, 10);

  const rows = await db
    .select({
      id: dbsChecks.id,
      staffProfileId: dbsChecks.staffProfileId,
      certificateNumber: dbsChecks.certificateNumber,
      recheckDate: dbsChecks.recheckDate,
      level: dbsChecks.level,
      status: dbsChecks.status,
    })
    .from(dbsChecks)
    .where(
      and(
        eq(dbsChecks.organisationId, orgId),
        gte(dbsChecks.recheckDate, todayStr),
        lte(dbsChecks.recheckDate, futureDateStr),
      ),
    )
    .orderBy(dbsChecks.recheckDate)
    .limit(100);

  return rows;
}

// ---------------------------------------------------------------------------
// Get overdue DBS checks (compliance dashboard query)
// ---------------------------------------------------------------------------

/**
 * Returns DBS checks that are past their recheck date.
 * Used by the compliance dashboard to flag overdue rechecks.
 */
export async function getOverdueChecks(): Promise<ExpiringDbsCheck[]> {
  const { orgId } = await requirePermission('read', 'compliance');

  const todayStr = new Date().toISOString().slice(0, 10);

  const rows = await db
    .select({
      id: dbsChecks.id,
      staffProfileId: dbsChecks.staffProfileId,
      certificateNumber: dbsChecks.certificateNumber,
      recheckDate: dbsChecks.recheckDate,
      level: dbsChecks.level,
      status: dbsChecks.status,
    })
    .from(dbsChecks)
    .where(
      and(
        eq(dbsChecks.organisationId, orgId),
        lte(dbsChecks.recheckDate, todayStr),
      ),
    )
    .orderBy(dbsChecks.recheckDate)
    .limit(100);

  return rows;
}

// ---------------------------------------------------------------------------
// DBS expiry notification engine
// ---------------------------------------------------------------------------

/**
 * Lazy notification generation for DBS expiry alerts.
 * Called on page load (MVP approach; production would use cron).
 */
export async function checkAndCreateDbsExpiryAlerts(
  userId: string,
  staffProfileId: string,
): Promise<void> {
  try {
    const { orgId } = await requirePermission('read', 'compliance');

    const today = new Date();
    const alertWindow = new Date(today);
    alertWindow.setDate(today.getDate() + 30);

    const todayStr = today.toISOString().slice(0, 10);
    const windowEndStr = alertWindow.toISOString().slice(0, 10);

    // Find DBS checks expiring soon or overdue
    const expiringChecks = await db
      .select({
        id: dbsChecks.id,
        certificateNumber: dbsChecks.certificateNumber,
        recheckDate: dbsChecks.recheckDate,
        level: dbsChecks.level,
      })
      .from(dbsChecks)
      .where(
        and(
          eq(dbsChecks.organisationId, orgId),
          eq(dbsChecks.staffProfileId, staffProfileId),
          lte(dbsChecks.recheckDate, windowEndStr),
        ),
      )
      .limit(20);

    if (expiringChecks.length === 0) return;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    for (const check of expiringChecks) {
      const severity = getDbsAlertSeverity(check.recheckDate);
      if (!severity) continue;

      const isOverdue = check.recheckDate < todayStr;
      const notificationType = isOverdue
        ? 'dbs_expired'
        : 'dbs_expiry';

      // Check for existing notification (avoid duplicates)
      const [existingNotif] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.organisationId, orgId),
            eq(notifications.entityId, check.id),
            eq(notifications.type, notificationType),
            gte(notifications.createdAt, yesterday),
          ),
        )
        .limit(1);

      if (existingNotif) continue;

      await db.insert(notifications).values({
        userId,
        organisationId: orgId,
        type: notificationType,
        title: isOverdue
          ? `DBS expired: certificate ${check.certificateNumber}`
          : `DBS expiring soon: certificate ${check.certificateNumber}`,
        body: isOverdue
          ? `DBS certificate ${check.certificateNumber} (${check.level}) expired on ${check.recheckDate}. Immediate recheck required.`
          : `DBS certificate ${check.certificateNumber} (${check.level}) is due for recheck on ${check.recheckDate}.`,
        entityType: 'dbs_check',
        entityId: check.id,
      });
    }
  } catch (error) {
    console.error('[checkAndCreateDbsExpiryAlerts] Error:', error);
  }
}
