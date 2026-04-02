/**
 * Reg 44 Monitoring — Zod validation schemas.
 *
 * Used for server action input validation and (optionally) client-side form validation.
 */
import { z } from 'zod';
import {
  VISIT_STATUSES,
  REPORT_STATUSES,
  RECOMMENDATION_PRIORITIES,
  RECOMMENDATION_STATUSES,
  NOTIFIABLE_EVENT_CATEGORIES,
  EVENT_STATUSES,
  PATHWAY_PLAN_STATUSES,
  MILESTONE_CATEGORIES,
  MILESTONE_STATUSES,
} from './types';

// ---------------------------------------------------------------------------
// Reg 44 Visits
// ---------------------------------------------------------------------------

export const createVisitSchema = z.object({
  visitDate: z.string().min(1, 'Visit date is required'),
  visitorName: z.string().min(1, 'Visitor name is required'),
  visitorId: z.string().uuid().optional(),
  childrenSpokenTo: z.array(z.string()).default([]),
  staffSpokenTo: z.array(z.string()).default([]),
  recordsReviewed: z.array(z.string()).default([]),
  areasInspected: z.array(z.string()).default([]),
  status: z.enum(VISIT_STATUSES).default('scheduled'),
});

export const updateVisitSchema = createVisitSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;

// ---------------------------------------------------------------------------
// Reg 44 Reports
// ---------------------------------------------------------------------------

const reportSectionsSchema = z.object({
  qualityOfCare: z.string().default(''),
  viewsOfChildren: z.string().default(''),
  education: z.string().default(''),
  health: z.string().default(''),
  safeguarding: z.string().default(''),
  staffing: z.string().default(''),
  environment: z.string().default(''),
  complaintsAndConcerns: z.string().default(''),
  recommendations: z.string().default(''),
});

export const createReportSchema = z.object({
  visitId: z.string().uuid('Visit ID is required'),
  sections: reportSectionsSchema,
  summary: z.string().optional(),
  status: z.enum(REPORT_STATUSES).default('draft'),
  authorId: z.string().uuid().optional(),
});

export const updateReportSchema = createReportSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export const createRecommendationSchema = z.object({
  reportId: z.string().uuid('Report ID is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(RECOMMENDATION_PRIORITIES).default('medium'),
  assignedToId: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  status: z.enum(RECOMMENDATION_STATUSES).default('open'),
  notes: z.string().optional(),
});

export const updateRecommendationSchema = createRecommendationSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export type CreateRecommendationInput = z.infer<
  typeof createRecommendationSchema
>;
export type UpdateRecommendationInput = z.infer<
  typeof updateRecommendationSchema
>;

// ---------------------------------------------------------------------------
// Reg 40 Notifiable Events
// ---------------------------------------------------------------------------

export const createNotifiableEventSchema = z.object({
  category: z.enum(NOTIFIABLE_EVENT_CATEGORIES),
  eventDate: z.string().min(1, 'Event date is required'),
  description: z.string().min(1, 'Description is required'),
  childrenInvolved: z.array(z.string()).default([]),
  staffInvolved: z.array(z.string()).default([]),
  notificationDate: z.string().optional(),
  ofstedReference: z.string().optional(),
  notificationMethod: z.string().optional(),
  actionsTaken: z.string().optional(),
  outcome: z.string().optional(),
  status: z.enum(EVENT_STATUSES).default('draft'),
  reportedById: z.string().uuid().optional(),
});

export const updateNotifiableEventSchema = createNotifiableEventSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export type CreateNotifiableEventInput = z.infer<
  typeof createNotifiableEventSchema
>;
export type UpdateNotifiableEventInput = z.infer<
  typeof updateNotifiableEventSchema
>;

// ---------------------------------------------------------------------------
// Pathway Plans
// ---------------------------------------------------------------------------

const pathwaySectionsSchema = z.object({
  accommodation: z.string().default(''),
  education: z.string().default(''),
  employment: z.string().default(''),
  health: z.string().default(''),
  financialSupport: z.string().default(''),
  relationships: z.string().default(''),
  identity: z.string().default(''),
  practicalSkills: z.string().default(''),
});

export const createPathwayPlanSchema = z.object({
  personId: z.string().uuid('Young person is required'),
  youngPersonName: z.string().min(1, 'Young person name is required').optional(),
  dateOfBirth: z.string().optional(),
  personalAdviser: z.string().optional(),
  planStartDate: z.string().min(1, 'Plan start date is required'),
  planReviewDate: z.string().optional(),
  sections: pathwaySectionsSchema,
  status: z.enum(PATHWAY_PLAN_STATUSES).default('draft'),
  createdById: z.string().uuid().optional(),
});

export const updatePathwayPlanSchema = createPathwayPlanSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  });

export type CreatePathwayPlanInput = z.infer<typeof createPathwayPlanSchema>;
export type UpdatePathwayPlanInput = z.infer<typeof updatePathwayPlanSchema>;

// ---------------------------------------------------------------------------
// Transition Milestones
// ---------------------------------------------------------------------------

export const createMilestoneSchema = z.object({
  pathwayPlanId: z.string().uuid('Pathway plan ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(MILESTONE_CATEGORIES),
  targetDate: z.string().optional(),
  completedDate: z.string().optional(),
  status: z.enum(MILESTONE_STATUSES).default('not-started'),
  notes: z.string().optional(),
});

export const updateMilestoneSchema = createMilestoneSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

// ---------------------------------------------------------------------------
// Independent Living Skills Assessment
// ---------------------------------------------------------------------------

const skillAssessmentSchema = z.object({
  skill: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  notes: z.string().default(''),
});

const independentLivingSkillsSchema = z.object({
  dailyLiving: z.array(skillAssessmentSchema).default([]),
  financialCapability: z.array(skillAssessmentSchema).default([]),
  healthAndWellbeing: z.array(skillAssessmentSchema).default([]),
  socialAndRelationships: z.array(skillAssessmentSchema).default([]),
  educationAndWork: z.array(skillAssessmentSchema).default([]),
  housingKnowledge: z.array(skillAssessmentSchema).default([]),
});

export const createAssessmentSchema = z.object({
  pathwayPlanId: z.string().uuid('Pathway plan ID is required'),
  assessmentDate: z.string().min(1, 'Assessment date is required'),
  assessorName: z.string().min(1, 'Assessor name is required'),
  assessorId: z.string().uuid().optional(),
  skills: independentLivingSkillsSchema,
  overallScore: z.number().int().optional(),
  comments: z.string().optional(),
  isBaseline: z.boolean().default(false),
});

export const updateAssessmentSchema = createAssessmentSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
