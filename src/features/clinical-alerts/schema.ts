/**
 * Clinical Alerts validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import {
  ALERT_TYPES,
  ALERT_SEVERITIES,
  ALERT_STATUSES,
} from './constants';

// ---------------------------------------------------------------------------
// Acknowledge alert schema
// ---------------------------------------------------------------------------

export const acknowledgeAlertSchema = z.object({
  alertId: z.string().uuid('Invalid alert ID'),
  actionTaken: z
    .string()
    .min(1, 'Action taken is required')
    .max(5000, 'Action taken must be 5000 characters or fewer'),
});

export type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>;

// ---------------------------------------------------------------------------
// Resolve alert schema
// ---------------------------------------------------------------------------

export const resolveAlertSchema = z.object({
  alertId: z.string().uuid('Invalid alert ID'),
  actionTaken: z
    .string()
    .max(5000, 'Action taken must be 5000 characters or fewer')
    .optional(),
});

export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;

// ---------------------------------------------------------------------------
// Escalate alert schema
// ---------------------------------------------------------------------------

export const escalateAlertSchema = z.object({
  alertId: z.string().uuid('Invalid alert ID'),
  reason: z
    .string()
    .min(1, 'Escalation reason is required')
    .max(5000, 'Reason must be 5000 characters or fewer'),
});

export type EscalateAlertInput = z.infer<typeof escalateAlertSchema>;

// ---------------------------------------------------------------------------
// Set custom threshold schema
// ---------------------------------------------------------------------------

export const setCustomThresholdSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  alertType: z.enum(ALERT_TYPES, { message: 'Invalid alert type' }),
  customThreshold: z.record(z.unknown()).refine(
    (val) => Object.keys(val).length > 0,
    { message: 'Custom threshold must have at least one value' },
  ),
  reason: z
    .string()
    .min(1, 'Clinical reason is required')
    .max(5000, 'Reason must be 5000 characters or fewer'),
});

export type SetCustomThresholdInput = z.infer<typeof setCustomThresholdSchema>;

// ---------------------------------------------------------------------------
// Create manual alert schema
// ---------------------------------------------------------------------------

export const createManualAlertSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  alertType: z.enum(ALERT_TYPES, { message: 'Invalid alert type' }),
  severity: z.enum(ALERT_SEVERITIES, { message: 'Invalid severity' }),
  message: z
    .string()
    .min(1, 'Alert message is required')
    .max(5000, 'Message must be 5000 characters or fewer'),
});

export type CreateManualAlertInput = z.infer<typeof createManualAlertSchema>;

// ---------------------------------------------------------------------------
// List alerts filter schema
// ---------------------------------------------------------------------------

export const listAlertsFilterSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  status: z.enum(ALERT_STATUSES).optional(),
  alertType: z.enum(ALERT_TYPES).optional(),
  severity: z.enum(ALERT_SEVERITIES).optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
});

export type ListAlertsFilter = z.infer<typeof listAlertsFilterSchema>;
