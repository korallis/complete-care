/**
 * Leave validation schemas -- used for server actions and client-side forms.
 * This file MUST NOT have 'use server' -- it is imported by client components too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LEAVE_TYPES = [
  'annual',
  'sick',
  'compassionate',
  'unpaid',
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  compassionate: 'Compassionate Leave',
  unpaid: 'Unpaid Leave',
};

export const LEAVE_STATUSES = [
  'pending',
  'approved',
  'denied',
  'cancelled',
] as const;

export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
  cancelled: 'Cancelled',
};

// ---------------------------------------------------------------------------
// Date validation
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Request leave schema
// ---------------------------------------------------------------------------

export const requestLeaveSchema = z
  .object({
    staffProfileId: z.string().uuid('Invalid staff profile ID'),
    type: z.enum(LEAVE_TYPES),
    startDate: z
      .string()
      .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format'),
    endDate: z
      .string()
      .regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format'),
    totalDays: z
      .number()
      .int()
      .min(1, 'Leave must be at least 1 day')
      .max(365, 'Leave cannot exceed 365 days'),
    reason: z
      .string()
      .max(2000, 'Reason must be 2000 characters or fewer')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    { message: 'End date must be on or after start date', path: ['endDate'] },
  );

export type RequestLeaveInput = z.infer<typeof requestLeaveSchema>;

// ---------------------------------------------------------------------------
// Review leave schema (approve/deny)
// ---------------------------------------------------------------------------

export const reviewLeaveSchema = z.object({
  status: z.enum(['approved', 'denied'] as const),
  reviewNote: z
    .string()
    .max(1000, 'Review note must be 1000 characters or fewer')
    .optional()
    .nullable(),
});

export type ReviewLeaveInput = z.infer<typeof reviewLeaveSchema>;

// ---------------------------------------------------------------------------
// Update leave balance schema
// ---------------------------------------------------------------------------

export const updateLeaveBalanceSchema = z.object({
  annualEntitlement: z
    .number()
    .int()
    .min(0, 'Entitlement cannot be negative')
    .max(365, 'Entitlement cannot exceed 365 days'),
});

export type UpdateLeaveBalanceInput = z.infer<typeof updateLeaveBalanceSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculates the number of working days (Mon-Fri) between two dates inclusive.
 */
export function calculateWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Returns the current calendar year.
 */
export function currentYear(): number {
  return new Date().getFullYear();
}
