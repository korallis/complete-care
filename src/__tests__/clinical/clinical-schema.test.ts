/**
 * Tests for clinical monitoring Zod validation schemas.
 *
 * Validates:
 * - recordFluidEntrySchema accepts valid input / rejects invalid
 * - recordMealEntrySchema accepts valid input / rejects invalid
 * - createMustAssessmentSchema accepts valid input / rejects invalid
 */

import { describe, it, expect } from 'vitest';
import {
  recordFluidEntrySchema,
  recordMealEntrySchema,
  createMustAssessmentSchema,
} from '@/features/clinical-monitoring/schema';

// ---------------------------------------------------------------------------
// recordFluidEntrySchema
// ---------------------------------------------------------------------------

describe('recordFluidEntrySchema', () => {
  const validIntake = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    entryType: 'intake' as const,
    fluidType: 'water',
    volume: 200,
    iddsiLevel: null,
    characteristics: null,
    recordedAt: '2026-04-01T10:00:00.000Z',
  };

  const validOutput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    entryType: 'output' as const,
    fluidType: 'urine',
    volume: 300,
    iddsiLevel: null,
    characteristics: 'Clear, light yellow',
    recordedAt: '2026-04-01T10:00:00.000Z',
  };

  it('accepts valid intake entry', () => {
    const result = recordFluidEntrySchema.safeParse(validIntake);
    expect(result.success).toBe(true);
  });

  it('accepts valid output entry', () => {
    const result = recordFluidEntrySchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it('accepts thickened fluid with IDDSI level', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      fluidType: 'thickened',
      iddsiLevel: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid entry type', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      entryType: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects intake fluid type for output entry', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validOutput,
      fluidType: 'water', // water is an intake type, not output
    });
    expect(result.success).toBe(false);
  });

  it('rejects output fluid type for intake entry', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      fluidType: 'urine', // urine is an output type, not intake
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative volume', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      volume: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero volume', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      volume: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects volume > 5000ml', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      volume: 5001,
    });
    expect(result.success).toBe(false);
  });

  it('rejects IDDSI level > 4', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      fluidType: 'thickened',
      iddsiLevel: 5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects IDDSI level < 0', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      fluidType: 'thickened',
      iddsiLevel: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid person ID', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid recordedAt', () => {
    const result = recordFluidEntrySchema.safeParse({
      ...validIntake,
      recordedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// recordMealEntrySchema
// ---------------------------------------------------------------------------

describe('recordMealEntrySchema', () => {
  const validMeal = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    mealType: 'breakfast' as const,
    description: 'Porridge with honey and banana',
    portionConsumed: 'all' as const,
    recordedAt: '2026-04-01T08:00:00.000Z',
  };

  it('accepts valid meal entry', () => {
    const result = recordMealEntrySchema.safeParse(validMeal);
    expect(result.success).toBe(true);
  });

  it('accepts all meal types', () => {
    for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      const result = recordMealEntrySchema.safeParse({
        ...validMeal,
        mealType,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all portion options', () => {
    for (const portion of [
      'all',
      'three_quarters',
      'half',
      'quarter',
      'refused',
    ] as const) {
      const result = recordMealEntrySchema.safeParse({
        ...validMeal,
        portionConsumed: portion,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid meal type', () => {
    const result = recordMealEntrySchema.safeParse({
      ...validMeal,
      mealType: 'brunch',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid portion option', () => {
    const result = recordMealEntrySchema.safeParse({
      ...validMeal,
      portionConsumed: 'most',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = recordMealEntrySchema.safeParse({
      ...validMeal,
      description: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description over 1000 chars', () => {
    const result = recordMealEntrySchema.safeParse({
      ...validMeal,
      description: 'x'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createMustAssessmentSchema
// ---------------------------------------------------------------------------

describe('createMustAssessmentSchema', () => {
  const validAssessment = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    bmiScore: 0,
    weightLossScore: 0,
    acuteDiseaseScore: 0,
    notes: null,
  };

  it('accepts valid assessment with all zeros', () => {
    const result = createMustAssessmentSchema.safeParse(validAssessment);
    expect(result.success).toBe(true);
  });

  it('accepts valid assessment with max scores', () => {
    const result = createMustAssessmentSchema.safeParse({
      ...validAssessment,
      bmiScore: 2,
      weightLossScore: 2,
      acuteDiseaseScore: 2,
    });
    expect(result.success).toBe(true);
  });

  it('accepts notes', () => {
    const result = createMustAssessmentSchema.safeParse({
      ...validAssessment,
      notes: 'Patient appears thin, recent weight loss reported.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid BMI score', () => {
    const result = createMustAssessmentSchema.safeParse({
      ...validAssessment,
      bmiScore: 3,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid weight loss score', () => {
    const result = createMustAssessmentSchema.safeParse({
      ...validAssessment,
      weightLossScore: 3,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid acute disease score (1)', () => {
    // Acute disease score can only be 0 or 2
    const result = createMustAssessmentSchema.safeParse({
      ...validAssessment,
      acuteDiseaseScore: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects notes over 5000 chars', () => {
    const result = createMustAssessmentSchema.safeParse({
      ...validAssessment,
      notes: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid person ID', () => {
    const result = createMustAssessmentSchema.safeParse({
      ...validAssessment,
      personId: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});
