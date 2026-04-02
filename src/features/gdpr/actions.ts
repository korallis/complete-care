'use server';

/**
 * GDPR Server Actions
 *
 * CRUD for Subject Access Requests (SARs), erasure requests,
 * data retention policies, and data exports.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  subjectAccessRequests,
  erasureRequests,
  dataRetentionPolicies,
  dataRetentionFlags,
  dataExports,
  organisations,
} from '@/lib/db/schema';
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

const createSarSchema = z.object({
  subjectName: z.string().min(1),
  subjectEmail: z.string().email(),
  personId: z.string().uuid().optional(),
  receivedAt: z.string().min(1),
  exportFormat: z.enum(['json', 'pdf', 'both']).default('json'),
  notes: z.string().optional(),
});

const createErasureRequestSchema = z.object({
  subjectName: z.string().min(1),
  subjectEmail: z.string().email(),
  personId: z.string().uuid().optional(),
  receivedAt: z.string().min(1),
  notes: z.string().optional(),
});

const createRetentionPolicySchema = z.object({
  dataType: z.string().min(1),
  retentionDays: z.number().int().min(1),
  isStatutory: z.boolean().default(false),
  legalBasis: z.enum([
    'consent',
    'legal_obligation',
    'vital_interests',
    'public_task',
    'legitimate_interests',
  ]),
  description: z.string().optional(),
  autoDeleteEnabled: z.boolean().default(false),
  warningDays: z.number().int().default(30),
});

// ---------------------------------------------------------------------------
// Subject Access Requests (SARs)
// ---------------------------------------------------------------------------

export async function listSars({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const { orgId } = await requirePermission('read', 'compliance');

  const conditions = [eq(subjectAccessRequests.organisationId, orgId)];
  if (status) conditions.push(eq(subjectAccessRequests.status, status));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(subjectAccessRequests)
      .where(whereClause)
      .orderBy(desc(subjectAccessRequests.receivedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(subjectAccessRequests).where(whereClause),
  ]);

  return {
    sars: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getSar(id: string) {
  const { orgId } = await requirePermission('read', 'compliance');

  const [row] = await db
    .select()
    .from(subjectAccessRequests)
    .where(eq(subjectAccessRequests.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function createSar(
  input: z.infer<typeof createSarSchema>,
): Promise<ActionResult<typeof subjectAccessRequests.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'compliance');

    const parsed = createSarSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;
    const receivedAt = new Date(data.receivedAt);
    const deadlineAt = new Date(receivedAt);
    deadlineAt.setDate(deadlineAt.getDate() + 30); // 30 calendar days per ICO guidance

    const [row] = await db
      .insert(subjectAccessRequests)
      .values({
        organisationId: orgId,
        subjectName: data.subjectName,
        subjectEmail: data.subjectEmail,
        personId: data.personId ?? null,
        receivedAt,
        deadlineAt,
        exportFormat: data.exportFormat,
        notes: data.notes ?? null,
        status: 'received',
      })
      .returning();

    await auditLog('create', 'subject_access_request', row.id, {
      before: null,
      after: { subjectName: data.subjectName, deadline: deadlineAt.toISOString() },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/settings/gdpr`);
      revalidatePath(`/${slug}/settings/gdpr/sars`);
    }

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createSar] Error:', error);
    return { success: false, error: 'Failed to create subject access request' };
  }
}

export async function updateSarStatus(
  id: string,
  status: string,
  extra?: { exportPath?: string; rejectionReason?: string },
): Promise<ActionResult<typeof subjectAccessRequests.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'compliance');

    const [existing] = await db
      .select()
      .from(subjectAccessRequests)
      .where(eq(subjectAccessRequests.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'SAR not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof subjectAccessRequests.$inferInsert> = {
      status,
      processedByUserId: userId,
      updatedAt: new Date(),
    };

    if (status === 'fulfilled') updates.fulfilledAt = new Date();
    if (extra?.exportPath) updates.exportPath = extra.exportPath;
    if (extra?.rejectionReason) updates.rejectionReason = extra.rejectionReason;

    const [updated] = await db
      .update(subjectAccessRequests)
      .set(updates)
      .where(eq(subjectAccessRequests.id, id))
      .returning();

    await auditLog('update_status', 'subject_access_request', id, {
      before: { status: existing.status },
      after: { status },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/settings/gdpr`);
      revalidatePath(`/${slug}/settings/gdpr/sars`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateSarStatus] Error:', error);
    return { success: false, error: 'Failed to update SAR status' };
  }
}

export async function getOverdueSars() {
  const { orgId } = await requirePermission('read', 'compliance');

  return db
    .select()
    .from(subjectAccessRequests)
    .where(
      and(
        eq(subjectAccessRequests.organisationId, orgId),
        lte(subjectAccessRequests.deadlineAt, new Date()),
        eq(subjectAccessRequests.status, 'in_progress'),
      ),
    )
    .orderBy(subjectAccessRequests.deadlineAt);
}

// ---------------------------------------------------------------------------
// Erasure Requests
// ---------------------------------------------------------------------------

export async function listErasureRequests({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const { orgId } = await requirePermission('read', 'compliance');

  const conditions = [eq(erasureRequests.organisationId, orgId)];
  if (status) conditions.push(eq(erasureRequests.status, status));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(erasureRequests)
      .where(whereClause)
      .orderBy(desc(erasureRequests.receivedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(erasureRequests).where(whereClause),
  ]);

  return {
    requests: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getErasureRequest(id: string) {
  const { orgId } = await requirePermission('read', 'compliance');

  const [row] = await db
    .select()
    .from(erasureRequests)
    .where(eq(erasureRequests.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function createErasureRequest(
  input: z.infer<typeof createErasureRequestSchema>,
): Promise<ActionResult<typeof erasureRequests.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'compliance');

    const parsed = createErasureRequestSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;
    const receivedAt = new Date(data.receivedAt);
    const deadlineAt = new Date(receivedAt);
    deadlineAt.setDate(deadlineAt.getDate() + 30);

    const [row] = await db
      .insert(erasureRequests)
      .values({
        organisationId: orgId,
        subjectName: data.subjectName,
        subjectEmail: data.subjectEmail,
        personId: data.personId ?? null,
        receivedAt,
        deadlineAt,
        notes: data.notes ?? null,
        status: 'received',
      })
      .returning();

    await auditLog('create', 'erasure_request', row.id, {
      before: null,
      after: { subjectName: data.subjectName, deadline: deadlineAt.toISOString() },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/settings/gdpr`);
      revalidatePath(`/${slug}/settings/gdpr/erasure`);
    }

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createErasureRequest] Error:', error);
    return { success: false, error: 'Failed to create erasure request' };
  }
}

export async function updateErasureRequestStatus(
  id: string,
  status: string,
  extra?: { rejectionReason?: string; anonymisedFields?: unknown },
): Promise<ActionResult<typeof erasureRequests.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'compliance');

    const [existing] = await db
      .select()
      .from(erasureRequests)
      .where(eq(erasureRequests.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Erasure request not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof erasureRequests.$inferInsert> = {
      status,
      processedByUserId: userId,
      updatedAt: new Date(),
    };

    if (status === 'completed') updates.completedAt = new Date();
    if (extra?.rejectionReason) updates.rejectionReason = extra.rejectionReason;
    if (extra?.anonymisedFields) updates.anonymisedFields = extra.anonymisedFields;

    const [updated] = await db
      .update(erasureRequests)
      .set(updates)
      .where(eq(erasureRequests.id, id))
      .returning();

    await auditLog('update_status', 'erasure_request', id, {
      before: { status: existing.status },
      after: { status },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/settings/gdpr`);
      revalidatePath(`/${slug}/settings/gdpr/erasure`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateErasureRequestStatus] Error:', error);
    return { success: false, error: 'Failed to update erasure request status' };
  }
}

// ---------------------------------------------------------------------------
// Data Retention Policies
// ---------------------------------------------------------------------------

export async function listRetentionPolicies() {
  const { orgId } = await requirePermission('read', 'compliance');

  return db
    .select()
    .from(dataRetentionPolicies)
    .where(eq(dataRetentionPolicies.organisationId, orgId))
    .orderBy(dataRetentionPolicies.dataType);
}

export async function createRetentionPolicy(
  input: z.infer<typeof createRetentionPolicySchema>,
): Promise<ActionResult<typeof dataRetentionPolicies.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = createRetentionPolicySchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(dataRetentionPolicies)
      .values({
        organisationId: orgId,
        dataType: data.dataType,
        retentionDays: data.retentionDays,
        isStatutory: data.isStatutory,
        legalBasis: data.legalBasis,
        description: data.description ?? null,
        autoDeleteEnabled: data.autoDeleteEnabled,
        warningDays: data.warningDays,
      })
      .returning();

    await auditLog('create', 'data_retention_policy', row.id, {
      before: null,
      after: { dataType: data.dataType, retentionDays: data.retentionDays, legalBasis: data.legalBasis },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/settings/gdpr`);
      revalidatePath(`/${slug}/settings/gdpr/retention`);
    }

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createRetentionPolicy] Error:', error);
    return { success: false, error: 'Failed to create retention policy' };
  }
}

export async function updateRetentionPolicy(
  id: string,
  input: Partial<z.infer<typeof createRetentionPolicySchema>>,
): Promise<ActionResult<typeof dataRetentionPolicies.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const [existing] = await db
      .select()
      .from(dataRetentionPolicies)
      .where(eq(dataRetentionPolicies.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Policy not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof dataRetentionPolicies.$inferInsert> = { updatedAt: new Date() };
    if (input.retentionDays !== undefined) updates.retentionDays = input.retentionDays;
    if (input.legalBasis !== undefined) updates.legalBasis = input.legalBasis;
    if (input.description !== undefined) updates.description = input.description ?? null;
    if (input.autoDeleteEnabled !== undefined) updates.autoDeleteEnabled = input.autoDeleteEnabled;
    if (input.warningDays !== undefined) updates.warningDays = input.warningDays;

    const [updated] = await db
      .update(dataRetentionPolicies)
      .set(updates)
      .where(eq(dataRetentionPolicies.id, id))
      .returning();

    await auditLog('update', 'data_retention_policy', id, {
      before: { retentionDays: existing.retentionDays },
      after: { retentionDays: updated.retentionDays },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/settings/gdpr`);
      revalidatePath(`/${slug}/settings/gdpr/retention`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateRetentionPolicy] Error:', error);
    return { success: false, error: 'Failed to update retention policy' };
  }
}

// ---------------------------------------------------------------------------
// Data Retention Flags
// ---------------------------------------------------------------------------

export async function listRetentionFlags({
  status,
  page = 1,
  pageSize = 20,
}: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { orgId } = await requirePermission('read', 'compliance');

  const conditions = [eq(dataRetentionFlags.organisationId, orgId)];
  if (status) conditions.push(eq(dataRetentionFlags.status, status));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(dataRetentionFlags)
      .where(whereClause)
      .orderBy(dataRetentionFlags.retentionExpiresAt)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(dataRetentionFlags).where(whereClause),
  ]);

  return {
    flags: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function reviewRetentionFlag(
  id: string,
  decision: 'approved_for_deletion' | 'retained',
  reason?: string,
): Promise<ActionResult<typeof dataRetentionFlags.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const [existing] = await db
      .select()
      .from(dataRetentionFlags)
      .where(eq(dataRetentionFlags.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Retention flag not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(dataRetentionFlags)
      .set({
        status: decision,
        reviewedByUserId: userId,
        reviewedAt: new Date(),
        retentionReason: reason ?? null,
        updatedAt: new Date(),
      })
      .where(eq(dataRetentionFlags.id, id))
      .returning();

    await auditLog('review', 'data_retention_flag', id, {
      before: { status: existing.status },
      after: { status: decision, reason },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/settings/gdpr`);
      revalidatePath(`/${slug}/settings/gdpr/retention`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[reviewRetentionFlag] Error:', error);
    return { success: false, error: 'Failed to review retention flag' };
  }
}

// ---------------------------------------------------------------------------
// Data Exports
// ---------------------------------------------------------------------------

export async function listDataExports({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  const { orgId } = await requirePermission('read', 'compliance');

  const conditions = [eq(dataExports.organisationId, orgId)];
  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(dataExports)
      .where(whereClause)
      .orderBy(desc(dataExports.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(dataExports).where(whereClause),
  ]);

  return {
    exports: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function createDataExport(data: {
  exportType: string;
  format?: string;
  personId?: string;
  sarId?: string;
}): Promise<ActionResult<typeof dataExports.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('export', 'compliance');

    const [row] = await db
      .insert(dataExports)
      .values({
        organisationId: orgId,
        exportType: data.exportType,
        format: data.format ?? 'json',
        personId: data.personId ?? null,
        sarId: data.sarId ?? null,
        initiatedByUserId: userId,
        status: 'pending',
      })
      .returning();

    await auditLog('create', 'data_export', row.id, {
      before: null,
      after: { exportType: data.exportType, format: data.format },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/settings/gdpr`);
      revalidatePath(`/${slug}/settings/gdpr/exports`);
    }

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createDataExport] Error:', error);
    return { success: false, error: 'Failed to create data export' };
  }
}
