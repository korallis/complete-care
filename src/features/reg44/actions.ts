'use server';

import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  contactRecords,
  keyworkerSessions,
  lacRecords,
  meetings,
  organisations,
  persons,
  reg40NotifiableEvents,
  reg44Recommendations,
  reg44Reports,
  reg44Visits,
  restraints,
  sanctions,
  safeguardingChronology,
  complaints,
  pathwayPlans,
  transitionMilestones,
  independentLivingAssessments,
} from '@/lib/db/schema';
import { auditLog } from '@/lib/audit';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import type { ActionResult } from '@/types';
import {
  createAssessmentSchema,
  createMilestoneSchema,
  createNotifiableEventSchema,
  createPathwayPlanSchema,
  createRecommendationSchema,
  createReportSchema,
  createVisitSchema,
  updateAssessmentSchema,
  updateMilestoneSchema,
  updateNotifiableEventSchema,
  updatePathwayPlanSchema,
  updateRecommendationSchema,
  updateReportSchema,
  updateVisitSchema,
  type CreateAssessmentInput,
  type CreateMilestoneInput,
  type CreateNotifiableEventInput,
  type CreatePathwayPlanInput,
  type CreateRecommendationInput,
  type CreateReportInput,
  type CreateVisitInput,
  type UpdateAssessmentInput,
  type UpdateMilestoneInput,
  type UpdateNotifiableEventInput,
  type UpdatePathwayPlanInput,
  type UpdateRecommendationInput,
  type UpdateReportInput,
  type UpdateVisitInput,
} from './validation';
import {
  buildHealthPassport,
  buildLeavingCareChecklist,
  buildPathwayPlanAlerts,
  calculateAge,
  calculateAssessmentReadiness,
  matchesPersonName,
  sortChronologyEntries,
  type TransitionChronologyEntry,
} from './helpers';

type AssessmentSkills = NonNullable<
  typeof independentLivingAssessments.$inferInsert['skills']
>;

function isOptionalSchemaDrift(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code !== undefined &&
    ['42P01', '42703'].includes((error as { code?: string }).code ?? '')
  );
}

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

async function revalidateReg44Paths(orgId: string) {
  const slug = await getOrgSlug(orgId);
  if (!slug) return;
  revalidatePath(`/${slug}/reg44`);
  revalidatePath(`/${slug}/reg44/visits`);
  revalidatePath(`/${slug}/reg44/reports`);
  revalidatePath(`/${slug}/reg44/recommendations`);
  revalidatePath(`/${slug}/reg44/notifiable-events`);
  revalidatePath(`/${slug}/reg44/transition`);
}

async function getPersonInOrg(
  personId: string,
  orgId: string,
): Promise<typeof persons.$inferSelect | null> {
  const [person] = await db
    .select()
    .from(persons)
    .where(
      and(
        eq(persons.id, personId),
        eq(persons.organisationId, orgId),
        isNull(persons.deletedAt),
      ),
    )
    .limit(1);

  return person ?? null;
}

function normaliseDateString(value: string | Date | null | undefined) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.toISOString().slice(0, 10);
}

function computeAssessmentScore(input: AssessmentSkills) {
  return calculateAssessmentReadiness(input).overall;
}

export type Reg44Overview = {
  visits: number;
  reports: number;
  recommendations: number;
  openRecommendations: number;
  notifiableEvents: number;
  pathwayPlans: number;
  activePathwayPlans: number;
  assessments: number;
};

