/**
 * Clinical Monitoring Constants — routes, labels, and option lists.
 * Pure constants module — no side effects, no DB calls.
 */

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

export function clinicalBasePath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/clinical`;
}

export function fluidsPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/clinical/fluids`;
}

export function nutritionPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/clinical/nutrition`;
}

// ---------------------------------------------------------------------------
// Fluid entry types
// ---------------------------------------------------------------------------

export const FLUID_ENTRY_TYPES = ['intake', 'output'] as const;
export type FluidEntryType = (typeof FLUID_ENTRY_TYPES)[number];

export const FLUID_ENTRY_TYPE_LABELS: Record<FluidEntryType, string> = {
  intake: 'Intake',
  output: 'Output',
};

// ---------------------------------------------------------------------------
// Fluid types (intake)
// ---------------------------------------------------------------------------

export const INTAKE_FLUID_TYPES = [
  'water',
  'tea',
  'coffee',
  'juice',
  'milk',
  'soup',
  'squash',
  'thickened',
  'other',
] as const;
export type IntakeFluidType = (typeof INTAKE_FLUID_TYPES)[number];

export const INTAKE_FLUID_TYPE_LABELS: Record<IntakeFluidType, string> = {
  water: 'Water',
  tea: 'Tea',
  coffee: 'Coffee',
  juice: 'Juice',
  milk: 'Milk',
  soup: 'Soup',
  squash: 'Squash',
  thickened: 'Thickened Fluid',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Fluid types (output)
// ---------------------------------------------------------------------------

export const OUTPUT_FLUID_TYPES = [
  'urine',
  'vomit',
  'drain',
  'other',
] as const;
export type OutputFluidType = (typeof OUTPUT_FLUID_TYPES)[number];

export const OUTPUT_FLUID_TYPE_LABELS: Record<OutputFluidType, string> = {
  urine: 'Urine',
  vomit: 'Vomit',
  drain: 'Drain',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// IDDSI Consistency Levels
// ---------------------------------------------------------------------------

export const IDDSI_LEVELS = [0, 1, 2, 3, 4] as const;
export type IddsiLevel = (typeof IDDSI_LEVELS)[number];

export const IDDSI_LEVEL_LABELS: Record<IddsiLevel, string> = {
  0: 'Level 0 - Thin',
  1: 'Level 1 - Slightly Thick',
  2: 'Level 2 - Mildly Thick',
  3: 'Level 3 - Moderately Thick',
  4: 'Level 4 - Extremely Thick',
};

// ---------------------------------------------------------------------------
// Meal types
// ---------------------------------------------------------------------------

export const MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

// ---------------------------------------------------------------------------
// Portion consumed
// ---------------------------------------------------------------------------

export const PORTION_OPTIONS = [
  'all',
  'three_quarters',
  'half',
  'quarter',
  'refused',
] as const;
export type PortionConsumed = (typeof PORTION_OPTIONS)[number];

export const PORTION_LABELS: Record<PortionConsumed, string> = {
  all: 'All',
  three_quarters: 'Three Quarters',
  half: 'Half',
  quarter: 'Quarter',
  refused: 'Refused',
};

export const PORTION_PERCENTAGES: Record<PortionConsumed, number> = {
  all: 100,
  three_quarters: 75,
  half: 50,
  quarter: 25,
  refused: 0,
};

// ---------------------------------------------------------------------------
// MUST scoring
// ---------------------------------------------------------------------------

export const BMI_SCORES = [0, 1, 2] as const;
export type BmiScore = (typeof BMI_SCORES)[number];

export const BMI_SCORE_LABELS: Record<BmiScore, string> = {
  0: 'BMI > 20 (Score 0)',
  1: 'BMI 18.5 - 20 (Score 1)',
  2: 'BMI < 18.5 (Score 2)',
};

export const WEIGHT_LOSS_SCORES = [0, 1, 2] as const;
export type WeightLossScore = (typeof WEIGHT_LOSS_SCORES)[number];

export const WEIGHT_LOSS_SCORE_LABELS: Record<WeightLossScore, string> = {
  0: 'Weight loss < 5% (Score 0)',
  1: 'Weight loss 5-10% (Score 1)',
  2: 'Weight loss > 10% (Score 2)',
};

export const ACUTE_DISEASE_SCORES = [0, 2] as const;
export type AcuteDiseaseScore = (typeof ACUTE_DISEASE_SCORES)[number];

export const ACUTE_DISEASE_SCORE_LABELS: Record<AcuteDiseaseScore, string> = {
  0: 'No acute disease effect (Score 0)',
  2: 'Acutely ill, no nutritional intake > 5 days (Score 2)',
};

export const MUST_RISK_CATEGORIES = ['low', 'medium', 'high'] as const;
export type MustRiskCategory = (typeof MUST_RISK_CATEGORIES)[number];

export const MUST_RISK_LABELS: Record<MustRiskCategory, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

export const MUST_CARE_PATHWAYS = ['routine', 'observe', 'treat'] as const;
export type MustCarePathway = (typeof MUST_CARE_PATHWAYS)[number];

export const MUST_CARE_PATHWAY_LABELS: Record<MustCarePathway, string> = {
  routine: 'Routine Clinical Care',
  observe: 'Observe',
  treat: 'Treat',
};

// ---------------------------------------------------------------------------
// Fluid threshold alerts
// ---------------------------------------------------------------------------

/** Amber alert threshold: intake < 1000ml in 24hrs */
export const FLUID_INTAKE_AMBER_THRESHOLD = 1000;

/** Red alert threshold: intake < 800ml in 24hrs */
export const FLUID_INTAKE_RED_THRESHOLD = 800;

/** Hours of no intake recording before auto-prompt (during waking hours) */
export const FLUID_NO_INTAKE_ALERT_HOURS = 4;

/** Waking hours range for auto-prompt (6am-10pm) */
export const WAKING_HOURS_START = 6;
export const WAKING_HOURS_END = 22;

// ---------------------------------------------------------------------------
// Common volume presets for quick selection
// ---------------------------------------------------------------------------

export const COMMON_VOLUMES = [
  { label: 'Small cup (100ml)', value: 100 },
  { label: 'Cup (200ml)', value: 200 },
  { label: 'Mug (250ml)', value: 250 },
  { label: 'Glass (300ml)', value: 300 },
  { label: 'Large glass (400ml)', value: 400 },
  { label: 'Bottle (500ml)', value: 500 },
] as const;
