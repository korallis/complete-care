/**
 * Clinical Monitoring validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import {
  FLUID_ENTRY_TYPES,
  INTAKE_FLUID_TYPES,
  OUTPUT_FLUID_TYPES,
  MEAL_TYPES,
  PORTION_OPTIONS,
  BMI_SCORES,
  WEIGHT_LOSS_SCORES,
  ACUTE_DISEASE_SCORES,
} from './constants';

// ---------------------------------------------------------------------------
// Record fluid entry schema
// ---------------------------------------------------------------------------

export const recordFluidEntrySchema = z
  .object({
    personId: z.string().uuid('Invalid person ID'),
    entryType: z.enum(FLUID_ENTRY_TYPES, {
      message: 'Entry type must be intake or output',
    }),
    fluidType: z.string().min(1, 'Fluid type is required'),
    volume: z
      .number()
      .int('Volume must be a whole number')
      .positive('Volume must be greater than 0')
      .max(5000, 'Volume cannot exceed 5000ml'),
    iddsiLevel: z
      .number()
      .int()
      .min(0, 'IDDSI level must be between 0 and 4')
      .max(4, 'IDDSI level must be between 0 and 4')
      .optional()
      .nullable(),
    characteristics: z.string().max(1000).optional().nullable(),
    recordedAt: z.string().datetime({ message: 'Invalid date/time' }),
  })
  .refine(
    (data) => {
      // Validate fluid type matches entry type
      if (data.entryType === 'intake') {
        return (INTAKE_FLUID_TYPES as readonly string[]).includes(
          data.fluidType,
        );
      }
      return (OUTPUT_FLUID_TYPES as readonly string[]).includes(
        data.fluidType,
      );
    },
    {
      message: 'Invalid fluid type for the selected entry type',
      path: ['fluidType'],
    },
  );

export type RecordFluidEntryInput = z.infer<typeof recordFluidEntrySchema>;

// ---------------------------------------------------------------------------
// Record meal entry schema
// ---------------------------------------------------------------------------

export const recordMealEntrySchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  mealType: z.enum(MEAL_TYPES, { message: 'Invalid meal type' }),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(1000, 'Description must be 1000 characters or fewer'),
  portionConsumed: z.enum(PORTION_OPTIONS, {
    message: 'Invalid portion option',
  }),
  recordedAt: z.string().datetime({ message: 'Invalid date/time' }),
});

export type RecordMealEntryInput = z.infer<typeof recordMealEntrySchema>;

// ---------------------------------------------------------------------------
// Create MUST assessment schema
// ---------------------------------------------------------------------------

export const createMustAssessmentSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  bmiScore: z.number().refine(
    (val) => (BMI_SCORES as readonly number[]).includes(val),
    { message: 'BMI score must be 0, 1, or 2' },
  ),
  weightLossScore: z.number().refine(
    (val) => (WEIGHT_LOSS_SCORES as readonly number[]).includes(val),
    { message: 'Weight loss score must be 0, 1, or 2' },
  ),
  acuteDiseaseScore: z.number().refine(
    (val) => (ACUTE_DISEASE_SCORES as readonly number[]).includes(val),
    { message: 'Acute disease score must be 0 or 2' },
  ),
  notes: z.string().max(5000).optional().nullable(),
});

export type CreateMustAssessmentInput = z.infer<
  typeof createMustAssessmentSchema
>;
