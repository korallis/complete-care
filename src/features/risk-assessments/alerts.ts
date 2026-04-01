/**
 * Risk Assessment Alert Engine
 *
 * Alert rules:
 * - AMBER: Overdue reviews (review date has passed)
 * - RED:   High or critical risk scores → alert managers
 *
 * Pure functions for determining alert state.
 * DB-dependent notification creation lives in actions.ts.
 */

import type { RiskLevel } from '@/lib/db/schema/risk-assessments';
import { isReviewOverdue } from './schema';

// ---------------------------------------------------------------------------
// Alert types
// ---------------------------------------------------------------------------

export type AlertSeverity = 'amber' | 'red';

export type RiskAlert = {
  severity: AlertSeverity;
  title: string;
  message: string;
  assessmentId: string;
  templateId: string;
  personId: string;
};

// ---------------------------------------------------------------------------
// Alert determination
// ---------------------------------------------------------------------------

/**
 * Returns true if the risk level should trigger a red alert.
 * High and critical risk scores are red-alerted to managers.
 */
export function isHighRiskAlert(riskLevel: RiskLevel): boolean {
  return riskLevel === 'high' || riskLevel === 'critical';
}

/**
 * Returns true if a review is overdue (amber alert).
 */
export function isOverdueAlert(reviewDate: string | null | undefined): boolean {
  return isReviewOverdue(reviewDate);
}

/**
 * Computes all alerts for a single risk assessment.
 */
export function getAssessmentAlerts(assessment: {
  id: string;
  templateId: string;
  personId: string;
  riskLevel: string;
  reviewDate: string | null;
  status: string;
  templateName?: string;
}): RiskAlert[] {
  const alerts: RiskAlert[] = [];
  const name = assessment.templateName ?? assessment.templateId;

  // Red alert: high/critical risk level on completed assessments
  if (
    assessment.status === 'completed' &&
    isHighRiskAlert(assessment.riskLevel as RiskLevel)
  ) {
    alerts.push({
      severity: 'red',
      title: `High risk: ${name}`,
      message: `${name} assessment scored ${assessment.riskLevel} risk. Immediate review recommended.`,
      assessmentId: assessment.id,
      templateId: assessment.templateId,
      personId: assessment.personId,
    });
  }

  // Amber alert: overdue review on completed assessments
  if (assessment.status === 'completed' && isOverdueAlert(assessment.reviewDate)) {
    alerts.push({
      severity: 'amber',
      title: `Review overdue: ${name}`,
      message: `${name} assessment review was due on ${assessment.reviewDate} and has not been completed.`,
      assessmentId: assessment.id,
      templateId: assessment.templateId,
      personId: assessment.personId,
    });
  }

  return alerts;
}

/**
 * Computes alerts for a list of assessments (e.g. all assessments for a person).
 */
export function getAlertsForAssessments(
  assessments: Array<{
    id: string;
    templateId: string;
    personId: string;
    riskLevel: string;
    reviewDate: string | null;
    status: string;
    templateName?: string;
  }>,
): RiskAlert[] {
  return assessments.flatMap(getAssessmentAlerts);
}

/**
 * Returns the highest severity across a list of alerts.
 * Returns null if there are no alerts.
 */
export function getHighestSeverity(
  alerts: RiskAlert[],
): AlertSeverity | null {
  if (alerts.length === 0) return null;
  if (alerts.some((a) => a.severity === 'red')) return 'red';
  if (alerts.some((a) => a.severity === 'amber')) return 'amber';
  return null;
}

/**
 * Returns the notification type string for a given alert severity.
 */
export function getNotificationType(severity: AlertSeverity): string {
  return severity === 'red'
    ? 'risk_alert_high'
    : 'risk_alert_overdue';
}
