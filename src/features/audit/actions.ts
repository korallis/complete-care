'use server';

/**
 * Audit Trail Server Actions
 *
 * Provides server-side data access for the audit log.
 * All queries are tenant-scoped to the authenticated user's active organisation.
 *
 * IMMUTABILITY ENFORCEMENT:
 * - Only SELECT queries are permitted here.
 * - No UPDATE or DELETE operations exist — audit entries are permanent.
 */

import { and, eq, desc, gte, lte, ilike, or, count } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import { requirePermission } from '@/lib/rbac';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: unknown;
  ipAddress: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type AuditLogFilters = {
  /** Filter by action type (create, update, delete, or custom) */
  action?: string;
  /** Filter by entity type (person, care_plan, staff, etc.) */
  entityType?: string;
  /** Filter by user ID */
  userId?: string;
  /** Filter by entity ID (for entity-level history) */
  entityId?: string;
  /** Start of date range (inclusive) */
  dateFrom?: Date;
  /** End of date range (inclusive) */
  dateTo?: Date;
  /** Free-text search (searched against entityType, entityId, action) */
  search?: string;
};

export type AuditLogPage = {
  entries: AuditLogEntry[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 25;

/**
 * Fetch a paginated, filterable audit log for the current organisation.
 * Requires 'read' permission on 'audit_logs'.
 */
export async function getAuditLogs({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  filters = {},
}: {
  page?: number;
  pageSize?: number;
  filters?: AuditLogFilters;
} = {}): Promise<AuditLogPage> {
  const { orgId } = await requirePermission('read', 'audit_logs');

  // Build WHERE conditions
  const conditions = [eq(auditLogs.organisationId, orgId)];

  if (filters.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }

  if (filters.entityType) {
    conditions.push(eq(auditLogs.entityType, filters.entityType));
  }

  if (filters.userId) {
    conditions.push(eq(auditLogs.userId, filters.userId));
  }

  if (filters.entityId) {
    conditions.push(eq(auditLogs.entityId, filters.entityId));
  }

  if (filters.dateFrom) {
    conditions.push(gte(auditLogs.createdAt, filters.dateFrom));
  }

  if (filters.dateTo) {
    // Include the entire end day by adding 1 day
    const endOfDay = new Date(filters.dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLogs.createdAt, endOfDay));
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(auditLogs.entityType, term),
        ilike(auditLogs.entityId, term),
        ilike(auditLogs.action, term),
      )!,
    );
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  // Parallel: fetch entries + count
  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        changes: auditLogs.changes,
        ipAddress: auditLogs.ipAddress,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset(offset),

    db
      .select({ count: count() })
      .from(auditLogs)
      .where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  const entries: AuditLogEntry[] = rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    changes: row.changes,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
    user: row.userId
      ? { id: row.userId, name: row.userName!, email: row.userEmail! }
      : null,
  }));

  return {
    entries,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Fetch audit history for a specific entity (for entity detail pages).
 * Requires authentication with an active org — any authenticated member can
 * view their org's entity history.
 */
export async function getEntityAuditHistory(
  entityType: string,
  entityId: string,
  limit = 50,
): Promise<AuditLogEntry[]> {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return [];
  }

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      changes: auditLogs.changes,
      ipAddress: auditLogs.ipAddress,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(
      and(
        eq(auditLogs.organisationId, session.user.activeOrgId),
        eq(auditLogs.entityType, entityType),
        eq(auditLogs.entityId, entityId),
      ),
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    changes: row.changes,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
    user: row.userId
      ? { id: row.userId, name: row.userName!, email: row.userEmail! }
      : null,
  }));
}

/**
 * Get distinct entity types present in the org's audit log.
 * Used to populate the entity type filter dropdown.
 */
export async function getAuditEntityTypes(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return [];
  }

  const rows = await db
    .selectDistinct({ entityType: auditLogs.entityType })
    .from(auditLogs)
    .where(eq(auditLogs.organisationId, session.user.activeOrgId))
    .orderBy(auditLogs.entityType);

  return rows.map((r) => r.entityType);
}

/**
 * Get distinct actions present in the org's audit log.
 * Used to populate the action filter dropdown.
 */
export async function getAuditActions(): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return [];
  }

  const rows = await db
    .selectDistinct({ action: auditLogs.action })
    .from(auditLogs)
    .where(eq(auditLogs.organisationId, session.user.activeOrgId))
    .orderBy(auditLogs.action);

  return rows.map((r) => r.action);
}

/**
 * Get recent audit log summary stats for the org (for dashboard widgets).
 * No permission check — any authenticated member can see summary stats.
 */
export async function getAuditSummaryStats(): Promise<{
  totalEntries: number;
  last24Hours: number;
  last7Days: number;
}> {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return { totalEntries: 0, last24Hours: 0, last7Days: 0 };
  }

  const orgId = session.user.activeOrgId;
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [total, last24h, last7d] = await Promise.all([
    db
      .select({ count: count() })
      .from(auditLogs)
      .where(eq(auditLogs.organisationId, orgId)),
    db
      .select({ count: count() })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.organisationId, orgId),
          gte(auditLogs.createdAt, oneDayAgo),
        ),
      ),
    db
      .select({ count: count() })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.organisationId, orgId),
          gte(auditLogs.createdAt, sevenDaysAgo),
        ),
      ),
  ]);

  return {
    totalEntries: total[0]?.count ?? 0,
    last24Hours: last24h[0]?.count ?? 0,
    last7Days: last7d[0]?.count ?? 0,
  };
}
