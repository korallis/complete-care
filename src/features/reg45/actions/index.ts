'use server';

/**
 * Reg 45 Server Actions
 *
 * CRUD for Reg 45 six-monthly quality review reports and version history.
 * Includes sign-off workflow and version snapshots.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { reg45Reports, reg45ReportVersions, organisations } from '@/lib/db/schema';
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

const createReg45ReportSchema = z.object({
  reportingPeriod: z.string().min(1),
  reportingPeriodStart: z.string().min(1),
  reportingPeriodEnd: z.string().min(1),
  reg44FindingsSummary: z.string().optional(),
  actionsTaken: z.string().optional(),
  qualityOfCareAssessment: z.string().optional(),
  staffDevelopment: z.string().optional(),
  childrensProgress: z.string().optional(),
  recommendations: z.string().optional(),
});

const updateReg45ReportSchema = z.object({
  reg44FindingsSummary: z.string().optional(),
  actionsTaken: z.string().optional(),
  qualityOfCareAssessment: z.string().optional(),
  staffDevelopment: z.string().optional(),
  childrensProgress: z.string().optional(),
  recommendations: z.string().optional(),
});

// ---------------------------------------------------------------------------
// List / Get
// ---------------------------------------------------------------------------

export async function listReg45Reports({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const { orgId } = await requirePermission('read', 'reports');

  const conditions = [eq(reg45Reports.organisationId, orgId)];
  if (status) conditions.push(eq(reg45Reports.status, status));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(reg45Reports)
      .where(whereClause)
      .orderBy(desc(reg45Reports.reportingPeriodEnd))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(reg45Reports).where(whereClause),
  ]);

  return {
    reports: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getReg45Report(id: string) {
  const { orgId } = await requirePermission('read', 'reports');

  const [row] = await db
    .select()
    .from(reg45Reports)
    .where(eq(reg45Reports.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createReg45Report(
  input: z.infer<typeof createReg45ReportSchema>,
): Promise<ActionResult<typeof reg45Reports.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'reports');

    const parsed = createReg45ReportSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(reg45Reports)
      .values({
        organisationId: orgId,
        reportingPeriod: data.reportingPeriod,
        reportingPeriodStart: new Date(data.reportingPeriodStart),
        reportingPeriodEnd: new Date(data.reportingPeriodEnd),
        reg44FindingsSummary: data.reg44FindingsSummary ?? null,
        actionsTaken: data.actionsTaken ?? null,
        qualityOfCareAssessment: data.qualityOfCareAssessment ?? null,
        staffDevelopment: data.staffDevelopment ?? null,
        childrensProgress: data.childrensProgress ?? null,
        recommendations: data.recommendations ?? null,
        version: 1,
        status: 'draft',
        authorId: userId,
      })
      .returning();

    // Create version 1 snapshot
    await db.insert(reg45ReportVersions).values({
      organisationId: orgId,
      reportId: row.id,
      version: 1,
      content: {
        reportingPeriod: data.reportingPeriod,
        reg44FindingsSummary: data.reg44FindingsSummary ?? null,
        actionsTaken: data.actionsTaken ?? null,
        qualityOfCareAssessment: data.qualityOfCareAssessment ?? null,
        staffDevelopment: data.staffDevelopment ?? null,
        childrensProgress: data.childrensProgress ?? null,
        recommendations: data.recommendations ?? null,
      },
      createdBy: userId,
    });

    await auditLog('create', 'reg45_report', row.id, {
      before: null,
      after: { reportingPeriod: data.reportingPeriod, version: 1 },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/reg45`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createReg45Report] Error:', error);
    return { success: false, error: 'Failed to create Reg 45 report' };
  }
}

// ---------------------------------------------------------------------------
// Update (creates new version)
// ---------------------------------------------------------------------------

export async function updateReg45Report(
  id: string,
  input: z.infer<typeof updateReg45ReportSchema>,
): Promise<ActionResult<typeof reg45Reports.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'reports');

    const [existing] = await db
      .select()
      .from(reg45Reports)
      .where(eq(reg45Reports.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Report not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status === 'signed_off' || existing.status === 'archived') {
      return { success: false, error: `Cannot update a ${existing.status} report` };
    }

    const newVersion = existing.version + 1;

    const updates: Partial<typeof reg45Reports.$inferInsert> = {
      version: newVersion,
      updatedAt: new Date(),
    };
    if (input.reg44FindingsSummary !== undefined) updates.reg44FindingsSummary = input.reg44FindingsSummary ?? null;
    if (input.actionsTaken !== undefined) updates.actionsTaken = input.actionsTaken ?? null;
    if (input.qualityOfCareAssessment !== undefined) updates.qualityOfCareAssessment = input.qualityOfCareAssessment ?? null;
    if (input.staffDevelopment !== undefined) updates.staffDevelopment = input.staffDevelopment ?? null;
    if (input.childrensProgress !== undefined) updates.childrensProgress = input.childrensProgress ?? null;
    if (input.recommendations !== undefined) updates.recommendations = input.recommendations ?? null;

    const [updated] = await db
      .update(reg45Reports)
      .set(updates)
      .where(eq(reg45Reports.id, id))
      .returning();

    // Create version snapshot
    await db.insert(reg45ReportVersions).values({
      organisationId: orgId,
      reportId: id,
      version: newVersion,
      content: {
        reg44FindingsSummary: updated.reg44FindingsSummary,
        actionsTaken: updated.actionsTaken,
        qualityOfCareAssessment: updated.qualityOfCareAssessment,
        staffDevelopment: updated.staffDevelopment,
        childrensProgress: updated.childrensProgress,
        recommendations: updated.recommendations,
      },
      createdBy: userId,
    });

    await auditLog('update', 'reg45_report', id, {
      before: { version: existing.version },
      after: { version: newVersion },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/reg45/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateReg45Report] Error:', error);
    return { success: false, error: 'Failed to update Reg 45 report' };
  }
}

// ---------------------------------------------------------------------------
// Submit for review
// ---------------------------------------------------------------------------

export async function submitForReview(
  reportId: string,
): Promise<ActionResult<typeof reg45Reports.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'reports');

    const [existing] = await db
      .select()
      .from(reg45Reports)
      .where(eq(reg45Reports.id, reportId))
      .limit(1);

    if (!existing) return { success: false, error: 'Report not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'draft') {
      return { success: false, error: 'Only draft reports can be submitted for review' };
    }

    const [updated] = await db
      .update(reg45Reports)
      .set({ status: 'pending_review', updatedAt: new Date() })
      .where(eq(reg45Reports.id, reportId))
      .returning();

    await auditLog('submit_review', 'reg45_report', reportId, {
      before: { status: 'draft' },
      after: { status: 'pending_review' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/reg45/${reportId}`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to submit report for review' };
  }
}

// ---------------------------------------------------------------------------
// Sign off
// ---------------------------------------------------------------------------

export async function signOffReport(
  reportId: string,
  notes: string,
): Promise<ActionResult<typeof reg45Reports.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('approve', 'reports');

    const [existing] = await db
      .select()
      .from(reg45Reports)
      .where(eq(reg45Reports.id, reportId))
      .limit(1);

    if (!existing) return { success: false, error: 'Report not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'pending_review') {
      return { success: false, error: 'Only reports pending review can be signed off' };
    }

    const now = new Date();

    const [updated] = await db
      .update(reg45Reports)
      .set({
        status: 'signed_off',
        signedOffBy: userId,
        signedOffAt: now,
        signOffNotes: notes,
        updatedAt: now,
      })
      .where(eq(reg45Reports.id, reportId))
      .returning();

    // Create final version snapshot
    await db.insert(reg45ReportVersions).values({
      organisationId: orgId,
      reportId,
      version: existing.version,
      content: {
        reg44FindingsSummary: existing.reg44FindingsSummary,
        actionsTaken: existing.actionsTaken,
        qualityOfCareAssessment: existing.qualityOfCareAssessment,
        staffDevelopment: existing.staffDevelopment,
        childrensProgress: existing.childrensProgress,
        recommendations: existing.recommendations,
        signOffNotes: notes,
        signedOff: true,
      },
      createdBy: userId,
    });

    await auditLog('sign_off', 'reg45_report', reportId, {
      before: { status: 'pending_review' },
      after: { status: 'signed_off' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/reg45/${reportId}`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to sign off report' };
  }
}

// ---------------------------------------------------------------------------
// Version history
// ---------------------------------------------------------------------------

export async function getReportVersions(reportId: string) {
  const { orgId } = await requirePermission('read', 'reports');

  const [report] = await db
    .select({ organisationId: reg45Reports.organisationId })
    .from(reg45Reports)
    .where(eq(reg45Reports.id, reportId))
    .limit(1);

  if (!report) return [];
  assertBelongsToOrg(report.organisationId, orgId);

  return db
    .select()
    .from(reg45ReportVersions)
    .where(
      and(
        eq(reg45ReportVersions.reportId, reportId),
        eq(reg45ReportVersions.organisationId, orgId),
      ),
    )
    .orderBy(desc(reg45ReportVersions.version));
}

export async function getReportVersion(reportId: string, version: number) {
  const { orgId } = await requirePermission('read', 'reports');

  const [report] = await db
    .select({ organisationId: reg45Reports.organisationId })
    .from(reg45Reports)
    .where(eq(reg45Reports.id, reportId))
    .limit(1);

  if (!report) return null;
  assertBelongsToOrg(report.organisationId, orgId);

  const [row] = await db
    .select()
    .from(reg45ReportVersions)
    .where(
      and(
        eq(reg45ReportVersions.reportId, reportId),
        eq(reg45ReportVersions.organisationId, orgId),
        eq(reg45ReportVersions.version, version),
      ),
    )
    .limit(1);

  return row ?? null;
}
