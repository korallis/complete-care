'use client';

/**
 * RiskAlertBanner — displays risk alert banners for a person's assessments.
 *
 * Shows:
 * - Red banner for high/critical risk scores
 * - Amber banner for overdue reviews
 */

import { cn } from '@/lib/utils';
import type { RiskAlert } from '@/features/risk-assessments/alerts';

// ---------------------------------------------------------------------------
// Single alert
// ---------------------------------------------------------------------------

type AlertItemProps = {
  alert: RiskAlert;
};

function AlertItem({ alert }: AlertItemProps) {
  const isRed = alert.severity === 'red';

  return (
    <div
      className={cn(
        'rounded-xl border px-5 py-3 text-sm',
        isRed
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-amber-200 bg-amber-50 text-amber-800',
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isRed ? (
            <svg
              className="h-4 w-4 text-red-500"
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
              className="h-4 w-4 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{alert.title}</p>
          <p className="text-xs mt-0.5 opacity-80">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

type RiskAlertBannerProps = {
  alerts: RiskAlert[];
  className?: string;
};

export function RiskAlertBanner({ alerts, className }: RiskAlertBannerProps) {
  if (alerts.length === 0) return null;

  // Sort red alerts first
  const sorted = [...alerts].sort((a, b) => {
    if (a.severity === 'red' && b.severity !== 'red') return -1;
    if (a.severity !== 'red' && b.severity === 'red') return 1;
    return 0;
  });

  return (
    <div
      className={cn('space-y-2', className)}
      aria-label="Risk alerts"
      role="region"
    >
      {sorted.map((alert, i) => (
        <AlertItem key={`${alert.assessmentId}-${alert.severity}-${i}`} alert={alert} />
      ))}
    </div>
  );
}
