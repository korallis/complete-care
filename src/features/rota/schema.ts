/**
 * Rota feature validation schemas -- used for server actions and client-side forms.
 * This file MUST NOT have 'use server' -- it is imported by client components too.
 */

import { z } from 'zod';
import { CANCELLATION_REASONS, ADMISSION_STATUSES } from './constants';

// ---------------------------------------------------------------------------
// Common regex
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Visit assignment
// ---------------------------------------------------------------------------

export const assignVisitSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  staffId: z.string().uuid('Invalid staff ID').nullable(),
});

export type AssignVisitInput = z.infer<typeof assignVisitSchema>;

// ---------------------------------------------------------------------------
// Bulk assignment
// ---------------------------------------------------------------------------

export const bulkAssignSchema = z.object({
  visitIds: z.array(z.string().uuid()).min(1, 'At least one visit must be selected'),
  staffId: z.string().uuid('Invalid staff ID'),
});

export type BulkAssignInput = z.infer<typeof bulkAssignSchema>;

// ---------------------------------------------------------------------------
// Visit cancellation
// ---------------------------------------------------------------------------

export const cancelVisitSchema = z.object({
  visitId: z.string().uuid('Invalid visit ID'),
  reasonCode: z.enum(CANCELLATION_REASONS, {
    errorMap: () => ({ message: 'Please select a cancellation reason' }),
  }),
  reasonNotes: z.string().max(2000).optional().nullable(),
  billingExcluded: z.boolean().default(true),
  carerNotified: z.boolean().default(false),
});

export type CancelVisitInput = z.infer<typeof cancelVisitSchema>;

// ---------------------------------------------------------------------------
// Hospital admission
// ---------------------------------------------------------------------------

export const admitToHospitalSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  admittedDate: z
    .string()
    .regex(DATE_REGEX, 'Admission date must be in YYYY-MM-DD format'),
  hospital: z.string().min(1, 'Hospital name is required').max(255),
  ward: z.string().max(100).optional().nullable(),
  expectedDischarge: z
    .string()
    .regex(DATE_REGEX, 'Expected discharge date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  reason: z.string().max(2000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  /** Whether to auto-suspend scheduled visits during admission */
  suspendVisits: z.boolean().default(true),
});

export type AdmitToHospitalInput = z.infer<typeof admitToHospitalSchema>;

// ---------------------------------------------------------------------------
// Hospital discharge
// ---------------------------------------------------------------------------

export const dischargeFromHospitalSchema = z.object({
  admissionId: z.string().uuid('Invalid admission ID'),
  dischargedDate: z
    .string()
    .regex(DATE_REGEX, 'Discharge date must be in YYYY-MM-DD format'),
  notes: z.string().max(5000).optional().nullable(),
  /** Whether to resume previously suspended visits */
  resumeVisits: z.boolean().default(true),
});

export type DischargeFromHospitalInput = z.infer<typeof dischargeFromHospitalSchema>;

// ---------------------------------------------------------------------------
// Rota view query
// ---------------------------------------------------------------------------

export const rotaViewSchema = z.object({
  startDate: z
    .string()
    .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format'),
  endDate: z
    .string()
    .regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format'),
  /** Filter by specific staff members */
  staffIds: z.array(z.string().uuid()).optional(),
  /** Filter by specific clients */
  personIds: z.array(z.string().uuid()).optional(),
  /** Filter by visit status */
  statuses: z.array(z.string()).optional(),
  /** View mode */
  viewMode: z.enum(['weekly', 'daily']).default('weekly'),
});

export type RotaViewInput = z.infer<typeof rotaViewSchema>;

// ---------------------------------------------------------------------------
// Update hospital admission
// ---------------------------------------------------------------------------

export const updateAdmissionSchema = z.object({
  hospital: z.string().min(1).max(255).optional(),
  ward: z.string().max(100).optional().nullable(),
  expectedDischarge: z
    .string()
    .regex(DATE_REGEX)
    .optional()
    .nullable(),
  reason: z.string().max(2000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  status: z.enum(ADMISSION_STATUSES).optional(),
});

export type UpdateAdmissionInput = z.infer<typeof updateAdmissionSchema>;
