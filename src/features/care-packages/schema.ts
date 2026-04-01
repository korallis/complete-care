/**
 * Care Packages validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import {
  PACKAGE_STATUSES,
  FUNDING_TYPES,
  VISIT_FREQUENCIES,
  VISIT_STATUSES,
} from './constants';

// ---------------------------------------------------------------------------
// Time format regex (HH:MM 24h)
// ---------------------------------------------------------------------------

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Commissioner schema
// ---------------------------------------------------------------------------

export const commissionerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Commissioner name is required').max(255),
  type: z.enum(['local_authority', 'nhs_chc', 'private', 'other']),
  reference: z.string().max(100).optional(),
  contactName: z.string().max(255).optional(),
  contactEmail: z.string().email().max(255).optional().or(z.literal('')),
  contactPhone: z.string().max(50).optional(),
});

// ---------------------------------------------------------------------------
// Environment notes schema
// ---------------------------------------------------------------------------

export const environmentNotesSchema = z.object({
  keySafeCode: z.string().max(50).optional(),
  entryInstructions: z.string().max(2000).optional(),
  hazards: z.string().max(2000).optional(),
  parking: z.string().max(1000).optional(),
});

// ---------------------------------------------------------------------------
// Visit task schema
// ---------------------------------------------------------------------------

export const visitTaskSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1, 'Task description is required').max(500),
  required: z.boolean().default(true),
  order: z.number().int().min(0),
});

// ---------------------------------------------------------------------------
// Custom pattern schema
// ---------------------------------------------------------------------------

export const customPatternSchema = z.object({
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1, 'At least one day must be selected'),
  weekPattern: z.enum(['every', 'week_a', 'week_b']),
});

// ---------------------------------------------------------------------------
// Create care package schema
// ---------------------------------------------------------------------------

export const createCarePackageSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  status: z.enum(PACKAGE_STATUSES).optional().default('active'),
  startDate: z
    .string()
    .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format'),
  endDate: z
    .string()
    .regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  reviewDate: z
    .string()
    .regex(DATE_REGEX, 'Review date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  fundingType: z.enum(FUNDING_TYPES).optional().default('private'),
  commissioners: z.array(commissionerSchema).optional().default([]),
  environmentNotes: environmentNotesSchema.optional().default({}),
  weeklyHours: z.string().max(10).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type CreateCarePackageInput = z.infer<typeof createCarePackageSchema>;

// ---------------------------------------------------------------------------
// Update care package schema
// ---------------------------------------------------------------------------

export const updateCarePackageSchema = z.object({
  status: z.enum(PACKAGE_STATUSES).optional(),
  startDate: z
    .string()
    .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  endDate: z
    .string()
    .regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  reviewDate: z
    .string()
    .regex(DATE_REGEX, 'Review date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  fundingType: z.enum(FUNDING_TYPES).optional(),
  commissioners: z.array(commissionerSchema).optional(),
  environmentNotes: environmentNotesSchema.optional(),
  weeklyHours: z.string().max(10).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

export type UpdateCarePackageInput = z.infer<typeof updateCarePackageSchema>;

// ---------------------------------------------------------------------------
// Create visit type schema
// ---------------------------------------------------------------------------

export const createVisitTypeSchema = z.object({
  carePackageId: z.string().uuid('Invalid care package ID'),
  name: z.string().min(1, 'Visit type name is required').max(100),
  duration: z.number().int().min(5, 'Duration must be at least 5 minutes').max(480),
  timeWindowStart: z
    .string()
    .regex(TIME_REGEX, 'Time must be in HH:MM format (24h)'),
  timeWindowEnd: z
    .string()
    .regex(TIME_REGEX, 'Time must be in HH:MM format (24h)'),
  taskList: z.array(visitTaskSchema).default([]),
  frequency: z.enum(VISIT_FREQUENCIES).default('daily'),
  customPattern: customPatternSchema.optional().nullable(),
});

export type CreateVisitTypeInput = z.infer<typeof createVisitTypeSchema>;

// ---------------------------------------------------------------------------
// Update visit type schema
// ---------------------------------------------------------------------------

export const updateVisitTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  duration: z.number().int().min(5).max(480).optional(),
  timeWindowStart: z.string().regex(TIME_REGEX).optional(),
  timeWindowEnd: z.string().regex(TIME_REGEX).optional(),
  taskList: z.array(visitTaskSchema).optional(),
  frequency: z.enum(VISIT_FREQUENCIES).optional(),
  customPattern: customPatternSchema.optional().nullable(),
});

export type UpdateVisitTypeInput = z.infer<typeof updateVisitTypeSchema>;

// ---------------------------------------------------------------------------
// Create scheduled visit schema (for ad-hoc visits)
// ---------------------------------------------------------------------------

export const createScheduledVisitSchema = z.object({
  carePackageId: z.string().uuid('Invalid care package ID'),
  personId: z.string().uuid('Invalid person ID'),
  visitTypeId: z.string().uuid().optional().nullable(),
  assignedStaffId: z.string().uuid().optional().nullable(),
  date: z.string().regex(DATE_REGEX, 'Date must be in YYYY-MM-DD format'),
  scheduledStart: z.string().regex(TIME_REGEX, 'Start time must be in HH:MM format'),
  scheduledEnd: z.string().regex(TIME_REGEX, 'End time must be in HH:MM format'),
  isAdHoc: z.boolean().default(false),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateScheduledVisitInput = z.infer<typeof createScheduledVisitSchema>;

// ---------------------------------------------------------------------------
// Update scheduled visit schema
// ---------------------------------------------------------------------------

export const updateScheduledVisitSchema = z.object({
  assignedStaffId: z.string().uuid().optional().nullable(),
  date: z.string().regex(DATE_REGEX).optional(),
  scheduledStart: z.string().regex(TIME_REGEX).optional(),
  scheduledEnd: z.string().regex(TIME_REGEX).optional(),
  status: z.enum(VISIT_STATUSES).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateScheduledVisitInput = z.infer<typeof updateScheduledVisitSchema>;

// ---------------------------------------------------------------------------
// Generate schedule schema
// ---------------------------------------------------------------------------

export const generateScheduleSchema = z.object({
  carePackageId: z.string().uuid('Invalid care package ID'),
  startDate: z.string().regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format'),
});

export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Add minutes to an HH:MM time string, returning HH:MM */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

/** Returns true if the review date is overdue (past today). */
export function isPackageReviewOverdue(
  reviewDate: string | null | undefined,
): boolean {
  if (!reviewDate) return false;
  const today = new Date().toISOString().slice(0, 10);
  return reviewDate < today;
}

/** Returns true if the review date is within the reminder window (default 14 days). */
export function isPackageReviewDueSoon(
  reviewDate: string | null | undefined,
  windowDays = 14,
): boolean {
  if (!reviewDate) return false;
  const today = new Date();
  const review = new Date(reviewDate);
  const diffMs = review.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= windowDays;
}
