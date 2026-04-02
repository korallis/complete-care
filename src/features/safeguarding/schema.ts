/**
 * Zod validation schemas for safeguarding feature.
 * Used in server actions and client-side form validation.
 */
import { z } from 'zod';
import {
  CONCERN_SEVERITIES,
  DSL_DECISIONS,
  LADO_STATUSES,
  LADO_OUTCOMES,
  LADO_EMPLOYMENT_ACTIONS,
  SECTION_47_STATUSES,
  MASH_STATUSES,
} from '@/lib/db/schema/safeguarding';

// ---------------------------------------------------------------------------
// Safeguarding Concern (VAL-CHILD-008)
// ---------------------------------------------------------------------------

export const createConcernSchema = z.object({
  childId: z.string().uuid('Invalid child ID'),
  observedAt: z.coerce.date({ required_error: 'Observation date/time is required' }),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(10000, 'Description must be 10,000 characters or fewer'),
  verbatimAccount: z
    .string()
    .max(10000, 'Verbatim account must be 10,000 characters or fewer')
    .optional()
    .nullable(),
  childPresentation: z
    .string()
    .max(5000, 'Child presentation must be 5,000 characters or fewer')
    .optional()
    .nullable(),
  bodyMapId: z.string().uuid().optional().nullable(),
  severity: z.enum(CONCERN_SEVERITIES, {
    required_error: 'Severity is required',
  }),
  location: z.string().max(500).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  witnesses: z.string().max(2000).optional().nullable(),
  immediateActions: z.string().max(5000).optional().nullable(),
});

export type CreateConcernInput = z.infer<typeof createConcernSchema>;

// ---------------------------------------------------------------------------
// Concern Correction (append-only)
// ---------------------------------------------------------------------------

export const createCorrectionSchema = z.object({
  concernId: z.string().uuid('Invalid concern ID'),
  fieldName: z.string().min(1, 'Field name is required'),
  correctedValue: z.string().min(1, 'Corrected value is required'),
  reason: z
    .string()
    .min(5, 'Reason must be at least 5 characters')
    .max(2000, 'Reason must be 2,000 characters or fewer'),
});

export type CreateCorrectionInput = z.infer<typeof createCorrectionSchema>;

// ---------------------------------------------------------------------------
// DSL Review (VAL-CHILD-009)
// ---------------------------------------------------------------------------

export const createDslReviewSchema = z
  .object({
    concernId: z.string().uuid('Invalid concern ID'),
    decision: z.enum(DSL_DECISIONS, {
      required_error: 'Decision is required',
    }),
    rationale: z
      .string()
      .min(10, 'Rationale must be at least 10 characters')
      .max(10000, 'Rationale must be 10,000 characters or fewer'),
    riskAssessment: z.string().max(10000).optional().nullable(),
    referralDate: z.coerce.date().optional().nullable(),
    referralAgency: z.string().max(500).optional().nullable(),
    referralReference: z.string().max(200).optional().nullable(),
    expectedResponseDate: z.coerce.date().optional().nullable(),
    additionalActions: z.string().max(5000).optional().nullable(),
  })
  .refine(
    (data) => {
      // If decision is an external referral, referral fields should be provided
      const externalDecisions = ['refer_to_mash', 'refer_to_lado', 'refer_to_police'];
      if (externalDecisions.includes(data.decision)) {
        return !!data.referralDate;
      }
      return true;
    },
    {
      message: 'Referral date is required for external referral decisions',
      path: ['referralDate'],
    },
  );

export type CreateDslReviewInput = z.infer<typeof createDslReviewSchema>;

// ---------------------------------------------------------------------------
// LADO Referral (VAL-CHILD-010)
// ---------------------------------------------------------------------------

export const createLadoReferralSchema = z.object({
  concernId: z.string().uuid().optional().nullable(),
  dslReviewId: z.string().uuid().optional().nullable(),
  childId: z.string().uuid('Invalid child ID'),
  allegationAgainstStaffId: z.string().uuid().optional().nullable(),
  allegationAgainstStaffName: z
    .string()
    .min(1, 'Staff member name is required')
    .max(500),
  allegationDetails: z
    .string()
    .min(10, 'Allegation details must be at least 10 characters')
    .max(10000),
  allegationCategory: z.string().max(200).optional().nullable(),
  ladoReference: z.string().max(200).optional().nullable(),
  ladoOfficerName: z.string().max(500).optional().nullable(),
  ladoOfficerContact: z.string().max(500).optional().nullable(),
  referralDate: z.coerce.date({ required_error: 'Referral date is required' }),
  notes: z.string().max(10000).optional().nullable(),
});

