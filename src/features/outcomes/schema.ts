/**
 * Zod validation schemas for the outcomes & skills feature.
 * Used by server actions and form validation.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums / constants
// ---------------------------------------------------------------------------

export const GOAL_CATEGORIES = [
  'independent_living',
  'health_wellbeing',
  'social_community',
  'communication',
  'emotional_wellbeing',
] as const;

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  independent_living: 'Independent Living',
  health_wellbeing: 'Health & Wellbeing',
  social_community: 'Social & Community',
  communication: 'Communication',
  emotional_wellbeing: 'Emotional Wellbeing',
};

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const GOAL_STATUSES = [
  'active',
  'completed',
  'paused',
  'cancelled',
] as const;

export const TRAFFIC_LIGHT_STATUSES = ['red', 'amber', 'green'] as const;

export const TRAFFIC_LIGHT_LABELS: Record<TrafficLightStatus, string> = {
  red: 'Regression',
  amber: 'Maintaining',
  green: 'Progressing',
};

export type TrafficLightStatus = (typeof TRAFFIC_LIGHT_STATUSES)[number];

export const COMPETENCY_LEVELS = [
  'prompted',
  'verbal_prompt',
  'physical_prompt',
  'independent',
] as const;

export const COMPETENCY_LEVEL_LABELS: Record<CompetencyLevel, string> = {
  prompted: 'Prompted',
  verbal_prompt: 'Verbal Prompt',
  physical_prompt: 'Physical Prompt',
  independent: 'Independent',
};

export type CompetencyLevel = (typeof COMPETENCY_LEVELS)[number];

/** Numeric value for competency level ordering (higher = more independent) */
export const COMPETENCY_LEVEL_VALUE: Record<CompetencyLevel, number> = {
  physical_prompt: 1,
  prompted: 2,
  verbal_prompt: 3,
  independent: 4,
};

// ---------------------------------------------------------------------------
// Goal participant schema
// ---------------------------------------------------------------------------

export const goalParticipantSchema = z.object({
  userId: z.string().uuid().optional(),
  name: z.string().min(1),
  role: z.string().min(1),
});

export type GoalParticipant = z.infer<typeof goalParticipantSchema>;

// ---------------------------------------------------------------------------
// SMART Goal schemas
// ---------------------------------------------------------------------------

export const createGoalSchema = z.object({
  personId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  category: z.enum(GOAL_CATEGORIES),
  smartSpecific: z.string().min(1, 'Specific field is required'),
  smartMeasurable: z.string().min(1, 'Measurable field is required'),
  smartAchievable: z.string().min(1, 'Achievable field is required'),
  smartRelevant: z.string().min(1, 'Relevant field is required'),
  smartTimeBound: z.string().min(1, 'Time-bound field is required'),
  baselineAssessment: z.string().optional(),
  baselineValue: z.string().optional(),
  targetValue: z.string().optional(),
  reviewDate: z.string().optional(),
  participants: z.array(goalParticipantSchema).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = createGoalSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(GOAL_STATUSES).optional(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

// ---------------------------------------------------------------------------
// Goal Review schemas
// ---------------------------------------------------------------------------

export const createGoalReviewSchema = z.object({
  goalId: z.string().uuid(),
  reviewDate: z.string().min(1, 'Review date is required'),
  status: z.enum(TRAFFIC_LIGHT_STATUSES),
  currentValue: z.string().optional(),
  notes: z.string().optional(),
  evidence: z.string().optional(),
});

export type CreateGoalReviewInput = z.infer<typeof createGoalReviewSchema>;

// ---------------------------------------------------------------------------
// Skill Domain schemas
// ---------------------------------------------------------------------------

export const createSkillDomainSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateSkillDomainInput = z.infer<typeof createSkillDomainSchema>;

// ---------------------------------------------------------------------------
// Skill schemas
// ---------------------------------------------------------------------------

export const createSkillSchema = z.object({
  domainId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
});

export type CreateSkillInput = z.infer<typeof createSkillSchema>;

// ---------------------------------------------------------------------------
// Skill Assessment schemas
// ---------------------------------------------------------------------------

export const createSkillAssessmentSchema = z.object({
  personId: z.string().uuid(),
  skillId: z.string().uuid(),
  competencyLevel: z.enum(COMPETENCY_LEVELS),
  assessmentDate: z.string().min(1, 'Assessment date is required'),
  notes: z.string().optional(),
});

export type CreateSkillAssessmentInput = z.infer<
  typeof createSkillAssessmentSchema
>;

// ---------------------------------------------------------------------------
// Community Access schemas
// ---------------------------------------------------------------------------

export const createCommunityAccessSchema = z.object({
  personId: z.string().uuid(),
  activityDate: z.string().min(1, 'Activity date is required'),
  destination: z.string().min(1, 'Destination is required'),
  durationMinutes: z.number().int().positive('Duration must be positive'),
  accompaniedBy: z.string().optional(),
  outcomes: z.string().optional(),
  skillsPractised: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type CreateCommunityAccessInput = z.infer<
  typeof createCommunityAccessSchema
>;

// ---------------------------------------------------------------------------
// Support Hours schemas
// ---------------------------------------------------------------------------

export const createSupportHoursSchema = z.object({
  personId: z.string().uuid(),
  weekStarting: z.string().min(1, 'Week starting date is required'),
  plannedHours: z.string().min(1, 'Planned hours are required'),
  actualHours: z.string().optional(),
  varianceNotes: z.string().optional(),
  commissionerRef: z.string().optional(),
});

export type CreateSupportHoursInput = z.infer<typeof createSupportHoursSchema>;

export const updateSupportHoursSchema = z.object({
  id: z.string().uuid(),
  actualHours: z.string().min(1, 'Actual hours are required'),
  varianceNotes: z.string().optional(),
});

export type UpdateSupportHoursInput = z.infer<typeof updateSupportHoursSchema>;
