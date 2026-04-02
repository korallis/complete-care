/**
 * Zod validation schemas for the admissions/referral feature.
 * Used by server actions and client-side form validation.
 */
import { z } from 'zod';

// ── Shared enums ───────────────────────────────────────────────────────

export const referralStatusEnum = z.enum([
  'received',
  'assessment_complete',
  'accepted',
  'declined',
  'admitted',
]);
export type ReferralStatus = z.infer<typeof referralStatusEnum>;

export const riskRatingEnum = z.enum(['low', 'medium', 'high']);
export type RiskRating = z.infer<typeof riskRatingEnum>;

export const recommendationEnum = z.enum([
  'accept',
  'decline',
  'accept_with_conditions',
]);
export type Recommendation = z.infer<typeof recommendationEnum>;

// ── Referral form schema ───────────────────────────────────────────────

const placementHistoryEntrySchema = z.object({
  placementType: z.string().min(1),
  provider: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  reason: z.string().optional(),
});

const needsSchema = z.object({
  physical: z.array(z.string()).default([]),
  emotional: z.array(z.string()).default([]),
  educational: z.array(z.string()).default([]),
  medical: z.array(z.string()).default([]),
});

const behaviourEntrySchema = z.object({
  description: z.string().min(1),
  triggers: z.array(z.string()).default([]),
  managementStrategies: z.array(z.string()).default([]),
});

const medicalInformationSchema = z.object({
  diagnosis: z.string().optional(),
  medication: z.string().optional(),
  allergies: z.string().optional(),
  gpDetails: z.string().optional(),
});

export const createReferralSchema = z.object({
  // Child information
  childFirstName: z.string().min(1, 'First name is required'),
  childLastName: z.string().min(1, 'Last name is required'),
  childDateOfBirth: z.string().min(1, 'Date of birth is required'),
  childGender: z.string().min(1, 'Gender is required'),
  childEthnicity: z.string().optional(),
  childNationality: z.string().optional(),
  childLanguage: z.string().optional(),
  childReligion: z.string().optional(),

  // Needs & behaviours
  needs: needsSchema.optional(),
  behaviours: z.array(behaviourEntrySchema).optional(),
  medicalInformation: medicalInformationSchema.optional(),
  backgroundSummary: z.string().optional(),

  // Placement history
  placementHistory: z.array(placementHistoryEntrySchema).optional(),
  referralReason: z.string().min(1, 'Referral reason is required'),

  // Placing authority
  placingAuthorityName: z
    .string()
    .min(1, 'Placing authority name is required'),
  socialWorkerName: z.string().min(1, 'Social worker name is required'),
  socialWorkerEmail: z
    .string()
    .email('Valid email required')
    .min(1, 'Social worker email is required'),
  socialWorkerPhone: z.string().optional(),
  teamManagerName: z.string().optional(),
  teamManagerEmail: z.string().email().optional().or(z.literal('')),

  // Legal
  legalStatus: z.string().optional(),
});
export type CreateReferralInput = z.infer<typeof createReferralSchema>;

// ── Matching / impact risk assessment schema ───────────────────────────

const riskEntrySchema = z.object({
  childName: z.string().min(1),
  childId: z.string().optional(),
  riskDescription: z.string().min(1),
  likelihood: z.string().min(1),
  severity: z.string().min(1),
  mitigations: z.string().optional(),
});

const compatibilityFactorSchema = z.object({
  factor: z.string().min(1),
  assessment: z.string().min(1),
  rating: z.enum(['compatible', 'neutral', 'incompatible']),
});

export const createMatchingAssessmentSchema = z.object({
  referralId: z.string().uuid(),

  // Risk-to
  riskToExisting: z.array(riskEntrySchema).optional(),
  riskToRating: riskRatingEnum.optional(),

  // Risk-from
  riskFromExisting: z.array(riskEntrySchema).optional(),
  riskFromRating: riskRatingEnum.optional(),

  // Compatibility
  compatibilityFactors: z.array(compatibilityFactorSchema).optional(),

  // Capacity
  currentOccupancy: z.number().int().min(0).optional(),
  maxCapacity: z.number().int().min(0).optional(),
  bedsAvailable: z.number().int().min(0).optional(),
  capacityNotes: z.string().optional(),

  // Overall
  overallRiskRating: riskRatingEnum,
  recommendation: recommendationEnum,
  recommendationRationale: z
    .string()
    .min(1, 'Rationale is required'),
  conditions: z.string().optional(),
});
export type CreateMatchingAssessmentInput = z.infer<
  typeof createMatchingAssessmentSchema
>;

// ── Decision schema ────────────────────────────────────────────────────

export const recordDecisionSchema = z.object({
  referralId: z.string().uuid(),
  decision: z.enum(['accepted', 'declined']),
  reason: z.string().min(1, 'Decision reason is required'),
  acceptanceConditions: z.string().optional(),
});
export type RecordDecisionInput = z.infer<typeof recordDecisionSchema>;

// ── Checklist item schema ──────────────────────────────────────────────

export const updateChecklistItemSchema = z.object({
  id: z.string().uuid(),
  completed: z.boolean(),
  notes: z.string().optional(),
});
export type UpdateChecklistItemInput = z.infer<
  typeof updateChecklistItemSchema
>;

export const completeAdmissionSchema = z.object({
  referralId: z.string().uuid(),
});
export type CompleteAdmissionInput = z.infer<typeof completeAdmissionSchema>;
