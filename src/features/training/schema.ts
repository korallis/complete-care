/**
 * Training Matrix validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Date validation helper
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Training course categories
// ---------------------------------------------------------------------------

export const TRAINING_CATEGORIES = [
  'mandatory',
  'clinical',
  'specialist',
  'management',
  'other',
] as const;

export type TrainingCategory = (typeof TRAINING_CATEGORIES)[number];

export const TRAINING_CATEGORY_LABELS: Record<TrainingCategory, string> = {
  mandatory: 'Mandatory',
  clinical: 'Clinical',
  specialist: 'Specialist',
  management: 'Management',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Training record statuses
// ---------------------------------------------------------------------------

export const TRAINING_STATUSES = [
  'current',
  'expiring_soon',
  'expired',
  'not_completed',
] as const;

export type TrainingStatus = (typeof TRAINING_STATUSES)[number];

export const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  current: 'Current',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  not_completed: 'Not Completed',
};

// ---------------------------------------------------------------------------
// Qualification statuses
// ---------------------------------------------------------------------------

export const QUALIFICATION_STATUSES = [
  'completed',
  'working_towards',
] as const;

export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];

export const QUALIFICATION_STATUS_LABELS: Record<QualificationStatus, string> = {
  completed: 'Completed',
  working_towards: 'Working Towards',
};

// ---------------------------------------------------------------------------
// Qualification levels
// ---------------------------------------------------------------------------

export const QUALIFICATION_LEVELS = [
  'Level 2 Certificate',
  'Level 2 Diploma',
  'Level 3 Certificate',
  'Level 3 Diploma',
  'Level 4 Diploma',
  'Level 5 Diploma',
  'Level 6 Diploma',
  'Level 7 Diploma',
] as const;

export type QualificationLevel = (typeof QUALIFICATION_LEVELS)[number];

// ---------------------------------------------------------------------------
// Create training course schema
// ---------------------------------------------------------------------------

export const createTrainingCourseSchema = z.object({
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(255, 'Course name must be 255 characters or fewer'),
  category: z.enum(TRAINING_CATEGORIES).default('mandatory'),
  requiredForRoles: z.array(z.string()).default([]),
  defaultProvider: z.string().max(255).optional().nullable(),
  validityMonths: z
    .union([
      z.number().int().min(1).max(120),
      z.string().transform((v) => (v === '' ? null : Number(v))),
    ])
    .nullable()
    .optional(),
  isDefault: z.boolean().default(false),
});

export type CreateTrainingCourseInput = z.infer<typeof createTrainingCourseSchema>;

// ---------------------------------------------------------------------------
// Update training course schema
// ---------------------------------------------------------------------------

export const updateTrainingCourseSchema = createTrainingCourseSchema.partial();

export type UpdateTrainingCourseInput = z.infer<typeof updateTrainingCourseSchema>;

// ---------------------------------------------------------------------------
// Create training record schema
// ---------------------------------------------------------------------------

export const createTrainingRecordSchema = z.object({
  staffProfileId: z.string().uuid('Invalid staff profile ID'),
  courseId: z.string().uuid('Invalid course ID').optional().nullable(),
  courseName: z
    .string()
    .min(1, 'Course name is required')
    .max(255, 'Course name must be 255 characters or fewer'),
  provider: z.string().max(255).optional().nullable(),
  completedDate: z
    .string()
    .regex(DATE_REGEX, 'Completed date must be in YYYY-MM-DD format'),
  expiryDate: z
    .string()
    .regex(DATE_REGEX, 'Expiry date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  certificateUrl: z.string().max(2048).optional().nullable(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').optional().nullable(),
});

export type CreateTrainingRecordInput = z.infer<typeof createTrainingRecordSchema>;

// ---------------------------------------------------------------------------
// Update training record schema
// ---------------------------------------------------------------------------

export const updateTrainingRecordSchema = z.object({
  courseName: z
    .string()
    .min(1, 'Course name is required')
    .max(255, 'Course name must be 255 characters or fewer')
    .optional(),
  provider: z.string().max(255).optional().nullable(),
  completedDate: z
    .string()
    .regex(DATE_REGEX, 'Completed date must be in YYYY-MM-DD format')
    .optional(),
  expiryDate: z
    .string()
    .regex(DATE_REGEX, 'Expiry date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  certificateUrl: z.string().max(2048).optional().nullable(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').optional().nullable(),
});

export type UpdateTrainingRecordInput = z.infer<typeof updateTrainingRecordSchema>;

// ---------------------------------------------------------------------------
// Create qualification schema
// ---------------------------------------------------------------------------

export const createQualificationSchema = z.object({
  staffProfileId: z.string().uuid('Invalid staff profile ID'),
  name: z
    .string()
    .min(1, 'Qualification name is required')
    .max(255, 'Qualification name must be 255 characters or fewer'),
  level: z
    .string()
    .min(1, 'Qualification level is required')
    .max(100, 'Level must be 100 characters or fewer'),
  status: z.enum(QUALIFICATION_STATUSES).default('working_towards'),
  completedDate: z
    .string()
    .regex(DATE_REGEX, 'Completed date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  targetDate: z
    .string()
    .regex(DATE_REGEX, 'Target date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').optional().nullable(),
});

export type CreateQualificationInput = z.infer<typeof createQualificationSchema>;

// ---------------------------------------------------------------------------
// Update qualification schema
// ---------------------------------------------------------------------------

export const updateQualificationSchema = z.object({
  name: z
    .string()
    .min(1, 'Qualification name is required')
    .max(255, 'Qualification name must be 255 characters or fewer')
    .optional(),
  level: z
    .string()
    .min(1, 'Qualification level is required')
    .max(100, 'Level must be 100 characters or fewer')
    .optional(),
  status: z.enum(QUALIFICATION_STATUSES).optional(),
  completedDate: z
    .string()
    .regex(DATE_REGEX, 'Completed date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  targetDate: z
    .string()
    .regex(DATE_REGEX, 'Target date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').optional().nullable(),
});

export type UpdateQualificationInput = z.infer<typeof updateQualificationSchema>;

// ---------------------------------------------------------------------------
// Status computation helpers
// ---------------------------------------------------------------------------

/**
 * Computes the training record status based on the expiry date relative to today.
 *
 * - expired: expiry date is in the past
 * - expiring_soon: expiry date is within 30 days
 * - current: expiry date is more than 30 days away (or no expiry)
 */
export function computeTrainingStatus(expiryDate: string | null | undefined): TrainingStatus {
  if (!expiryDate) return 'current';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return 'expired';

  const diffMs = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) return 'expiring_soon';

  return 'current';
}

/**
 * Calculates a default expiry date based on completed date and validity months.
 */
export function calculateExpiryDate(completedDate: string, validityMonths: number): string {
  const d = new Date(completedDate);
  d.setMonth(d.getMonth() + validityMonths);
  return d.toISOString().slice(0, 10);
}
