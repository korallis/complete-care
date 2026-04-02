/**
 * Tests for outcomes Zod validation schemas.
 */
import { describe, it, expect } from 'vitest';
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
  GOAL_CATEGORIES,
  TRAFFIC_LIGHT_STATUSES,
  COMPETENCY_LEVELS,
  COMPETENCY_LEVEL_VALUE,
} from '@/features/outcomes/schema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('outcome constants', () => {
  it('has 5 goal categories', () => {
    expect(GOAL_CATEGORIES).toHaveLength(5);
    expect(GOAL_CATEGORIES).toContain('independent_living');
    expect(GOAL_CATEGORIES).toContain('health_wellbeing');
    expect(GOAL_CATEGORIES).toContain('social_community');
    expect(GOAL_CATEGORIES).toContain('communication');
    expect(GOAL_CATEGORIES).toContain('emotional_wellbeing');
  });

  it('has 3 traffic-light statuses', () => {
    expect(TRAFFIC_LIGHT_STATUSES).toEqual(['red', 'amber', 'green']);
  });

  it('has 4 competency levels', () => {
    expect(COMPETENCY_LEVELS).toHaveLength(4);
  });

  it('competency levels are ordered correctly by value', () => {
    expect(COMPETENCY_LEVEL_VALUE.physical_prompt).toBeLessThan(
      COMPETENCY_LEVEL_VALUE.prompted,
    );
    expect(COMPETENCY_LEVEL_VALUE.prompted).toBeLessThan(
      COMPETENCY_LEVEL_VALUE.verbal_prompt,
    );
    expect(COMPETENCY_LEVEL_VALUE.verbal_prompt).toBeLessThan(
      COMPETENCY_LEVEL_VALUE.independent,
    );
  });
});

// ---------------------------------------------------------------------------
// createGoalSchema (VAL-SL-009)
// ---------------------------------------------------------------------------

