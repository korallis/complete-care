'use server';

/**
 * Behaviour Server Actions
 *
 * CRUD for baseline assessments, progress records, behaviour incidents,
 * positive behaviours, and statements of purpose.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  baselineAssessments,
  progressRecords,
  positiveBehaviours,
  behaviourIncidents,
  statementsOfPurpose,
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

const createBaselineAssessmentSchema = z.object({
  personId: z.string().uuid(),
  assessmentTool: z.string().min(1),
  assessmentDate: z.string().min(1),
  domainScores: z.record(z.string(), z.number()),
  notes: z.string().optional(),
});

const createProgressRecordSchema = z.object({
  personId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  domain: z.string().min(1),
  score: z.number().int(),
  narrative: z.string().optional(),
});

const createBehaviourIncidentSchema = z.object({
  personId: z.string().uuid(),
  antecedent: z.string().min(1),
  behaviour: z.string().min(1),
  consequence: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  behaviourType: z.string().min(1),
  location: z.string().optional(),
  durationMinutes: z.number().int().optional(),
  deescalationUsed: z.string().optional(),
  physicalIntervention: z.boolean().default(false),
  staffInvolved: z.array(z.string()).optional(),
  occurredAt: z.string().min(1),
});

const createPositiveBehaviourSchema = z.object({
  personId: z.string().uuid(),
  description: z.string().min(1),
  category: z.string().min(1),
  points: z.number().int().default(0),
  occurredAt: z.string().min(1),
});

const createStatementOfPurposeSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  nextReviewDate: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Baseline Assessments
// ---------------------------------------------------------------------------

export async function listBaselineAssessments({
  personId,
  page = 1,
  pageSize = 20,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
}) {
  const { orgId } = await requirePermission('read', 'assessments');

  const conditions = [
    eq(baselineAssessments.organisationId, orgId),
    eq(baselineAssessments.personId, personId),
  ];
  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(baselineAssessments)
      .where(whereClause)
      .orderBy(desc(baselineAssessments.assessmentDate))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(baselineAssessments).where(whereClause),
  ]);

  return {
    assessments: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getBaselineAssessment(id: string) {
  const { orgId } = await requirePermission('read', 'assessments');

  const [row] = await db
    .select()
    .from(baselineAssessments)
    .where(eq(baselineAssessments.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function createBaselineAssessment(
  input: z.infer<typeof createBaselineAssessmentSchema>,
): Promise<ActionResult<typeof baselineAssessments.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const parsed = createBaselineAssessmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(baselineAssessments)
      .values({
        organisationId: orgId,
        personId: data.personId,
        assessedById: userId,
        assessmentTool: data.assessmentTool,
        assessmentDate: data.assessmentDate,
        domainScores: data.domainScores,
        notes: data.notes ?? null,
      })
      .returning();

    await auditLog('create', 'baseline_assessment', row.id, {
      before: null,
      after: { personId: data.personId, tool: data.assessmentTool },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/behaviour`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createBaselineAssessment] Error:', error);
    return { success: false, error: 'Failed to create baseline assessment' };
  }
}

export async function updateBaselineAssessment(
  id: string,
  input: Partial<z.infer<typeof createBaselineAssessmentSchema>>,
): Promise<ActionResult<typeof baselineAssessments.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'assessments');

    const [existing] = await db
      .select()
      .from(baselineAssessments)
      .where(eq(baselineAssessments.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Assessment not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof baselineAssessments.$inferInsert> = { updatedAt: new Date() };
    if (input.assessmentTool !== undefined) updates.assessmentTool = input.assessmentTool;
    if (input.assessmentDate !== undefined) updates.assessmentDate = input.assessmentDate;
    if (input.domainScores !== undefined) updates.domainScores = input.domainScores;
    if (input.notes !== undefined) updates.notes = input.notes ?? null;

    const [updated] = await db
      .update(baselineAssessments)
      .set(updates)
      .where(eq(baselineAssessments.id, id))
      .returning();

    await auditLog('update', 'baseline_assessment', id, {
      before: { tool: existing.assessmentTool },
      after: { tool: updated.assessmentTool },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/behaviour`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateBaselineAssessment] Error:', error);
    return { success: false, error: 'Failed to update baseline assessment' };
  }
}

export async function deleteBaselineAssessment(id: string): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('delete', 'assessments');

    const [existing] = await db
      .select()
      .from(baselineAssessments)
      .where(eq(baselineAssessments.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Assessment not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(baselineAssessments).where(eq(baselineAssessments.id, id));

    await auditLog('delete', 'baseline_assessment', id, {
      before: { personId: existing.personId, tool: existing.assessmentTool },
      after: null,
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/behaviour`);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to delete baseline assessment' };
  }
}

// ---------------------------------------------------------------------------
// Progress Records
// ---------------------------------------------------------------------------

export async function listProgressRecords({
  personId,
  assessmentId,
}: {
  personId: string;
  assessmentId?: string;
}) {
  const { orgId } = await requirePermission('read', 'assessments');

  const conditions = [
    eq(progressRecords.organisationId, orgId),
    eq(progressRecords.personId, personId),
  ];
  if (assessmentId) conditions.push(eq(progressRecords.assessmentId, assessmentId));

  return db
    .select()
    .from(progressRecords)
    .where(and(...conditions))
    .orderBy(desc(progressRecords.recordedAt));
}

export async function createProgressRecord(
  input: z.infer<typeof createProgressRecordSchema>,
): Promise<ActionResult<typeof progressRecords.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const parsed = createProgressRecordSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(progressRecords)
      .values({
        organisationId: orgId,
        personId: data.personId,
        assessmentId: data.assessmentId,
        domain: data.domain,
        score: data.score,
        narrative: data.narrative ?? null,
        recordedById: userId,
      })
      .returning();

    await auditLog('create', 'progress_record', row.id, {
      before: null,
      after: { domain: data.domain, score: data.score },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/behaviour`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createProgressRecord] Error:', error);
    return { success: false, error: 'Failed to create progress record' };
  }
}

// ---------------------------------------------------------------------------
// Behaviour Incidents
// ---------------------------------------------------------------------------

export async function listBehaviourIncidents({
  personId,
  page = 1,
  pageSize = 20,
  severity,
  behaviourType,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
  severity?: string;
  behaviourType?: string;
}) {
  const { orgId } = await requirePermission('read', 'incidents');

  const conditions = [
    eq(behaviourIncidents.organisationId, orgId),
    eq(behaviourIncidents.personId, personId),
  ];
  if (severity) conditions.push(eq(behaviourIncidents.severity, severity));
  if (behaviourType) conditions.push(eq(behaviourIncidents.behaviourType, behaviourType));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(behaviourIncidents)
      .where(whereClause)
      .orderBy(desc(behaviourIncidents.occurredAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(behaviourIncidents).where(whereClause),
  ]);

  return {
    incidents: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getBehaviourIncident(id: string) {
  const { orgId } = await requirePermission('read', 'incidents');

  const [row] = await db
    .select()
    .from(behaviourIncidents)
    .where(eq(behaviourIncidents.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function createBehaviourIncident(
  input: z.infer<typeof createBehaviourIncidentSchema>,
): Promise<ActionResult<typeof behaviourIncidents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'incidents');

    const parsed = createBehaviourIncidentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(behaviourIncidents)
      .values({
        organisationId: orgId,
        personId: data.personId,
        antecedent: data.antecedent,
        behaviour: data.behaviour,
        consequence: data.consequence,
        severity: data.severity,
        behaviourType: data.behaviourType,
        location: data.location ?? null,
        durationMinutes: data.durationMinutes ?? null,
        deescalationUsed: data.deescalationUsed ?? null,
        physicalIntervention: data.physicalIntervention,
        staffInvolved: data.staffInvolved ?? null,
        recordedById: userId,
        occurredAt: new Date(data.occurredAt),
      })
      .returning();

    await auditLog('create', 'behaviour_incident', row.id, {
      before: null,
      after: { personId: data.personId, severity: data.severity, type: data.behaviourType },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/behaviour`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createBehaviourIncident] Error:', error);
    return { success: false, error: 'Failed to create behaviour incident' };
  }
}

export async function updateBehaviourIncident(
  id: string,
  input: Partial<z.infer<typeof createBehaviourIncidentSchema>>,
): Promise<ActionResult<typeof behaviourIncidents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'incidents');

    const [existing] = await db
      .select()
      .from(behaviourIncidents)
      .where(eq(behaviourIncidents.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Incident not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof behaviourIncidents.$inferInsert> = { updatedAt: new Date() };
    if (input.antecedent !== undefined) updates.antecedent = input.antecedent;
    if (input.behaviour !== undefined) updates.behaviour = input.behaviour;
    if (input.consequence !== undefined) updates.consequence = input.consequence;
    if (input.severity !== undefined) updates.severity = input.severity;
    if (input.behaviourType !== undefined) updates.behaviourType = input.behaviourType;
    if (input.location !== undefined) updates.location = input.location ?? null;
    if (input.durationMinutes !== undefined) updates.durationMinutes = input.durationMinutes ?? null;
    if (input.deescalationUsed !== undefined) updates.deescalationUsed = input.deescalationUsed ?? null;
    if (input.physicalIntervention !== undefined) updates.physicalIntervention = input.physicalIntervention;
    if (input.staffInvolved !== undefined) updates.staffInvolved = input.staffInvolved ?? null;
    if (input.occurredAt !== undefined) updates.occurredAt = new Date(input.occurredAt);

    const [updated] = await db
      .update(behaviourIncidents)
      .set(updates)
      .where(eq(behaviourIncidents.id, id))
      .returning();

    await auditLog('update', 'behaviour_incident', id, {
      before: { severity: existing.severity },
      after: { severity: updated.severity },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/behaviour`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateBehaviourIncident] Error:', error);
    return { success: false, error: 'Failed to update behaviour incident' };
  }
}

// ---------------------------------------------------------------------------
// Positive Behaviours
// ---------------------------------------------------------------------------

export async function listPositiveBehaviours({
  personId,
  page = 1,
  pageSize = 20,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
}) {
  const { orgId } = await requirePermission('read', 'assessments');

  const conditions = [
    eq(positiveBehaviours.organisationId, orgId),
    eq(positiveBehaviours.personId, personId),
  ];
  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(positiveBehaviours)
      .where(whereClause)
      .orderBy(desc(positiveBehaviours.occurredAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(positiveBehaviours).where(whereClause),
  ]);

  return {
    behaviours: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function createPositiveBehaviour(
  input: z.infer<typeof createPositiveBehaviourSchema>,
): Promise<ActionResult<typeof positiveBehaviours.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const parsed = createPositiveBehaviourSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(positiveBehaviours)
      .values({
        organisationId: orgId,
        personId: data.personId,
        description: data.description,
        category: data.category,
        points: data.points,
        recordedById: userId,
        occurredAt: new Date(data.occurredAt),
      })
      .returning();

    await auditLog('create', 'positive_behaviour', row.id, {
      before: null,
      after: { personId: data.personId, category: data.category, points: data.points },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/behaviour`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createPositiveBehaviour] Error:', error);
    return { success: false, error: 'Failed to create positive behaviour record' };
  }
}

// ---------------------------------------------------------------------------
// Statement of Purpose
// ---------------------------------------------------------------------------

export async function listStatementsOfPurpose({
  page = 1,
  pageSize = 20,
  status,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const { orgId } = await requirePermission('read', 'compliance');

  const conditions = [eq(statementsOfPurpose.organisationId, orgId)];
  if (status) conditions.push(eq(statementsOfPurpose.status, status));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  return db
    .select()
    .from(statementsOfPurpose)
    .where(whereClause)
    .orderBy(desc(statementsOfPurpose.version))
    .limit(pageSize)
    .offset(offset);
}

export async function getStatementOfPurpose(id: string) {
  const { orgId } = await requirePermission('read', 'compliance');

  const [row] = await db
    .select()
    .from(statementsOfPurpose)
    .where(eq(statementsOfPurpose.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function createStatementOfPurpose(
  input: z.infer<typeof createStatementOfPurposeSchema>,
): Promise<ActionResult<typeof statementsOfPurpose.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'compliance');

    const parsed = createStatementOfPurposeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    // Determine next version number
    const [latest] = await db
      .select({ version: statementsOfPurpose.version })
      .from(statementsOfPurpose)
      .where(eq(statementsOfPurpose.organisationId, orgId))
      .orderBy(desc(statementsOfPurpose.version))
      .limit(1);

    const nextVersion = (latest?.version ?? 0) + 1;

    const [row] = await db
      .insert(statementsOfPurpose)
      .values({
        organisationId: orgId,
        version: nextVersion,
        title: data.title,
        content: data.content,
        status: 'draft',
        nextReviewDate: data.nextReviewDate ?? null,
        createdById: userId,
      })
      .returning();

    await auditLog('create', 'statement_of_purpose', row.id, {
      before: null,
      after: { title: data.title, version: nextVersion },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/compliance/statement-of-purpose`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createStatementOfPurpose] Error:', error);
    return { success: false, error: 'Failed to create statement of purpose' };
  }
}

export async function publishStatementOfPurpose(
  id: string,
): Promise<ActionResult<typeof statementsOfPurpose.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('approve', 'compliance');

    const [existing] = await db
      .select()
      .from(statementsOfPurpose)
      .where(eq(statementsOfPurpose.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Statement not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'draft') {
      return { success: false, error: 'Only draft statements can be published' };
    }

    const [updated] = await db
      .update(statementsOfPurpose)
      .set({
        status: 'published',
        approvedById: userId,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(statementsOfPurpose.id, id))
      .returning();

    await auditLog('publish', 'statement_of_purpose', id, {
      before: { status: 'draft' },
      after: { status: 'published' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/compliance/statement-of-purpose`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to publish statement of purpose' };
  }
}
