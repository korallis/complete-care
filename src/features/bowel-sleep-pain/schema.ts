/**
 * Bowel, Sleep & Pain validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import {
  BRISTOL_TYPES,
  STOOL_COLOURS,
  SLEEP_STATUSES,
  SLEEP_POSITIONS,
  BED_RAILS_OPTIONS,
  PAIN_TOOLS,
  PAIN_TYPES,
  ABBEY_CATEGORIES,
  ABBEY_MAX_PER_DOMAIN,
  PAINAD_CATEGORIES,
  PAINAD_MAX_PER_DOMAIN,
} from './constants';

// ---------------------------------------------------------------------------
// Record bowel entry schema
// ---------------------------------------------------------------------------

export const recordBowelEntrySchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  bristolType: z
    .number()
    .int('Bristol type must be a whole number')
    .refine(
      (val) => (BRISTOL_TYPES as readonly number[]).includes(val),
      { message: 'Bristol type must be between 1 and 7' },
    ),
  colour: z.enum(STOOL_COLOURS, { message: 'Invalid stool colour' }),
  bloodPresent: z.boolean().default(false),
  mucusPresent: z.boolean().default(false),
  laxativeGiven: z.boolean().default(false),
  laxativeName: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  recordedAt: z.string().datetime({ message: 'Invalid date/time' }),
});

export type RecordBowelEntryInput = z.infer<typeof recordBowelEntrySchema>;

// ---------------------------------------------------------------------------
// Record sleep check schema
// ---------------------------------------------------------------------------

export const recordSleepCheckSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  checkTime: z.string().datetime({ message: 'Invalid date/time' }),
  status: z.enum(SLEEP_STATUSES, { message: 'Invalid sleep status' }),
  position: z.enum(SLEEP_POSITIONS, { message: 'Invalid sleep position' }),
  repositioned: z.boolean().default(false),
  nightWandering: z.boolean().default(false),
  bedRails: z.enum(BED_RAILS_OPTIONS, { message: 'Invalid bed rails status' }),
  callBellChecked: z.boolean().default(false),
  notes: z.string().max(5000).optional().nullable(),
});

export type RecordSleepCheckInput = z.infer<typeof recordSleepCheckSchema>;

// ---------------------------------------------------------------------------
// Create pain assessment schema
// ---------------------------------------------------------------------------

const abbeyScoresSchema = z.object(
  Object.fromEntries(
    ABBEY_CATEGORIES.map((cat) => [
      cat,
      z
        .number()
        .int()
        .min(0, `${cat} score must be 0-${ABBEY_MAX_PER_DOMAIN}`)
        .max(
          ABBEY_MAX_PER_DOMAIN,
          `${cat} score must be 0-${ABBEY_MAX_PER_DOMAIN}`,
        ),
    ]),
  ) as Record<
    (typeof ABBEY_CATEGORIES)[number],
    z.ZodNumber
  >,
);

const painadScoresSchema = z.object(
  Object.fromEntries(
    PAINAD_CATEGORIES.map((cat) => [
      cat,
      z
        .number()
        .int()
        .min(0, `${cat} score must be 0-${PAINAD_MAX_PER_DOMAIN}`)
        .max(
          PAINAD_MAX_PER_DOMAIN,
          `${cat} score must be 0-${PAINAD_MAX_PER_DOMAIN}`,
        ),
    ]),
  ) as Record<
    (typeof PAINAD_CATEGORIES)[number],
    z.ZodNumber
  >,
);

export const createPainAssessmentSchema = z
  .object({
    personId: z.string().uuid('Invalid person ID'),
    toolUsed: z.enum(PAIN_TOOLS, { message: 'Invalid pain assessment tool' }),
    nrsScore: z
      .number()
      .int('NRS score must be a whole number')
      .min(0, 'NRS score must be 0-10')
      .max(10, 'NRS score must be 0-10')
      .optional()
      .nullable(),
    location: z.string().max(200).optional().nullable(),
    painType: z.enum(PAIN_TYPES, { message: 'Invalid pain type' }).optional().nullable(),
    abbeyScores: abbeyScoresSchema.optional().nullable(),
    painadScores: painadScoresSchema.optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    recordedAt: z.string().datetime({ message: 'Invalid date/time' }),
  })
  .refine(
    (data) => {
      if (data.toolUsed === 'nrs') {
        return data.nrsScore != null;
      }
      return true;
    },
    {
      message: 'NRS score is required when using the NRS tool',
      path: ['nrsScore'],
    },
  )
  .refine(
    (data) => {
      if (data.toolUsed === 'abbey') {
        return data.abbeyScores != null;
      }
      return true;
    },
    {
      message: 'Abbey scores are required when using the Abbey Pain Scale',
      path: ['abbeyScores'],
    },
  )
  .refine(
    (data) => {
      if (data.toolUsed === 'painad') {
        return data.painadScores != null;
      }
      return true;
    },
    {
      message: 'PAINAD scores are required when using the PAINAD scale',
      path: ['painadScores'],
    },
  );

export type CreatePainAssessmentInput = z.infer<
  typeof createPainAssessmentSchema
>;
