/**
 * NEWS2 Calculation Engine — pure functions for National Early Warning Score 2.
 *
 * No side effects, no DB calls, no imports from server-only modules.
 * Safe for use in both client and server environments.
 *
 * References:
 * - Royal College of Physicians: NEWS2 (2017)
 * - NHS England: NEWS2 Implementation Guidance
 */

import {
  NEWS2_RESP_RATE_THRESHOLDS,
  NEWS2_SPO2_SCALE1_THRESHOLDS,
  NEWS2_SPO2_SCALE2_ON_AIR_THRESHOLDS,
  NEWS2_SPO2_SCALE2_ON_O2_THRESHOLDS,
  NEWS2_SUPPLEMENTAL_O2_SCORE_ON,
  NEWS2_SUPPLEMENTAL_O2_SCORE_OFF,
  NEWS2_SYSTOLIC_BP_THRESHOLDS,
  NEWS2_PULSE_RATE_THRESHOLDS,
  NEWS2_AVPU_SCORES,
  NEWS2_TEMPERATURE_THRESHOLDS,
  type AvpuLevel,
  type News2Escalation,
  type News2Scale,
} from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type News2Input = {
  respiratoryRate: number;
  spo2: number;
  supplementalOxygen: boolean;
  systolicBp: number;
  pulseRate: number;
  consciousness: AvpuLevel;
  temperature: number;
  /** Whether to use Scale 2 (COPD). Defaults to Scale 1. */
  isCopd?: boolean;
};

export type News2ParameterScores = {
  respiratoryRate: number;
  spo2: number;
  supplementalOxygen: number;
  systolicBp: number;
  pulseRate: number;
  consciousness: number;
  temperature: number;
};

export type News2Result = {
  /** Total NEWS2 score (0-20) */
  totalScore: number;
  /** Individual parameter scores */
  parameterScores: News2ParameterScores;
  /** Scale used: 1 (standard) or 2 (COPD) */
  scaleUsed: News2Scale;
  /** Escalation level derived from total score */
  escalation: News2Escalation;
  /** Whether any single parameter scored 3 (clinical concern trigger) */
  hasClinicalConcern: boolean;
};

// ---------------------------------------------------------------------------
// Individual parameter scoring functions
// ---------------------------------------------------------------------------

/**
 * Scores a numeric vital against a threshold table.
 * Returns the score for the matching range.
 */
function scoreFromThresholds(
  value: number,
  thresholds: ReadonlyArray<{ readonly min: number; readonly max: number; readonly score: number }>,
): number {
  for (const t of thresholds) {
    if (value >= t.min && value <= t.max) {
      return t.score;
    }
  }
  // Should never happen with properly defined thresholds covering all ranges
  return 0;
}

/**
 * Scores respiratory rate (NEWS2 parameter 1).
 */
export function scoreRespiratoryRate(rate: number): number {
  return scoreFromThresholds(rate, NEWS2_RESP_RATE_THRESHOLDS);
}

/**
 * Scores SpO2 (NEWS2 parameter 2).
 *
 * Scale 1: Standard scoring for most patients.
 * Scale 2: For COPD/chronic hypoxaemia patients with prescribed SpO2 88-92%.
 *   - On air: higher SpO2 (>=93) scores 3 (paradoxically high for COPD)
 *   - On O2: graduated scoring above 92%
 */
export function scoreSpo2(
  spo2: number,
  isCopd: boolean,
  supplementalOxygen: boolean,
): number {
  if (!isCopd) {
    return scoreFromThresholds(spo2, NEWS2_SPO2_SCALE1_THRESHOLDS);
  }

  // Scale 2
  if (supplementalOxygen) {
    return scoreFromThresholds(spo2, NEWS2_SPO2_SCALE2_ON_O2_THRESHOLDS);
  }
  return scoreFromThresholds(spo2, NEWS2_SPO2_SCALE2_ON_AIR_THRESHOLDS);
}

