/**
 * Care Plan validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Section schema
// ---------------------------------------------------------------------------

export const carePlanSectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'personal_details',
    'health',
    'mobility',
    'nutrition',
    'continence',
    'personal_care',
    'communication',
    'social',
    'end_of_life',
    'custom',
  ]),
  title: z.string().min(1, 'Section title is required').max(200),
  content: z.string().max(10000).default(''),
  order: z.number().int().min(0),
});

export type CarePlanSectionInput = z.infer<typeof carePlanSectionSchema>;

// ---------------------------------------------------------------------------
// Create care plan schema
// ---------------------------------------------------------------------------

export const createCarePlanSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  title: z
    .string()
    .min(1, 'Care plan title is required')
    .max(255, 'Title must be 255 characters or fewer'),
  template: z
    .enum(['comprehensive', 'personal_care', 'health_mobility', 'social_wellbeing', 'blank'])
    .optional()
    .nullable(),
  sections: z.array(carePlanSectionSchema).default([]),
  reviewFrequency: z
    .enum(['weekly', 'monthly', 'quarterly'])
    .default('monthly'),
  nextReviewDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Review date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
});

export type CreateCarePlanInput = z.infer<typeof createCarePlanSchema>;

// ---------------------------------------------------------------------------
// Update care plan schema
// ---------------------------------------------------------------------------

export const updateCarePlanSchema = z.object({
  title: z
    .string()
    .min(1, 'Care plan title is required')
    .max(255)
    .optional(),
  sections: z.array(carePlanSectionSchema).optional(),
  reviewFrequency: z
    .enum(['weekly', 'monthly', 'quarterly'])
    .optional(),
  nextReviewDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Review date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
});

export type UpdateCarePlanInput = z.infer<typeof updateCarePlanSchema>;

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
export function isReviewOverdue(nextReviewDate: string | null | undefined): boolean {
  if (!nextReviewDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return nextReviewDate < today;
}

/** Returns true if the review date is within the reminder window (default 7 days). */
export function isReviewDueSoon(
  nextReviewDate: string | null | undefined,
  windowDays = 7,
): boolean {
  if (!nextReviewDate) return false;
  const today = new Date();
  const reviewDate = new Date(nextReviewDate);
  const diffMs = reviewDate.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= windowDays;
}

/** Returns the review status label for a care plan. */
export function getReviewStatus(nextReviewDate: string | null | undefined): 'overdue' | 'due_soon' | 'upcoming' | 'none' {
  if (!nextReviewDate) return 'none';
  if (isReviewOverdue(nextReviewDate)) return 'overdue';
  if (isReviewDueSoon(nextReviewDate)) return 'due_soon';
  return 'upcoming';
}
