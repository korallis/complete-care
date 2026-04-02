/**
 * Tests for weight-wounds Zod schemas and calculation helpers.
 * In-memory only — no database required.
 */
import { describe, it, expect } from 'vitest';
import {
  weightRecordSchema,
  weightScheduleSchema,
  waterlowAssessmentSchema,
  createWoundSchema,
  woundAssessmentSchema,
  calculateBmi,
  getBmiCategory,
  calculateWeightChangePercent,
  calculateWaterlowTotal,
  getWaterlowRiskCategory,
  type WaterlowScores,
} from '../../../features/weight-wounds/schema';

// ---------------------------------------------------------------------------
// BMI Calculations (VAL-CLIN-010)
// ---------------------------------------------------------------------------

describe('calculateBmi', () => {
  it('calculates BMI correctly for standard values', () => {
    // 70kg, 175cm → BMI ~22.9
    expect(calculateBmi(70, 175)).toBeCloseTo(22.9, 1);
  });

  it('calculates BMI for obese range', () => {
    // 120kg, 170cm → BMI ~41.5
    expect(calculateBmi(120, 170)).toBeCloseTo(41.5, 1);
  });

  it('calculates BMI for underweight range', () => {
    // 45kg, 170cm → BMI ~15.6
    expect(calculateBmi(45, 170)).toBeCloseTo(15.6, 1);
  });
});

describe('getBmiCategory', () => {
  it('returns underweight for BMI < 18.5', () => {
    expect(getBmiCategory(15.6)).toBe('underweight');
  });

  it('returns normal for BMI 18.5-24.9', () => {
    expect(getBmiCategory(22.9)).toBe('normal');
  });

  it('returns overweight for BMI 25-29.9', () => {
    expect(getBmiCategory(27.0)).toBe('overweight');
  });

  it('returns obese_class_1 for BMI 30-34.9', () => {
    expect(getBmiCategory(32.0)).toBe('obese_class_1');
  });

  it('returns obese_class_2 for BMI 35-39.9', () => {
    expect(getBmiCategory(37.0)).toBe('obese_class_2');
  });

  it('returns obese_class_3 for BMI >= 40', () => {
    expect(getBmiCategory(41.5)).toBe('obese_class_3');
  });
});

