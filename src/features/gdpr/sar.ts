/**
 * Subject Access Request (SAR) utilities — GDPR Article 15.
 *
 * Handles the lifecycle of SARs:
 *   1. Record receipt of SAR (auto-calculates 30-day deadline)
 *   2. Track progress
 *   3. Generate data export package (JSON/PDF)
 *   4. Mark as fulfilled
 */

import { z } from 'zod';

/** Validation schema for creating a new SAR. */
export const createSarSchema = z.object({
  organisationId: z.string().uuid(),
  subjectName: z.string().min(1, 'Subject name is required'),
  subjectEmail: z.string().email('Valid email is required'),
  personId: z.string().uuid().optional(),
  receivedAt: z.coerce.date(),
  exportFormat: z.enum(['json', 'pdf', 'both']).default('json'),
  notes: z.string().optional(),
});

export type CreateSarInput = z.infer<typeof createSarSchema>;

/** Validation schema for updating SAR status. */
export const updateSarSchema = z.object({
  status: z.enum(['received', 'in_progress', 'export_ready', 'fulfilled', 'rejected']),
  rejectionReason: z.string().optional(),
  exportPath: z.string().optional(),
  processedByUserId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export type UpdateSarInput = z.infer<typeof updateSarSchema>;

/** SAR status labels for UI display. */
export const SAR_STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  in_progress: 'In Progress',
  export_ready: 'Export Ready',
  fulfilled: 'Fulfilled',
  rejected: 'Rejected',
};

/** Number of days allowed to fulfil a SAR (ICO guidance). */
export const SAR_DEADLINE_DAYS = 30;

/**
 * Calculate the SAR deadline from the received date.
 * ICO requires fulfilment within 30 calendar days.
 */
export function calculateSarDeadline(receivedAt: Date): Date {
  const deadline = new Date(receivedAt);
  deadline.setDate(deadline.getDate() + SAR_DEADLINE_DAYS);
  return deadline;
}

/**
 * Check if a SAR is overdue based on its deadline.
 */
export function isSarOverdue(deadlineAt: Date): boolean {
  return new Date() > deadlineAt;
}

/**
 * Calculate remaining days until SAR deadline.
 * Returns negative values if overdue.
 */
export function sarDaysRemaining(deadlineAt: Date): number {
  const now = new Date();
  const diff = deadlineAt.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Build a data export package for a SAR.
 * Collects all person data across tables and formats as JSON.
 */
export interface SarExportPackage {
  exportDate: string;
  dataSubject: {
    name: string;
    email: string;
  };
  data: Record<string, unknown>;
}

export function buildSarExportPackage(
  subjectName: string,
  subjectEmail: string,
  data: Record<string, unknown>,
): SarExportPackage {
  return {
    exportDate: new Date().toISOString(),
    dataSubject: {
      name: subjectName,
      email: subjectEmail,
    },
    data,
  };
}
