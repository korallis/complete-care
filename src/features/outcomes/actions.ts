'use server';

/**
 * Server actions for the outcomes & skills feature.
 * All mutations are scoped to an organisation (multi-tenant).
 */

import { db } from '@/lib/db';
import {
  goals,
  goalReviews,
  skillDomains,
  skills,
  skillAssessments,
  communityAccess,
  supportHours,
} from '@/lib/db/schema/outcomes';
import { eq, and, desc, asc } from 'drizzle-orm';
import type { ActionResult } from '@/types';
import { requirePermission } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import {
  createGoalSchema,
  updateGoalSchema,
  createGoalReviewSchema,
  createSkillDomainSchema,
  createSkillSchema,
  createSkillAssessmentSchema,
  createCommunityAccessSchema,
  createSupportHoursSchema,
  updateSupportHoursSchema,
} from './schema';

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export async function createGoal(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { userId, orgId: organisationId } = await requirePermission('create', 'care_plans');

  const parsed = createGoalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(goals)
    .values({
      organisationId,
      createdBy: userId,
      ...parsed.data,
      participants: parsed.data.participants ?? null,
    })
    .returning({ id: goals.id });

  await auditLog('create', 'goal', row.id, {
    after: parsed.data,
  }, { userId, organisationId });

  return { success: true, data: { id: row.id } };
}

export async function updateGoal(
  input: unknown,
): Promise<ActionResult> {
  const { userId, orgId: organisationId } = await requirePermission('update', 'care_plans');

  const parsed = updateGoalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...data } = parsed.data;
  await db
    .update(goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.organisationId, organisationId)));

  await auditLog('update', 'goal', id, {
    after: data,
  }, { userId, organisationId });

  return { success: true, data: undefined };
}

export async function getGoalsForPerson(
  personId: string,
) {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');
  return db
    .select()
    .from(goals)
    .where(
      and(eq(goals.organisationId, organisationId), eq(goals.personId, personId)),
    )
    .orderBy(desc(goals.createdAt));
}

export async function getGoalById(goalId: string) {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');
  const [row] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.organisationId, organisationId)));
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Goal Reviews
// ---------------------------------------------------------------------------

export async function createGoalReview(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { userId, orgId: organisationId } = await requirePermission('create', 'care_plans');

  const parsed = createGoalReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(goalReviews)
    .values({
      organisationId,
      reviewerId: userId,
      ...parsed.data,
    })
    .returning({ id: goalReviews.id });

  await auditLog('create', 'goal_review', row.id, {
    after: parsed.data,
  }, { userId, organisationId });

  return { success: true, data: { id: row.id } };
}

export async function getReviewsForGoal(
  goalId: string,
) {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');
  return db
    .select()
    .from(goalReviews)
    .where(
      and(
        eq(goalReviews.organisationId, organisationId),
        eq(goalReviews.goalId, goalId),
      ),
    )
    .orderBy(desc(goalReviews.reviewDate));
}

