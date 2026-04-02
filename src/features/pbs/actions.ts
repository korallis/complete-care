'use server';

import { db } from '@/lib/db';
import { pbsPlans, abcIncidents, restrictivePractices } from '@/lib/db/schema';
import { eq, and, desc, sql, gte, lte, count } from 'drizzle-orm';
import { requirePermission } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import {
  createPbsPlanSchema,
  updatePbsPlanSchema,
  createAbcIncidentSchema,
  createRestrictivePracticeSchema,
  editRestrictivePracticeSchema,
  type CreatePbsPlanInput,
  type UpdatePbsPlanInput,
  type CreateAbcIncidentInput,
  type CreateRestrictivePracticeInput,
  type EditRestrictivePracticeInput,
} from './schema';

// ---------------------------------------------------------------------------
// PBS Plans
// ---------------------------------------------------------------------------

export async function createPbsPlan(input: CreatePbsPlanInput) {
  const parsed = createPbsPlanSchema.parse(input);
  const { userId, orgId: organisationId } = await requirePermission('create', 'care_plans');

  // Determine next version number for this person
  const existing = await db
    .select({ maxVersion: sql<number>`COALESCE(MAX(${pbsPlans.version}), 0)` })
    .from(pbsPlans)
    .where(
      and(
        eq(pbsPlans.organisationId, organisationId),
        eq(pbsPlans.personId, parsed.personId),
      ),
    );

  const nextVersion = (existing[0]?.maxVersion ?? 0) + 1;

  const [plan] = await db
    .insert(pbsPlans)
    .values({
      organisationId,
      personId: parsed.personId,
      version: nextVersion,
      functionalAssessmentSummary: parsed.functionalAssessmentSummary,
      identifiedBehaviours: parsed.identifiedBehaviours,
      hypothesisedFunction: parsed.hypothesisedFunction,
      primaryStrategies: parsed.primaryStrategies,
      secondaryStrategies: parsed.secondaryStrategies,
      reactiveStrategies: parsed.reactiveStrategies,
      postIncidentSupport: parsed.postIncidentSupport,
      reductionPlan: parsed.reductionPlan ?? null,
      mdiContributions: parsed.mdiContributions ?? [],
      createdBy: userId,
    })
    .returning();

  await auditLog('create', 'pbs_plan', plan.id, undefined, { userId, organisationId });

  return { success: true, plan };
}

export async function updatePbsPlan(input: UpdatePbsPlanInput) {
  const parsed = updatePbsPlanSchema.parse(input);
  const { userId, orgId: organisationId } = await requirePermission('update', 'care_plans');

  // Mark previous version as superseded
  const [previous] = await db
    .select()
    .from(pbsPlans)
    .where(
      and(
        eq(pbsPlans.id, parsed.planId),
        eq(pbsPlans.organisationId, organisationId),
      ),
    );

  if (!previous) throw new Error('Plan not found');

  assertBelongsToOrg(previous.organisationId, organisationId);

  await db
    .update(pbsPlans)
    .set({ status: 'superseded', updatedAt: new Date() })
    .where(eq(pbsPlans.id, previous.id));

  // Create new version
  const [plan] = await db
    .insert(pbsPlans)
    .values({
      organisationId,
      personId: parsed.personId,
      version: previous.version + 1,
      status: 'active',
      functionalAssessmentSummary: parsed.functionalAssessmentSummary,
      identifiedBehaviours: parsed.identifiedBehaviours,
      hypothesisedFunction: parsed.hypothesisedFunction,
      primaryStrategies: parsed.primaryStrategies,
      secondaryStrategies: parsed.secondaryStrategies,
      reactiveStrategies: parsed.reactiveStrategies,
      postIncidentSupport: parsed.postIncidentSupport,
      reductionPlan: parsed.reductionPlan ?? null,
      mdiContributions: parsed.mdiContributions ?? [],
      createdBy: userId,
    })
    .returning();

  await auditLog('update', 'pbs_plan', plan.id, {
    after: { previousVersionId: previous.id },
  }, { userId, organisationId });

  return { success: true, plan };
}

export async function getPbsPlansForPerson(personId: string) {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');

  return db
    .select()
    .from(pbsPlans)
    .where(
      and(
        eq(pbsPlans.organisationId, organisationId),
        eq(pbsPlans.personId, personId),
      ),
    )
    .orderBy(desc(pbsPlans.version));
}

export async function getActivePbsPlan(personId: string) {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');

  const [plan] = await db
    .select()
    .from(pbsPlans)
    .where(
      and(
        eq(pbsPlans.organisationId, organisationId),
        eq(pbsPlans.personId, personId),
        eq(pbsPlans.status, 'active'),
      ),
    )
    .orderBy(desc(pbsPlans.version))
    .limit(1);

  return plan ?? null;
}

// ---------------------------------------------------------------------------
// ABC Incidents
// ---------------------------------------------------------------------------

export async function createAbcIncident(input: CreateAbcIncidentInput) {
  const parsed = createAbcIncidentSchema.parse(input);
  const { userId, orgId: organisationId } = await requirePermission('create', 'incidents');

  const [incident] = await db
    .insert(abcIncidents)
    .values({
      organisationId,
      personId: parsed.personId,
      pbsPlanId: parsed.pbsPlanId ?? null,
      occurredAt: new Date(parsed.occurredAt),
      antecedentCategory: parsed.antecedentCategory,
      antecedentDescription: parsed.antecedentDescription,
      behaviourTopography: parsed.behaviourTopography,
      behaviourDuration: parsed.behaviourDuration ?? null,
      behaviourIntensity: parsed.behaviourIntensity,
      consequenceStaffResponse: parsed.consequenceStaffResponse,
      settingEnvironment: parsed.settingEnvironment ?? null,
      settingPeoplePresent: parsed.settingPeoplePresent ?? null,
      settingActivity: parsed.settingActivity ?? null,
      settingSensoryFactors: parsed.settingSensoryFactors ?? null,
      recordedBy: userId,
    })
    .returning();

  await auditLog('create', 'abc_incident', incident.id, undefined, { userId, organisationId });

  return { success: true, incident };
}

