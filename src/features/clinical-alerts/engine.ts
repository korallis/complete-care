/**
 * Clinical Alert Evaluation Engine — pure functions for alert detection.
 *
 * No side effects, no DB calls, no imports from server-only modules.
 * Safe for use in both client and server environments.
 *
 * The engine evaluates clinical data against thresholds and returns
 * an array of alerts to be created. The caller (server action) is
 * responsible for persisting these to the database.
 */

import {
  DEFAULT_THRESHOLDS,
  DEFAULT_ESCALATION_BY_SEVERITY,
  type AlertType,
  type AlertSeverity,
  type EscalationLevel,
  type FluidThresholds,
  type News2Thresholds,
  type WeightLossThresholds,
  type ConstipationThresholds,
  type DiarrhoeaThresholds,
  type PainThresholds,
} from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * An alert candidate produced by the engine.
 * The caller persists this into the clinical_alerts table.
 */
export type AlertCandidate = {
  alertType: AlertType;
  severity: AlertSeverity;
  source: 'auto';
  triggerValue: string;
  triggerThreshold: string;
  message: string;
  escalationLevel: EscalationLevel;
};

/**
 * Custom thresholds map — keyed by alert type.
 * If a key is present, its values override the defaults for that type.
 */
export type CustomThresholds = {
  fluid_low?: Partial<FluidThresholds>;
  news2_elevated?: Partial<News2Thresholds>;
  weight_loss?: Partial<WeightLossThresholds>;
  constipation?: Partial<ConstipationThresholds>;
  diarrhoea?: Partial<DiarrhoeaThresholds>;
  pain_sustained?: Partial<PainThresholds>;
};

// ---------------------------------------------------------------------------
// Threshold resolution
// ---------------------------------------------------------------------------

/**
 * Resolves effective thresholds by merging custom overrides with defaults.
 */
export function resolveThresholds<T extends Record<string, unknown>>(
  defaults: T,
  overrides?: Partial<T>,
): T {
  if (!overrides) return defaults;
  return { ...defaults, ...overrides };
}

// ---------------------------------------------------------------------------
// Fluid intake evaluation
// ---------------------------------------------------------------------------

/**
 * Input for fluid intake evaluation.
 */
export type FluidIntakeInput = {
  /** Total intake in ml for the 24hr period */
  totalIntakeMl: number;
};

/**
 * Evaluates fluid intake against thresholds.
 * Returns an alert candidate if thresholds are breached, or null.
 */
