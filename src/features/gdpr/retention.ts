/**
 * Data retention policy utilities.
 *
 * Implements configurable retention periods per data type with special
 * handling for children's records (75-year retention per Schedule 3).
 */

import { z } from 'zod';

/** Validation schema for creating/updating a retention policy. */
export const retentionPolicySchema = z.object({
  organisationId: z.string().uuid(),
  dataType: z.enum([
    'person',
    'care_plan',
    'medication',
    'incident',
    'assessment',
    'children_case_record',
    'financial',
    'staff_record',
    'correspondence',
  ]),
  retentionDays: z.number().int().positive(),
  isStatutory: z.boolean().default(false),
  legalBasis: z.enum([
    'consent',
    'legal_obligation',
    'vital_interests',
    'public_task',
    'legitimate_interests',
  ]),
  description: z.string().optional(),
  autoDeleteEnabled: z.boolean().default(false),
  warningDays: z.number().int().positive().default(30),
});

export type RetentionPolicyInput = z.infer<typeof retentionPolicySchema>;

/** Legal basis labels for UI. */
export const LEGAL_BASIS_LABELS: Record<string, string> = {
  consent: 'Consent (Article 6(1)(a))',
  legal_obligation: 'Legal Obligation (Article 6(1)(c))',
  vital_interests: 'Vital Interests (Article 6(1)(d))',
  public_task: 'Public Task (Article 6(1)(e))',
  legitimate_interests: 'Legitimate Interests (Article 6(1)(f))',
};

/** Data type labels for UI. */
export const DATA_TYPE_LABELS: Record<string, string> = {
  person: 'Person Records',
  care_plan: 'Care Plans',
  medication: 'Medication Records',
  incident: 'Incident Reports',
  assessment: 'Assessments',
  children_case_record: "Children's Case Records",
  financial: 'Financial Records',
  staff_record: 'Staff Records',
  correspondence: 'Correspondence',
};

/**
 * Children's records 75-year retention period in days.
 * Per Schedule 3, Regulation 43 of The Children's Homes (England) Regulations 2015.
 * Records must be retained for 75 years from the date of birth of the child,
 * or 15 years from the date of death if the child died before age 18.
 */
export const CHILDRENS_RECORD_RETENTION_DAYS = 75 * 365; // ~27,375 days

/**
 * Default retention periods (in days) for common data types.
 * These serve as sensible defaults — organisations can customise.
 */
export const DEFAULT_RETENTION_PERIODS: Record<string, number> = {
  person: 3 * 365, // 3 years after last service
  care_plan: 8 * 365, // 8 years
  medication: 8 * 365, // 8 years (NHS guidance)
  incident: 10 * 365, // 10 years
  assessment: 3 * 365, // 3 years
  children_case_record: CHILDRENS_RECORD_RETENTION_DAYS, // 75 years
  financial: 7 * 365, // 7 years (HMRC)
  staff_record: 6 * 365, // 6 years after employment ends
  correspondence: 3 * 365, // 3 years
};

/** Retention flag status labels. */
export const RETENTION_FLAG_STATUS_LABELS: Record<string, string> = {
  warning: 'Approaching Expiry',
  expired: 'Retention Expired',
  approved_for_deletion: 'Approved for Deletion',
  deleted: 'Deleted',
  retained: 'Retained (Extended)',
};

/**
 * Calculate when a record's retention expires.
 */
export function calculateRetentionExpiry(
  createdAt: Date,
  retentionDays: number,
): Date {
  const expiry = new Date(createdAt);
  expiry.setDate(expiry.getDate() + retentionDays);
  return expiry;
}

/**
 * Check if a record is within the warning window.
 */
export function isInWarningWindow(
  retentionExpiresAt: Date,
  warningDays: number,
): boolean {
  const now = new Date();
  const warningStart = new Date(retentionExpiresAt);
  warningStart.setDate(warningStart.getDate() - warningDays);
  return now >= warningStart && now < retentionExpiresAt;
}

/**
 * Check if a record's retention has expired.
 */
export function isRetentionExpired(retentionExpiresAt: Date): boolean {
  return new Date() >= retentionExpiresAt;
}

/**
 * Calculate retention expiry for a children's case record based on date of birth.
 * 75 years from DOB per Schedule 3.
 */
export function calculateChildrensRecordExpiry(dateOfBirth: Date): Date {
  const expiry = new Date(dateOfBirth);
  expiry.setFullYear(expiry.getFullYear() + 75);
  return expiry;
}