describe('calculateWeightChangePercent', () => {
  it('calculates percentage gain', () => {
    expect(calculateWeightChangePercent(73.5, 70)).toBeCloseTo(5.0, 1);
  });

  it('calculates percentage loss', () => {
    expect(calculateWeightChangePercent(66.5, 70)).toBeCloseTo(-5.0, 1);
  });

  it('returns 0 when previous weight is 0', () => {
    expect(calculateWeightChangePercent(70, 0)).toBe(0);
  });

  it('returns 0 for no change', () => {
    expect(calculateWeightChangePercent(70, 70)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Waterlow Scoring (VAL-CLIN-011)
// ---------------------------------------------------------------------------

describe('calculateWaterlowTotal', () => {
  it('sums all component scores', () => {
    const scores: WaterlowScores = {
      age: 2,
      bmi: 1,
      skinType: 2,
      mobility: 3,
      nutrition: 1,
      tissueMalnutrition: 2,
      neurologicalDeficit: 4,
      surgery: 0,
      medication: 1,
    };
    expect(calculateWaterlowTotal(scores)).toBe(16);
  });

  it('returns 0 for all-zero scores', () => {
    const scores: WaterlowScores = {
      age: 0,
      bmi: 0,
      skinType: 0,
      mobility: 0,
      nutrition: 0,
      tissueMalnutrition: 0,
      neurologicalDeficit: 0,
      surgery: 0,
      medication: 0,
    };
    expect(calculateWaterlowTotal(scores)).toBe(0);
  });
});

describe('getWaterlowRiskCategory', () => {
  it('returns not_at_risk for score < 10', () => {
    expect(getWaterlowRiskCategory(5)).toBe('not_at_risk');
    expect(getWaterlowRiskCategory(9)).toBe('not_at_risk');
  });

  it('returns at_risk for score 10-14', () => {
    expect(getWaterlowRiskCategory(10)).toBe('at_risk');
    expect(getWaterlowRiskCategory(14)).toBe('at_risk');
  });

  it('returns high_risk for score 15-19', () => {
    expect(getWaterlowRiskCategory(15)).toBe('high_risk');
    expect(getWaterlowRiskCategory(19)).toBe('high_risk');
  });

  it('returns very_high_risk for score >= 20', () => {
    expect(getWaterlowRiskCategory(20)).toBe('very_high_risk');
    expect(getWaterlowRiskCategory(35)).toBe('very_high_risk');
  });
});

// ---------------------------------------------------------------------------
// Zod Schema Validation — Weight
// ---------------------------------------------------------------------------

describe('weightRecordSchema', () => {
  it('accepts valid weight record', () => {
    const result = weightRecordSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      recordedDate: '2026-04-01',
      weightKg: 72.5,
      heightCm: 175,
      notes: 'Morning weigh-in',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing weight', () => {
    const result = weightRecordSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      recordedDate: '2026-04-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weight below minimum', () => {
    const result = weightRecordSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      recordedDate: '2026-04-01',
      weightKg: 0.1,
    });
    expect(result.success).toBe(false);
  });

  it('allows null height', () => {
    const result = weightRecordSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      recordedDate: '2026-04-01',
      weightKg: 72.5,
      heightCm: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('weightScheduleSchema', () => {
  it('accepts valid schedule with defaults', () => {
    const result = weightScheduleSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.frequency).toBe('monthly');
      expect(result.data.changeAlertThreshold).toBe(5);
      expect(result.data.changeAlertDays).toBe(30);
    }
  });

  it('rejects invalid frequency', () => {
    const result = weightScheduleSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      frequency: 'daily',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Zod Schema Validation — Waterlow
// ---------------------------------------------------------------------------

describe('waterlowAssessmentSchema', () => {
  it('accepts valid assessment', () => {
    const result = waterlowAssessmentSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      assessmentDate: '2026-04-01',
      scores: {
        age: 2,
        bmi: 1,
        skinType: 2,
        mobility: 3,
        nutrition: 1,
        tissueMalnutrition: 2,
        neurologicalDeficit: 4,
        surgery: 0,
        medication: 1,
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing scores', () => {
    const result = waterlowAssessmentSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      assessmentDate: '2026-04-01',
      scores: { age: 2 }, // missing other fields
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Zod Schema Validation — Wounds (VAL-CLIN-012 / VAL-CLIN-013)
// ---------------------------------------------------------------------------

describe('createWoundSchema', () => {
  it('accepts valid wound', () => {
    const result = createWoundSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      location: 'Left heel',
      woundType: 'pressure_ulcer',
      dateIdentified: '2026-03-15',
      dressingType: 'Hydrocolloid',
      dressingFrequency: 'Every 3 days',
      nextAssessmentDate: '2026-04-05',
    });
    expect(result.success).toBe(true);
  });

  it('accepts wound with body map position', () => {
    const result = createWoundSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      location: 'Sacrum',
      bodyMapPosition: { x: 50, y: 40, region: 'sacrum' },
      woundType: 'pressure_ulcer',
      dateIdentified: '2026-03-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid wound type', () => {
    const result = createWoundSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      location: 'Left arm',
      woundType: 'burn',
      dateIdentified: '2026-03-15',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid body map region', () => {
    const result = createWoundSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      location: 'Elbow',
      bodyMapPosition: { x: 50, y: 20, region: 'elbow' },
      woundType: 'trauma',
      dateIdentified: '2026-03-15',
    });
    expect(result.success).toBe(false);
  });
});

describe('woundAssessmentSchema', () => {
  it('accepts valid assessment', () => {
    const result = woundAssessmentSchema.safeParse({
      woundId: '550e8400-e29b-41d4-a716-446655440000',
      assessmentDate: '2026-04-01',
      lengthCm: 3.5,
      widthCm: 2.0,
      depthCm: 0.5,
      pressureUlcerGrade: 'grade_2',
      woundBed: 'granulating',
      exudate: 'low',
      surroundingSkin: 'inflamed',
      signsOfInfection: false,
      painLevel: 4,
      treatmentApplied: 'Hydrocolloid dressing applied',
      notes: 'Wound improving',
    });
    expect(result.success).toBe(true);
  });

  it('accepts minimal assessment', () => {
    const result = woundAssessmentSchema.safeParse({
      woundId: '550e8400-e29b-41d4-a716-446655440000',
      assessmentDate: '2026-04-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects pain level > 10', () => {
    const result = woundAssessmentSchema.safeParse({
      woundId: '550e8400-e29b-41d4-a716-446655440000',
      assessmentDate: '2026-04-01',
      painLevel: 11,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid pressure ulcer grade', () => {
    const result = woundAssessmentSchema.safeParse({
      woundId: '550e8400-e29b-41d4-a716-446655440000',
      assessmentDate: '2026-04-01',
      pressureUlcerGrade: 'grade_5',
    });
    expect(result.success).toBe(false);
  });
});