/**
 * Scores supplemental oxygen use (NEWS2 parameter 3).
 *
 * On Scale 1: 2 if on oxygen, 0 if on air.
 * On Scale 2: oxygen scoring is incorporated into SpO2 scoring, so this returns 0.
 */
export function scoreSupplementalOxygen(
  onOxygen: boolean,
  isCopd: boolean,
): number {
  if (isCopd) return 0; // Scale 2 incorporates O2 into SpO2 scoring
  return onOxygen ? NEWS2_SUPPLEMENTAL_O2_SCORE_ON : NEWS2_SUPPLEMENTAL_O2_SCORE_OFF;
}

/**
 * Scores systolic blood pressure (NEWS2 parameter 4).
 */
export function scoreSystolicBp(systolic: number): number {
  return scoreFromThresholds(systolic, NEWS2_SYSTOLIC_BP_THRESHOLDS);
}

/**
 * Scores pulse rate (NEWS2 parameter 5).
 */
export function scorePulseRate(rate: number): number {
  return scoreFromThresholds(rate, NEWS2_PULSE_RATE_THRESHOLDS);
}

/**
 * Scores consciousness level (NEWS2 parameter 6).
 * Alert = 0, any other AVPU response = 3.
 */
export function scoreConsciousness(avpu: AvpuLevel): number {
  return NEWS2_AVPU_SCORES[avpu] ?? 0;
}

/**
 * Scores temperature (NEWS2 parameter 7).
 */
export function scoreTemperature(temp: number): number {
  return scoreFromThresholds(temp, NEWS2_TEMPERATURE_THRESHOLDS);
}

// ---------------------------------------------------------------------------
// Escalation
// ---------------------------------------------------------------------------

/**
 * Determines the NEWS2 escalation level from the total score.
 *
 * - 0:   Routine monitoring
 * - 1-4: Urgent ward-based assessment (also triggered if any single param = 3)
 * - 5-6: Urgent / emergency response
 * - 7+:  Emergency response
 */
export function getEscalation(
  totalScore: number,
  hasClinicalConcern: boolean,
): News2Escalation {
  if (totalScore >= 7) return 'emergency';
  if (totalScore >= 5) return 'urgent';
  // A single parameter score of 3 triggers at least ward assessment
  if (totalScore >= 1 || hasClinicalConcern) return 'ward_assessment';
  return 'routine';
}

// ---------------------------------------------------------------------------
// Full NEWS2 calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the complete NEWS2 score from vital sign parameters.
 *
 * This is a pure function with no side effects.
 *
 * @param input - The six NEWS2 parameters plus temperature
 * @returns Full NEWS2 result with score breakdown, escalation, and clinical concern flag
 */
export function calculateNews2(input: News2Input): News2Result {
  const isCopd = input.isCopd ?? false;
  const scaleUsed: News2Scale = isCopd ? 2 : 1;

  const parameterScores: News2ParameterScores = {
    respiratoryRate: scoreRespiratoryRate(input.respiratoryRate),
    spo2: scoreSpo2(input.spo2, isCopd, input.supplementalOxygen),
    supplementalOxygen: scoreSupplementalOxygen(input.supplementalOxygen, isCopd),
    systolicBp: scoreSystolicBp(input.systolicBp),
    pulseRate: scorePulseRate(input.pulseRate),
    consciousness: scoreConsciousness(input.consciousness),
    temperature: scoreTemperature(input.temperature),
  };

  const totalScore =
    parameterScores.respiratoryRate +
    parameterScores.spo2 +
    parameterScores.supplementalOxygen +
    parameterScores.systolicBp +
    parameterScores.pulseRate +
    parameterScores.consciousness +
    parameterScores.temperature;

  // Clinical concern: any single parameter scoring 3
  const hasClinicalConcern = Object.values(parameterScores).some(
    (score) => score === 3,
  );

  const escalation = getEscalation(totalScore, hasClinicalConcern);

  return {
    totalScore,
    parameterScores,
    scaleUsed,
    escalation,
    hasClinicalConcern,
  };
}
