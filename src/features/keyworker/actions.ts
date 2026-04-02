'use server';

/**
 * Keyworker Server Actions
 *
 * CRUD for keyworker sessions, restraint records, sanctions, and visitor log.
 * Children's residential care specific — Schedule 4 compliant visitor tracking.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, gte, ilike, isNull, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  keyworkerSessions,
  restraints,
  sanctions,
  visitorLog,
  childrensVoice,
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

const sessionGoalsSchema = z.object({
  shortTerm: z.array(z.string()).optional(),
  longTerm: z.array(z.string()).optional(),
  progress: z.string().optional(),
});

const sessionActionSchema = z.object({
  action: z.string().min(1),
  assignedTo: z.string().min(1),
  deadline: z.string().min(1),
  completed: z.boolean().default(false),
});

const createKeyworkerSessionSchema = z.object({
  personId: z.string().uuid(),
  keyworkerId: z.string().uuid(),
  sessionDate: z.string().min(1),
  checkIn: z.string().optional(),
  weekReview: z.string().optional(),
  goals: sessionGoalsSchema.optional(),
  education: z.string().optional(),
  health: z.string().optional(),
  family: z.string().optional(),
  wishesAndFeelings: z.string().optional(),
  actions: z.array(sessionActionSchema).optional(),
});

const injuryCheckSchema = z.object({
  childInjured: z.boolean(),
  childInjuryDetails: z.string().optional(),
  staffInjured: z.boolean(),
  staffInjuryDetails: z.string().optional(),
  medicalAttentionRequired: z.boolean(),
  medicalAttentionDetails: z.string().optional(),
});

const createRestraintSchema = z.object({
  personId: z.string().uuid(),
  dateTime: z.string().min(1),
  duration: z.number().int().min(1),
  technique: z.string().min(1),
  reason: z.string().min(1),
  injuryCheck: injuryCheckSchema,
  childDebrief: z.string().optional(),
  staffDebrief: z.string().optional(),
});

const createSanctionSchema = z.object({
  personId: z.string().uuid(),
  dateTime: z.string().min(1),
  description: z.string().min(1),
  sanctionType: z.string().min(1),
  isProhibited: z.boolean().default(false),
  justification: z.string().optional(),
});

const createVisitorLogSchema = z.object({
  visitorName: z.string().min(1),
  relationship: z.string().min(1),
  personVisitedId: z.string().uuid().optional(),
  visitDate: z.string().min(1),
  arrivalTime: z.string().min(1),
  departureTime: z.string().optional(),
  idChecked: z.boolean().default(false),
  dbsChecked: z.boolean().default(false),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Keyworker Sessions
// ---------------------------------------------------------------------------

export async function listKeyworkerSessions({
  personId,
  keyworkerId,
  page = 1,
  pageSize = 20,
}: {
  personId?: string;
  keyworkerId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { orgId } = await requirePermission('read', 'care_plans');

  const conditions = [eq(keyworkerSessions.organisationId, orgId)];
  if (personId) conditions.push(eq(keyworkerSessions.personId, personId));
  if (keyworkerId) conditions.push(eq(keyworkerSessions.keyworkerId, keyworkerId));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(keyworkerSessions)
      .where(whereClause)
      .orderBy(desc(keyworkerSessions.sessionDate))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(keyworkerSessions).where(whereClause),
  ]);

  return {
    sessions: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getKeyworkerSession(id: string) {
  const { orgId } = await requirePermission('read', 'care_plans');

  const [row] = await db
    .select()
    .from(keyworkerSessions)
    .where(eq(keyworkerSessions.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function createKeyworkerSession(
  input: z.infer<typeof createKeyworkerSessionSchema>,
): Promise<ActionResult<typeof keyworkerSessions.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');

    const parsed = createKeyworkerSessionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(keyworkerSessions)
      .values({
        organisationId: orgId,
        personId: data.personId,
        keyworkerId: data.keyworkerId,
        sessionDate: data.sessionDate,
        checkIn: data.checkIn ?? null,
        weekReview: data.weekReview ?? null,
        goals: data.goals ?? {},
        education: data.education ?? null,
        health: data.health ?? null,
        family: data.family ?? null,
        wishesAndFeelings: data.wishesAndFeelings ?? null,
        actions: data.actions ?? [],
      })
      .returning();

    await auditLog('create', 'keyworker_session', row.id, {
      before: null,
      after: { personId: data.personId, keyworkerId: data.keyworkerId, date: data.sessionDate },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/keyworker`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createKeyworkerSession] Error:', error);
    return { success: false, error: 'Failed to create keyworker session' };
  }
}

export async function updateKeyworkerSession(
  id: string,
  input: Partial<z.infer<typeof createKeyworkerSessionSchema>>,
): Promise<ActionResult<typeof keyworkerSessions.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');

    const [existing] = await db
      .select()
      .from(keyworkerSessions)
      .where(eq(keyworkerSessions.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Session not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof keyworkerSessions.$inferInsert> = { updatedAt: new Date() };
    if (input.sessionDate !== undefined) updates.sessionDate = input.sessionDate;
    if (input.checkIn !== undefined) updates.checkIn = input.checkIn ?? null;
    if (input.weekReview !== undefined) updates.weekReview = input.weekReview ?? null;
    if (input.goals !== undefined) updates.goals = input.goals ?? {};
    if (input.education !== undefined) updates.education = input.education ?? null;
    if (input.health !== undefined) updates.health = input.health ?? null;
    if (input.family !== undefined) updates.family = input.family ?? null;
    if (input.wishesAndFeelings !== undefined) updates.wishesAndFeelings = input.wishesAndFeelings ?? null;
    if (input.actions !== undefined) updates.actions = input.actions ?? [];

    const [updated] = await db
      .update(keyworkerSessions)
      .set(updates)
      .where(eq(keyworkerSessions.id, id))
      .returning();

    await auditLog('update', 'keyworker_session', id, {
      before: { date: existing.sessionDate },
      after: { date: updated.sessionDate },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/keyworker`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateKeyworkerSession] Error:', error);
    return { success: false, error: 'Failed to update keyworker session' };
  }
}

// ---------------------------------------------------------------------------
// Restraints
// ---------------------------------------------------------------------------

export async function listRestraints({
  personId,
  page = 1,
  pageSize = 20,
}: {
  personId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { orgId } = await requirePermission('read', 'incidents');

  const conditions = [eq(restraints.organisationId, orgId)];
  if (personId) conditions.push(eq(restraints.personId, personId));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(restraints)
      .where(whereClause)
      .orderBy(desc(restraints.dateTime))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(restraints).where(whereClause),
  ]);

  return {
    restraints: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getRestraint(id: string) {
  const { orgId } = await requirePermission('read', 'incidents');

  const [row] = await db
    .select()
    .from(restraints)
    .where(eq(restraints.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function createRestraint(
  input: z.infer<typeof createRestraintSchema>,
): Promise<ActionResult<typeof restraints.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'incidents');

    const parsed = createRestraintSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(restraints)
      .values({
        organisationId: orgId,
        personId: data.personId,
        dateTime: data.dateTime,
        duration: data.duration,
        technique: data.technique,
        reason: data.reason,
        injuryCheck: data.injuryCheck,
        childDebrief: data.childDebrief ?? null,
        staffDebrief: data.staffDebrief ?? null,
        recordedById: userId,
      })
      .returning();

    await auditLog('create', 'restraint', row.id, {
      before: null,
      after: {
        personId: data.personId,
        technique: data.technique,
        duration: data.duration,
        childInjured: data.injuryCheck.childInjured,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/keyworker`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createRestraint] Error:', error);
    return { success: false, error: 'Failed to create restraint record' };
  }
}

export async function reviewRestraint(
  id: string,
  managementReview: string,
): Promise<ActionResult<typeof restraints.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('approve', 'incidents');

    const [existing] = await db
      .select()
      .from(restraints)
      .where(eq(restraints.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Restraint record not found' };
    assertBelongsToOrg(existing.organisationId, orgId);
    if (!existing.childDebrief?.trim() || !existing.staffDebrief?.trim()) {
      return {
        success: false,
        error: 'Both child and staff debriefs must be completed before manager sign-off.',
      };
    }
    if (!managementReview.trim()) {
      return { success: false, error: 'Management review is required for sign-off.' };
    }

    const [updated] = await db
      .update(restraints)
      .set({
        managementReview,
        reviewedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(restraints.id, id))
      .returning();

    await auditLog('review', 'restraint', id, {
      before: { reviewed: false },
      after: { reviewed: true },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/keyworker`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to review restraint record' };
  }
}

// ---------------------------------------------------------------------------
// Sanctions
// ---------------------------------------------------------------------------

export async function listSanctions({
  personId,
  page = 1,
  pageSize = 20,
}: {
  personId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { orgId } = await requirePermission('read', 'incidents');

  const conditions = [eq(sanctions.organisationId, orgId)];
  if (personId) conditions.push(eq(sanctions.personId, personId));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(sanctions)
      .where(whereClause)
      .orderBy(desc(sanctions.dateTime))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(sanctions).where(whereClause),
  ]);

  return {
    sanctions: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function createSanction(
  input: z.infer<typeof createSanctionSchema>,
): Promise<ActionResult<typeof sanctions.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'incidents');

    const parsed = createSanctionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    if (data.isProhibited) {
      return {
        success: false,
        error: 'Prohibited sanctions cannot be recorded. Select a permitted measure instead.',
        field: 'isProhibited',
      };
    }

    const [row] = await db
      .insert(sanctions)
      .values({
        organisationId: orgId,
        personId: data.personId,
        dateTime: data.dateTime,
        description: data.description,
        sanctionType: data.sanctionType,
        isProhibited: data.isProhibited,
        justification: data.justification ?? null,
        imposedById: userId,
      })
      .returning();

    await auditLog('create', 'sanction', row.id, {
      before: null,
      after: {
        personId: data.personId,
        type: data.sanctionType,
        isProhibited: data.isProhibited,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/keyworker`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createSanction] Error:', error);
    return { success: false, error: 'Failed to create sanction record' };
  }
}

export async function reviewSanction(
  id: string,
): Promise<ActionResult<typeof sanctions.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('approve', 'incidents');

    const [existing] = await db
      .select()
      .from(sanctions)
      .where(eq(sanctions.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Sanction not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(sanctions)
      .set({
        reviewedById: userId,
        updatedAt: new Date(),
      })
      .where(eq(sanctions.id, id))
      .returning();

    await auditLog('review', 'sanction', id, {
      before: { reviewed: false },
      after: { reviewed: true },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/keyworker`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to review sanction' };
  }
}

// ---------------------------------------------------------------------------
// Visitor Log
// ---------------------------------------------------------------------------

export async function listVisitorLog({
  personVisitedId,
  relationship,
  visitorName,
  dateFrom,
  dateTo,
  signedInOnly,
  page = 1,
  pageSize = 20,
}: {
  personVisitedId?: string;
  relationship?: string;
  visitorName?: string;
  dateFrom?: string;
  dateTo?: string;
  signedInOnly?: boolean;
  page?: number;
  pageSize?: number;
} = {}) {
  const { orgId } = await requirePermission('read', 'compliance');

  const conditions = [eq(visitorLog.organisationId, orgId)];
  if (personVisitedId) conditions.push(eq(visitorLog.personVisitedId, personVisitedId));
  if (relationship) conditions.push(eq(visitorLog.relationship, relationship));
  if (visitorName?.trim()) conditions.push(ilike(visitorLog.visitorName, `%${visitorName.trim()}%`));
  if (dateFrom) conditions.push(gte(visitorLog.visitDate, dateFrom));
  if (dateTo) conditions.push(lte(visitorLog.visitDate, dateTo));
  if (signedInOnly) conditions.push(isNull(visitorLog.departureTime));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(visitorLog)
      .where(whereClause)
      .orderBy(desc(visitorLog.visitDate), desc(visitorLog.arrivalTime))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(visitorLog).where(whereClause),
  ]);

  return {
    entries: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function createVisitorLogEntry(
  input: z.infer<typeof createVisitorLogSchema>,
): Promise<ActionResult<typeof visitorLog.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'compliance');

    const parsed = createVisitorLogSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(visitorLog)
      .values({
        organisationId: orgId,
        visitorName: data.visitorName,
        relationship: data.relationship,
        personVisitedId: data.personVisitedId ?? null,
        visitDate: data.visitDate,
        arrivalTime: data.arrivalTime,
        departureTime: data.departureTime ?? null,
        idChecked: data.idChecked,
        dbsChecked: data.dbsChecked,
        notes: data.notes ?? null,
        recordedById: userId,
      })
      .returning();

    await auditLog('create', 'visitor_log', row.id, {
      before: null,
      after: { visitorName: data.visitorName, date: data.visitDate, idChecked: data.idChecked },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/visitor-log`);
      if (data.personVisitedId) revalidatePath(`/${slug}/persons/${data.personVisitedId}/keyworker`);
    }

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createVisitorLogEntry] Error:', error);
    return { success: false, error: 'Failed to create visitor log entry' };
  }
}

export async function updateVisitorLogEntry(
  id: string,
  input: Partial<z.infer<typeof createVisitorLogSchema>>,
): Promise<ActionResult<typeof visitorLog.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'compliance');

    const [existing] = await db
      .select()
      .from(visitorLog)
      .where(eq(visitorLog.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Visitor log entry not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof visitorLog.$inferInsert> = { updatedAt: new Date() };
    if (input.departureTime !== undefined) updates.departureTime = input.departureTime ?? null;
    if (input.idChecked !== undefined) updates.idChecked = input.idChecked;
    if (input.dbsChecked !== undefined) updates.dbsChecked = input.dbsChecked;
    if (input.notes !== undefined) updates.notes = input.notes ?? null;

    const [updated] = await db
      .update(visitorLog)
      .set(updates)
      .where(eq(visitorLog.id, id))
      .returning();

    await auditLog('update', 'visitor_log', id, {
      before: { departureTime: existing.departureTime },
      after: { departureTime: updated.departureTime },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/visitor-log`);
      if (existing.personVisitedId) revalidatePath(`/${slug}/persons/${existing.personVisitedId}/keyworker`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update visitor log entry' };
  }
}

// ---------------------------------------------------------------------------
// Children's Voice
// ---------------------------------------------------------------------------

const createChildrensVoiceSchema = z.object({
  personId: z.string().uuid(),
  recordedDate: z.string().min(1),
  category: z.string().min(1),
  content: z.string().min(1),
  method: z.string().optional().nullable(),
  actionTaken: z.string().optional().nullable(),
});

export async function listChildrensVoice({
  personId,
  page = 1,
  pageSize = 20,
}: {
  personId?: string;
  page?: number;
  pageSize?: number;
}) {
  const { orgId } = await requirePermission('read', 'care_plans');

  const conditions = [eq(childrensVoice.organisationId, orgId)];
  if (personId) conditions.push(eq(childrensVoice.personId, personId));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(childrensVoice)
      .where(whereClause)
      .orderBy(desc(childrensVoice.recordedDate))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(childrensVoice).where(whereClause),
  ]);

  return {
    entries: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function createChildrensVoiceEntry(
  input: z.infer<typeof createChildrensVoiceSchema>,
): Promise<ActionResult<typeof childrensVoice.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');

    const parsed = createChildrensVoiceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(childrensVoice)
      .values({
        organisationId: orgId,
        personId: data.personId,
        recordedDate: data.recordedDate,
        category: data.category,
        content: data.content,
        method: data.method ?? null,
        actionTaken: data.actionTaken ?? null,
        recordedById: userId,
      })
      .returning();

    await auditLog('create', 'childrens_voice', row.id, {
      before: null,
      after: {
        personId: data.personId,
        category: data.category,
        date: data.recordedDate,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/keyworker`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createChildrensVoiceEntry] Error:', error);
    return { success: false, error: 'Failed to create children\'s voice entry' };
  }
}
