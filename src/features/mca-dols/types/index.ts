/**
 * MCA & DoLS — Zod schemas, types, and validation logic.
 *
 * Key regulatory rules encoded here:
 * - MCA is always decision-specific
 * - Diagnostic test "No" → auto-conclude "has_capacity", skip functional
 * - Functional test: failing ANY ONE criterion → "lacks_capacity"
 * - Best interest decision is mandatory when outcome is "lacks_capacity"
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// MCA outcome derivation
// ---------------------------------------------------------------------------

export type McaOutcome = 'has_capacity' | 'lacks_capacity';

/**
 * Derives the MCA outcome from the two-stage test results.
 *
 * Rules (Mental Capacity Act 2005):
 * - If diagnostic test = false (no impairment) → has_capacity
 * - If diagnostic test = true:
 *   - If any functional criterion is false → lacks_capacity
 *   - If all functional criteria are true → has_capacity
 */
export function deriveMcaOutcome(input: {
  diagnosticTestResult: boolean;
  canUnderstand?: boolean | null;
  canRetain?: boolean | null;
  canUseOrWeigh?: boolean | null;
  canCommunicate?: boolean | null;
}): McaOutcome {
  if (!input.diagnosticTestResult) {
    return 'has_capacity';
  }

  const functionalResults = [
    input.canUnderstand,
    input.canRetain,
    input.canUseOrWeigh,
    input.canCommunicate,
  ];

  // If any criterion is false, the person lacks capacity for this decision
  if (functionalResults.some((r) => r === false)) {
    return 'lacks_capacity';
  }

  return 'has_capacity';
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

/** Person consulted in a best interest decision */
export const personConsultedSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  views: z.string().min(1, 'Views are required'),
});

export type PersonConsulted = z.infer<typeof personConsultedSchema>;

/**
 * MCA Assessment — full form schema.
 * Functional test fields are conditionally required when diagnosticTestResult = true.
 */