export type CreateLadoReferralInput = z.infer<typeof createLadoReferralSchema>;

export const updateLadoReferralSchema = z.object({
  id: z.string().uuid(),
  ladoReference: z.string().max(200).optional().nullable(),
  ladoOfficerName: z.string().max(500).optional().nullable(),
  ladoOfficerContact: z.string().max(500).optional().nullable(),
  status: z.enum(LADO_STATUSES).optional(),
  outcome: z.enum(LADO_OUTCOMES).optional().nullable(),
  employmentAction: z.enum(LADO_EMPLOYMENT_ACTIONS).optional().nullable(),
  outcomeDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
});

export type UpdateLadoReferralInput = z.infer<typeof updateLadoReferralSchema>;

// ---------------------------------------------------------------------------
// Section 47 (VAL-CHILD-010)
// ---------------------------------------------------------------------------

const strategyMeetingAttendeeSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  organisation: z.string().optional(),
});

export const createSection47Schema = z.object({
  concernId: z.string().uuid().optional().nullable(),
  childId: z.string().uuid('Invalid child ID'),
  localAuthorityReference: z.string().max(200).optional().nullable(),
  socialWorkerName: z.string().max(500).optional().nullable(),
  socialWorkerContact: z.string().max(500).optional().nullable(),
  strategyMeetingDate: z.coerce.date().optional().nullable(),
  strategyMeetingAttendees: z
    .array(strategyMeetingAttendeeSchema)
    .optional()
    .nullable(),
  strategyMeetingDecisions: z.string().max(10000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
});

export type CreateSection47Input = z.infer<typeof createSection47Schema>;

export const updateSection47Schema = z.object({
  id: z.string().uuid(),
  localAuthorityReference: z.string().max(200).optional().nullable(),
  socialWorkerName: z.string().max(500).optional().nullable(),
  socialWorkerContact: z.string().max(500).optional().nullable(),
  strategyMeetingDate: z.coerce.date().optional().nullable(),
  strategyMeetingAttendees: z
    .array(strategyMeetingAttendeeSchema)
    .optional()
    .nullable(),
  strategyMeetingDecisions: z.string().max(10000).optional().nullable(),
  status: z.enum(SECTION_47_STATUSES).optional(),
  outcome: z.string().max(10000).optional().nullable(),
  outcomeDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
});

export type UpdateSection47Input = z.infer<typeof updateSection47Schema>;

// ---------------------------------------------------------------------------
// MASH Referral
// ---------------------------------------------------------------------------

export const createMashReferralSchema = z.object({
  concernId: z.string().uuid().optional().nullable(),
  dslReviewId: z.string().uuid().optional().nullable(),
  childId: z.string().uuid('Invalid child ID'),
  referralDate: z.coerce.date({ required_error: 'Referral date is required' }),
  referralReason: z
    .string()
    .min(10, 'Referral reason must be at least 10 characters')
    .max(10000),
  referralAgency: z.string().max(500).optional().nullable(),
  mashReference: z.string().max(200).optional().nullable(),
  expectedResponseDate: z.coerce.date().optional().nullable(),
});

export type CreateMashReferralInput = z.infer<typeof createMashReferralSchema>;

export const updateMashReferralSchema = z.object({
  id: z.string().uuid(),
  mashReference: z.string().max(200).optional().nullable(),
  status: z.enum(MASH_STATUSES).optional(),
  outcome: z.string().max(10000).optional().nullable(),
  outcomeDate: z.coerce.date().optional().nullable(),
  responseDetails: z.string().max(10000).optional().nullable(),
});

export type UpdateMashReferralInput = z.infer<typeof updateMashReferralSchema>;

// ---------------------------------------------------------------------------
// Chronology Manual Entry (VAL-CHILD-025)
// ---------------------------------------------------------------------------

export const createChronologyEntrySchema = z.object({
  childId: z.string().uuid('Invalid child ID'),
  eventDate: z.coerce.date({ required_error: 'Event date is required' }),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(500, 'Title must be 500 characters or fewer'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(10000, 'Description must be 10,000 characters or fewer'),
  category: z.string().max(100).optional().nullable(),
  significance: z.enum(['standard', 'significant', 'critical']).default('standard'),
  isRestricted: z.boolean().default(false),
});

export type CreateChronologyEntryInput = z.infer<
  typeof createChronologyEntrySchema
>;
