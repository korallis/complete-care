/**
 * Database schema definition tests for outcomes tables.
 * Verifies structure, types, and column properties in memory (no DB connection needed).
 */
import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  goals,
  goalReviews,
  skillDomains,
  skills,
  skillAssessments,
  communityAccess,
  supportHours,
  goalsRelations,
  goalReviewsRelations,
  skillDomainsRelations,
  skillsRelations,
  skillAssessmentsRelations,
  communityAccessRelations,
  supportHoursRelations,
} from '@/lib/db/schema';
import type {
  Goal,
  NewGoal,
  GoalReview,
  NewGoalReview,
  SkillDomain,
  NewSkillDomain,
  Skill,
  NewSkill,
  SkillAssessment,
  NewSkillAssessment,
  CommunityAccess,
  NewCommunityAccess,
  SupportHour,
  NewSupportHour,
} from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// goals (VAL-SL-009)
// ---------------------------------------------------------------------------

describe('goals schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(goals)).toBe('goals');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(goals);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'title',
        'description',
        'category',
        'smartSpecific',
        'smartMeasurable',
        'smartAchievable',
        'smartRelevant',
        'smartTimeBound',
        'baselineAssessment',
        'baselineValue',
        'targetValue',
        'reviewDate',
        'status',
        'participants',
        'createdBy',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('id column is uuid primary key with default random', () => {
    expect(goals.id.columnType).toBe('PgUUID');
    expect(goals.id.primary).toBe(true);
    expect(goals.id.hasDefault).toBe(true);
  });

  it('organisationId is not null', () => {
    expect(goals.organisationId.notNull).toBe(true);
  });

  it('personId is not null', () => {
    expect(goals.personId.notNull).toBe(true);
  });

  it('all SMART fields are not null', () => {
    expect(goals.smartSpecific.notNull).toBe(true);
    expect(goals.smartMeasurable.notNull).toBe(true);
    expect(goals.smartAchievable.notNull).toBe(true);
    expect(goals.smartRelevant.notNull).toBe(true);
    expect(goals.smartTimeBound.notNull).toBe(true);
  });

  it('status defaults to active', () => {
    expect(goals.status.default).toBe('active');
  });

  it('participants is jsonb nullable', () => {
    expect(goals.participants.columnType).toBe('PgJsonb');
  });

  it('exports Goal and NewGoal types', () => {
    const goal: Goal = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      title: 'Test Goal',
      description: null,
      category: 'independent_living',
      smartSpecific: 'Specific',
      smartMeasurable: 'Measurable',
      smartAchievable: 'Achievable',
      smartRelevant: 'Relevant',
      smartTimeBound: 'Time-bound',
      baselineAssessment: null,
      baselineValue: null,
      targetValue: null,
      reviewDate: null,
      status: 'active',
      participants: null,
      createdBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(goal.title).toBe('Test Goal');

    const newGoal: NewGoal = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      title: 'New Goal',
      category: 'health_wellbeing',
      smartSpecific: 'S',
      smartMeasurable: 'M',
      smartAchievable: 'A',
      smartRelevant: 'R',
      smartTimeBound: 'T',
    };
    expect(newGoal.title).toBe('New Goal');
  });
});

// ---------------------------------------------------------------------------
// goal_reviews (VAL-SL-010)
// ---------------------------------------------------------------------------

describe('goalReviews schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(goalReviews)).toBe('goal_reviews');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(goalReviews);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'goalId',
        'reviewDate',
        'reviewerId',
        'status',
        'currentValue',
        'notes',
        'evidence',
        'createdAt',
      ]),
    );
  });

  it('status is not null (traffic-light required)', () => {
    expect(goalReviews.status.notNull).toBe(true);
  });

  it('exports GoalReview and NewGoalReview types', () => {
    const review: GoalReview = {
      id: 'uuid',
      organisationId: 'org-uuid',
      goalId: 'goal-uuid',
      reviewDate: '2026-04-01',
      reviewerId: null,
      status: 'green',
      currentValue: null,
      notes: null,
      evidence: null,
      createdAt: new Date(),
    };
    expect(review.status).toBe('green');

    const newReview: NewGoalReview = {
      organisationId: 'org-uuid',
      goalId: 'goal-uuid',
      reviewDate: '2026-04-01',
      status: 'amber',
    };
    expect(newReview.status).toBe('amber');
  });
});

// ---------------------------------------------------------------------------
// skill_domains (VAL-SL-011)
// ---------------------------------------------------------------------------

describe('skillDomains schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(skillDomains)).toBe('skill_domains');
  });

  it('organisationId is not null', () => {
    expect(skillDomains.organisationId.notNull).toBe(true);
  });

  it('exports SkillDomain and NewSkillDomain types', () => {
    const domain: SkillDomain = {
      id: 'uuid',
      organisationId: 'org-uuid',
      name: 'Personal Care',
      description: null,
      sortOrder: 0,
      createdAt: new Date(),
    };
    expect(domain.name).toBe('Personal Care');

    const newDomain: NewSkillDomain = {
      organisationId: 'org-uuid',
      name: 'Cooking',
    };
    expect(newDomain.name).toBe('Cooking');
  });
});

