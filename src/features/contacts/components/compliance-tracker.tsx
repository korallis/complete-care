'use client';

/**
 * Compliance Tracker — shows whether contact frequency matches the care plan.
 * e.g. "Weekly phone with mum: 4/4 this month"
 */

import type { ComplianceSummary } from '../actions';

const FREQUENCY_TARGETS: Record<string, number> = {
  daily: 30,
  weekly: 4,
  fortnightly: 2,
  monthly: 1,
};

function getExpectedCount(frequency: string | null): number | null {
  if (!frequency) return null;
  const normalised = frequency.toLowerCase().trim();
  for (const [key, value] of Object.entries(FREQUENCY_TARGETS)) {
    if (normalised.includes(key)) return value;
  }
  return null;
}

export function ComplianceTracker({
  summaries,
}: {
  summaries: ComplianceSummary[];
}) {
  if (summaries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No approved contacts to track compliance for.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary) => {
        const expected = getExpectedCount(summary.expectedFrequency);
        const isOnTrack = expected !== null && summary.completedThisMonth >= expected;
        const isBehind = expected !== null && summary.completedThisMonth < expected;

        return (
          <div
            key={summary.approvedContactId}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <div className="font-medium">{summary.contactName}</div>
              <div className="text-sm text-muted-foreground">
                {summary.relationship}
                {summary.expectedFrequency &&
                  ` \u00b7 ${summary.expectedFrequency}`}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Completed count */}
              <div className="text-right">
                <div className="text-lg font-semibold tabular-nums">
                  {summary.completedThisMonth}
                  {expected !== null && (
                    <span className="text-sm text-muted-foreground">
                      /{expected}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  completed this month
                </div>
              </div>

              {/* Status indicator */}
              {expected !== null && (
                <div
                  className={`h-3 w-3 rounded-full ${
                    isOnTrack
                      ? 'bg-green-500'
                      : isBehind
                        ? 'bg-amber-500'
                        : 'bg-gray-300'
                  }`}
                  title={
                    isOnTrack
                      ? 'On track'
                      : isBehind
                        ? 'Behind schedule'
                        : 'Unknown'
                  }
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
