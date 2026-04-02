/**
 * Zod validation schemas for weight monitoring and wound care.
 * Used in server actions and client-side form validation.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Weight Monitoring
// ---------------------------------------------------------------------------

export const weightFrequency = z.enum(['weekly', 'fortnightly', 'monthly']);

export const weightScheduleSchema = z.object({
  personId: z.string().uuid(),
  frequency: weightFrequency.default('monthly'),
  changeAlertThreshold: z.number().min(1).max(50).default(5),
  changeAlertDays: z.number().int().min(1).max(365).default(30),
  heightCm: z.number().min(30).max(300).nullable().optional(),
  isActive: z.boolean().default(true),
});

export const weightRecordSchema = z.object({
  personId: z.string().uuid(),
  recordedDate: z.string().date(),
  weightKg: z.number().min(0.5).max(500),
  heightCm: z.number().min(30).max(300).nullable().optional(),
  notes: z.string().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// BMI Calculation
// ---------------------------------------------------------------------------

export const BMI_CATEGORIES = {
  underweight: { label: 'Underweight', min: 0, max: 18.5, colour: 'text-blue-600' },
  normal: { label: 'Normal', min: 18.5, max: 25, colour: 'text-green-600' },
  overweight: { label: 'Overweight', min: 25, max: 30, colour: 'text-amber-600' },
  obese_class_1: { label: 'Obese (Class I)', min: 30, max: 35, colour: 'text-orange-600' },
  obese_class_2: { label: 'Obese (Class II)', min: 35, max: 40, colour: 'text-red-600' },
  obese_class_3: { label: 'Obese (Class III)', min: 40, max: Infinity, colour: 'text-red-800' },
} as const;

export type BmiCategoryKey = keyof typeof BMI_CATEGORIES;

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBmiCategory(bmi: number): BmiCategoryKey {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  if (bmi < 35) return 'obese_class_1';
  if (bmi < 40) return 'obese_class_2';
  return 'obese_class_3';
}

/**
 * Check if weight change exceeds threshold over a period.
 * Returns percentage change (negative = loss, positive = gain).
 */
export function calculateWeightChangePercent(
  currentKg: number,
  previousKg: number,
): number {
  if (previousKg === 0) return 0;
  return Math.round(((currentKg - previousKg) / previousKg) * 1000) / 10;
}

// ---------------------------------------------------------------------------
// Waterlow Scoring
// ---------------------------------------------------------------------------

export const waterlowScoresSchema = z.object({
  age: z.number().int().min(0).max(5),
  bmi: z.number().int().min(0).max(3),
  skinType: z.number().int().min(0).max(5),
  mobility: z.number().int().min(0).max(5),
  nutrition: z.number().int().min(0).max(3),
  tissueMalnutrition: z.number().int().min(0).max(8),
  neurologicalDeficit: z.number().int().min(0).max(6),
  surgery: z.number().int().min(0).max(5),
  medication: z.number().int().min(0).max(4),
});

export const waterlowAssessmentSchema = z.object({
  personId: z.string().uuid(),
  assessmentDate: z.string().date(),
  scores: waterlowScoresSchema,
  notes: z.string().max(2000).optional(),
});

export type WaterlowScores = z.infer<typeof waterlowScoresSchema>;

export const WATERLOW_RISK_CATEGORIES = {
  not_at_risk: { label: 'Not at Risk', min: 0, max: 10, colour: 'text-green-600', bg: 'bg-green-50' },
  at_risk: { label: 'At Risk', min: 10, max: 15, colour: 'text-amber-600', bg: 'bg-amber-50' },
  high_risk: { label: 'High Risk', min: 15, max: 20, colour: 'text-orange-600', bg: 'bg-orange-50' },
  very_high_risk: { label: 'Very High Risk', min: 20, max: Infinity, colour: 'text-red-600', bg: 'bg-red-50' },
} as const;

