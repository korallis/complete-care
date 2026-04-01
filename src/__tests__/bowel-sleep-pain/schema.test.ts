/**
 * Tests for bowel, sleep, and pain Zod validation schemas.
 *
 * Validates:
 * - recordBowelEntrySchema accepts valid / rejects invalid
 * - recordSleepCheckSchema accepts valid / rejects invalid
 * - createPainAssessmentSchema accepts valid / rejects invalid
 * - Tool-specific required fields (NRS score for nrs, Abbey scores for abbey, PAINAD scores for painad)
 */

import { describe, it, expect } from 'vitest';
import {
  recordBowelEntrySchema,
  recordSleepCheckSchema,
  createPainAssessmentSchema,
} from '@/features/bowel-sleep-pain/schema';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const ISO_DATE = '2026-04-01T10:00:00.000Z';

// ---------------------------------------------------------------------------
// recordBowelEntrySchema
// ---------------------------------------------------------------------------

describe('recordBowelEntrySchema', () => {
  const validBowel = {
    personId: UUID,
    bristolType: 4,
    colour: 'brown' as const,
    bloodPresent: false,
    mucusPresent: false,
    laxativeGiven: false,
    laxativeName: null,
    notes: null,
    recordedAt: ISO_DATE,
  };

  it('accepts valid input', () => {
    const result = recordBowelEntrySchema.safeParse(validBowel);
    expect(result.success).toBe(true);
  });

  it('accepts all Bristol types (1-7)', () => {
    for (let t = 1; t <= 7; t++) {
      expect(
        recordBowelEntrySchema.safeParse({ ...validBowel, bristolType: t }).success,
      ).toBe(true);
    }
  });

  it('rejects Bristol type 0', () => {
    expect(
      recordBowelEntrySchema.safeParse({ ...validBowel, bristolType: 0 }).success,
    ).toBe(false);
  });

  it('rejects Bristol type 8', () => {
    expect(
      recordBowelEntrySchema.safeParse({ ...validBowel, bristolType: 8 }).success,
    ).toBe(false);
  });

  it('accepts all stool colours', () => {
    const colours = [
      'brown', 'dark_brown', 'light_brown', 'yellow', 'green',
      'black', 'red_tinged', 'clay', 'other',
    ] as const;
    for (const c of colours) {
      expect(
        recordBowelEntrySchema.safeParse({ ...validBowel, colour: c }).success,
      ).toBe(true);
    }
  });

  it('rejects invalid colour', () => {
    expect(
      recordBowelEntrySchema.safeParse({ ...validBowel, colour: 'purple' }).success,
    ).toBe(false);
  });

  it('accepts blood and mucus flags', () => {
    const result = recordBowelEntrySchema.safeParse({
      ...validBowel,
      bloodPresent: true,
      mucusPresent: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts laxative with name', () => {
    const result = recordBowelEntrySchema.safeParse({
      ...validBowel,
      laxativeGiven: true,
      laxativeName: 'Lactulose 15ml',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid person ID', () => {
    expect(
      recordBowelEntrySchema.safeParse({ ...validBowel, personId: 'not-a-uuid' }).success,
    ).toBe(false);
  });

  it('rejects invalid date', () => {
    expect(
      recordBowelEntrySchema.safeParse({ ...validBowel, recordedAt: 'bad' }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// recordSleepCheckSchema
// ---------------------------------------------------------------------------

describe('recordSleepCheckSchema', () => {
  const validSleep = {
    personId: UUID,
    checkTime: ISO_DATE,
    status: 'asleep' as const,
    position: 'left' as const,
    repositioned: false,
    nightWandering: false,
    bedRails: 'not_applicable' as const,
    callBellChecked: false,
    notes: null,
  };

  it('accepts valid input', () => {
    const result = recordSleepCheckSchema.safeParse(validSleep);
    expect(result.success).toBe(true);
  });

  it('accepts all sleep statuses', () => {
    for (const s of ['asleep', 'awake', 'restless', 'out_of_bed'] as const) {
      expect(
        recordSleepCheckSchema.safeParse({ ...validSleep, status: s }).success,
      ).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    expect(
      recordSleepCheckSchema.safeParse({ ...validSleep, status: 'sleeping' }).success,
    ).toBe(false);
  });

  it('accepts all positions', () => {
    for (const p of ['left', 'right', 'back', 'sitting'] as const) {
      expect(
        recordSleepCheckSchema.safeParse({ ...validSleep, position: p }).success,
      ).toBe(true);
    }
  });

  it('rejects invalid position', () => {
    expect(
      recordSleepCheckSchema.safeParse({ ...validSleep, position: 'prone' }).success,
    ).toBe(false);
  });

  it('accepts all bed rails options', () => {
    for (const r of ['up', 'down', 'not_applicable'] as const) {
      expect(
        recordSleepCheckSchema.safeParse({ ...validSleep, bedRails: r }).success,
      ).toBe(true);
    }
  });

  it('rejects invalid bed rails', () => {
    expect(
      recordSleepCheckSchema.safeParse({ ...validSleep, bedRails: 'half' }).success,
    ).toBe(false);
  });

  it('accepts night wandering and repositioned flags', () => {
    const result = recordSleepCheckSchema.safeParse({
      ...validSleep,
      repositioned: true,
      nightWandering: true,
      callBellChecked: true,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createPainAssessmentSchema
// ---------------------------------------------------------------------------

describe('createPainAssessmentSchema', () => {
  const validNrs = {
    personId: UUID,
    toolUsed: 'nrs' as const,
    nrsScore: 5,
    location: 'Lower back',
    painType: 'aching' as const,
    abbeyScores: null,
    painadScores: null,
    notes: null,
    recordedAt: ISO_DATE,
  };

  const validAbbey = {
    personId: UUID,
    toolUsed: 'abbey' as const,
    nrsScore: null,
    location: 'Left hip',
    painType: 'dull' as const,
    abbeyScores: {
      vocalisation: 2,
      facial_expression: 1,
      body_language: 2,
      behaviour_change: 1,
      physiological_change: 0,
      physical_change: 1,
    },
    painadScores: null,
    notes: null,
    recordedAt: ISO_DATE,
  };

  const validPainad = {
    personId: UUID,
    toolUsed: 'painad' as const,
    nrsScore: null,
    location: 'Right knee',
    painType: 'sharp' as const,
    abbeyScores: null,
    painadScores: {
      breathing: 1,
      vocalisation: 1,
      facial_expression: 2,
      body_language: 1,
      consolability: 1,
    },
    notes: 'Grimacing when moved.',
    recordedAt: ISO_DATE,
  };

  it('accepts valid NRS input', () => {
    const result = createPainAssessmentSchema.safeParse(validNrs);
    expect(result.success).toBe(true);
  });

  it('accepts valid Abbey input', () => {
    const result = createPainAssessmentSchema.safeParse(validAbbey);
    expect(result.success).toBe(true);
  });

  it('accepts valid PAINAD input', () => {
    const result = createPainAssessmentSchema.safeParse(validPainad);
    expect(result.success).toBe(true);
  });

  it('rejects NRS without nrsScore', () => {
    const result = createPainAssessmentSchema.safeParse({
      ...validNrs,
      nrsScore: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects Abbey without abbeyScores', () => {
    const result = createPainAssessmentSchema.safeParse({
      ...validAbbey,
      abbeyScores: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects PAINAD without painadScores', () => {
    const result = createPainAssessmentSchema.safeParse({
      ...validPainad,
      painadScores: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects NRS score below 0', () => {
    const result = createPainAssessmentSchema.safeParse({
      ...validNrs,
      nrsScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects NRS score above 10', () => {
    const result = createPainAssessmentSchema.safeParse({
      ...validNrs,
      nrsScore: 11,
    });
    expect(result.success).toBe(false);
  });

  it('accepts NRS score at boundaries (0 and 10)', () => {
    expect(
      createPainAssessmentSchema.safeParse({ ...validNrs, nrsScore: 0 }).success,
    ).toBe(true);
    expect(
      createPainAssessmentSchema.safeParse({ ...validNrs, nrsScore: 10 }).success,
    ).toBe(true);
  });

  it('rejects Abbey score above 3 per domain', () => {
    const result = createPainAssessmentSchema.safeParse({
      ...validAbbey,
      abbeyScores: {
        ...validAbbey.abbeyScores,
        vocalisation: 4,
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects PAINAD score above 2 per domain', () => {
    const result = createPainAssessmentSchema.safeParse({
      ...validPainad,
      painadScores: {
        ...validPainad.painadScores,
        breathing: 3,
      },
    });
    expect(result.success).toBe(false);
  });

  it('accepts all pain types', () => {
    for (const t of ['sharp', 'dull', 'aching', 'burning', 'throbbing'] as const) {
      expect(
        createPainAssessmentSchema.safeParse({ ...validNrs, painType: t }).success,
      ).toBe(true);
    }
  });

  it('rejects invalid pain type', () => {
    expect(
      createPainAssessmentSchema.safeParse({ ...validNrs, painType: 'stabbing' }).success,
    ).toBe(false);
  });

  it('rejects invalid tool', () => {
    expect(
      createPainAssessmentSchema.safeParse({ ...validNrs, toolUsed: 'wong_baker' }).success,
    ).toBe(false);
  });

  it('accepts optional location and painType as null', () => {
    const result = createPainAssessmentSchema.safeParse({
      ...validNrs,
      location: null,
      painType: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects notes over 5000 characters', () => {
    const result = createPainAssessmentSchema.safeParse({
      ...validNrs,
      notes: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
