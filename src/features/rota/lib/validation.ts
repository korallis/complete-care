import { z } from 'zod';

/**
 * Zod schemas for shift pattern and rota validation.
 */

export const sleepInConfigSchema = z
  .object({
    sleepInStart: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    sleepInEnd: z
      .string()
      .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    flatRate: z.number().min(0, 'Flat rate must be non-negative'),
    enhancedRateIfDisturbed: z.number().min(0, 'Enhanced rate must be non-negative'),
  })
  .nullable();

export const rotaPatternConfigSchema = z
  .object({
    daysOn: z.number().int().min(1).max(14),
    daysOff: z.number().int().min(1).max(14),
    cycleWeeks: z.number().int().min(1).max(8).optional(),
  })
  .nullable();

export const shiftPatternSchema = z.object({
  name: z.string().min(1, 'Shift pattern name is required').max(100),
  careDomain: z.enum(['domiciliary_care', 'supported_living', 'childrens_home'], {
    required_error: 'Care domain is required',
  }),
  shiftType: z.enum(['standard', 'sleep_in', 'waking_night', 'on_call']).default('standard'),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM or HH:MM:SS'),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM or HH:MM:SS'),
  isOvernight: z.boolean().default(false),
  breakMinutes: z.number().int().min(0).max(120).default(0),
  payRateMultiplier: z.string().regex(/^\d+\.\d{2}$/, 'Must be decimal with 2 places').default('1.00'),
  sleepInConfig: sleepInConfigSchema.optional().nullable(),
  rotaPattern: z
    .enum(['2on2off', '4on4off', '5on2off', 'custom'])
    .nullable()
    .optional(),
  rotaPatternConfig: rotaPatternConfigSchema.optional().nullable(),
  requiredQualifications: z.array(z.string()).default([]),
  minimumStaff: z.number().int().min(1).default(1),
  colour: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex colour')
    .default('#3B82F6'),
});

export const createShiftPatternSchema = shiftPatternSchema;
export const updateShiftPatternSchema = shiftPatternSchema.partial();

export const rotaPeriodSchema = z.object({
  name: z.string().min(1, 'Period name is required'),
  periodType: z.enum(['week', 'fortnight', 'four_week']).default('week'),
  startDate: z.string().datetime({ message: 'Valid start date required' }),
  endDate: z.string().datetime({ message: 'Valid end date required' }),
});

export const assignStaffSchema = z.object({
  shiftAssignmentId: z.string().uuid(),
  staffId: z.string().uuid(),
});

export const conflictOverrideSchema = z.object({
  shiftAssignmentId: z.string().uuid(),
  conflictType: z.enum(['double_booking', 'skills_gap']),
  overrideReason: z
    .string()
    .min(10, 'Override reason must be at least 10 characters')
    .max(500),
});

export type ShiftPatternFormData = z.infer<typeof shiftPatternSchema>;
export type RotaPeriodFormData = z.infer<typeof rotaPeriodSchema>;
export type AssignStaffData = z.infer<typeof assignStaffSchema>;
export type ConflictOverrideData = z.infer<typeof conflictOverrideSchema>;
