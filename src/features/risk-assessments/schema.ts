/**
 * Risk Assessment validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Template IDs
// ---------------------------------------------------------------------------

export const riskAssessmentTemplateIds = [
  'falls',
  'waterlow',
  'must',
  'moving_handling',
  'fire_peep',
  'medication',
  'choking',
] as const;

export type RiskAssessmentTemplateId = (typeof riskAssessmentTemplateIds)[number];

// ---------------------------------------------------------------------------
// Create risk assessment schema
// ---------------------------------------------------------------------------

export const createRiskAssessmentSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  templateId: z.enum(riskAssessmentTemplateIds, {
    errorMap: () => ({ message: 'Invalid assessment template' }),
  }),
  reviewFrequency: z
    .enum(['weekly', 'monthly', 'quarterly'])
    .default('monthly'),
});

export type CreateRiskAssessmentInput = z.infer<typeof createRiskAssessmentSchema>;

// ---------------------------------------------------------------------------
// Complete (submit scores) risk assessment schema
// ---------------------------------------------------------------------------

export const completeRiskAssessmentSchema = z.object({
  scores: z.record(z.string(), z.number().int().min(0)),
  notes: z.string().max(5000).optional().nullable(),
  reviewDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Review date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
});

export type CompleteRiskAssessmentInput = z.infer<typeof completeRiskAssessmentSchema>;

// ---------------------------------------------------------------------------
// Review frequency helper
// ---------------------------------------------------------------------------

/** Returns the ISO date for the next review given a frequency and start date. */
export function calculateNextReviewDate(
  fromDate: Date,
  frequency: 'weekly' | 'monthly' | 'quarterly',
): string {
  const d = new Date(fromDate);
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
  }
  return d.toISOString().slice(0, 10);
}

/** Returns true if the review date is overdue (past today). */
export function isReviewOverdue(reviewDate: string | null | undefined): boolean {
  if (!reviewDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return reviewDate < today;
}

/** Returns true if the review date is within the reminder window (default 7 days). */
export function isReviewDueSoon(
  reviewDate: string | null | undefined,
  windowDays = 7,
): boolean {
  if (!reviewDate) return false;
  const today = new Date();
  const review = new Date(reviewDate);
  const diffMs = review.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= windowDays;
}