export type WaterlowRiskCategory = keyof typeof WATERLOW_RISK_CATEGORIES;

export function calculateWaterlowTotal(scores: WaterlowScores): number {
  return Object.values(scores).reduce((sum, v) => sum + v, 0);
}

export function getWaterlowRiskCategory(total: number): WaterlowRiskCategory {
  if (total >= 20) return 'very_high_risk';
  if (total >= 15) return 'high_risk';
  if (total >= 10) return 'at_risk';
  return 'not_at_risk';
}

/** Waterlow scoring options for form selectors */
export const WATERLOW_OPTIONS = {
  age: [
    { value: 0, label: '14-49' },
    { value: 1, label: '50-64' },
    { value: 2, label: '65-74' },
    { value: 3, label: '75-80' },
    { value: 4, label: '81+' },
  ],
  bmi: [
    { value: 0, label: 'BMI 20-24.9 (Average)' },
    { value: 1, label: 'BMI 25-29.9 (Above average)' },
    { value: 2, label: 'BMI < 20 (Below average)' },
    { value: 3, label: 'BMI ≥ 30 (Obese)' },
  ],
  skinType: [
    { value: 0, label: 'Healthy' },
    { value: 1, label: 'Tissue paper' },
    { value: 2, label: 'Dry' },
    { value: 3, label: 'Oedematous' },
    { value: 4, label: 'Clammy/pyrexia' },
    { value: 5, label: 'Discoloured (Grade 1)' },
  ],
  mobility: [
    { value: 0, label: 'Fully mobile' },
    { value: 1, label: 'Restless/fidgety' },
    { value: 2, label: 'Apathetic' },
    { value: 3, label: 'Restricted' },
    { value: 4, label: 'Bedbound (e.g. traction)' },
    { value: 5, label: 'Chairbound' },
  ],
  nutrition: [
    { value: 0, label: 'Average' },
    { value: 1, label: 'Poor' },
    { value: 2, label: 'NG tube/fluids only' },
    { value: 3, label: 'NBM/anorexic' },
  ],
  tissueMalnutrition: [
    { value: 0, label: 'None' },
    { value: 2, label: 'Anaemia' },
    { value: 3, label: 'Smoking' },
    { value: 5, label: 'Terminal cachexia' },
    { value: 8, label: 'Multiple organ failure' },
  ],
  neurologicalDeficit: [
    { value: 0, label: 'None' },
    { value: 4, label: 'Diabetes, MS, CVA' },
    { value: 5, label: 'Motor/sensory deficit' },
    { value: 6, label: 'Paraplegia' },
  ],
  surgery: [
    { value: 0, label: 'None' },
    { value: 2, label: 'Orthopaedic — below waist, spine' },
    { value: 5, label: 'On table > 2 hours' },
  ],
  medication: [
    { value: 0, label: 'None' },
    { value: 1, label: 'Cytotoxics' },
    { value: 2, label: 'Steroids' },
    { value: 3, label: 'Anti-inflammatory' },
    { value: 4, label: 'Multiple (high dose)' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Wound Care
// ---------------------------------------------------------------------------

export const woundType = z.enum([
  'pressure_ulcer',
  'surgical',
  'trauma',
  'skin_tear',
  'leg_ulcer',
  'other',
]);

export const pressureUlcerGrade = z.enum([
  'grade_1',
  'grade_2',
  'grade_3',
  'grade_4',
  'unstageable',
]);

export const woundStatus = z.enum([
  'open',
  'healing',
  'healed',
  'deteriorating',
  'referred',
]);

export const woundBedType = z.enum([
  'granulating',
  'epithelialising',
  'sloughy',
  'necrotic',
  'mixed',
]);

export const exudateLevel = z.enum(['none', 'low', 'moderate', 'heavy']);

export const surroundingSkinType = z.enum([
  'healthy',
  'inflamed',
  'macerated',
  'dry',
  'oedematous',
]);

export const bodyMapRegion = z.enum([
  'head',
  'neck',
  'chest',
  'abdomen',
  'upper_back',
  'lower_back',
  'sacrum',
  'left_arm',
  'right_arm',
  'left_hand',
  'right_hand',
  'left_hip',
  'right_hip',
  'left_thigh',
  'right_thigh',
  'left_knee',
  'right_knee',
  'left_lower_leg',
  'right_lower_leg',
  'left_foot',
  'right_foot',
  'left_heel',
  'right_heel',
]);

export const createWoundSchema = z.object({
  personId: z.string().uuid(),
  location: z.string().min(1).max(200),
  bodyMapPosition: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
      region: bodyMapRegion,
    })
    .nullable()
    .optional(),
  woundType: woundType,
  dateIdentified: z.string().date(),
  dressingType: z.string().max(500).optional(),
  dressingFrequency: z.string().max(200).optional(),
  specialInstructions: z.string().max(2000).optional(),
  nextAssessmentDate: z.string().date().optional(),
});

export const updateWoundSchema = createWoundSchema.partial().extend({
  id: z.string().uuid(),
  status: woundStatus.optional(),
  dateResolved: z.string().date().optional(),
});

export const woundAssessmentSchema = z.object({
  woundId: z.string().uuid(),
  assessmentDate: z.string().date(),
  lengthCm: z.number().min(0).max(100).nullable().optional(),
  widthCm: z.number().min(0).max(100).nullable().optional(),
  depthCm: z.number().min(0).max(50).nullable().optional(),
  pressureUlcerGrade: pressureUlcerGrade.nullable().optional(),
  woundBed: woundBedType.nullable().optional(),
  exudate: exudateLevel.nullable().optional(),
  surroundingSkin: surroundingSkinType.nullable().optional(),
  signsOfInfection: z.boolean().default(false),
  painLevel: z.number().int().min(0).max(10).nullable().optional(),
  photoRef: z.string().max(500).nullable().optional(),
  treatmentApplied: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export const WOUND_TYPE_LABELS: Record<z.infer<typeof woundType>, string> = {
  pressure_ulcer: 'Pressure Ulcer',
  surgical: 'Surgical',
  trauma: 'Trauma',
  skin_tear: 'Skin Tear',
  leg_ulcer: 'Leg Ulcer',
  other: 'Other',
};

export const PRESSURE_ULCER_GRADE_LABELS: Record<z.infer<typeof pressureUlcerGrade>, string> = {
  grade_1: 'Grade 1 — Non-blanchable erythema',
  grade_2: 'Grade 2 — Partial thickness skin loss',
  grade_3: 'Grade 3 — Full thickness skin loss',
  grade_4: 'Grade 4 — Full thickness tissue loss',
  unstageable: 'Unstageable — Depth unknown',
};

export const WOUND_STATUS_LABELS: Record<z.infer<typeof woundStatus>, string> = {
  open: 'Open',
  healing: 'Healing',
  healed: 'Healed',
  deteriorating: 'Deteriorating',
  referred: 'Referred',
};

export const WOUND_BED_LABELS: Record<z.infer<typeof woundBedType>, string> = {
  granulating: 'Granulating',
  epithelialising: 'Epithelialising',
  sloughy: 'Sloughy',
  necrotic: 'Necrotic',
  mixed: 'Mixed',
};

export const EXUDATE_LABELS: Record<z.infer<typeof exudateLevel>, string> = {
  none: 'None',
  low: 'Low',
  moderate: 'Moderate',
  heavy: 'Heavy',
};

export const SURROUNDING_SKIN_LABELS: Record<z.infer<typeof surroundingSkinType>, string> = {
  healthy: 'Healthy',
  inflamed: 'Inflamed',
  macerated: 'Macerated',
  dry: 'Dry',
  oedematous: 'Oedematous',
};
