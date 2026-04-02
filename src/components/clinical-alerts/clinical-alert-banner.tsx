'use client';

/**
 * ClinicalAlertBanner — displays active clinical alerts at the top of person pages.
 *
 * Shows alert severity (emergency > red > amber > info), escalation level, and message.
 * Sorted by severity (most severe first).
 */

import { cn } from '@/lib/utils';
import {
  ALERT_SEVERITY_LABELS,
  ALERT_TYPE_LABELS,
  type AlertSeverity,
  type AlertType,
} from '@/features/clinical-alerts/constants';
import { EscalationBadge } from './escalation-badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertBannerItem = {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  escalationLevel: string;
  createdAt: Date;
};

// ---------------------------------------------------------------------------
// Severity ordering (highest first)
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<string, number> = {
  emergency: 0,
  red: 1,
  amber: 2,
  info: 3,
};

const SEVERITY_STYLES: Record<string, string> = {
  emergency: 'border-red-300 bg-red-100 text-red-900',
  red: 'border-red-200 bg-red-50 text-red-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const SEVERITY_ICON_STYLES: Record<string, string> = {
  emergency: 'text-red-600',
  red: 'text-red-500',
  amber: 'text-amber-500',
  info: 'text-blue-500',
};

// ---------------------------------------------------------------------------
// Single alert item
// ---------------------------------------------------------------------------

function AlertBannerItemComponent({ alert }: { alert: AlertBannerItem }) {
  const severity = alert.severity as AlertSeverity;
  const borderStyle = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.info;
  const iconStyle = SEVERITY_ICON_STYLES[severity] ?? SEVERITY_ICON_STYLES.info;
  const typeLabel =
    ALERT_TYPE_LABELS[alert.alertType as AlertType] ?? alert.alertType;
  const isEmergency = severity === 'emergency' || severity === 'red';

  return (
    <div
      className={cn('rounded-xl border px-5 py-3 text-sm', borderStyle)}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isEmergency ? (
            <svg
              className={cn('h-4 w-4', iconStyle)}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className={cn('h-4 w-4', iconStyle)}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">
              {ALERT_SEVERITY_LABELS[severity] ?? severity}: {typeLabel}
            </p>
            <EscalationBadge level={alert.escalationLevel} />
          </div>
          <p className="text-xs mt-0.5 opacity-80">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

type ClinicalAlertBannerProps = {
  alerts: AlertBannerItem[];
  className?: string;
};

export function ClinicalAlertBanner({
  alerts,
  className,
}: ClinicalAlertBannerProps) {
  if (alerts.length === 0) return null;

  // Sort by severity (most severe first)
  const sorted = [...alerts].sort((a, b) => {
    const orderA = SEVERITY_ORDER[a.severity] ?? 99;
    const orderB = SEVERITY_ORDER[b.severity] ?? 99;
    return orderA - orderB;
  });

  return (
    <div
      className={cn('space-y-2', className)}
      aria-label="Clinical alerts"
      role="region"
    >
      {sorted.map((alert) => (
        <AlertBannerItemComponent key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