export async function getReviewSummaryForPerson(
  personId: string,
) {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');
  // Get all goals for person, then get latest review per goal
  const personGoals = await db
    .select({ id: goals.id, title: goals.title, category: goals.category, status: goals.status })
    .from(goals)
    .where(
      and(
        eq(goals.organisationId, organisationId),
        eq(goals.personId, personId),
        eq(goals.status, 'active'),
      ),
    );

  const summary: { red: number; amber: number; green: number; unreviewed: number } = {
    red: 0,
    amber: 0,
    green: 0,
    unreviewed: 0,
  };

  for (const goal of personGoals) {
    const [latestReview] = await db
      .select({ status: goalReviews.status })
      .from(goalReviews)
      .where(
        and(
          eq(goalReviews.organisationId, organisationId),
          eq(goalReviews.goalId, goal.id),
        ),
      )
      .orderBy(desc(goalReviews.reviewDate))
      .limit(1);

    if (!latestReview) {
      summary.unreviewed++;
    } else if (
      latestReview.status === 'red' ||
      latestReview.status === 'amber' ||
      latestReview.status === 'green'
    ) {
      summary[latestReview.status]++;
    }
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Skill Domains & Skills
// ---------------------------------------------------------------------------

export async function createSkillDomain(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { orgId: organisationId } = await requirePermission('create', 'care_plans');

  const parsed = createSkillDomainSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(skillDomains)
    .values({ organisationId, ...parsed.data })
    .returning({ id: skillDomains.id });

  return { success: true, data: { id: row.id } };
}

export async function getSkillDomains() {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');
  return db
    .select()
    .from(skillDomains)
    .where(eq(skillDomains.organisationId, organisationId))
    .orderBy(asc(skillDomains.sortOrder));
}

export async function createSkill(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { orgId: organisationId } = await requirePermission('create', 'care_plans');

  const parsed = createSkillSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(skills)
    .values({ organisationId, ...parsed.data })
    .returning({ id: skills.id });

  return { success: true, data: { id: row.id } };
}

export async function getSkillsByDomain(
  domainId: string,
) {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');
  return db
    .select()
    .from(skills)
    .where(
      and(
        eq(skills.organisationId, organisationId),
        eq(skills.domainId, domainId),
      ),
    )
    .orderBy(asc(skills.name));
}

// ---------------------------------------------------------------------------
// Skill Assessments
// ---------------------------------------------------------------------------

export async function createSkillAssessment(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { userId, orgId: organisationId } = await requirePermission('create', 'assessments');

  const parsed = createSkillAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(skillAssessments)
    .values({ organisationId, assessorId: userId, ...parsed.data })
    .returning({ id: skillAssessments.id });

  await auditLog('create', 'skill_assessment', row.id, {
    after: parsed.data,
  }, { userId, organisationId });

  return { success: true, data: { id: row.id } };
}

export async function getSkillAssessmentsForPerson(
  personId: string,
) {
  const { orgId: organisationId } = await requirePermission('read', 'assessments');
  return db
    .select()
    .from(skillAssessments)
    .where(
      and(
        eq(skillAssessments.organisationId, organisationId),
        eq(skillAssessments.personId, personId),
      ),
    )
    .orderBy(desc(skillAssessments.assessmentDate));
}

export async function getSkillTrend(
  personId: string,
  skillId: string,
) {
  const { orgId: organisationId } = await requirePermission('read', 'assessments');
  return db
    .select()
    .from(skillAssessments)
    .where(
      and(
        eq(skillAssessments.organisationId, organisationId),
        eq(skillAssessments.personId, personId),
        eq(skillAssessments.skillId, skillId),
      ),
    )
    .orderBy(asc(skillAssessments.assessmentDate));
}

// ---------------------------------------------------------------------------
// Community Access
// ---------------------------------------------------------------------------

export async function createCommunityAccessRecord(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { userId, orgId: organisationId } = await requirePermission('create', 'care_plans');

  const parsed = createCommunityAccessSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(communityAccess)
    .values({
      organisationId,
      recordedBy: userId,
      ...parsed.data,
      skillsPractised: parsed.data.skillsPractised ?? null,
    })
    .returning({ id: communityAccess.id });

  await auditLog('create', 'community_access', row.id, {
    after: parsed.data,
  }, { userId, organisationId });

  return { success: true, data: { id: row.id } };
}

export async function getCommunityAccessForPerson(
  personId: string,
) {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');
  return db
    .select()
    .from(communityAccess)
    .where(
      and(
        eq(communityAccess.organisationId, organisationId),
        eq(communityAccess.personId, personId),
      ),
    )
    .orderBy(desc(communityAccess.activityDate));
}

// ---------------------------------------------------------------------------
// Support Hours
// ---------------------------------------------------------------------------

export async function createSupportHoursRecord(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { userId, orgId: organisationId } = await requirePermission('create', 'care_plans');

  const parsed = createSupportHoursSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(supportHours)
    .values({
      organisationId,
      recordedBy: userId,
      ...parsed.data,
    })
    .returning({ id: supportHours.id });

  await auditLog('create', 'support_hours', row.id, {
    after: parsed.data,
  }, { userId, organisationId });

  return { success: true, data: { id: row.id } };
}

export async function updateSupportHoursRecord(
  input: unknown,
): Promise<ActionResult> {
  const { userId, orgId: organisationId } = await requirePermission('update', 'care_plans');

  const parsed = updateSupportHoursSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...data } = parsed.data;
  await db
    .update(supportHours)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(supportHours.id, id),
        eq(supportHours.organisationId, organisationId),
      ),
    );

  await auditLog('update', 'support_hours', id, {
    after: data,
  }, { userId, organisationId });

  return { success: true, data: undefined };
}

export async function getSupportHoursForPerson(
  personId: string,
) {
  const { orgId: organisationId } = await requirePermission('read', 'care_plans');
  return db
    .select()
    .from(supportHours)
    .where(
      and(
        eq(supportHours.organisationId, organisationId),
        eq(supportHours.personId, personId),
      ),
    )
    .orderBy(desc(supportHours.weekStarting));
}
