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
  organisationId: string,
  userId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
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

  return { success: true, data: { id: row.id } };
}

export async function updateGoal(
  organisationId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = updateGoalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, ...data } = parsed.data;
  await db
    .update(goals)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.organisationId, organisationId)));

  return { success: true, data: undefined };
}

export async function getGoalsForPerson(
  organisationId: string,
  personId: string,
) {
  return db
    .select()
    .from(goals)
    .where(
      and(eq(goals.organisationId, organisationId), eq(goals.personId, personId)),
    )
    .orderBy(desc(goals.createdAt));
}

export async function getGoalById(organisationId: string, goalId: string) {
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
  organisationId: string,
  reviewerId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createGoalReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(goalReviews)
    .values({
      organisationId,
      reviewerId,
      ...parsed.data,
    })
    .returning({ id: goalReviews.id });

  return { success: true, data: { id: row.id } };
}

export async function getReviewsForGoal(
  organisationId: string,
  goalId: string,
) {
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
  organisationId: string,
  personId: string,
) {
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
  organisationId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
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

export async function getSkillDomains(organisationId: string) {
  return db
    .select()
    .from(skillDomains)
    .where(eq(skillDomains.organisationId, organisationId))
    .orderBy(asc(skillDomains.sortOrder));
}

export async function createSkill(
  organisationId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
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
  organisationId: string,
  domainId: string,
) {
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
  organisationId: string,
  assessorId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSkillAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(skillAssessments)
    .values({ organisationId, assessorId, ...parsed.data })
    .returning({ id: skillAssessments.id });

  return { success: true, data: { id: row.id } };
}

export async function getSkillAssessmentsForPerson(
  organisationId: string,
  personId: string,
) {
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
  organisationId: string,
  personId: string,
  skillId: string,
) {
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
  organisationId: string,
  recordedById: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createCommunityAccessSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(communityAccess)
    .values({
      organisationId,
      recordedBy: recordedById,
      ...parsed.data,
      skillsPractised: parsed.data.skillsPractised ?? null,
    })
    .returning({ id: communityAccess.id });

  return { success: true, data: { id: row.id } };
}

export async function getCommunityAccessForPerson(
  organisationId: string,
  personId: string,
) {
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
  organisationId: string,
  recordedById: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSupportHoursSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const [row] = await db
    .insert(supportHours)
    .values({
      organisationId,
      recordedBy: recordedById,
      ...parsed.data,
    })
    .returning({ id: supportHours.id });

  return { success: true, data: { id: row.id } };
}

export async function updateSupportHoursRecord(
  organisationId: string,
  input: unknown,
): Promise<ActionResult> {
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

  return { success: true, data: undefined };
}

export async function getSupportHoursForPerson(
  organisationId: string,
  personId: string,
) {
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