describe('createGoalSchema', () => {
  const validGoal = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Learn to cook independently',
    description: 'Develop cooking skills for daily meals',
    category: 'independent_living' as const,
    smartSpecific: 'Cook 3 simple meals without assistance',
    smartMeasurable: 'Track meals cooked independently each week',
    smartAchievable: 'Start with sandwiches, progress to hot meals',
    smartRelevant: 'Essential for independent living transition',
    smartTimeBound: 'Achieve by end of Q2 2026',
    baselineAssessment: 'Currently requires full support for all meals',
    baselineValue: '0',
    targetValue: '3',
    reviewDate: '2026-06-30',
    participants: [
      { name: 'John Smith', role: 'Keyworker' },
      { name: 'Jane Doe', role: 'Service User', userId: '550e8400-e29b-41d4-a716-446655440001' },
    ],
  };

  it('accepts a valid goal with all SMART fields', () => {
    const result = createGoalSchema.safeParse(validGoal);
    expect(result.success).toBe(true);
  });

  it('requires all SMART fields', () => {
    const fields = [
      'smartSpecific',
      'smartMeasurable',
      'smartAchievable',
      'smartRelevant',
      'smartTimeBound',
    ] as const;

    for (const field of fields) {
      const input = { ...validGoal, [field]: '' };
      const result = createGoalSchema.safeParse(input);
      expect(result.success).toBe(false);
    }
  });

  it('requires a valid category', () => {
    const input = { ...validGoal, category: 'invalid_category' };
    const result = createGoalSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('accepts all 5 goal categories', () => {
    for (const cat of GOAL_CATEGORIES) {
      const input = { ...validGoal, category: cat };
      const result = createGoalSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });

  it('requires a title', () => {
    const input = { ...validGoal, title: '' };
    const result = createGoalSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('requires a valid UUID for personId', () => {
    const input = { ...validGoal, personId: 'not-a-uuid' };
    const result = createGoalSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('allows optional fields to be omitted', () => {
    const minimal = {
      personId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Minimal goal',
      category: 'communication' as const,
      smartSpecific: 'Specific',
      smartMeasurable: 'Measurable',
      smartAchievable: 'Achievable',
      smartRelevant: 'Relevant',
      smartTimeBound: 'Time-bound',
    };
    const result = createGoalSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateGoalSchema
// ---------------------------------------------------------------------------

describe('updateGoalSchema', () => {
  it('requires an id', () => {
    const result = updateGoalSchema.safeParse({ title: 'Updated' });
    expect(result.success).toBe(false);
  });

  it('accepts partial updates with id', () => {
    const result = updateGoalSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'completed',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createGoalReviewSchema (VAL-SL-010)
// ---------------------------------------------------------------------------

describe('createGoalReviewSchema', () => {
  it('accepts a valid review with traffic-light status', () => {
    const result = createGoalReviewSchema.safeParse({
      goalId: '550e8400-e29b-41d4-a716-446655440000',
      reviewDate: '2026-04-01',
      status: 'green',
      notes: 'Good progress this month',
      evidence: 'Observed cooking 2 meals independently',
    });
    expect(result.success).toBe(true);
  });

  it('only accepts red/amber/green status', () => {
    for (const status of TRAFFIC_LIGHT_STATUSES) {
      const result = createGoalReviewSchema.safeParse({
        goalId: '550e8400-e29b-41d4-a716-446655440000',
        reviewDate: '2026-04-01',
        status,
      });
      expect(result.success).toBe(true);
    }

    const invalid = createGoalReviewSchema.safeParse({
      goalId: '550e8400-e29b-41d4-a716-446655440000',
      reviewDate: '2026-04-01',
      status: 'blue',
    });
    expect(invalid.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Skill schemas (VAL-SL-011)
// ---------------------------------------------------------------------------

describe('createSkillDomainSchema', () => {
  it('accepts a valid domain', () => {
    const result = createSkillDomainSchema.safeParse({
      name: 'Personal Care',
      description: 'Daily living skills',
    });
    expect(result.success).toBe(true);
  });

  it('requires a name', () => {
    const result = createSkillDomainSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('createSkillSchema', () => {
  it('accepts a valid skill', () => {
    const result = createSkillSchema.safeParse({
      domainId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Brushing teeth',
    });
    expect(result.success).toBe(true);
  });
});

describe('createSkillAssessmentSchema', () => {
  it('accepts all competency levels', () => {
    for (const level of COMPETENCY_LEVELS) {
      const result = createSkillAssessmentSchema.safeParse({
        personId: '550e8400-e29b-41d4-a716-446655440000',
        skillId: '550e8400-e29b-41d4-a716-446655440001',
        competencyLevel: level,
        assessmentDate: '2026-04-01',
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid competency levels', () => {
    const result = createSkillAssessmentSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      skillId: '550e8400-e29b-41d4-a716-446655440001',
      competencyLevel: 'expert',
      assessmentDate: '2026-04-01',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Community access schema (VAL-SL-012)
// ---------------------------------------------------------------------------

describe('createCommunityAccessSchema', () => {
  it('accepts a valid community access record', () => {
    const result = createCommunityAccessSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      activityDate: '2026-04-01',
      destination: 'Local library',
      durationMinutes: 90,
      accompaniedBy: 'Sarah (keyworker)',
      outcomes: 'Borrowed 2 books, interacted with librarian',
      skillsPractised: ['Communication', 'Money management'],
    });
    expect(result.success).toBe(true);
  });

  it('requires destination and positive duration', () => {
    const noDestination = createCommunityAccessSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      activityDate: '2026-04-01',
      destination: '',
      durationMinutes: 60,
    });
    expect(noDestination.success).toBe(false);

    const negativeDuration = createCommunityAccessSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      activityDate: '2026-04-01',
      destination: 'Park',
      durationMinutes: -10,
    });
    expect(negativeDuration.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Support hours schema (VAL-SL-013)
// ---------------------------------------------------------------------------

describe('createSupportHoursSchema', () => {
  it('accepts valid support hours', () => {
    const result = createSupportHoursSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      weekStarting: '2026-03-30',
      plannedHours: '20',
      actualHours: '18.5',
      varianceNotes: 'Appointment cancelled',
      commissionerRef: 'COM-2026-001',
    });
    expect(result.success).toBe(true);
  });

  it('requires planned hours', () => {
    const result = createSupportHoursSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      weekStarting: '2026-03-30',
      plannedHours: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateSupportHoursSchema', () => {
  it('accepts valid update', () => {
    const result = updateSupportHoursSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      actualHours: '19',
      varianceNotes: 'Slight under-delivery',
    });
    expect(result.success).toBe(true);
  });

  it('requires actual hours', () => {
    const result = updateSupportHoursSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      actualHours: '',
    });
    expect(result.success).toBe(false);
  });
});
