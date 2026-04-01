'use client';

/**
 * ComplianceAlertList -- Prioritized list of upcoming/overdue compliance items.
 *
 * Sorted by severity (red first) and urgency (days until expiry).
 */

import Link from 'next/link';
import type { ComplianceAlert } from '@/features/compliance/actions';

function AlertIcon({ severity }: { severity: 'red' | 'amber' }) {
  if (severity === 'red') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 text-red-500 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-amber-500 shrink-0"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

interface ComplianceAlertListProps {
  alerts: ComplianceAlert[];
  orgSlug: string;
}

export function ComplianceAlertList({
  alerts,
  orgSlug,
}: ComplianceAlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-[oklch(0.55_0_0)]">
        <p className="text-sm">No compliance alerts at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const borderColour =
          alert.severity === 'red'
            ? 'border-l-red-500'
            : 'border-l-amber-400';
        const bgColour =
          alert.severity === 'red' ? 'bg-red-50' : 'bg-amber-50';

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-lg border border-l-4 ${borderColour} ${bgColour} px-4 py-3`}
          >
            <AlertIcon severity={alert.severity} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium uppercase tracking-wide text-[oklch(0.45_0_0)]">
                  {alert.area}
                </span>
                <span className="text-xs text-[oklch(0.55_0_0)]">
                  {alert.daysUntilExpiry < 0
                    ? `${Math.abs(alert.daysUntilExpiry)}d overdue`
                    : `${alert.daysUntilExpiry}d remaining`}
                </span>
              </div>
              <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] mt-0.5">
                {alert.title}
              </p>
              <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
                {alert.detail}
              </p>
            </div>
            <Link
              href={`/${orgSlug}/staff/compliance/${alert.staffId}`}
              className="text-xs text-[oklch(0.35_0.06_160)] hover:underline shrink-0"
            >
              View
            </Link>
          </div>
        );
      })}
    </div>
  );
}
