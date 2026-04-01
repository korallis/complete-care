'use client';

/**
 * FluidAlertBanner — displays threshold alerts for fluid intake.
 * Amber for < 1000ml, Red for < 800ml in 24hrs.
 * Also shows auto-prompt if no intake recorded for 4+ hours during waking hours.
 */

import {
  getFluidAlertLevel,
  getFluidAlertMessage,
  shouldShowIntakePrompt,
} from '@/features/clinical-monitoring/utils';

type FluidAlertBannerProps = {
  totalIntake: number;
  lastIntakeAt: Date | null;
};

export function FluidAlertBanner({
  totalIntake,
  lastIntakeAt,
}: FluidAlertBannerProps) {
  const alertLevel = getFluidAlertLevel(totalIntake);
  const alertMessage = getFluidAlertMessage(alertLevel, totalIntake);
  const showPrompt = shouldShowIntakePrompt(lastIntakeAt);

  if (alertLevel === 'none' && !showPrompt) {
    return null;
  }

  return (
    <div className="space-y-2">
      {alertMessage && (
        <div
          role="alert"
          className={`rounded-lg border px-4 py-3 text-sm ${
            alertLevel === 'red'
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="font-medium">{alertMessage}</span>
          </div>
        </div>
      )}

      {showPrompt && (
        <div
          role="status"
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
        >
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              No fluid intake recorded for 4+ hours. Please record current
              intake.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
