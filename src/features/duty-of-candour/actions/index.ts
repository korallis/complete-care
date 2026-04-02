'use server';

/**
 * Duty of Candour Server Actions
 *
 * CQC Regulation 20 incident recording and workflow.
 * Tracks: incident -> verbal notification -> written follow-up (10 days)
 *         -> investigation -> apology -> closure.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { dutyOfCandourIncidents, organisations } from '@/lib/db/schema';
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

/** Calculate 10 working days from incident date */
function calculateWrittenFollowUpDeadline(incidentDate: Date): Date {
  const deadline = new Date(incidentDate);
  let workingDays = 0;
  while (workingDays < 10) {
    deadline.setDate(deadline.getDate() + 1);
    const day = deadline.getDay();
    if (day !== 0 && day !== 6) workingDays++;
  }
  return deadline;
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createDocIncidentSchema = z.object({
  personId: z.string().uuid(),
  incidentTitle: z.string().min(1),
  incidentDescription: z.string().min(1),
  incidentDate: z.string().min(1),
  severity: z.enum(['moderate_harm', 'severe_harm', 'death', 'prolonged_psychological_harm']),
});

const verbalNotificationSchema = z.object({
  verbalNotificationNotes: z.string().optional(),
});

const writtenFollowUpSchema = z.object({
  writtenFollowUpContent: z.string().min(1),
});

const investigationSchema = z.object({
  investigationFindings: z.string().optional(),
});

const apologySchema = z.object({
  apologyMethod: z.string().min(1),
  apologyContent: z.string().min(1),
});

// ---------------------------------------------------------------------------
// List / Get
// ---------------------------------------------------------------------------

export async function listDocIncidents({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const { orgId } = await requirePermission('read', 'incidents');

  const conditions = [eq(dutyOfCandourIncidents.organisationId, orgId)];
  if (status) conditions.push(eq(dutyOfCandourIncidents.status, status));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(dutyOfCandourIncidents)
      .where(whereClause)
      .orderBy(desc(dutyOfCandourIncidents.incidentDate))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(dutyOfCandourIncidents).where(whereClause),
  ]);

  return {
    incidents: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getDocIncident(id: string) {
  const { orgId } = await requirePermission('read', 'incidents');

  const [row] = await db
    .select()
    .from(dutyOfCandourIncidents)
    .where(eq(dutyOfCandourIncidents.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function getOverdueDocIncidents() {
  const { orgId } = await requirePermission('read', 'incidents');

  const now = new Date();

  return db
    .select()
    .from(dutyOfCandourIncidents)
    .where(
      and(
        eq(dutyOfCandourIncidents.organisationId, orgId),
        eq(dutyOfCandourIncidents.writtenFollowUpSent, false),
        lt(dutyOfCandourIncidents.writtenFollowUpDeadline, now),
      ),
    )
    .orderBy(dutyOfCandourIncidents.writtenFollowUpDeadline);
}

// ---------------------------------------------------------------------------
// Create incident
// ---------------------------------------------------------------------------

export async function createDocIncident(
  input: z.infer<typeof createDocIncidentSchema>,
): Promise<ActionResult<typeof dutyOfCandourIncidents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'incidents');

    const parsed = createDocIncidentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;
    const incidentDate = new Date(data.incidentDate);
    const deadline = calculateWrittenFollowUpDeadline(incidentDate);

    const [row] = await db
      .insert(dutyOfCandourIncidents)
      .values({
        organisationId: orgId,
        personId: data.personId,
        incidentTitle: data.incidentTitle,
        incidentDescription: data.incidentDescription,
        incidentDate,
        severity: data.severity,
        writtenFollowUpDeadline: deadline,
        status: 'open',
        createdBy: userId,
      })
      .returning();

    await auditLog('create', 'duty_of_candour_incident', row.id, {
      before: null,
      after: { title: data.incidentTitle, severity: data.severity, deadline: deadline.toISOString() },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/duty-of-candour`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createDocIncident] Error:', error);
    return { success: false, error: 'Failed to create duty of candour incident' };
  }
}

// ---------------------------------------------------------------------------
// Workflow step: Verbal notification
// ---------------------------------------------------------------------------

export async function recordVerbalNotification(
  id: string,
  input: z.infer<typeof verbalNotificationSchema>,
): Promise<ActionResult<typeof dutyOfCandourIncidents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'incidents');

    const [existing] = await db
      .select()
      .from(dutyOfCandourIncidents)
      .where(eq(dutyOfCandourIncidents.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Incident not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.verbalNotificationGiven) {
      return { success: false, error: 'Verbal notification already recorded' };
    }

    const [updated] = await db
      .update(dutyOfCandourIncidents)
      .set({
        verbalNotificationGiven: true,
        verbalNotificationDate: new Date(),
        verbalNotificationBy: userId,
        verbalNotificationNotes: input.verbalNotificationNotes ?? null,
        status: 'verbal_given',
        updatedAt: new Date(),
      })
      .where(eq(dutyOfCandourIncidents.id, id))
      .returning();

    await auditLog('verbal_notification', 'duty_of_candour_incident', id, {
      before: { status: existing.status },
      after: { status: 'verbal_given' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/duty-of-candour/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to record verbal notification' };
  }
}

// ---------------------------------------------------------------------------
// Workflow step: Written follow-up
// ---------------------------------------------------------------------------

export async function recordWrittenFollowUp(
  id: string,
  input: z.infer<typeof writtenFollowUpSchema>,
): Promise<ActionResult<typeof dutyOfCandourIncidents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'incidents');

    const [existing] = await db
      .select()
      .from(dutyOfCandourIncidents)
      .where(eq(dutyOfCandourIncidents.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Incident not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(dutyOfCandourIncidents)
      .set({
        writtenFollowUpSent: true,
        writtenFollowUpDate: new Date(),
        writtenFollowUpBy: userId,
        writtenFollowUpContent: input.writtenFollowUpContent,
        status: 'written_sent',
        updatedAt: new Date(),
      })
      .where(eq(dutyOfCandourIncidents.id, id))
      .returning();

    await auditLog('written_follow_up', 'duty_of_candour_incident', id, {
      before: { status: existing.status },
      after: { status: 'written_sent' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/duty-of-candour/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to record written follow-up' };
  }
}

// ---------------------------------------------------------------------------
// Workflow step: Investigation
// ---------------------------------------------------------------------------

export async function startInvestigation(
  id: string,
): Promise<ActionResult<typeof dutyOfCandourIncidents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'incidents');

    const [existing] = await db
      .select()
      .from(dutyOfCandourIncidents)
      .where(eq(dutyOfCandourIncidents.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Incident not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(dutyOfCandourIncidents)
      .set({
        investigationStarted: true,
        investigationStartDate: new Date(),
        investigationLeadId: userId,
        status: 'investigating',
        updatedAt: new Date(),
      })
      .where(eq(dutyOfCandourIncidents.id, id))
      .returning();

    await auditLog('start_investigation', 'duty_of_candour_incident', id, {
      before: { status: existing.status },
      after: { status: 'investigating' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/duty-of-candour/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to start investigation' };
  }
}

export async function completeInvestigation(
  id: string,
  input: z.infer<typeof investigationSchema>,
): Promise<ActionResult<typeof dutyOfCandourIncidents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'incidents');

    const [existing] = await db
      .select()
      .from(dutyOfCandourIncidents)
      .where(eq(dutyOfCandourIncidents.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Incident not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(dutyOfCandourIncidents)
      .set({
        investigationFindings: input.investigationFindings ?? null,
        investigationCompletedDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(dutyOfCandourIncidents.id, id))
      .returning();

    await auditLog('complete_investigation', 'duty_of_candour_incident', id, {
      before: { investigationCompleted: false },
      after: { investigationCompleted: true },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/duty-of-candour/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to complete investigation' };
  }
}

// ---------------------------------------------------------------------------
// Workflow step: Apology and closure
// ---------------------------------------------------------------------------

export async function recordApology(
  id: string,
  input: z.infer<typeof apologySchema>,
): Promise<ActionResult<typeof dutyOfCandourIncidents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'incidents');

    const [existing] = await db
      .select()
      .from(dutyOfCandourIncidents)
      .where(eq(dutyOfCandourIncidents.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Incident not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(dutyOfCandourIncidents)
      .set({
        apologyGiven: true,
        apologyDate: new Date(),
        apologyMethod: input.apologyMethod,
        apologyContent: input.apologyContent,
        status: 'closed',
        updatedAt: new Date(),
      })
      .where(eq(dutyOfCandourIncidents.id, id))
      .returning();

    await auditLog('record_apology', 'duty_of_candour_incident', id, {
      before: { status: existing.status },
      after: { status: 'closed', apologyGiven: true },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/duty-of-candour/${id}`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to record apology' };
  }
}