export function evaluateFluidIntake(
  input: FluidIntakeInput,
  customThresholds?: Partial<FluidThresholds>,
): AlertCandidate | null {
  const thresholds = resolveThresholds(DEFAULT_THRESHOLDS.fluid_low, customThresholds);

  if (input.totalIntakeMl < thresholds.redMl) {
    const severity: AlertSeverity = 'red';
    return {
      alertType: 'fluid_low',
      severity,
      source: 'auto',
      triggerValue: `${input.totalIntakeMl}ml`,
      triggerThreshold: `<${thresholds.redMl}ml`,
      message: `Critically low fluid intake: ${input.totalIntakeMl}ml in 24hrs (below ${thresholds.redMl}ml threshold)`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  if (input.totalIntakeMl < thresholds.amberMl) {
    const severity: AlertSeverity = 'amber';
    return {
      alertType: 'fluid_low',
      severity,
      source: 'auto',
      triggerValue: `${input.totalIntakeMl}ml`,
      triggerThreshold: `<${thresholds.amberMl}ml`,
      message: `Low fluid intake: ${input.totalIntakeMl}ml in 24hrs (below ${thresholds.amberMl}ml threshold)`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// NEWS2 evaluation
// ---------------------------------------------------------------------------

/**
 * Input for NEWS2 evaluation.
 */
export type News2Input = {
  /** Total NEWS2 score */
  totalScore: number;
  /** Whether any single parameter scored 3 */
  hasClinicalConcern: boolean;
};

/**
 * Evaluates NEWS2 score against thresholds.
 * Returns an alert candidate if thresholds are breached, or null.
 */
export function evaluateNews2(
  input: News2Input,
  customThresholds?: Partial<News2Thresholds>,
): AlertCandidate | null {
  const thresholds = resolveThresholds(DEFAULT_THRESHOLDS.news2_elevated, customThresholds);

  if (input.totalScore >= thresholds.emergencyScore) {
    const severity: AlertSeverity = 'emergency';
    return {
      alertType: 'news2_elevated',
      severity,
      source: 'auto',
      triggerValue: `NEWS2 score ${input.totalScore}`,
      triggerThreshold: `>=${thresholds.emergencyScore}`,
      message: `Emergency: NEWS2 score ${input.totalScore} — immediate emergency response required`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  if (input.totalScore >= thresholds.redScore) {
    const severity: AlertSeverity = 'red';
    return {
      alertType: 'news2_elevated',
      severity,
      source: 'auto',
      triggerValue: `NEWS2 score ${input.totalScore}`,
      triggerThreshold: `>=${thresholds.redScore}`,
      message: `Urgent: NEWS2 score ${input.totalScore} — urgent clinical assessment required`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  if (input.totalScore >= thresholds.amberScore || input.hasClinicalConcern) {
    const severity: AlertSeverity = 'amber';
    const concern = input.hasClinicalConcern
      ? ' (single parameter score of 3 — clinical concern)'
      : '';
    return {
      alertType: 'news2_elevated',
      severity,
      source: 'auto',
      triggerValue: `NEWS2 score ${input.totalScore}${concern}`,
      triggerThreshold: `>=${thresholds.amberScore}`,
      message: `NEWS2 score ${input.totalScore}${concern} — ward-based assessment required`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Weight loss evaluation
// ---------------------------------------------------------------------------

/**
 * Input for weight loss evaluation.
 */
export type WeightLossInput = {
  /** Current weight in kg */
  currentWeightKg: number;
  /** Previous weight in kg (from reference period) */
  previousWeightKg: number;
  /** Number of days between measurements */
  daysBetween: number;
};

/**
 * Evaluates weight loss percentage against thresholds.
 * Returns an alert candidate if thresholds are breached, or null.
 */
export function evaluateWeightLoss(
  input: WeightLossInput,
  customThresholds?: Partial<WeightLossThresholds>,
): AlertCandidate | null {
  const thresholds = resolveThresholds(DEFAULT_THRESHOLDS.weight_loss, customThresholds);

  // Only evaluate if within the configured period
  if (input.daysBetween > thresholds.periodDays) return null;

  // No previous weight or weight gain — no alert
  if (input.previousWeightKg <= 0 || input.currentWeightKg >= input.previousWeightKg) {
    return null;
  }

  const lossKg = input.previousWeightKg - input.currentWeightKg;
  const lossPercent = (lossKg / input.previousWeightKg) * 100;
  const formattedPercent = lossPercent.toFixed(1);

  if (lossPercent >= thresholds.redPercent) {
    const severity: AlertSeverity = 'red';
    return {
      alertType: 'weight_loss',
      severity,
      source: 'auto',
      triggerValue: `${formattedPercent}% loss (${input.previousWeightKg}kg -> ${input.currentWeightKg}kg)`,
      triggerThreshold: `>=${thresholds.redPercent}% in ${thresholds.periodDays} days`,
      message: `Significant weight loss: ${formattedPercent}% in ${input.daysBetween} days — urgent nutritional review required`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  if (lossPercent >= thresholds.amberPercent) {
    const severity: AlertSeverity = 'amber';
    return {
      alertType: 'weight_loss',
      severity,
      source: 'auto',
      triggerValue: `${formattedPercent}% loss (${input.previousWeightKg}kg -> ${input.currentWeightKg}kg)`,
      triggerThreshold: `>=${thresholds.amberPercent}% in ${thresholds.periodDays} days`,
      message: `Weight loss detected: ${formattedPercent}% in ${input.daysBetween} days — monitor closely and review nutrition`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Constipation evaluation
// ---------------------------------------------------------------------------

/**
 * Input for constipation evaluation.
 */
export type ConstipationInput = {
  /** Date of the last bowel movement, or null if none recorded */
  lastBowelMovementAt: Date | null;
  /** Current time for comparison */
  currentTime: Date;
};

/**
 * Evaluates constipation risk based on days since last bowel movement.
 * Returns an alert candidate if thresholds are breached, or null.
 */
export function evaluateConstipation(
  input: ConstipationInput,
  customThresholds?: Partial<ConstipationThresholds>,
): AlertCandidate | null {
  const thresholds = resolveThresholds(DEFAULT_THRESHOLDS.constipation, customThresholds);

  if (!input.lastBowelMovementAt) {
    const severity: AlertSeverity = 'red';
    return {
      alertType: 'constipation',
      severity,
      source: 'auto',
      triggerValue: 'No bowel movement on record',
      triggerThreshold: `>${thresholds.redDays} days`,
      message: 'No bowel movement on record — review required',
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  const daysSinceLastBm = Math.floor(
    (input.currentTime.getTime() - input.lastBowelMovementAt.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (daysSinceLastBm >= thresholds.redDays) {
    const severity: AlertSeverity = 'red';
    return {
      alertType: 'constipation',
      severity,
      source: 'auto',
      triggerValue: `${daysSinceLastBm} days`,
      triggerThreshold: `>=${thresholds.redDays} days`,
      message: `No bowel movement for ${daysSinceLastBm} days — urgent review required`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  if (daysSinceLastBm >= thresholds.amberDays) {
    const severity: AlertSeverity = 'amber';
    return {
      alertType: 'constipation',
      severity,
      source: 'auto',
      triggerValue: `${daysSinceLastBm} days`,
      triggerThreshold: `>=${thresholds.amberDays} days`,
      message: `No bowel movement for ${daysSinceLastBm} days — monitor closely`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Diarrhoea evaluation
// ---------------------------------------------------------------------------

/**
 * Input for diarrhoea evaluation.
 */
export type DiarrhoeaInput = {
  /** Bristol stool types from the last 24hrs */
  bristolTypes: number[];
};

/**
 * Evaluates diarrhoea risk based on loose stool count in 24hrs.
 * Returns an alert candidate if thresholds are breached, or null.
 */
export function evaluateDiarrhoea(
  input: DiarrhoeaInput,
  customThresholds?: Partial<DiarrhoeaThresholds>,
): AlertCandidate | null {
  const thresholds = resolveThresholds(DEFAULT_THRESHOLDS.diarrhoea, customThresholds);

  const looseStools = input.bristolTypes.filter((t) => t >= 6 && t <= 7);

  if (looseStools.length >= thresholds.thresholdCount) {
    const severity: AlertSeverity = 'red';
    return {
      alertType: 'diarrhoea',
      severity,
      source: 'auto',
      triggerValue: `${looseStools.length} loose/liquid stools in 24hrs`,
      triggerThreshold: `>=${thresholds.thresholdCount} type 6-7 stools`,
      message: `${looseStools.length} loose/liquid stools (type 6-7) in 24hrs — diarrhoea protocol required`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Pain evaluation
// ---------------------------------------------------------------------------

/**
 * Input for sustained pain evaluation.
 */
export type PainInput = {
  /** Recent pain scores (most recent first), normalised to 0-10 NRS equivalent */
  recentScores: number[];
};

/**
 * Evaluates sustained pain based on consecutive high scores.
 * Returns an alert candidate if thresholds are breached, or null.
 */
export function evaluatePain(
  input: PainInput,
  customThresholds?: Partial<PainThresholds>,
): AlertCandidate | null {
  const thresholds = resolveThresholds(DEFAULT_THRESHOLDS.pain_sustained, customThresholds);

  if (input.recentScores.length < thresholds.consecutiveCount) {
    return null;
  }

  // Check if the most recent N scores are all at or above threshold
  const recentN = input.recentScores.slice(0, thresholds.consecutiveCount);
  const allAboveThreshold = recentN.every((s) => s >= thresholds.thresholdScore);

  if (allAboveThreshold) {
    const avgScore = Math.round(
      recentN.reduce((sum, s) => sum + s, 0) / recentN.length,
    );
    const severity: AlertSeverity = 'red';
    return {
      alertType: 'pain_sustained',
      severity,
      source: 'auto',
      triggerValue: `${thresholds.consecutiveCount} consecutive scores >= ${thresholds.thresholdScore} (avg: ${avgScore})`,
      triggerThreshold: `>=${thresholds.consecutiveCount} assessments at >=${thresholds.thresholdScore}`,
      message: `Sustained high pain: ${thresholds.consecutiveCount} consecutive assessments scored ${thresholds.thresholdScore}+ — pain management review required`,
      escalationLevel: DEFAULT_ESCALATION_BY_SEVERITY[severity],
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Full evaluation
// ---------------------------------------------------------------------------

/**
 * Input for a full clinical alert evaluation across all domains.
 * Each field is optional — only provided domains are evaluated.
 */
export type FullEvaluationInput = {
  fluidIntake?: FluidIntakeInput;
  news2?: News2Input;
  weightLoss?: WeightLossInput;
  constipation?: ConstipationInput;
  diarrhoea?: DiarrhoeaInput;
  pain?: PainInput;
};

/**
 * Evaluates all provided clinical data against thresholds.
 * Returns an array of alert candidates to be persisted.
 */
export function evaluateAllAlerts(
  input: FullEvaluationInput,
  customThresholds?: CustomThresholds,
): AlertCandidate[] {
  const alerts: AlertCandidate[] = [];

  if (input.fluidIntake) {
    const alert = evaluateFluidIntake(input.fluidIntake, customThresholds?.fluid_low);
    if (alert) alerts.push(alert);
  }

  if (input.news2) {
    const alert = evaluateNews2(input.news2, customThresholds?.news2_elevated);
    if (alert) alerts.push(alert);
  }

  if (input.weightLoss) {
    const alert = evaluateWeightLoss(input.weightLoss, customThresholds?.weight_loss);
    if (alert) alerts.push(alert);
  }

  if (input.constipation) {
    const alert = evaluateConstipation(input.constipation, customThresholds?.constipation);
    if (alert) alerts.push(alert);
  }

  if (input.diarrhoea) {
    const alert = evaluateDiarrhoea(input.diarrhoea, customThresholds?.diarrhoea);
    if (alert) alerts.push(alert);
  }

  if (input.pain) {
    const alert = evaluatePain(input.pain, customThresholds?.pain_sustained);
    if (alert) alerts.push(alert);
  }

  return alerts;
}