export const mcaAssessmentSchema = z
  .object({
    personId: z.string().uuid('Invalid person ID'),
    decisionToBeAssessed: z.string().min(1, 'Decision to be assessed is required'),
    assessorId: z.string().uuid('Invalid assessor ID'),

    // Diagnostic test
    diagnosticTestResult: z.boolean(),
    diagnosticTestEvidence: z.string().min(1, 'Diagnostic test evidence is required'),

    // Functional test (conditionally required)
    canUnderstand: z.boolean().nullable().optional(),
    canUnderstandEvidence: z.string().nullable().optional(),
    canRetain: z.boolean().nullable().optional(),
    canRetainEvidence: z.string().nullable().optional(),
    canUseOrWeigh: z.boolean().nullable().optional(),
    canUseOrWeighEvidence: z.string().nullable().optional(),
    canCommunicate: z.boolean().nullable().optional(),
    canCommunicateEvidence: z.string().nullable().optional(),

    // Support
    supportStepsTaken: z.string().min(1, 'Support steps taken is required'),

    assessmentDate: z.coerce.date(),
    reviewDate: z.coerce.date().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // When diagnostic test is positive, functional test is required
    if (data.diagnosticTestResult) {
      const functionalFields = [
        { field: 'canUnderstand', evidence: 'canUnderstandEvidence', label: 'understand' },
        { field: 'canRetain', evidence: 'canRetainEvidence', label: 'retain' },
        { field: 'canUseOrWeigh', evidence: 'canUseOrWeighEvidence', label: 'use or weigh' },
        { field: 'canCommunicate', evidence: 'canCommunicateEvidence', label: 'communicate' },
      ] as const;

      for (const { field, evidence, label } of functionalFields) {
        if (data[field] === null || data[field] === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `"Can they ${label}?" is required when diagnostic test is positive`,
            path: [field],
          });
        }
        if (!data[evidence]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Evidence for "${label}" is required when diagnostic test is positive`,
            path: [evidence],
          });
        }
      }
    }
  });

export type McaAssessmentInput = z.infer<typeof mcaAssessmentSchema>;

/**
 * Best Interest Decision schema.
 */
export const bestInterestDecisionSchema = z.object({
  mcaAssessmentId: z.string().uuid('Invalid MCA assessment ID'),
  personId: z.string().uuid('Invalid person ID'),
  decisionBeingMade: z.string().min(1, 'Decision being made is required'),
  personsConsulted: z
    .array(personConsultedSchema)
    .min(1, 'At least one person must be consulted'),
  personWishesFeelingsBeliefs: z
    .string()
    .min(1, "Person's wishes, feelings, beliefs and values are required"),
  lessRestrictiveOptionsConsidered: z
    .string()
    .min(1, 'Less restrictive options considered is required'),
  decisionReached: z.string().min(1, 'Decision reached is required'),
  decisionMakerName: z.string().min(1, 'Decision maker name is required'),
  decisionMakerRole: z.string().min(1, 'Decision maker role is required'),
  decisionDate: z.coerce.date(),
  reviewDate: z.coerce.date().nullable().optional(),
});

export type BestInterestDecisionInput = z.infer<typeof bestInterestDecisionSchema>;

/**
 * LPA / ADRT record schema.
 */
export const lpaAdrtRecordSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  recordType: z.enum(['lpa_health', 'lpa_finance', 'adrt'], {
    errorMap: () => ({ message: 'Record type must be lpa_health, lpa_finance, or adrt' }),
  }),
  isActive: z.boolean().default(true),
  details: z.string().min(1, 'Details are required'),
  registeredDate: z.string().nullable().optional(),
  conditions: z.string().nullable().optional(),
  documentReference: z.string().nullable().optional(),
});

export type LpaAdrtRecordInput = z.infer<typeof lpaAdrtRecordSchema>;

/**
 * DoLS application status lifecycle.
 */
export const dolsStatusValues = [
  'applied',
  'granted',
  'refused',
  'expired',
  'renewed',
] as const;
export type DolsStatus = (typeof dolsStatusValues)[number];

/**
 * DoLS application schema.
 */
export const dolsApplicationSchema = z
  .object({
    personId: z.string().uuid('Invalid person ID'),
    managingAuthority: z.string().min(1, 'Managing authority is required'),
    supervisoryBody: z.string().min(1, 'Supervisory body (Local Authority) is required'),
    laReferenceNumber: z.string().nullable().optional(),
    applicationDate: z.string().min(1, 'Application date is required'),
    reason: z.string().min(1, 'Reason is required'),
    restrictions: z.string().min(1, 'Restrictions are required'),
    linkedMcaId: z.string().uuid().nullable().optional(),
    linkedBestInterestId: z.string().uuid().nullable().optional(),
    personsRepresentative: z.string().nullable().optional(),
    imcaInstructed: z.boolean().default(false),
    status: z.enum(dolsStatusValues).default('applied'),

    // Authorisation details
    authorisationStartDate: z.string().nullable().optional(),
    authorisationEndDate: z.string().nullable().optional(),
    conditions: z.string().nullable().optional(),
    reviewDate: z.string().nullable().optional(),
    expiryAlertDays: z.number().int().min(1).max(365).default(28),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'granted') {
      if (!data.authorisationStartDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Authorisation start date is required when status is granted',
          path: ['authorisationStartDate'],
        });
      }
      if (!data.authorisationEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Authorisation end date is required when status is granted',
          path: ['authorisationEndDate'],
        });
      }
      // Max 12 months validation
      if (data.authorisationStartDate && data.authorisationEndDate) {
        const start = new Date(data.authorisationStartDate);
        const end = new Date(data.authorisationEndDate);
        const maxEnd = new Date(start);
        maxEnd.setMonth(maxEnd.getMonth() + 12);
        if (end > maxEnd) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Authorisation cannot exceed 12 months',
            path: ['authorisationEndDate'],
          });
        }
      }
    }
  });

export type DolsApplicationInput = z.infer<typeof dolsApplicationSchema>;

/**
 * DoLS restriction schema.
 */
export const dolsRestrictionSchema = z.object({
  dolsApplicationId: z.string().uuid('Invalid DoLS application ID'),
  personId: z.string().uuid('Invalid person ID'),
  restrictionType: z.string().min(1, 'Restriction type is required'),
  description: z.string().min(1, 'Description is required'),
  justification: z.string().min(1, 'Justification is required'),
  isActive: z.boolean().default(true),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable().optional(),
});

export type DolsRestrictionInput = z.infer<typeof dolsRestrictionSchema>;

// ---------------------------------------------------------------------------
// DoLS expiry helpers
// ---------------------------------------------------------------------------

/**
 * Determines if a DoLS authorisation is expiring within the alert window.
 */
export function isDolsExpiringSoon(
  authorisationEndDate: string | null | undefined,
  alertDays: number,
  now: Date = new Date(),
): boolean {
  if (!authorisationEndDate) return false;
  const endDate = new Date(authorisationEndDate);
  const alertDate = new Date(endDate);
  alertDate.setDate(alertDate.getDate() - alertDays);
  return now >= alertDate && now < endDate;
}

/**
 * Determines if a DoLS authorisation has expired.
 */
export function isDolsExpired(
  authorisationEndDate: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!authorisationEndDate) return false;
  return now >= new Date(authorisationEndDate);
}