// ---------------------------------------------------------------------------
// skills
// ---------------------------------------------------------------------------

describe('skills schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(skills)).toBe('skills');
  });

  it('exports Skill and NewSkill types', () => {
    const skill: Skill = {
      id: 'uuid',
      organisationId: 'org-uuid',
      domainId: 'domain-uuid',
      name: 'Brushing teeth',
      description: null,
      createdAt: new Date(),
    };
    expect(skill.name).toBe('Brushing teeth');

    const newSkill: NewSkill = {
      organisationId: 'org-uuid',
      domainId: 'domain-uuid',
      name: 'Making bed',
    };
    expect(newSkill.name).toBe('Making bed');
  });
});

// ---------------------------------------------------------------------------
// skill_assessments
// ---------------------------------------------------------------------------

describe('skillAssessments schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(skillAssessments)).toBe('skill_assessments');
  });

  it('competencyLevel is not null', () => {
    expect(skillAssessments.competencyLevel.notNull).toBe(true);
  });

  it('exports SkillAssessment and NewSkillAssessment types', () => {
    const assessment: SkillAssessment = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      skillId: 'skill-uuid',
      competencyLevel: 'verbal_prompt',
      assessmentDate: '2026-04-01',
      assessorId: null,
      notes: null,
      createdAt: new Date(),
    };
    expect(assessment.competencyLevel).toBe('verbal_prompt');

    const newAssessment: NewSkillAssessment = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      skillId: 'skill-uuid',
      competencyLevel: 'independent',
      assessmentDate: '2026-04-01',
    };
    expect(newAssessment.competencyLevel).toBe('independent');
  });
});

// ---------------------------------------------------------------------------
// community_access (VAL-SL-012)
// ---------------------------------------------------------------------------

describe('communityAccess schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(communityAccess)).toBe('community_access');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(communityAccess);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'activityDate',
        'destination',
        'durationMinutes',
        'accompaniedBy',
        'outcomes',
        'skillsPractised',
        'notes',
        'recordedBy',
        'createdAt',
      ]),
    );
  });

  it('skillsPractised is jsonb', () => {
    expect(communityAccess.skillsPractised.columnType).toBe('PgJsonb');
  });

  it('exports CommunityAccess and NewCommunityAccess types', () => {
    const record: CommunityAccess = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      activityDate: '2026-04-01',
      destination: 'Library',
      durationMinutes: 60,
      accompaniedBy: null,
      outcomes: null,
      skillsPractised: null,
      notes: null,
      recordedBy: null,
      createdAt: new Date(),
    };
    expect(record.destination).toBe('Library');

    const newRecord: NewCommunityAccess = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      activityDate: '2026-04-01',
      destination: 'Park',
      durationMinutes: 90,
    };
    expect(newRecord.destination).toBe('Park');
  });
});

// ---------------------------------------------------------------------------
// support_hours (VAL-SL-013)
// ---------------------------------------------------------------------------

describe('supportHours schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(supportHours)).toBe('support_hours');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(supportHours);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'organisationId',
        'personId',
        'weekStarting',
        'plannedHours',
        'actualHours',
        'varianceNotes',
        'commissionerRef',
        'recordedBy',
        'createdAt',
        'updatedAt',
      ]),
    );
  });

  it('plannedHours is not null', () => {
    expect(supportHours.plannedHours.notNull).toBe(true);
  });

  it('actualHours is not null with default', () => {
    expect(supportHours.actualHours.notNull).toBe(true);
    expect(supportHours.actualHours.hasDefault).toBe(true);
  });

  it('exports SupportHour and NewSupportHour types', () => {
    const record: SupportHour = {
      id: 'uuid',
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      weekStarting: '2026-03-30',
      plannedHours: '20',
      actualHours: '18',
      varianceNotes: null,
      commissionerRef: null,
      recordedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(record.plannedHours).toBe('20');

    const newRecord: NewSupportHour = {
      organisationId: 'org-uuid',
      personId: 'person-uuid',
      weekStarting: '2026-03-30',
      plannedHours: '25',
    };
    expect(newRecord.plannedHours).toBe('25');
  });
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

describe('outcomes relations', () => {
  it('goalsRelations is defined', () => {
    expect(goalsRelations).toBeDefined();
  });

  it('goalReviewsRelations is defined', () => {
    expect(goalReviewsRelations).toBeDefined();
  });

  it('skillDomainsRelations is defined', () => {
    expect(skillDomainsRelations).toBeDefined();
  });

  it('skillsRelations is defined', () => {
    expect(skillsRelations).toBeDefined();
  });

  it('skillAssessmentsRelations is defined', () => {
    expect(skillAssessmentsRelations).toBeDefined();
  });

  it('communityAccessRelations is defined', () => {
    expect(communityAccessRelations).toBeDefined();
  });

  it('supportHoursRelations is defined', () => {
    expect(supportHoursRelations).toBeDefined();
  });
});
