/**
 * Vital Signs validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import {
  BP_POSITIONS,
  PULSE_RHYTHMS,
  AVPU_LEVELS,
  VITAL_RANGES,
} from './constants';

// ---------------------------------------------------------------------------
// Record vital signs schema
// ---------------------------------------------------------------------------

export const recordVitalSignsSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),

  temperature: z
    .number()
    .min(VITAL_RANGES.temperature.min, `Temperature must be at least ${VITAL_RANGES.temperature.min}${VITAL_RANGES.temperature.unit}`)
    .max(VITAL_RANGES.temperature.max, `Temperature must be at most ${VITAL_RANGES.temperature.max}${VITAL_RANGES.temperature.unit}`)
    .optional()
    .nullable(),

  systolicBp: z
    .number()
    .int('Systolic BP must be a whole number')
    .min(VITAL_RANGES.systolicBp.min, `Systolic BP must be at least ${VITAL_RANGES.systolicBp.min}${VITAL_RANGES.systolicBp.unit}`)
    .max(VITAL_RANGES.systolicBp.max, `Systolic BP must be at most ${VITAL_RANGES.systolicBp.max}${VITAL_RANGES.systolicBp.unit}`)
    .optional()
    .nullable(),

  diastolicBp: z
    .number()
    .int('Diastolic BP must be a whole number')
    .min(VITAL_RANGES.diastolicBp.min, `Diastolic BP must be at least ${VITAL_RANGES.diastolicBp.min}${VITAL_RANGES.diastolicBp.unit}`)
    .max(VITAL_RANGES.diastolicBp.max, `Diastolic BP must be at most ${VITAL_RANGES.diastolicBp.max}${VITAL_RANGES.diastolicBp.unit}`)
    .optional()
    .nullable(),

  bpPosition: z
    .enum(BP_POSITIONS, { message: 'Invalid BP position' })
    .optional()
    .nullable(),

  pulseRate: z
    .number()
    .int('Pulse rate must be a whole number')
    .min(VITAL_RANGES.pulseRate.min, `Pulse rate must be at least ${VITAL_RANGES.pulseRate.min}${VITAL_RANGES.pulseRate.unit}`)
    .max(VITAL_RANGES.pulseRate.max, `Pulse rate must be at most ${VITAL_RANGES.pulseRate.max}${VITAL_RANGES.pulseRate.unit}`)
    .optional()
    .nullable(),

  pulseRhythm: z
    .enum(PULSE_RHYTHMS, { message: 'Invalid pulse rhythm' })
    .optional()
    .nullable(),

  respiratoryRate: z
    .number()
    .int('Respiratory rate must be a whole number')
    .min(VITAL_RANGES.respiratoryRate.min, `Respiratory rate must be at least ${VITAL_RANGES.respiratoryRate.min}`)
    .max(VITAL_RANGES.respiratoryRate.max, `Respiratory rate must be at most ${VITAL_RANGES.respiratoryRate.max}`)
    .optional()
    .nullable(),

  spo2: z
    .number()
    .int('SpO2 must be a whole number')
    .min(VITAL_RANGES.spo2.min, `SpO2 must be at least ${VITAL_RANGES.spo2.min}${VITAL_RANGES.spo2.unit}`)
    .max(VITAL_RANGES.spo2.max, `SpO2 must be at most ${VITAL_RANGES.spo2.max}${VITAL_RANGES.spo2.unit}`)
    .optional()
    .nullable(),

  supplementalOxygen: z.boolean().optional().nullable(),

  oxygenFlowRate: z
    .number()
    .min(VITAL_RANGES.oxygenFlowRate.min, `Oxygen flow rate must be at least ${VITAL_RANGES.oxygenFlowRate.min}`)
    .max(VITAL_RANGES.oxygenFlowRate.max, `Oxygen flow rate must be at most ${VITAL_RANGES.oxygenFlowRate.max}${VITAL_RANGES.oxygenFlowRate.unit}`)
    .optional()
    .nullable(),

  avpu: z
    .enum(AVPU_LEVELS, { message: 'Invalid AVPU level' })
    .optional()
    .nullable(),

  bloodGlucose: z
    .number()
    .min(VITAL_RANGES.bloodGlucose.min, `Blood glucose must be at least ${VITAL_RANGES.bloodGlucose.min}${VITAL_RANGES.bloodGlucose.unit}`)
    .max(VITAL_RANGES.bloodGlucose.max, `Blood glucose must be at most ${VITAL_RANGES.bloodGlucose.max}${VITAL_RANGES.bloodGlucose.unit}`)
    .optional()
    .nullable(),

  painScore: z
    .number()
    .int('Pain score must be a whole number')
    .min(VITAL_RANGES.painScore.min, `Pain score must be at least ${VITAL_RANGES.painScore.min}`)
    .max(VITAL_RANGES.painScore.max, `Pain score must be at most ${VITAL_RANGES.painScore.max}`)
    .optional()
    .nullable(),

  isCopd: z.boolean().default(false),

  recordedAt: z.string().datetime({ message: 'Invalid date/time' }),

  notes: z.string().max(5000, 'Notes must be 5000 characters or fewer').optional().nullable(),
});

export type RecordVitalSignsInput = z.infer<typeof recordVitalSignsSchema>;
