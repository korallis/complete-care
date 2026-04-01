/**
 * Incident Reporting validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import { SEVERITY_LEVELS, INCIDENT_STATUSES, REGULATORY_BODIES } from './constants';

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const involvedPersonSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  role: z.string().min(1, 'Role is required').max(100),
  personId: z.string().uuid().optional(),
});

export const witnessSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  role: z.string().min(1, 'Role is required').max(100),
  contactInfo: z.string().max(500).optional(),
  statement: z.string().max(5000).optional(),
});

export const injuryDetailSchema = z.object({
  bodyRegion: z.string().min(1, 'Body region is required').max(100),
  description: z.string().min(1, 'Description is required').max(2000),
  severity: z.string().min(1, 'Severity is required').max(100),
  treatment: z.string().max(2000).optional(),
  bodyMapEntryId: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// Create incident schema
// ---------------------------------------------------------------------------

export const createIncidentSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  dateTime: z.string().min(1, 'Date and time are required'),
  location: z.string().min(1, 'Location is required').max(200),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(10000, 'Description must be 10,000 characters or fewer'),
  immediateActions: z.string().max(5000).optional(),
  severity: z.enum(SEVERITY_LEVELS, {
    errorMap: () => ({ message: 'Invalid severity level' }),
  }),
  involvedPersons: z.array(involvedPersonSchema).default([]),
  witnesses: z.array(witnessSchema).default([]),
  injuryDetails: z.array(injuryDetailSchema).default([]),
  linkedBodyMapEntryIds: z.array(z.string().uuid()).default([]),
  isNotifiable: z.enum(['yes', 'no']).default('no'),
  regulatoryBody: z.enum(REGULATORY_BODIES).optional(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

// ---------------------------------------------------------------------------
// Update investigation schema
// ---------------------------------------------------------------------------

export const updateInvestigationSchema = z.object({
  status: z.enum(INCIDENT_STATUSES).optional(),
  investigationNotes: z.string().max(10000).optional(),
  outcome: z.string().max(5000).optional(),
  isNotifiable: z.enum(['yes', 'no']).optional(),
  regulatoryBody: z.enum(REGULATORY_BODIES).optional(),
});

export type UpdateInvestigationInput = z.infer<typeof updateInvestigationSchema>;

// ---------------------------------------------------------------------------
// Close incident schema
// ---------------------------------------------------------------------------

export const closeIncidentSchema = z.object({
  outcome: z.string().min(1, 'Outcome is required').max(5000),
});

export type CloseIncidentInput = z.infer<typeof closeIncidentSchema>;

// ---------------------------------------------------------------------------
// Filter schema (for query params)
// ---------------------------------------------------------------------------

export const incidentFilterSchema = z.object({
  personId: z.string().uuid().optional(),
  severity: z.enum(SEVERITY_LEVELS).optional(),
  status: z.enum(INCIDENT_STATUSES).optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type IncidentFilter = z.infer<typeof incidentFilterSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a badge variant for the severity */
export function getSeverityVariant(
  severity: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (severity) {
    case 'minor':
      return 'secondary';
    case 'moderate':
      return 'outline';
    case 'serious':
      return 'destructive';
    case 'death':
      return 'destructive';
    default:
      return 'outline';
  }
}

/** Format a date for display */
export function formatIncidentDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format date and time for display */
export function formatIncidentDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
