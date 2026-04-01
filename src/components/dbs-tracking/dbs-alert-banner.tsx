'use client';

/**
 * DbsAlertBanner — displays expiring/overdue DBS alerts for a staff member.
 * Severity:
 * - amber: recheck within 30 days
 * - red:   recheck within 7 days or overdue
 */

import type { DbsAlert, DbsAlertSeverity } from '@/features/dbs-tracking/alerts';

const SEVERITY_STYLES: Record<
  DbsAlertSeverity,
  { bg: string; border: string; text: string; icon: string }
> = {
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'text-amber-500',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-500',
  },
};

function AlertIcon({ severity }: { severity: DbsAlertSeverity }) {
  const style = SEVERITY_STYLES[severity];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 flex-shrink-0 ${style.icon}`}
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function DbsAlertBanner({ alerts }: { alerts: DbsAlert[] }) {
  if (alerts.length === 0) return null;

  // Group by severity, show red first
  const redAlerts = alerts.filter((a) => a.severity === 'red');
  const amberAlerts = alerts.filter((a) => a.severity === 'amber');
  const sortedAlerts = [...redAlerts, ...amberAlerts];

  return (
    <div className="space-y-2" role="alert">
      {sortedAlerts.map((alert) => {
        const style = SEVERITY_STYLES[alert.severity];
        return (
          <div
            key={alert.dbsCheckId}
            className={`flex items-start gap-3 rounded-lg border p-3 ${style.bg} ${style.border}`}
          >
            <AlertIcon severity={alert.severity} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${style.text}`}>
                {alert.title}
              </p>
              <p className={`text-sm mt-0.5 ${style.text} opacity-80`}>
                {alert.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