export async function getReg44Overview(): Promise<Reg44Overview> {
  const { orgId } = await requirePermission('read', 'ofsted');

  const [visitsResult, reportsResult, recommendationsResult, openRecommendationsResult, eventsResult, plansResult, activePlansResult, assessmentsResult] =
    await Promise.all([
      db.select({ count: count() }).from(reg44Visits).where(eq(reg44Visits.organisationId, orgId)),
      db.select({ count: count() }).from(reg44Reports).where(eq(reg44Reports.organisationId, orgId)),
      db.select({ count: count() }).from(reg44Recommendations).where(eq(reg44Recommendations.organisationId, orgId)),
      db
        .select({ count: count() })
        .from(reg44Recommendations)
        .where(
          and(
            eq(reg44Recommendations.organisationId, orgId),
            eq(reg44Recommendations.status, 'open'),
          ),
        ),
      db.select({ count: count() }).from(reg40NotifiableEvents).where(eq(reg40NotifiableEvents.organisationId, orgId)),
      db.select({ count: count() }).from(pathwayPlans).where(eq(pathwayPlans.organisationId, orgId)),
      db
        .select({ count: count() })
        .from(pathwayPlans)
        .where(
          and(
            eq(pathwayPlans.organisationId, orgId),
            eq(pathwayPlans.status, 'active'),
          ),
        ),
      db.select({ count: count() }).from(independentLivingAssessments).where(eq(independentLivingAssessments.organisationId, orgId)),
    ]);

  return {
    visits: visitsResult[0]?.count ?? 0,
    reports: reportsResult[0]?.count ?? 0,
    recommendations: recommendationsResult[0]?.count ?? 0,
    openRecommendations: openRecommendationsResult[0]?.count ?? 0,
    notifiableEvents: eventsResult[0]?.count ?? 0,
    pathwayPlans: plansResult[0]?.count ?? 0,
    activePathwayPlans: activePlansResult[0]?.count ?? 0,
    assessments: assessmentsResult[0]?.count ?? 0,
  };
}

export async function getReg44AutoSummary() {
  const { orgId } = await requirePermission('read', 'ofsted');

  try {
    const [visits, meetingsCount, complaintsCount, eventsCount, overdueRecommendations] = await Promise.all([
    db.select({ count: count() }).from(reg44Visits).where(eq(reg44Visits.organisationId, orgId)),
    db.select({ count: count() }).from(meetings).where(eq(meetings.organisationId, orgId)),
    db.select({ count: count() }).from(complaints).where(eq(complaints.organisationId, orgId)),
    db.select({ count: count() }).from(reg40NotifiableEvents).where(eq(reg40NotifiableEvents.organisationId, orgId)),
    db
      .select({ count: count() })
      .from(reg44Recommendations)
      .where(
        and(
          eq(reg44Recommendations.organisationId, orgId),
          eq(reg44Recommendations.status, 'overdue'),
        ),
      ),
  ]);

    return {
      qualityOfCare: `${visits[0]?.count ?? 0} Reg 44 visits logged with ${(meetingsCount[0]?.count ?? 0)} children’s meetings available for evidence.`,
      viewsOfChildren: `${meetingsCount[0]?.count ?? 0} children’s meeting record(s) can inform the monthly report narrative.`,
      complaintsAndConcerns: `${complaintsCount[0]?.count ?? 0} complaint record(s) and ${eventsCount[0]?.count ?? 0} notifiable event(s) are available for auto-summary.`,
      recommendations: `${overdueRecommendations[0]?.count ?? 0} overdue recommendation(s) currently flagged.`,
    };
  } catch (error) {
    if (isOptionalSchemaDrift(error)) {
      return {
        qualityOfCare: 'Reg 44 visit evidence will populate once supporting monitoring tables are provisioned.',
        viewsOfChildren: "Children's voice evidence will appear here when meetings and records are available.",
        complaintsAndConcerns: 'Complaints and notifiable-event summaries are unavailable until optional safeguarding tables are synced.',
        recommendations: 'Recommendation summaries will populate once related reporting data is available.',
      };
    }

    throw error;
  }
}

export async function listReg44Visits() {
  const { orgId } = await requirePermission('read', 'ofsted');
  return db
    .select()
    .from(reg44Visits)
    .where(eq(reg44Visits.organisationId, orgId))
    .orderBy(desc(reg44Visits.visitDate), desc(reg44Visits.createdAt));
}

export async function createReg44Visit(
  input: CreateVisitInput,
): Promise<ActionResult<typeof reg44Visits.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');
    const parsed = createVisitSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [row] = await db
      .insert(reg44Visits)
      .values({
        organisationId: orgId,
        ...parsed.data,
      })
      .returning();

    await auditLog('create', 'reg44_visit', row.id, { before: null, after: { visitDate: row.visitDate, visitorName: row.visitorName } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create Reg 44 visit' };
  }
}

