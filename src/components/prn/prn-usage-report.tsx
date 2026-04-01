'use client';

/**
 * PrnUsageReport — usage frequency and effectiveness charts for PRN medications.
 */

import type { PrnUsageReport as PrnUsageReportType } from '@/features/prn/actions';
import { getEffectColor } from '@/features/prn/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PrnUsageReportProps = {
  report: PrnUsageReportType;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      className="h-2 rounded-full bg-[oklch(0.94_0.005_160)] overflow-hidden"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrnUsageReport({ report }: PrnUsageReportProps) {
  const maxAdmins = Math.max(
    ...report.items.map((i) => i.totalAdministrations),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Total Administrations
          </p>
          <p className="text-2xl font-semibold text-[oklch(0.22_0.04_160)] mt-1">
            {report.items.reduce((sum, i) => sum + i.totalAdministrations, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Assessed
          </p>
          <p className="text-2xl font-semibold text-[oklch(0.22_0.04_160)] mt-1">
            {report.items.reduce((sum, i) => sum + i.assessedCount, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Avg. Effectiveness
          </p>
          <p className="text-2xl font-semibold text-[oklch(0.22_0.04_160)] mt-1">
            {(() => {
              const rated = report.items.filter(
                (i) => i.effectivenessRate !== null,
              );
              if (rated.length === 0) return '--';
              const avg = Math.round(
                rated.reduce((sum, i) => sum + (i.effectivenessRate ?? 0), 0) /
                  rated.length,
              );
              return `${avg}%`;
            })()}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Pending Follow-Ups
          </p>
          <p
            className={`text-2xl font-semibold mt-1 ${
              report.pendingFollowUps > 0
                ? 'text-amber-600'
                : 'text-[oklch(0.22_0.04_160)]'
            }`}
          >
            {report.pendingFollowUps}
          </p>
        </div>
      </div>

      {/* Per-medication breakdown */}
      {report.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
          <p className="text-sm text-[oklch(0.55_0_0)]">
            No PRN usage data for this period.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Usage by Medication
          </h3>
          <div className="space-y-5">
            {report.items.map((item) => (
              <div
                key={item.protocolId}
                className="rounded-lg border border-[oklch(0.92_0.003_160)] bg-[oklch(0.985_0.003_160)] p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                      {item.drugName}
                    </h4>
                    <p className="text-xs text-[oklch(0.55_0_0)]">
                      {item.totalAdministrations} administration{item.totalAdministrations !== 1 ? 's' : ''}
                      {item.assessedCount > 0 && (
                        <> &mdash; {item.assessedCount} assessed</>
                      )}
                    </p>
                  </div>
                  {item.effectivenessRate !== null && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        item.effectivenessRate >= 75
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.effectivenessRate >= 50
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {item.effectivenessRate}% effective
                    </span>
                  )}
                </div>

                {/* Usage bar */}
                <div className="mb-3">
                  <ProgressBar
                    value={item.totalAdministrations}
                    max={maxAdmins}
                    color="bg-[oklch(0.45_0.1_160)]"
                  />
                </div>

                {/* Effectiveness breakdown */}
                {item.assessedCount > 0 && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className={`rounded-md p-2 ${getEffectColor('yes').bg} ${getEffectColor('yes').text}`}>
                      <p className="font-medium">Effective</p>
                      <p className="text-lg font-semibold">{item.effectiveCount}</p>
                    </div>
                    <div className={`rounded-md p-2 ${getEffectColor('partial').bg} ${getEffectColor('partial').text}`}>
                      <p className="font-medium">Partial</p>
                      <p className="text-lg font-semibold">{item.partialCount}</p>
                    </div>
                    <div className={`rounded-md p-2 ${getEffectColor('no').bg} ${getEffectColor('no').text}`}>
                      <p className="font-medium">Not Effective</p>
                      <p className="text-lg font-semibold">{item.notEffectiveCount}</p>
                    </div>
                  </div>
                )}

                {/* Pain score averages */}
                {(item.averagePrePainScore !== null ||
                  item.averagePostPainScore !== null) && (
                  <div className="mt-3 flex items-center gap-4 text-xs text-[oklch(0.55_0_0)]">
                    {item.averagePrePainScore !== null && (
                      <span>
                        Avg. pre-pain: <strong className="text-[oklch(0.35_0.04_160)]">{item.averagePrePainScore}/10</strong>
                      </span>
                    )}
                    {item.averagePostPainScore !== null && (
                      <span>
                        Avg. post-pain: <strong className="text-[oklch(0.35_0.04_160)]">{item.averagePostPainScore}/10</strong>
                      </span>
                    )}
                    {item.averagePrePainScore !== null &&
                      item.averagePostPainScore !== null && (
                        <span
                          className={
                            item.averagePostPainScore < item.averagePrePainScore
                              ? 'text-emerald-600'
                              : item.averagePostPainScore > item.averagePrePainScore
                                ? 'text-red-600'
                                : ''
                          }
                        >
                          {item.averagePostPainScore < item.averagePrePainScore
                            ? `Avg. reduction: ${(item.averagePrePainScore - item.averagePostPainScore).toFixed(1)}`
                            : item.averagePostPainScore > item.averagePrePainScore
                              ? `Avg. increase: ${(item.averagePostPainScore - item.averagePrePainScore).toFixed(1)}`
                              : 'No change'}
                        </span>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-[oklch(0.65_0_0)] text-center">
        Report period: {report.dateFrom} to {report.dateTo}
      </p>
    </div>
  );
}
