/**
 * Risk Assessment Scoring Engine
 *
 * Pure functions for calculating risk scores and levels.
 * No side effects, no DB calls — safe for client and server use.
 */

import type { RiskLevel, RiskAssessmentScores } from '@/lib/db/schema/risk-assessments';
import type { RiskThresholds, RiskAssessmentTemplate } from './templates';
import { getTemplate } from './templates';

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

/**
 * Sums all score values from the responses map.
 */
export function calculateTotalScore(scores: RiskAssessmentScores): number {
  return Object.values(scores).reduce((sum, val) => sum + (val ?? 0), 0);
}

/**
 * Maps a total score to a risk level using the template's thresholds.
 *
 * If the score exceeds all defined thresholds, returns 'critical'.
 * If below all thresholds, returns 'low'.
 */
export function calculateRiskLevel(
  totalScore: number,
  thresholds: RiskThresholds,
): RiskLevel {
  if (totalScore >= thresholds.critical.min) return 'critical';
  if (totalScore >= thresholds.high.min) return 'high';
  if (totalScore >= thresholds.medium.min) return 'medium';
  return 'low';
}

/**
 * Convenience: calculate both total score and risk level in one call.
 */
export function calculateAssessmentResult(
  scores: RiskAssessmentScores,
  templateId: string,
): { totalScore: number; riskLevel: RiskLevel } {
  const template = getTemplate(templateId);
  if (!template) {
    return { totalScore: 0, riskLevel: 'low' };
  }

  const totalScore = calculateTotalScore(scores);
  const riskLevel = calculateRiskLevel(totalScore, template.thresholds);
  return { totalScore, riskLevel };
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Checks if all questions in a template have been answered.
 */
export function isAssessmentComplete(
  scores: RiskAssessmentScores,
  template: RiskAssessmentTemplate,
): boolean {
  return template.questions.every((q) => q.id in scores);
}

/**
 * Returns the IDs of unanswered questions.
 */
export function getUnansweredQuestions(
  scores: RiskAssessmentScores,
  template: RiskAssessmentTemplate,
): string[] {
  return template.questions
    .filter((q) => !(q.id in scores))
    .map((q) => q.id);
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/** Human-readable labels for risk levels */
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/** Colour variant for risk level badges */
export function getRiskLevelVariant(
  riskLevel: RiskLevel,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (riskLevel) {
    case 'low':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'high':
      return 'destructive';
    case 'critical':
      return 'destructive';
    default:
      return 'outline';
  }
}

/**
 * Returns the maximum possible score for a template.
 */
export function getMaxScore(template: RiskAssessmentTemplate): number {
  return template.questions.reduce((sum, q) => {
    const maxOption = Math.max(...q.options.map((o) => o.value));
    return sum + maxOption;
  }, 0);
}
