/**
 * Care Notes validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum constants
// ---------------------------------------------------------------------------

export const MOOD_OPTIONS = [
  'happy',
  'content',
  'anxious',
  'upset',
  'withdrawn',
] as const;

export const SHIFT_OPTIONS = [
  'morning',
  'afternoon',
  'evening',
  'night',
  'waking_night',
] as const;

export const PORTION_OPTIONS = [
  'none',
  'quarter',
  'half',
  'three_quarters',
  'all',
] as const;

export const NOTE_TYPE_OPTIONS = [
  'daily',
  'handover',
  'incident',
  'safeguarding',
  'medical',
] as const;

// ---------------------------------------------------------------------------
// Labels for UI display
// ---------------------------------------------------------------------------

export const MOOD_LABELS: Record<string, string> = {
  happy: 'Happy',
  content: 'Content',
  anxious: 'Anxious',
  upset: 'Upset',
  withdrawn: 'Withdrawn',
};

export const SHIFT_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
  waking_night: 'Waking Night',
};

export const PORTION_LABELS: Record<string, string> = {
  none: 'None',
  quarter: '25%',
  half: '50%',
  three_quarters: '75%',
  all: 'All',
};

export const NOTE_TYPE_LABELS: Record<string, string> = {
  daily: 'Daily',
  handover: 'Handover',
  incident: 'Incident',
  safeguarding: 'Safeguarding',
  medical: 'Medical',
};

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const personalCareSchema = z.object({
  washed: z.boolean().default(false),
  dressed: z.boolean().default(false),
  oralCare: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

export const nutritionMealSchema = z.object({
  offered: z.boolean().default(false),
  portionConsumed: z.enum(PORTION_OPTIONS).default('none'),
  notes: z.string().max(500).optional(),
});

export const nutritionSchema = z.object({
  breakfast: nutritionMealSchema.optional(),
  lunch: nutritionMealSchema.optional(),
  dinner: nutritionMealSchema.optional(),
  fluidsNote: z.string().max(500).optional(),
});

// ---------------------------------------------------------------------------
// Create care note schema
// ---------------------------------------------------------------------------

export const createCareNoteSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  noteType: z.enum(NOTE_TYPE_OPTIONS).default('daily'),
  shift: z.enum(SHIFT_OPTIONS).optional(),
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(10000, 'Note must be 10,000 characters or fewer'),
  mood: z.enum(MOOD_OPTIONS).optional(),
  personalCare: personalCareSchema.optional(),
  nutrition: nutritionSchema.optional(),
  mobility: z.string().max(2000).optional(),
  health: z.string().max(2000).optional(),
  handover: z.string().max(2000).optional(),
});

export type CreateCareNoteInput = z.infer<typeof createCareNoteSchema>;

// ---------------------------------------------------------------------------
// Timeline filter schema (for query params)
// ---------------------------------------------------------------------------

export const careNoteFilterSchema = z.object({
  personId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  shift: z.enum(SHIFT_OPTIONS).optional(),
  noteType: z.enum(NOTE_TYPE_OPTIONS).optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CareNoteFilter = z.infer<typeof careNoteFilterSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a colour class for the mood badge */
export function getMoodVariant(
  mood: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (mood) {
    case 'happy':
      return 'default';
    case 'content':
      return 'secondary';
    case 'anxious':
    case 'upset':
      return 'destructive';
    case 'withdrawn':
      return 'outline';
    default:
      return 'outline';
  }
}

/** Returns the shift label, or empty string if no shift */
export function getShiftLabel(shift: string | null | undefined): string {
  if (!shift) return '';
  return SHIFT_LABELS[shift] ?? shift;
}

/** Format a date for display in the timeline */
export function formatNoteDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a time for display */
export function formatNoteTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