export async function getAbcIncidentsForPerson(personId: string) {
  const { orgId: organisationId } = await requirePermission('read', 'incidents');

  return db
    .select()
    .from(abcIncidents)
    .where(
      and(
        eq(abcIncidents.organisationId, organisationId),
        eq(abcIncidents.personId, personId),
      ),
    )
    .orderBy(desc(abcIncidents.occurredAt));
}

// ---------------------------------------------------------------------------
// Restrictive Practices
// ---------------------------------------------------------------------------

export async function createRestrictivePractice(
  input: CreateRestrictivePracticeInput,
) {
  const parsed = createRestrictivePracticeSchema.parse(input);
  const { userId, orgId: organisationId } = await requirePermission('create', 'incidents');

  const [entry] = await db
    .insert(restrictivePractices)
    .values({
      organisationId,
      personId: parsed.personId,
      type: parsed.type,
      justification: parsed.justification,
      mcaLink: parsed.mcaLink ?? null,
      authorisedBy: parsed.authorisedBy,
      durationMinutes: parsed.durationMinutes,
      personResponse: parsed.personResponse,
      occurredAt: new Date(parsed.occurredAt),
      recordedBy: userId,
    })
    .returning();

  await auditLog('create', 'restrictive_practice', entry.id, undefined, { userId, organisationId });

  return { success: true, entry };
}

export async function editRestrictivePractice(
  input: EditRestrictivePracticeInput,
) {
  const parsed = editRestrictivePracticeSchema.parse(input);
  const { userId, orgId: organisationId } = await requirePermission('update', 'incidents');

  // Get original entry
  const [original] = await db
    .select()
    .from(restrictivePractices)
    .where(
      and(
        eq(restrictivePractices.id, parsed.originalId),
        eq(restrictivePractices.organisationId, organisationId),
      ),
    );

  if (!original) throw new Error('Restrictive practice entry not found');

  assertBelongsToOrg(original.organisationId, organisationId);

  // Mark original as superseded (immutable — we do NOT delete)
  await db
    .update(restrictivePractices)
    .set({ isSuperseded: true })
    .where(eq(restrictivePractices.id, original.id));

  // Create new version
  const [entry] = await db
    .insert(restrictivePractices)
    .values({
      organisationId,
      personId: parsed.personId,
      type: parsed.type,
      justification: parsed.justification,
      mcaLink: parsed.mcaLink ?? null,
      authorisedBy: parsed.authorisedBy,
      durationMinutes: parsed.durationMinutes,
      personResponse: parsed.personResponse,
      occurredAt: new Date(parsed.occurredAt),
      previousVersionId: original.id,
      versionNumber: original.versionNumber + 1,
      recordedBy: userId,
    })
    .returning();

  await auditLog('update', 'restrictive_practice', entry.id, {
    after: { previousVersionId: original.id },
  }, { userId, organisationId });

  return { success: true, entry };
}

export async function getRestrictivePractices(filters: {
  personId?: string;
  type?: string;
  from?: string;
  to?: string;
}) {
  const { orgId: organisationId } = await requirePermission('read', 'incidents');

  const conditions = [
    eq(restrictivePractices.organisationId, organisationId),
    eq(restrictivePractices.isSuperseded, false),
  ];

  if (filters.personId) {
    conditions.push(eq(restrictivePractices.personId, filters.personId));
  }
  if (filters.type) {
    conditions.push(eq(restrictivePractices.type, filters.type));
  }
  if (filters.from) {
    conditions.push(gte(restrictivePractices.occurredAt, new Date(filters.from)));
  }
  if (filters.to) {
    conditions.push(lte(restrictivePractices.occurredAt, new Date(filters.to)));
  }

  return db
    .select()
    .from(restrictivePractices)
    .where(and(...conditions))
    .orderBy(desc(restrictivePractices.occurredAt));
}

// ---------------------------------------------------------------------------
// Reduction Tracking — aggregation queries
// ---------------------------------------------------------------------------

export async function getRestrictivePracticeCounts(
  personId: string,
  period: 'weekly' | 'monthly' | 'quarterly',
) {
  const { orgId: organisationId } = await requirePermission('read', 'incidents');

  // Determine the date truncation expression based on period
  const truncExpr =
    period === 'weekly'
      ? sql`date_trunc('week', ${restrictivePractices.occurredAt})`
      : period === 'monthly'
        ? sql`date_trunc('month', ${restrictivePractices.occurredAt})`
        : sql`date_trunc('quarter', ${restrictivePractices.occurredAt})`;

  const rows = await db
    .select({
      period: truncExpr.as('period'),
      count: count().as('count'),
    })
    .from(restrictivePractices)
    .where(
      and(
        eq(restrictivePractices.organisationId, organisationId),
        eq(restrictivePractices.personId, personId),
        eq(restrictivePractices.isSuperseded, false),
      ),
    )
    .groupBy(truncExpr)
    .orderBy(truncExpr);

  return rows.map((r) => ({
    period: String(r.period),
    count: Number(r.count),
  }));
}