export async function updateReg44Visit(
  id: string,
  input: Omit<UpdateVisitInput, 'id'>,
): Promise<ActionResult<typeof reg44Visits.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');
    const parsed = updateVisitSchema.safeParse({ ...input, id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [existing] = await db.select().from(reg44Visits).where(eq(reg44Visits.id, id)).limit(1);
    if (!existing) return { success: false, error: 'Visit not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [row] = await db
      .update(reg44Visits)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(reg44Visits.id, id))
      .returning();

    await auditLog('update', 'reg44_visit', id, { before: { status: existing.status }, after: { status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update Reg 44 visit' };
  }
}

export async function listReg44Reports() {
  const { orgId } = await requirePermission('read', 'ofsted');
  return db
    .select()
    .from(reg44Reports)
    .where(eq(reg44Reports.organisationId, orgId))
    .orderBy(desc(reg44Reports.createdAt));
}

export async function createReg44Report(
  input: CreateReportInput,
): Promise<ActionResult<typeof reg44Reports.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');
    const parsed = createReportSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [visit] = await db
      .select()
      .from(reg44Visits)
      .where(eq(reg44Visits.id, parsed.data.visitId))
      .limit(1);
    if (!visit) return { success: false, error: 'Visit not found' };
    assertBelongsToOrg(visit.organisationId, orgId);

    const autoSummary = await getReg44AutoSummary();
    const [row] = await db
      .insert(reg44Reports)
      .values({
        organisationId: orgId,
        visitId: parsed.data.visitId,
        sections: {
          ...parsed.data.sections,
          qualityOfCare:
            parsed.data.sections.qualityOfCare || autoSummary.qualityOfCare,
          viewsOfChildren:
            parsed.data.sections.viewsOfChildren || autoSummary.viewsOfChildren,
          complaintsAndConcerns:
            parsed.data.sections.complaintsAndConcerns || autoSummary.complaintsAndConcerns,
          recommendations:
            parsed.data.sections.recommendations || autoSummary.recommendations,
        },
        summary: parsed.data.summary ?? autoSummary.qualityOfCare,
        status: parsed.data.status,
        authorId: userId,
      })
      .returning();

    await auditLog('create', 'reg44_report', row.id, { before: null, after: { visitId: row.visitId, status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create Reg 44 report' };
  }
}

export async function updateReg44Report(
  id: string,
  input: Omit<UpdateReportInput, 'id'>,
): Promise<ActionResult<typeof reg44Reports.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');
    const parsed = updateReportSchema.safeParse({ ...input, id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [existing] = await db.select().from(reg44Reports).where(eq(reg44Reports.id, id)).limit(1);
    if (!existing) return { success: false, error: 'Report not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [row] = await db
      .update(reg44Reports)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(reg44Reports.id, id))
      .returning();

    await auditLog('update', 'reg44_report', id, { before: { status: existing.status }, after: { status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update Reg 44 report' };
  }
}

export async function listReg44Recommendations() {
  const { orgId } = await requirePermission('read', 'ofsted');
  return db
    .select()
    .from(reg44Recommendations)
    .where(eq(reg44Recommendations.organisationId, orgId))
    .orderBy(desc(reg44Recommendations.createdAt));
}

export async function createReg44Recommendation(
  input: CreateRecommendationInput,
): Promise<ActionResult<typeof reg44Recommendations.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');
    const parsed = createRecommendationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [report] = await db
      .select()
      .from(reg44Reports)
      .where(eq(reg44Reports.id, parsed.data.reportId))
      .limit(1);
    if (!report) return { success: false, error: 'Report not found' };
    assertBelongsToOrg(report.organisationId, orgId);

    const [row] = await db
      .insert(reg44Recommendations)
      .values({
        organisationId: orgId,
        ...parsed.data,
      })
      .returning();

    await auditLog('create', 'reg44_recommendation', row.id, { before: null, after: { reportId: row.reportId, status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create recommendation' };
  }
}

export async function updateReg44Recommendation(
  id: string,
  input: Omit<UpdateRecommendationInput, 'id'>,
): Promise<ActionResult<typeof reg44Recommendations.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');
    const parsed = updateRecommendationSchema.safeParse({ ...input, id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [existing] = await db
      .select()
      .from(reg44Recommendations)
      .where(eq(reg44Recommendations.id, id))
      .limit(1);
    if (!existing) return { success: false, error: 'Recommendation not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [row] = await db
      .update(reg44Recommendations)
      .set({
        ...parsed.data,
        completedAt: parsed.data.status === 'completed' ? new Date() : existing.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(reg44Recommendations.id, id))
      .returning();

    await auditLog('update', 'reg44_recommendation', id, { before: { status: existing.status }, after: { status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update recommendation' };
  }
}

export async function listReg40NotifiableEvents() {
  const { orgId } = await requirePermission('read', 'ofsted');
  return db
    .select()
    .from(reg40NotifiableEvents)
    .where(eq(reg40NotifiableEvents.organisationId, orgId))
    .orderBy(desc(reg40NotifiableEvents.eventDate), desc(reg40NotifiableEvents.createdAt));
}

export async function createReg40NotifiableEvent(
  input: CreateNotifiableEventInput,
): Promise<ActionResult<typeof reg40NotifiableEvents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');
    const parsed = createNotifiableEventSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [row] = await db
      .insert(reg40NotifiableEvents)
      .values({
        organisationId: orgId,
        ...parsed.data,
        reportedById: userId,
      })
      .returning();

    await auditLog('create', 'reg40_notifiable_event', row.id, { before: null, after: { category: row.category, status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create notifiable event' };
  }
}

export async function updateReg40NotifiableEvent(
  id: string,
  input: Omit<UpdateNotifiableEventInput, 'id'>,
): Promise<ActionResult<typeof reg40NotifiableEvents.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');
    const parsed = updateNotifiableEventSchema.safeParse({ ...input, id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [existing] = await db
      .select()
      .from(reg40NotifiableEvents)
      .where(eq(reg40NotifiableEvents.id, id))
      .limit(1);
    if (!existing) return { success: false, error: 'Notifiable event not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [row] = await db
      .update(reg40NotifiableEvents)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(reg40NotifiableEvents.id, id))
      .returning();

    await auditLog('update', 'reg40_notifiable_event', id, { before: { status: existing.status }, after: { status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update notifiable event' };
  }
}

export async function listEligibleTransitionPeople() {
  const { orgId } = await requirePermission('read', 'persons');
  const rows = await db
    .select({
      id: persons.id,
      fullName: persons.fullName,
      preferredName: persons.preferredName,
      dateOfBirth: persons.dateOfBirth,
      type: persons.type,
    })
    .from(persons)
    .where(
      and(
        eq(persons.organisationId, orgId),
        eq(persons.status, 'active'),
        isNull(persons.deletedAt),
      ),
    )
    .orderBy(persons.fullName);

  return rows.filter((person) => {
    const age = calculateAge(person.dateOfBirth);
    return age !== null && age >= 16;
  });
}

export async function listPathwayPlans() {
  const { orgId } = await requirePermission('read', 'care_plans');
  return db
    .select()
    .from(pathwayPlans)
    .where(eq(pathwayPlans.organisationId, orgId))
    .orderBy(desc(pathwayPlans.planStartDate), desc(pathwayPlans.createdAt));
}

export async function createPathwayPlan(
  input: CreatePathwayPlanInput,
): Promise<ActionResult<typeof pathwayPlans.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');
    const parsed = createPathwayPlanSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const person = await getPersonInOrg(parsed.data.personId, orgId);
    if (!person) return { success: false, error: 'Young person not found' };

    const age = calculateAge(person.dateOfBirth);
    if (age === null || age < 16) {
      return { success: false, error: 'Pathway plans can only be created for young people aged 16+' };
    }

    const [row] = await db
      .insert(pathwayPlans)
      .values({
        organisationId: orgId,
        personId: person.id,
        youngPersonName: person.fullName,
        dateOfBirth: person.dateOfBirth,
        personalAdviser: parsed.data.personalAdviser ?? null,
        planStartDate: parsed.data.planStartDate,
        planReviewDate: parsed.data.planReviewDate ?? null,
        sections: parsed.data.sections,
        status: parsed.data.status,
        createdById: userId,
      })
      .returning();

    await auditLog('create', 'pathway_plan', row.id, { before: null, after: { personId: person.id, status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create pathway plan' };
  }
}

export async function updatePathwayPlan(
  id: string,
  input: Omit<UpdatePathwayPlanInput, 'id'>,
): Promise<ActionResult<typeof pathwayPlans.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');
    const parsed = updatePathwayPlanSchema.safeParse({ ...input, id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [existing] = await db.select().from(pathwayPlans).where(eq(pathwayPlans.id, id)).limit(1);
    if (!existing) return { success: false, error: 'Pathway plan not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [row] = await db
      .update(pathwayPlans)
      .set({
        personalAdviser: parsed.data.personalAdviser ?? existing.personalAdviser,
        planReviewDate:
          parsed.data.planReviewDate === undefined
            ? existing.planReviewDate
            : parsed.data.planReviewDate ?? null,
        sections: parsed.data.sections ?? existing.sections,
        status: parsed.data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(pathwayPlans.id, id))
      .returning();

    await auditLog('update', 'pathway_plan', id, { before: { status: existing.status }, after: { status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update pathway plan' };
  }
}

export async function listTransitionMilestones(pathwayPlanId?: string) {
  const { orgId } = await requirePermission('read', 'care_plans');
  const baseCondition = eq(transitionMilestones.organisationId, orgId);
  return db
    .select()
    .from(transitionMilestones)
    .where(
      pathwayPlanId
        ? and(baseCondition, eq(transitionMilestones.pathwayPlanId, pathwayPlanId))
        : baseCondition,
    )
    .orderBy(desc(transitionMilestones.targetDate), desc(transitionMilestones.createdAt));
}

export async function createTransitionMilestone(
  input: CreateMilestoneInput,
): Promise<ActionResult<typeof transitionMilestones.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');
    const parsed = createMilestoneSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [plan] = await db.select().from(pathwayPlans).where(eq(pathwayPlans.id, parsed.data.pathwayPlanId)).limit(1);
    if (!plan) return { success: false, error: 'Pathway plan not found' };
    assertBelongsToOrg(plan.organisationId, orgId);

    const [row] = await db
      .insert(transitionMilestones)
      .values({
        organisationId: orgId,
        ...parsed.data,
      })
      .returning();

    await auditLog('create', 'transition_milestone', row.id, { before: null, after: { pathwayPlanId: row.pathwayPlanId, status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create milestone' };
  }
}

export async function updateTransitionMilestone(
  id: string,
  input: Omit<UpdateMilestoneInput, 'id'>,
): Promise<ActionResult<typeof transitionMilestones.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');
    const parsed = updateMilestoneSchema.safeParse({ ...input, id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [existing] = await db
      .select()
      .from(transitionMilestones)
      .where(eq(transitionMilestones.id, id))
      .limit(1);
    if (!existing) return { success: false, error: 'Milestone not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [row] = await db
      .update(transitionMilestones)
      .set({
        ...parsed.data,
        completedDate:
          parsed.data.status === 'completed'
            ? parsed.data.completedDate ?? new Date().toISOString().slice(0, 10)
            : parsed.data.completedDate ?? existing.completedDate,
        updatedAt: new Date(),
      })
      .where(eq(transitionMilestones.id, id))
      .returning();

    await auditLog('update', 'transition_milestone', id, { before: { status: existing.status }, after: { status: row.status } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update milestone' };
  }
}

export async function listIndependentLivingAssessments(pathwayPlanId?: string) {
  const { orgId } = await requirePermission('read', 'assessments');
  const baseCondition = eq(independentLivingAssessments.organisationId, orgId);
  return db
    .select()
    .from(independentLivingAssessments)
    .where(
      pathwayPlanId
        ? and(baseCondition, eq(independentLivingAssessments.pathwayPlanId, pathwayPlanId))
        : baseCondition,
    )
    .orderBy(desc(independentLivingAssessments.assessmentDate), desc(independentLivingAssessments.createdAt));
}

export async function createIndependentLivingAssessment(
  input: CreateAssessmentInput,
): Promise<ActionResult<typeof independentLivingAssessments.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');
    const parsed = createAssessmentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [plan] = await db.select().from(pathwayPlans).where(eq(pathwayPlans.id, parsed.data.pathwayPlanId)).limit(1);
    if (!plan) return { success: false, error: 'Pathway plan not found' };
    assertBelongsToOrg(plan.organisationId, orgId);

    const [row] = await db
      .insert(independentLivingAssessments)
      .values({
        organisationId: orgId,
        pathwayPlanId: parsed.data.pathwayPlanId,
        assessmentDate: parsed.data.assessmentDate,
        assessorName: parsed.data.assessorName,
        assessorId: parsed.data.assessorId ?? userId,
        skills: parsed.data.skills as AssessmentSkills,
        overallScore:
          parsed.data.overallScore ??
          computeAssessmentScore(parsed.data.skills as AssessmentSkills),
        comments: parsed.data.comments ?? null,
        isBaseline: parsed.data.isBaseline,
      })
      .returning();

    await auditLog('create', 'independent_living_assessment', row.id, { before: null, after: { pathwayPlanId: row.pathwayPlanId, overallScore: row.overallScore } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create assessment' };
  }
}

export async function updateIndependentLivingAssessment(
  id: string,
  input: Omit<UpdateAssessmentInput, 'id'>,
): Promise<ActionResult<typeof independentLivingAssessments.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'assessments');
    const parsed = updateAssessmentSchema.safeParse({ ...input, id });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const [existing] = await db
      .select()
      .from(independentLivingAssessments)
      .where(eq(independentLivingAssessments.id, id))
      .limit(1);
    if (!existing) return { success: false, error: 'Assessment not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const skills = (parsed.data.skills ?? existing.skills) as AssessmentSkills;
    const [row] = await db
      .update(independentLivingAssessments)
      .set({
        ...parsed.data,
        skills,
        overallScore: parsed.data.overallScore ?? computeAssessmentScore(skills),
        updatedAt: new Date(),
      })
      .where(eq(independentLivingAssessments.id, id))
      .returning();

    await auditLog('update', 'independent_living_assessment', id, { before: { overallScore: existing.overallScore }, after: { overallScore: row.overallScore } }, { userId, organisationId: orgId });
    await revalidateReg44Paths(orgId);
    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update assessment' };
  }
}

export async function getTransitionChronology(personId: string) {
  const { orgId } = await requirePermission('read', 'care_plans');
  const person = await getPersonInOrg(personId, orgId);
  if (!person) return [] as TransitionChronologyEntry[];

  const [chronologyRows, meetingRows, complaintRows, keyworkerRows, restraintRows, sanctionRows, contactRows, lacRows, planRows, milestoneRows, assessmentRows, eventRows] = await Promise.all([
    db
      .select()
      .from(safeguardingChronology)
      .where(
        and(
          eq(safeguardingChronology.organisationId, orgId),
          eq(safeguardingChronology.childId, personId),
        ),
      )
      .orderBy(desc(safeguardingChronology.eventDate))
      .limit(30),
    db
      .select()
      .from(meetings)
      .where(and(eq(meetings.organisationId, orgId), eq(meetings.personId, personId)))
      .orderBy(desc(meetings.meetingDate))
      .limit(10),
    db
      .select()
      .from(complaints)
      .where(and(eq(complaints.organisationId, orgId), eq(complaints.personId, personId)))
      .orderBy(desc(complaints.complaintDate))
      .limit(10),
    db
      .select()
      .from(keyworkerSessions)
      .where(and(eq(keyworkerSessions.organisationId, orgId), eq(keyworkerSessions.personId, personId)))
      .orderBy(desc(keyworkerSessions.sessionDate))
      .limit(10),
    db
      .select()
      .from(restraints)
      .where(and(eq(restraints.organisationId, orgId), eq(restraints.personId, personId)))
      .orderBy(desc(restraints.dateTime))
      .limit(10),
    db
      .select()
      .from(sanctions)
      .where(and(eq(sanctions.organisationId, orgId), eq(sanctions.personId, personId)))
      .orderBy(desc(sanctions.dateTime))
      .limit(10),
    db
      .select()
      .from(contactRecords)
      .where(and(eq(contactRecords.organisationId, orgId), eq(contactRecords.personId, personId)))
      .orderBy(desc(contactRecords.contactDate))
      .limit(10),
    db
      .select()
      .from(lacRecords)
      .where(and(eq(lacRecords.organisationId, orgId), eq(lacRecords.personId, personId)))
      .orderBy(desc(lacRecords.updatedAt))
      .limit(10),
    db
      .select()
      .from(pathwayPlans)
      .where(and(eq(pathwayPlans.organisationId, orgId), eq(pathwayPlans.personId, personId)))
      .orderBy(desc(pathwayPlans.createdAt))
      .limit(10),
    db
      .select({ milestone: transitionMilestones, planId: pathwayPlans.id, planName: pathwayPlans.youngPersonName, personId: pathwayPlans.personId })
      .from(transitionMilestones)
      .innerJoin(pathwayPlans, eq(transitionMilestones.pathwayPlanId, pathwayPlans.id))
      .where(and(eq(transitionMilestones.organisationId, orgId), eq(pathwayPlans.personId, personId)))
      .orderBy(desc(transitionMilestones.targetDate))
      .limit(20),
    db
      .select({ assessment: independentLivingAssessments, personId: pathwayPlans.personId })
      .from(independentLivingAssessments)
      .innerJoin(pathwayPlans, eq(independentLivingAssessments.pathwayPlanId, pathwayPlans.id))
      .where(and(eq(independentLivingAssessments.organisationId, orgId), eq(pathwayPlans.personId, personId)))
      .orderBy(desc(independentLivingAssessments.assessmentDate))
      .limit(10),
    db
      .select()
      .from(reg40NotifiableEvents)
      .where(eq(reg40NotifiableEvents.organisationId, orgId))
      .orderBy(desc(reg40NotifiableEvents.eventDate))
      .limit(20),
  ]);

  const eventEntries = eventRows
    .filter((row) => matchesPersonName(row.childrenInvolved, person))
    .map<TransitionChronologyEntry>((row) => ({
      id: row.id,
      date: normaliseDateString(row.eventDate),
      source: 'reg40',
      title: `Reg 40 ${row.category.replaceAll('_', ' ')}`,
      description: row.description,
      href: undefined,
    }));

  const entries: TransitionChronologyEntry[] = [
    ...chronologyRows.map((row) => ({
      id: row.id,
      date: row.eventDate.toISOString(),
      source: row.source,
      title: row.title,
      description: row.description,
      category: row.category,
      isManual: row.isManual,
    })),
    ...meetingRows.map((row) => ({
      id: row.id,
      date: row.meetingDate,
      source: 'meeting',
      title: row.title,
      description: row.decisions,
      href: undefined,
    })),
    ...complaintRows.map((row) => ({
      id: row.id,
      date: row.complaintDate,
      source: 'complaint',
      title: `Complaint raised by ${row.raisedBy}`,
      description: row.nature,
    })),
    ...keyworkerRows.map((row) => ({
      id: row.id,
      date: row.sessionDate,
      source: 'keyworker',
      title: 'Key worker session',
      description: row.wishesAndFeelings || row.weekReview || 'Session recorded',
    })),
    ...restraintRows.map((row) => ({
      id: row.id,
      date: row.dateTime,
      source: 'restraint',
      title: `Restraint using ${row.technique}`,
      description: row.reason,
    })),
    ...sanctionRows.map((row) => ({
      id: row.id,
      date: row.dateTime,
      source: 'sanction',
      title: row.sanctionType,
      description: row.description,
    })),
    ...contactRows.map((row) => ({
      id: row.id,
      date: row.contactDate.toISOString(),
      source: 'contact',
      title: `Contact ${row.contactType.replaceAll('_', ' ')}`,
      description: row.notes || row.concerns || 'Contact record logged',
    })),
    ...lacRows.map((row) => ({
      id: row.id,
      date: row.legalStatusDate,
      source: 'lac',
      title: `LAC ${row.legalStatus}`,
      description: `${row.placingAuthority}${row.socialWorkerName ? ` · ${row.socialWorkerName}` : ''}`,
    })),
    ...planRows.map((row) => ({
      id: row.id,
      date: normaliseDateString(row.planStartDate),
      source: 'pathway_plan',
      title: 'Pathway plan created',
      description: `Status ${row.status}${row.personalAdviser ? ` · Adviser ${row.personalAdviser}` : ''}`,
    })),
    ...milestoneRows.map(({ milestone }) => ({
      id: milestone.id,
      date: milestone.completedDate || milestone.targetDate || milestone.createdAt.toISOString(),
      source: 'milestone',
      title: milestone.title,
      description: milestone.notes || milestone.description || `Status ${milestone.status}`,
    })),
    ...assessmentRows.map(({ assessment }) => ({
      id: assessment.id,
      date: assessment.assessmentDate,
      source: 'assessment',
      title: 'Independent living assessment',
      description: `Overall readiness ${assessment.overallScore ?? 0}%`,
    })),
    ...eventEntries,
  ];

  return sortChronologyEntries(entries).slice(0, 40);
}

export type TransitionPlanSummary = {
  plan: typeof pathwayPlans.$inferSelect;
  person: Awaited<ReturnType<typeof getPersonInOrg>>;
  milestones: typeof transitionMilestones.$inferSelect[];
  assessments: typeof independentLivingAssessments.$inferSelect[];
  readiness: ReturnType<typeof calculateAssessmentReadiness>;
  alerts: string[];
  chronology: TransitionChronologyEntry[];
  checklist: ReturnType<typeof buildLeavingCareChecklist>;
  healthPassport: ReturnType<typeof buildHealthPassport>;
};

export async function getTransitionDashboard() {
  const { orgId } = await requirePermission('read', 'care_plans');

  try {
    const [plans, milestones, assessments, eligiblePeople] = await Promise.all([
    db
      .select()
      .from(pathwayPlans)
      .where(eq(pathwayPlans.organisationId, orgId))
      .orderBy(desc(pathwayPlans.planStartDate), desc(pathwayPlans.createdAt)),
    db
      .select()
      .from(transitionMilestones)
      .where(eq(transitionMilestones.organisationId, orgId))
      .orderBy(desc(transitionMilestones.targetDate), desc(transitionMilestones.createdAt)),
    db
      .select()
      .from(independentLivingAssessments)
      .where(eq(independentLivingAssessments.organisationId, orgId))
      .orderBy(desc(independentLivingAssessments.assessmentDate), desc(independentLivingAssessments.createdAt)),
    listEligibleTransitionPeople(),
  ]);

  const personIds = [...new Set(plans.map((plan) => plan.personId).filter(Boolean))] as string[];
  const people = personIds.length
    ? await db
        .select()
        .from(persons)
        .where(and(eq(persons.organisationId, orgId), isNull(persons.deletedAt)))
    : [];
  const peopleById = new Map(people.map((person) => [person.id, person]));

  const summaries: TransitionPlanSummary[] = [];
  for (const plan of plans) {
    const person = plan.personId ? peopleById.get(plan.personId) ?? null : null;
    const planMilestones = milestones.filter((milestone) => milestone.pathwayPlanId === plan.id);
    const planAssessments = assessments.filter((assessment) => assessment.pathwayPlanId === plan.id);
    const latestAssessment = planAssessments[0] ?? null;
    const readiness = latestAssessment
      ? calculateAssessmentReadiness(latestAssessment.skills)
      : { overall: 0, domains: [] };
    const chronology = plan.personId ? await getTransitionChronology(plan.personId) : [];

    summaries.push({
      plan,
      person,
      milestones: planMilestones,
      assessments: planAssessments,
      readiness,
      alerts: buildPathwayPlanAlerts({ person, plan, milestones: planMilestones }),
      chronology,
      checklist: buildLeavingCareChecklist({ person, plan, readiness: readiness.overall }),
      healthPassport: buildHealthPassport(person),
    });
  }

    return {
      plans: summaries,
      eligiblePeople,
    };
  } catch (error) {
    if (isOptionalSchemaDrift(error)) {
      return {
        plans: [],
        eligiblePeople: [],
      };
    }

    throw error;
  }
}
