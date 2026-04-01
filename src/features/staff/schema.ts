/**
 * Staff Profile validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const STAFF_CONTRACT_TYPES = [
  'full_time',
  'part_time',
  'zero_hours',
  'agency',
  'bank',
] as const;

export const STAFF_STATUSES = [
  'active',
  'suspended',
  'on_leave',
  'terminated',
] as const;

export type StaffContractType = (typeof STAFF_CONTRACT_TYPES)[number];
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export const CONTRACT_TYPE_LABELS: Record<StaffContractType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  zero_hours: 'Zero Hours',
  agency: 'Agency',
  bank: 'Bank',
};

export const STATUS_LABELS: Record<StaffStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  on_leave: 'On Leave',
  terminated: 'Terminated',
};

// ---------------------------------------------------------------------------
// UK National Insurance number regex
// Two prefix letters, 6 digits, 1 suffix letter (A–D)
// Allows spaces/dashes between groups
// ---------------------------------------------------------------------------

const NI_NUMBER_REGEX = /^[A-Za-z]{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?[A-Da-d]$/;

// ---------------------------------------------------------------------------
// Employment history entry schema
// ---------------------------------------------------------------------------

export const employmentHistoryEntrySchema = z.object({
  id: z.string().min(1),
  jobTitle: z.string().min(1, 'Job title is required').max(255),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  contractType: z.enum(STAFF_CONTRACT_TYPES),
  weeklyHours: z.number().min(0).max(168).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export type EmploymentHistoryEntryInput = z.infer<typeof employmentHistoryEntrySchema>;

// ---------------------------------------------------------------------------
// Create staff schema
// ---------------------------------------------------------------------------

export const createStaffSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or fewer'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or fewer'),
  jobTitle: z
    .string()
    .min(1, 'Job title is required')
    .max(255, 'Job title must be 255 characters or fewer'),
  contractType: z.enum(STAFF_CONTRACT_TYPES).default('full_time'),
  weeklyHours: z
    .union([z.number().min(0).max(168), z.string().transform((v) => (v === '' ? null : Number(v)))])
    .nullable()
    .optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  niNumber: z
    .string()
    .max(20)
    .regex(NI_NUMBER_REGEX, 'Invalid National Insurance number format (e.g. AB 12 34 56 C)')
    .optional()
    .nullable()
    .or(z.literal('')),
  email: z
    .string()
    .email('Invalid email address')
    .max(255)
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((v) => (v === '' ? null : v)),
  phone: z.string().max(50).optional().nullable(),
  emergencyContactName: z.string().max(255).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  emergencyContactRelation: z.string().max(100).optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;

// ---------------------------------------------------------------------------
// Update staff schema
// ---------------------------------------------------------------------------

export const updateStaffSchema = createStaffSchema.partial();

export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ---------------------------------------------------------------------------
// Update status schema — separate because status transitions have rules
// ---------------------------------------------------------------------------

export const updateStaffStatusSchema = z.object({
  status: z.enum(STAFF_STATUSES),
  /** Optional reason for the status change (stored in audit log) */
  reason: z.string().max(500).optional(),
});

export type UpdateStaffStatusInput = z.infer<typeof updateStaffStatusSchema>;

// ---------------------------------------------------------------------------
// Status transition rules
// ---------------------------------------------------------------------------

const VALID_STATUS_TRANSITIONS: Record<StaffStatus, StaffStatus[]> = {
  active: ['suspended', 'on_leave', 'terminated'],
  suspended: ['active', 'terminated'],
  on_leave: ['active', 'terminated'],
  terminated: [], // Terminal state — no transitions out
};

/**
 * Returns true if the transition from `currentStatus` to `newStatus` is valid.
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string,
): boolean {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus as StaffStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus as StaffStatus);
}

/**
 * Returns the list of valid next statuses for a given current status.
 */
export function getValidNextStatuses(currentStatus: string): StaffStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus as StaffStatus] ?? [];
}
