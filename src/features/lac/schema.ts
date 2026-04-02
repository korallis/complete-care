/**
 * LAC Documentation Hub — Zod validation schemas.
 *
 * Used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import { LAC_LEGAL_STATUSES, PLACEMENT_PLAN_STATUSES } from './constants';

// ---------------------------------------------------------------------------
// Date validation helper
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// LAC Record schemas
// ---------------------------------------------------------------------------

export const createLacRecordSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  legalStatus: z.enum(LAC_LEGAL_STATUSES),
  legalStatusDate: z
    .string()
    .regex(DATE_REGEX, 'Legal status date must be in YYYY-MM-DD format'),
  placingAuthority: z
    .string()
    .min(1, 'Placing authority is required')
    .max(255),
  socialWorkerName: z.string().max(255).optional().nullable(),
  socialWorkerEmail: z
    .string()
    .email('Invalid email')
    .max(255)
    .optional()
    .nullable(),
  socialWorkerPhone: z.string().max(50).optional().nullable(),
  iroName: z.string().max(255).optional().nullable(),
  iroEmail: z
    .string()
    .email('Invalid email')
    .max(255)
    .optional()
    .nullable(),
  iroPhone: z.string().max(50).optional().nullable(),
  admissionDate: z
    .string()
    .regex(DATE_REGEX, 'Admission date must be in YYYY-MM-DD format'),
});

export type CreateLacRecordInput = z.infer<typeof createLacRecordSchema>;

export const updateLacRecordSchema = z.object({
  legalStatus: z.enum(LAC_LEGAL_STATUSES).optional(),
  legalStatusDate: z
    .string()
    .regex(DATE_REGEX, 'Legal status date must be in YYYY-MM-DD format')
    .optional(),
  placingAuthority: z.string().min(1).max(255).optional(),
  socialWorkerName: z.string().max(255).optional().nullable(),
  socialWorkerEmail: z
    .string()
    .email('Invalid email')
    .max(255)
    .optional()
    .nullable(),
  socialWorkerPhone: z.string().max(50).optional().nullable(),
  iroName: z.string().max(255).optional().nullable(),
  iroEmail: z
    .string()
    .email('Invalid email')
    .max(255)
    .optional()
    .nullable(),
  iroPhone: z.string().max(50).optional().nullable(),
  admissionDate: z
    .string()
    .regex(DATE_REGEX, 'Admission date must be in YYYY-MM-DD format')
    .optional(),
});

export type UpdateLacRecordInput = z.infer<typeof updateLacRecordSchema>;

// ---------------------------------------------------------------------------
// Placement plan schemas
// ---------------------------------------------------------------------------

export const placementPlanContentSchema = z.object({
  objectives: z.string().max(5000).optional(),
  arrangements: z.string().max(5000).optional(),
  educationPlan: z.string().max(5000).optional(),
  healthPlan: z.string().max(5000).optional(),
  contactArrangements: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
});

export const createPlacementPlanSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  lacRecordId: z.string().uuid('Invalid LAC record ID'),
  dueDate: z
    .string()
    .regex(DATE_REGEX, 'Due date must be in YYYY-MM-DD format'),
  content: placementPlanContentSchema.default({}),
  status: z.enum(PLACEMENT_PLAN_STATUSES).default('pending'),
  reviewDate: z
    .string()
    .regex(DATE_REGEX, 'Review date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
});

export type CreatePlacementPlanInput = z.infer<typeof createPlacementPlanSchema>;

export const updatePlacementPlanSchema = z.object({
  content: placementPlanContentSchema.optional(),
  status: z.enum(PLACEMENT_PLAN_STATUSES).optional(),
  completedDate: z
    .string()
    .regex(DATE_REGEX, 'Completed date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  reviewDate: z
    .string()
    .regex(DATE_REGEX, 'Review date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
});

export type UpdatePlacementPlanInput = z.infer<typeof updatePlacementPlanSchema>;

// ---------------------------------------------------------------------------
// Status change schema
// ---------------------------------------------------------------------------

export const createStatusChangeSchema = z.object({
  lacRecordId: z.string().uuid('Invalid LAC record ID'),
  previousStatus: z.enum(LAC_LEGAL_STATUSES),
  newStatus: z.enum(LAC_LEGAL_STATUSES),
  changedDate: z
    .string()
    .regex(DATE_REGEX, 'Changed date must be in YYYY-MM-DD format'),
  reason: z.string().max(2000).optional().nullable(),
});

export type CreateStatusChangeInput = z.infer<typeof createStatusChangeSchema>;
