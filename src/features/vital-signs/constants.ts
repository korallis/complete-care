/**
 * Vital Signs Constants — normal ranges, NEWS2 scoring tables, option lists.
 * Pure constants module — no side effects, no DB calls.
 */

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

export function vitalsPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/clinical/vitals`;
}

// ---------------------------------------------------------------------------
// Blood pressure positions
// ---------------------------------------------------------------------------

export const BP_POSITIONS = ['sitting', 'standing', 'lying'] as const;
export type BpPosition = (typeof BP_POSITIONS)[number];

export const BP_POSITION_LABELS: Record<BpPosition, string> = {
  sitting: 'Sitting',
  standing: 'Standing',
  lying: 'Lying',
};

// ---------------------------------------------------------------------------
// Pulse rhythm
// ---------------------------------------------------------------------------

export const PULSE_RHYTHMS = ['regular', 'irregular'] as const;
export type PulseRhythm = (typeof PULSE_RHYTHMS)[number];

export const PULSE_RHYTHM_LABELS: Record<PulseRhythm, string> = {
  regular: 'Regular',
  irregular: 'Irregular',
};

// ---------------------------------------------------------------------------
// AVPU consciousness levels
// ---------------------------------------------------------------------------

export const AVPU_LEVELS = ['alert', 'voice', 'pain', 'unresponsive'] as const;
export type AvpuLevel = (typeof AVPU_LEVELS)[number];

export const AVPU_LABELS: Record<AvpuLevel, string> = {
  alert: 'Alert',
  voice: 'Voice',
  pain: 'Pain',
  unresponsive: 'Unresponsive',
};

// ---------------------------------------------------------------------------
// NEWS2 scales
// ---------------------------------------------------------------------------

export const NEWS2_SCALES = [1, 2] as const;
export type News2Scale = (typeof NEWS2_SCALES)[number];

export const NEWS2_SCALE_LABELS: Record<News2Scale, string> = {
  1: 'Scale 1 (Standard)',
  2: 'Scale 2 (COPD / Target SpO2 88-92%)',
};

// ---------------------------------------------------------------------------
// NEWS2 escalation levels
// ---------------------------------------------------------------------------

export const NEWS2_ESCALATION_LEVELS = [
  'routine',
  'ward_assessment',
  'urgent',
  'emergency',
] as const;
export type News2Escalation = (typeof NEWS2_ESCALATION_LEVELS)[number];

export const NEWS2_ESCALATION_LABELS: Record<News2Escalation, string> = {
  routine: 'Routine Monitoring',
  ward_assessment: 'Urgent Ward-Based Assessment',
  urgent: 'Urgent / Emergency Response',
  emergency: 'Emergency Response',
};

export const NEWS2_ESCALATION_DESCRIPTIONS: Record<News2Escalation, string> = {
  routine:
    'Continue routine NEWS monitoring. Minimum 12-hourly observations.',
  ward_assessment:
    'Urgent ward-based response. Registered nurse to assess. Increase monitoring to minimum 4-hourly.',
  urgent:
    'Key personnel urgently alerted. Urgent assessment by clinician with competence in acute illness. Consider transfer to higher dependency care.',
  emergency:
    'Immediate emergency response. Urgent assessment by critical care team. Transfer to level 2 or 3 care.',
};

// ---------------------------------------------------------------------------
// Normal ranges for vital parameters
// ---------------------------------------------------------------------------

export const VITAL_RANGES = {
  temperature: { min: 32.0, max: 42.0, unit: '°C', normalMin: 36.1, normalMax: 38.0 },
  systolicBp: { min: 60, max: 250, unit: 'mmHg', normalMin: 111, normalMax: 219 },
  diastolicBp: { min: 30, max: 150, unit: 'mmHg', normalMin: 60, normalMax: 90 },
  pulseRate: { min: 20, max: 250, unit: 'bpm', normalMin: 51, normalMax: 90 },
  respiratoryRate: { min: 1, max: 60, unit: 'breaths/min', normalMin: 12, normalMax: 20 },
  spo2: { min: 50, max: 100, unit: '%', normalMin: 96, normalMax: 100 },
  bloodGlucose: { min: 1.0, max: 40.0, unit: 'mmol/L', normalMin: 4.0, normalMax: 7.0 },
  painScore: { min: 0, max: 10, unit: '', normalMin: 0, normalMax: 0 },
  oxygenFlowRate: { min: 0, max: 15, unit: 'L/min', normalMin: 0, normalMax: 0 },
} as const;

// ---------------------------------------------------------------------------
// NEWS2 scoring tables (per parameter)
// ---------------------------------------------------------------------------

/**
 * NEWS2 respiration rate scoring table.
 * Score: 3=<=8, 1=9-11, 0=12-20, 2=21-24, 3=>=25
 */
export const NEWS2_RESP_RATE_THRESHOLDS = [
  { min: -Infinity, max: 8, score: 3 },
  { min: 9, max: 11, score: 1 },
  { min: 12, max: 20, score: 0 },
  { min: 21, max: 24, score: 2 },
  { min: 25, max: Infinity, score: 3 },
] as const;

/**
 * NEWS2 SpO2 Scale 1 (standard) scoring table.
 * Score: 3=<=91, 2=92-93, 1=94-95, 0=>=96
 */
export const NEWS2_SPO2_SCALE1_THRESHOLDS = [
  { min: -Infinity, max: 91, score: 3 },
  { min: 92, max: 93, score: 2 },
  { min: 94, max: 95, score: 1 },
  { min: 96, max: Infinity, score: 0 },
] as const;

/**
 * NEWS2 SpO2 Scale 2 (COPD) scoring table — on air.
 * Score: 3=<=83, 2=84-85, 1=86-87, 0=88-92, 3=>=93 on air
 */
export const NEWS2_SPO2_SCALE2_ON_AIR_THRESHOLDS = [
  { min: -Infinity, max: 83, score: 3 },
  { min: 84, max: 85, score: 2 },
  { min: 86, max: 87, score: 1 },
  { min: 88, max: 92, score: 0 },
  { min: 93, max: Infinity, score: 3 },
] as const;

/**
 * NEWS2 SpO2 Scale 2 (COPD) scoring table — on oxygen.
 * Score: 3=<=83, 2=84-85, 1=86-87, 0=88-92, 1=93-94, 2=95-96, 3=>=97
 */
export const NEWS2_SPO2_SCALE2_ON_O2_THRESHOLDS = [
  { min: -Infinity, max: 83, score: 3 },
  { min: 84, max: 85, score: 2 },
  { min: 86, max: 87, score: 1 },
  { min: 88, max: 92, score: 0 },
  { min: 93, max: 94, score: 1 },
  { min: 95, max: 96, score: 2 },
  { min: 97, max: Infinity, score: 3 },
] as const;

/**
 * NEWS2 supplemental oxygen scoring.
 * Score: 2=on oxygen, 0=on air (Scale 1 only — Scale 2 handled separately)
 */
export const NEWS2_SUPPLEMENTAL_O2_SCORE_ON = 2;
export const NEWS2_SUPPLEMENTAL_O2_SCORE_OFF = 0;

/**
 * NEWS2 systolic BP scoring table.
 * Score: 3=<=90, 2=91-100, 1=101-110, 0=111-219, 3=>=220
 */
export const NEWS2_SYSTOLIC_BP_THRESHOLDS = [
  { min: -Infinity, max: 90, score: 3 },
  { min: 91, max: 100, score: 2 },
  { min: 101, max: 110, score: 1 },
  { min: 111, max: 219, score: 0 },
  { min: 220, max: Infinity, score: 3 },
] as const;

/**
 * NEWS2 pulse rate scoring table.
 * Score: 3=<=40, 1=41-50, 0=51-90, 1=91-110, 2=111-130, 3=>=131
 */
export const NEWS2_PULSE_RATE_THRESHOLDS = [
  { min: -Infinity, max: 40, score: 3 },
  { min: 41, max: 50, score: 1 },
  { min: 51, max: 90, score: 0 },
  { min: 91, max: 110, score: 1 },
  { min: 111, max: 130, score: 2 },
  { min: 131, max: Infinity, score: 3 },
] as const;

/**
 * NEWS2 consciousness (AVPU) scoring.
 * Alert = 0, any other response = 3
 */
export const NEWS2_AVPU_SCORES: Record<AvpuLevel, number> = {
  alert: 0,
  voice: 3,
  pain: 3,
  unresponsive: 3,
};

/**
 * NEWS2 temperature scoring table.
 * Score: 3=<=35.0, 1=35.1-36.0, 0=36.1-38.0, 1=38.1-39.0, 2=>=39.1
 */
export const NEWS2_TEMPERATURE_THRESHOLDS = [
  { min: -Infinity, max: 35.0, score: 3 },
  { min: 35.1, max: 36.0, score: 1 },
  { min: 36.1, max: 38.0, score: 0 },
  { min: 38.1, max: 39.0, score: 1 },
  { min: 39.1, max: Infinity, score: 2 },
] as const;
