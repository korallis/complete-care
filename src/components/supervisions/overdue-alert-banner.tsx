'use client';

/**
 * OverdueAlertBanner — displays overdue supervision alerts.
 * Shows count of overdue and upcoming supervisions with appropriate severity.
 */

type OverdueAlertBannerProps = {
  overdueCount: number;
  upcomingCount: number;
};

export function OverdueAlertBanner({
  overdueCount,
  upcomingCount,
}: OverdueAlertBannerProps) {
  if (overdueCount === 0 && upcomingCount === 0) return null;

  return (
    <div className="space-y-2" role="alert">
      {overdueCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 flex-shrink-0 text-red-500"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">
              {overdueCount} overdue supervision{overdueCount !== 1 ? 's' : ''}
            </p>
            <p className="text-sm mt-0.5 text-red-800 opacity-80">
              {overdueCount === 1
                ? 'A supervision session is past its scheduled date and needs to be completed or rescheduled.'
                : `${overdueCount} supervision sessions are past their scheduled dates and need attention.`}
            </p>
          </div>
        </div>
      )}
      {upcomingCount > 0 && overdueCount === 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 flex-shrink-0 text-amber-500"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              {upcomingCount} upcoming supervision{upcomingCount !== 1 ? 's' : ''} this week
            </p>
            <p className="text-sm mt-0.5 text-amber-800 opacity-80">
              Supervision sessions are scheduled within the next 7 days.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
