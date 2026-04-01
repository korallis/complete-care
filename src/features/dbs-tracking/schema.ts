/**
 * DBS Tracking validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// DBS check levels
// ---------------------------------------------------------------------------

export const DBS_LEVELS = [
  'basic',
  'standard',
  'enhanced',
  'enhanced_barred',
] as const;

export type DbsLevel = (typeof DBS_LEVELS)[number];

export const DBS_LEVEL_LABELS: Record<DbsLevel, string> = {
  basic: 'Basic',
  standard: 'Standard',
  enhanced: 'Enhanced',
  enhanced_barred: 'Enhanced + Barred',
};

// ---------------------------------------------------------------------------
// DBS check statuses
// ---------------------------------------------------------------------------

export const DBS_STATUSES = ['current', 'expiring_soon', 'expired'] as const;

export type DbsStatus = (typeof DBS_STATUSES)[number];

export const DBS_STATUS_LABELS: Record<DbsStatus, string> = {
  current: 'Current',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
};

// ---------------------------------------------------------------------------
// Date validation helper
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Create DBS check schema
// ---------------------------------------------------------------------------

export const createDbsCheckSchema = z.object({
  staffProfileId: z.string().uuid('Invalid staff profile ID'),
  certificateNumber: z
    .string()
    .min(1, 'Certificate number is required')
    .max(50, 'Certificate number must be 50 characters or fewer'),
  issueDate: z
    .string()
    .regex(DATE_REGEX, 'Issue date must be in YYYY-MM-DD format'),
  level: z.enum(DBS_LEVELS, {
    errorMap: () => ({ message: 'Please select a valid DBS level' }),
  }),
  updateServiceSubscribed: z.boolean().default(false),
  recheckDate: z
    .string()
    .regex(DATE_REGEX, 'Recheck date must be in YYYY-MM-DD format'),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').optional().nullable(),
  verifiedByName: z.string().max(255).optional().nullable(),
});

export type CreateDbsCheckInput = z.infer<typeof createDbsCheckSchema>;

// ---------------------------------------------------------------------------
// Update DBS check schema
// ---------------------------------------------------------------------------

export const updateDbsCheckSchema = z.object({
  certificateNumber: z
    .string()
    .min(1, 'Certificate number is required')
    .max(50, 'Certificate number must be 50 characters or fewer')
    .optional(),
  issueDate: z
    .string()
    .regex(DATE_REGEX, 'Issue date must be in YYYY-MM-DD format')
    .optional(),
  level: z
    .enum(DBS_LEVELS, {
      errorMap: () => ({ message: 'Please select a valid DBS level' }),
    })
    .optional(),
  updateServiceSubscribed: z.boolean().optional(),
  recheckDate: z
    .string()
    .regex(DATE_REGEX, 'Recheck date must be in YYYY-MM-DD format')
    .optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or fewer').optional().nullable(),
  verifiedByName: z.string().max(255).optional().nullable(),
});

export type UpdateDbsCheckInput = z.infer<typeof updateDbsCheckSchema>;

// ---------------------------------------------------------------------------
// Status computation helpers
// ---------------------------------------------------------------------------

/**
 * Computes the DBS check status based on the recheck date relative to today.
 *
 * - expired: recheck date is in the past
 * - expiring_soon: recheck date is within 30 days
 * - current: recheck date is more than 30 days away
 */
export function computeDbsStatus(recheckDate: string): DbsStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recheck = new Date(recheckDate);
  recheck.setHours(0, 0, 0, 0);

  if (recheck < today) return 'expired';

  const diffMs = recheck.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) return 'expiring_soon';

  return 'current';
}

/**
 * Returns the default recheck date (3 years from issue date).
 * Standard DBS recheck interval in UK care sector.
 */
export function calculateDefaultRecheckDate(issueDate: string): string {
  const d = new Date(issueDate);
  d.setFullYear(d.getFullYear() + 3);
  return d.toISOString().slice(0, 10);
}
