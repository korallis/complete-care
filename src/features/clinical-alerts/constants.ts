/**
 * Clinical Alerts Constants — alert types, severities, escalation levels, default thresholds.
 * Pure constants module — no side effects, no DB calls.
 */

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

export function alertsPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/clinical/alerts`;
}

// ---------------------------------------------------------------------------
// Alert types
// ---------------------------------------------------------------------------

export const ALERT_TYPES = [
  'fluid_low',
  'news2_elevated',
  'weight_loss',
  'constipation',
  'diarrhoea',
  'pain_sustained',
  'custom',
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  fluid_low: 'Low Fluid Intake',
  news2_elevated: 'NEWS2 Elevated',
  weight_loss: 'Weight Loss',
  constipation: 'Constipation',
  diarrhoea: 'Diarrhoea',
  pain_sustained: 'Sustained Pain',
  custom: 'Custom',
};

// ---------------------------------------------------------------------------
// Alert severities
// ---------------------------------------------------------------------------

export const ALERT_SEVERITIES = ['info', 'amber', 'red', 'emergency'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  info: 'Information',
  amber: 'Amber',
  red: 'Red',
  emergency: 'Emergency',
};

// ---------------------------------------------------------------------------
// Alert statuses
// ---------------------------------------------------------------------------

export const ALERT_STATUSES = [
  'active',
  'acknowledged',
  'resolved',
  'escalated',
] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
  escalated: 'Escalated',
};

// ---------------------------------------------------------------------------
// Alert sources
// ---------------------------------------------------------------------------

export const ALERT_SOURCES = ['auto', 'manual'] as const;
export type AlertSource = (typeof ALERT_SOURCES)[number];

export const ALERT_SOURCE_LABELS: Record<AlertSource, string> = {
  auto: 'Automatic',
  manual: 'Manual',
};

// ---------------------------------------------------------------------------
// Escalation levels (ordered from lowest to highest)
// ---------------------------------------------------------------------------

export const ESCALATION_LEVELS = [
  'staff',
  'senior',
  'nurse',
  'gp',
  'emergency',
] as const;
export type EscalationLevel = (typeof ESCALATION_LEVELS)[number];

export const ESCALATION_LEVEL_LABELS: Record<EscalationLevel, string> = {
  staff: 'Care Staff',
  senior: 'Senior Carer',
  nurse: 'Nurse',
  gp: 'GP',
  emergency: '999 Emergency',
};

export const ESCALATION_LEVEL_DESCRIPTIONS: Record<EscalationLevel, string> = {
  staff: 'On-duty care staff to assess and respond.',
  senior: 'Senior carer to review and decide on further action.',
  nurse: 'Registered nurse to assess clinically.',
  gp: 'Contact GP for urgent clinical review.',
  emergency: 'Call 999 — immediate emergency response required.',
};

/**
 * Returns the next escalation level, or null if already at highest.
 */
export function getNextEscalationLevel(
  current: EscalationLevel,
): EscalationLevel | null {
  const idx = ESCALATION_LEVELS.indexOf(current);
  if (idx === -1 || idx >= ESCALATION_LEVELS.length - 1) return null;
  return ESCALATION_LEVELS[idx + 1];
}

// ---------------------------------------------------------------------------
// Default thresholds
// ---------------------------------------------------------------------------

/**
 * Default clinical alert thresholds.
 * These can be overridden per-person via person_alert_thresholds table.
 */
export const DEFAULT_THRESHOLDS = {
  fluid_low: {
    /** Amber: 24hr intake below this (ml) */
    amberMl: 1000,
    /** Red: 24hr intake below this (ml) */
    redMl: 800,
  },
  news2_elevated: {
    /** Amber: total NEWS2 score at or above (ward-based assessment) */
    amberScore: 1,
    /** Red: total NEWS2 score at or above (urgent response) */
    redScore: 5,
    /** Emergency: total NEWS2 score at or above */
    emergencyScore: 7,
  },
  weight_loss: {
    /** Amber: % loss in period */
    amberPercent: 5,
    /** Red: % loss in period */
    redPercent: 10,
    /** Period in days to check weight loss over */
    periodDays: 30,
  },
  constipation: {
    /** Amber: days without bowel movement */
    amberDays: 3,
    /** Red: days without bowel movement */
    redDays: 5,
  },
  diarrhoea: {
    /** Number of type 6-7 stools in 24hrs triggering alert */
    thresholdCount: 3,
  },
  pain_sustained: {
    /** Pain score (NRS equivalent) that triggers alert when sustained */
    thresholdScore: 7,
    /** Number of consecutive assessments at or above threshold */
    consecutiveCount: 3,
  },
} as const;

export type FluidThresholds = { [K in keyof typeof DEFAULT_THRESHOLDS.fluid_low]: number };
export type News2Thresholds = { [K in keyof typeof DEFAULT_THRESHOLDS.news2_elevated]: number };
export type WeightLossThresholds = { [K in keyof typeof DEFAULT_THRESHOLDS.weight_loss]: number };
export type ConstipationThresholds = { [K in keyof typeof DEFAULT_THRESHOLDS.constipation]: number };
export type DiarrhoeaThresholds = { [K in keyof typeof DEFAULT_THRESHOLDS.diarrhoea]: number };
export type PainThresholds = { [K in keyof typeof DEFAULT_THRESHOLDS.pain_sustained]: number };

// ---------------------------------------------------------------------------
// Default escalation paths per alert type
// ---------------------------------------------------------------------------

/**
 * Default starting escalation level per alert severity.
 * Can be configured per organisation in future.
 */
export const DEFAULT_ESCALATION_BY_SEVERITY: Record<AlertSeverity, EscalationLevel> = {
  info: 'staff',
  amber: 'senior',
  red: 'nurse',
  emergency: 'emergency',
};
