/**
 * DBS Tracking Alert Engine
 *
 * Alert rules:
 * - AMBER: DBS recheck date within 30 days (approaching expiry)
 * - RED:   DBS recheck date within 7 days or overdue (expired)
 *
 * Pure functions for determining alert state.
 * DB-dependent notification creation lives in actions.ts.
 */

import { AMBER_ALERT_DAYS, RED_ALERT_DAYS } from './constants';

// ---------------------------------------------------------------------------
// Alert types
// ---------------------------------------------------------------------------

export type DbsAlertSeverity = 'amber' | 'red';

export type DbsAlert = {
  severity: DbsAlertSeverity;
  title: string;
  message: string;
  dbsCheckId: string;
  staffProfileId: string;
  staffName?: string;
  daysUntilExpiry: number;
};

// ---------------------------------------------------------------------------
// Alert determination
// ---------------------------------------------------------------------------

/**
 * Returns the number of days between today and the recheck date.
 * Negative values mean the recheck date has passed (overdue).
 */
export function daysUntilRecheck(recheckDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recheck = new Date(recheckDate);
  recheck.setHours(0, 0, 0, 0);
  const diffMs = recheck.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if the DBS check is expired (recheck date has passed).
 */
export function isDbsExpired(recheckDate: string): boolean {
  return daysUntilRecheck(recheckDate) < 0;
}

/**
 * Returns true if the DBS check is within the amber alert window (30 days).
 */
export function isDbsExpiringSoon(recheckDate: string): boolean {
  const days = daysUntilRecheck(recheckDate);
  return days >= 0 && days <= AMBER_ALERT_DAYS;
}

/**
 * Returns true if the DBS check is within the red alert window (7 days or overdue).
 */
export function isDbsRedAlert(recheckDate: string): boolean {
  const days = daysUntilRecheck(recheckDate);
  return days <= RED_ALERT_DAYS;
}

/**
 * Returns the alert severity for a DBS check based on its recheck date.
 * Returns null if no alert is needed.
 */
export function getDbsAlertSeverity(
  recheckDate: string,
): DbsAlertSeverity | null {
  const days = daysUntilRecheck(recheckDate);
  if (days <= RED_ALERT_DAYS) return 'red';
  if (days <= AMBER_ALERT_DAYS) return 'amber';
  return null;
}

/**
 * Computes all alerts for a single DBS check.
 */
export function getDbsCheckAlerts(check: {
  id: string;
  staffProfileId: string;
  recheckDate: string;
  certificateNumber: string;
  staffName?: string;
}): DbsAlert[] {
  const alerts: DbsAlert[] = [];
  const days = daysUntilRecheck(check.recheckDate);
  const severity = getDbsAlertSeverity(check.recheckDate);

  if (!severity) return alerts;

  const name = check.staffName ?? 'Staff member';

  if (severity === 'red') {
    if (days < 0) {
      alerts.push({
        severity: 'red',
        title: `DBS expired: ${name}`,
        message: `DBS certificate ${check.certificateNumber} for ${name} expired ${Math.abs(days)} day(s) ago. Immediate recheck required.`,
        dbsCheckId: check.id,
        staffProfileId: check.staffProfileId,
        staffName: check.staffName,
        daysUntilExpiry: days,
      });
    } else {
      alerts.push({
        severity: 'red',
        title: `DBS expiring: ${name}`,
        message: `DBS certificate ${check.certificateNumber} for ${name} expires in ${days} day(s). Urgent recheck needed.`,
        dbsCheckId: check.id,
        staffProfileId: check.staffProfileId,
        staffName: check.staffName,
        daysUntilExpiry: days,
      });
    }
  } else {
    alerts.push({
      severity: 'amber',
      title: `DBS recheck approaching: ${name}`,
      message: `DBS certificate ${check.certificateNumber} for ${name} is due for recheck in ${days} day(s) on ${check.recheckDate}.`,
      dbsCheckId: check.id,
      staffProfileId: check.staffProfileId,
      staffName: check.staffName,
      daysUntilExpiry: days,
    });
  }

  return alerts;
}

/**
 * Computes alerts for a list of DBS checks.
 */
export function getAlertsForDbsChecks(
  checks: Array<{
    id: string;
    staffProfileId: string;
    recheckDate: string;
    certificateNumber: string;
    staffName?: string;
  }>,
): DbsAlert[] {
  return checks.flatMap(getDbsCheckAlerts);
}

/**
 * Returns the highest severity across a list of DBS alerts.
 * Returns null if there are no alerts.
 */
export function getHighestDbsSeverity(
  alerts: DbsAlert[],
): DbsAlertSeverity | null {
  if (alerts.length === 0) return null;
  if (alerts.some((a) => a.severity === 'red')) return 'red';
  if (alerts.some((a) => a.severity === 'amber')) return 'amber';
  return null;
}
