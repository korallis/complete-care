/**
 * EMAR validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import {
  MEDICATION_ROUTES,
  MEDICATION_FREQUENCIES,
  DOSE_UNITS,
  ADMINISTRATION_STATUSES,
  STATUSES_REQUIRING_REASON,
} from './constants';

// ---------------------------------------------------------------------------
// Frequency detail schema
// ---------------------------------------------------------------------------

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const dayValues = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const frequencyDetailSchema = z.object({
  timesOfDay: z.array(
    z.string().regex(timePattern, 'Time must be in HH:mm format'),
  ),
  daysOfWeek: z
    .array(z.enum(dayValues))
    .optional(),
  maxDosesPerDay: z.number().int().positive().optional(),
  minHoursBetweenDoses: z.number().positive().optional(),
});

export type FrequencyDetailInput = z.infer<typeof frequencyDetailSchema>;

// ---------------------------------------------------------------------------
// Create medication schema
// ---------------------------------------------------------------------------

export const createMedicationSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  drugName: z
    .string()
    .min(1, 'Drug name is required')
    .max(255, 'Drug name must be 255 characters or fewer'),
  dose: z
    .string()
    .min(1, 'Dose is required')
    .max(100),
  doseUnit: z.enum(DOSE_UNITS, { message: 'Invalid dose unit' }),
  route: z.enum(MEDICATION_ROUTES, { message: 'Invalid route' }),
  frequency: z.enum(MEDICATION_FREQUENCIES, { message: 'Invalid frequency' }),
  frequencyDetail: frequencyDetailSchema.default({ timesOfDay: [] }),
  prescribedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Prescribed date must be in YYYY-MM-DD format'),
  prescriberName: z
    .string()
    .min(1, 'Prescriber name is required')
    .max(255),
  pharmacy: z.string().max(255).optional().nullable(),
  specialInstructions: z.string().max(2000).optional().nullable(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;

// ---------------------------------------------------------------------------
// Update medication schema
// ---------------------------------------------------------------------------

export const updateMedicationSchema = z.object({
  drugName: z.string().min(1).max(255).optional(),
  dose: z.string().min(1).max(100).optional(),
  doseUnit: z.enum(DOSE_UNITS).optional(),
  route: z.enum(MEDICATION_ROUTES).optional(),
  frequency: z.enum(MEDICATION_FREQUENCIES).optional(),
  frequencyDetail: frequencyDetailSchema.optional(),
  prescriberName: z.string().min(1).max(255).optional(),
  pharmacy: z.string().max(255).optional().nullable(),
  specialInstructions: z.string().max(2000).optional().nullable(),
});

export type UpdateMedicationInput = z.infer<typeof updateMedicationSchema>;

// ---------------------------------------------------------------------------
// Discontinue medication schema
// ---------------------------------------------------------------------------

export const discontinueMedicationSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(1000),
  status: z.enum(['discontinued', 'suspended', 'completed']).default('discontinued'),
});

export type DiscontinueMedicationInput = z.infer<typeof discontinueMedicationSchema>;

// ---------------------------------------------------------------------------
// Record administration schema
// ---------------------------------------------------------------------------

export const recordAdministrationSchema = z
  .object({
    medicationId: z.string().uuid('Invalid medication ID'),
    scheduledTime: z.string().datetime({ message: 'Invalid scheduled time' }),
    administeredAt: z.string().datetime({ message: 'Invalid administration time' }).optional().nullable(),
    status: z.enum(ADMINISTRATION_STATUSES, { message: 'Invalid status' }),
    reason: z.string().max(1000).optional().nullable(),
    witnessId: z.string().uuid().optional().nullable(),
    witnessName: z.string().max(255).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine(
    (data) => {
      // Reason is required for refused/withheld/omitted/not_available
      if (
        STATUSES_REQUIRING_REASON.includes(data.status as typeof STATUSES_REQUIRING_REASON[number]) &&
        (!data.reason || data.reason.trim().length === 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Reason is required when medication is refused, withheld, omitted, or not available',
      path: ['reason'],
    },
  );

export type RecordAdministrationInput = z.infer<typeof recordAdministrationSchema>;
