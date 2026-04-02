/**
 * Right to Erasure (GDPR Article 17) utilities.
 *
 * Implements erasure request workflow:
 *   1. Record erasure request (auto-calculates 30-day deadline)
 *   2. Approval workflow
 *   3. Anonymisation — replace PII with "[REDACTED]" while preserving audit trail structure
 *   4. Completion tracking
 */

import { z } from 'zod';

/** Validation schema for creating an erasure request. */
export const createErasureRequestSchema = z.object({
  organisationId: z.string().uuid(),
  subjectName: z.string().min(1, 'Subject name is required'),
  subjectEmail: z.string().email('Valid email is required'),
  personId: z.string().uuid().optional(),
  receivedAt: z.coerce.date(),
  notes: z.string().optional(),
});

export type CreateErasureRequestInput = z.infer<typeof createErasureRequestSchema>;

/** Validation schema for updating erasure request status. */
export const updateErasureRequestSchema = z.object({
  status: z.enum(['received', 'approved', 'in_progress', 'completed', 'rejected']),
  rejectionReason: z.string().optional(),
  processedByUserId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type UpdateErasureRequestInput = z.infer<typeof updateErasureRequestSchema>;

/** Erasure request status labels. */
export const ERASURE_STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  approved: 'Approved',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
};

/** Number of days allowed to fulfil an erasure request. */
export const ERASURE_DEADLINE_DAYS = 30;

/** The redaction string used to replace PII. */
export const REDACTED = '[REDACTED]';

/**
 * Calculate the erasure request deadline.
 */
export function calculateErasureDeadline(receivedAt: Date): Date {
  const deadline = new Date(receivedAt);
  deadline.setDate(deadline.getDate() + ERASURE_DEADLINE_DAYS);
  return deadline;
}

/**
 * Common PII field names that should be anonymised.
 * Used to identify fields to redact across different tables.
 */
export const PII_FIELDS = [
  'name',
  'firstName',
  'lastName',
  'email',
  'phone',
  'address',
  'addressLine1',
  'addressLine2',
  'postcode',
  'dateOfBirth',
  'nhsNumber',
  'niNumber',
  'nextOfKin',
  'emergencyContact',
  'gpDetails',
  'bankDetails',
  'notes',
] as const;

/**
 * Anonymise a record by replacing PII fields with REDACTED.
 * Preserves non-PII fields (IDs, timestamps, status fields) for audit trail integrity.
 *
 * @param record - The record object to anonymise
 * @param fieldsToRedact - Specific fields to redact (defaults to PII_FIELDS)
 * @returns Object with original and anonymised record, plus list of redacted fields
 */
export function anonymiseRecord<T extends Record<string, unknown>>(
  record: T,
  fieldsToRedact: readonly string[] = PII_FIELDS,
): { anonymised: T; redactedFields: string[] } {
  const anonymised = { ...record };
  const redactedFields: string[] = [];

  for (const field of fieldsToRedact) {
    if (field in anonymised && anonymised[field] !== null && anonymised[field] !== undefined) {
      (anonymised as Record<string, unknown>)[field] = REDACTED;
      redactedFields.push(field);
    }
  }

  return { anonymised, redactedFields };
}

/**
 * Build the anonymisation report for an erasure request.
 * Documents which tables/fields were anonymised for compliance records.
 */
export interface AnonymisationReport {
  requestId: string;
  processedAt: string;
  tablesProcessed: Array<{
    tableName: string;
    recordCount: number;
    fieldsRedacted: string[];
  }>;
}

export function buildAnonymisationReport(
  requestId: string,
  tablesProcessed: Array<{
    tableName: string;
    recordCount: number;
    fieldsRedacted: string[];
  }>,
): AnonymisationReport {
  return {
    requestId,
    processedAt: new Date().toISOString(),
    tablesProcessed,
  };
}

/**
 * Valid reasons for rejecting an erasure request.
 * GDPR Article 17(3) exemptions.
 */
export const ERASURE_EXEMPTIONS = [
  { code: 'freedom_of_expression', label: 'Freedom of expression and information' },
  { code: 'legal_obligation', label: 'Compliance with legal obligation' },
  { code: 'public_health', label: 'Public health in the public interest' },
  { code: 'archiving', label: 'Archiving in the public interest' },
  { code: 'legal_claims', label: 'Establishment, exercise or defence of legal claims' },
  { code: 'childrens_statutory', label: "Children's statutory record retention (75 years)" },
] as const;
