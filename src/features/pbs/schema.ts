import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const PBS_PLAN_STATUSES = [
  'draft',
  'active',
  'superseded',
  'archived',
] as const;

export const ANTECEDENT_CATEGORIES = [
  'demand',
  'transition',
  'sensory',
  'social',
  'denial',
  'unstructured_time',
  'pain_discomfort',
  'unknown',
  'other',
] as const;

export const ANTECEDENT_CATEGORY_LABELS: Record<
  (typeof ANTECEDENT_CATEGORIES)[number],
  string
> = {
  demand: 'Demand / Task',
  transition: 'Transition',
  sensory: 'Sensory',
  social: 'Social Interaction',
  denial: 'Denial / Restriction',
  unstructured_time: 'Unstructured Time',
  pain_discomfort: 'Pain / Discomfort',
  unknown: 'Unknown',
  other: 'Other',
};

export const RESTRICTIVE_PRACTICE_TYPES = [
  'physical',
  'environmental',
  'chemical',
  'mechanical',
] as const;

export const RESTRICTIVE_PRACTICE_TYPE_LABELS: Record<
  (typeof RESTRICTIVE_PRACTICE_TYPES)[number],
  string
> = {
  physical: 'Physical',
  environmental: 'Environmental',
  chemical: 'Chemical',
  mechanical: 'Mechanical',
};

export const INTENSITY_LEVELS = [1, 2, 3, 4, 5] as const;

export const INTENSITY_LABELS: Record<number, string> = {
  1: 'Minimal',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Severe',
};

export const PERIOD_OPTIONS = ['weekly', 'monthly', 'quarterly'] as const;

// ---------------------------------------------------------------------------
// MDI Contribution
// ---------------------------------------------------------------------------

export const mdiContributionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().min(1, 'Notes are required'),
});

// ---------------------------------------------------------------------------
// PBS Plan
// ---------------------------------------------------------------------------

export const createPbsPlanSchema = z.object({
  personId: z.string().uuid(),
  functionalAssessmentSummary: z
    .string()
    .min(10, 'Functional assessment summary must be at least 10 characters'),
  identifiedBehaviours: z
    .string()
    .min(10, 'Identified behaviours must be at least 10 characters'),
  hypothesisedFunction: z
    .string()
    .min(10, 'Hypothesised function must be at least 10 characters'),
  primaryStrategies: z
    .string()
    .min(10, 'Primary strategies must be at least 10 characters'),
  secondaryStrategies: z
    .string()
    .min(10, 'Secondary strategies must be at least 10 characters'),
  reactiveStrategies: z
    .string()
    .min(10, 'Reactive strategies must be at least 10 characters'),
  postIncidentSupport: z
    .string()
    .min(10, 'Post-incident support must be at least 10 characters'),
  reductionPlan: z.string().optional(),
  mdiContributions: z.array(mdiContributionSchema).optional(),
});

export type CreatePbsPlanInput = z.infer<typeof createPbsPlanSchema>;

export const updatePbsPlanSchema = createPbsPlanSchema.extend({
  planId: z.string().uuid(),
});

export type UpdatePbsPlanInput = z.infer<typeof updatePbsPlanSchema>;

// ---------------------------------------------------------------------------
// ABC Incident
// ---------------------------------------------------------------------------

export const createAbcIncidentSchema = z.object({
  personId: z.string().uuid(),
  pbsPlanId: z.string().uuid().optional(),
  occurredAt: z.string().min(1, 'Date/time is required'),
  antecedentCategory: z.enum(ANTECEDENT_CATEGORIES),
  antecedentDescription: z
    .string()
    .min(5, 'Antecedent description is required'),
  behaviourTopography: z
    .string()
    .min(5, 'Behaviour description is required'),
  behaviourDuration: z.coerce.number().int().min(0).optional(),
  behaviourIntensity: z.coerce.number().int().min(1).max(5),
  consequenceStaffResponse: z
    .string()
    .min(5, 'Staff response is required'),
  settingEnvironment: z.string().optional(),
  settingPeoplePresent: z.string().optional(),
  settingActivity: z.string().optional(),
  settingSensoryFactors: z.string().optional(),
});

export type CreateAbcIncidentInput = z.infer<typeof createAbcIncidentSchema>;

// ---------------------------------------------------------------------------
// Restrictive Practice
// ---------------------------------------------------------------------------

export const createRestrictivePracticeSchema = z.object({
  personId: z.string().uuid(),
  type: z.enum(RESTRICTIVE_PRACTICE_TYPES),
  justification: z.string().min(10, 'Justification must be at least 10 characters'),
  mcaLink: z.string().optional(),
  authorisedBy: z.string().min(2, 'Authorising person is required'),
  durationMinutes: z.coerce.number().int().min(1, 'Duration must be at least 1 minute'),
  personResponse: z.string().min(5, 'Person response is required'),
  occurredAt: z.string().min(1, 'Date/time is required'),
});

export type CreateRestrictivePracticeInput = z.infer<
  typeof createRestrictivePracticeSchema
>;

export const editRestrictivePracticeSchema = createRestrictivePracticeSchema.extend({
  /** The original entry being "edited" (which creates a new version) */
  originalId: z.string().uuid(),
});

export type EditRestrictivePracticeInput = z.infer<
  typeof editRestrictivePracticeSchema
>;
