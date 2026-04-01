'use client';

/**
 * TrainingGapList — shows missing/expired training per staff member.
 * Sorted by compliance percentage (worst first).
 */

import type { StaffTrainingGaps } from '@/features/training/actions';
import { TrainingCategoryBadge } from './training-status-badge';

type TrainingGapListProps = {
  gaps: StaffTrainingGaps[];
  orgSlug: string;
};

export function TrainingGapList({ gaps, orgSlug }: TrainingGapListProps) {
  if (gaps.length === 0) {
    return (
      <div className="rounded-xl border border-[oklch(0.92_0.005_160)] bg-white p-8 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          No training gap data available. Configure training courses first.
        </p>
      </div>
    );
  }

  // Only show staff with gaps
  const staffWithGaps = gaps.filter((g) => g.gaps.length > 0);

  if (staffWithGaps.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-sm font-medium text-emerald-700">
          All staff are fully compliant with required training.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {staffWithGaps.map((staff) => (
        <div
          key={staff.staffId}
          className="rounded-xl border border-[oklch(0.92_0.005_160)] bg-white overflow-hidden"
        >
          {/* Staff header */}
          <div className="flex items-center justify-between border-b border-[oklch(0.92_0.005_160)] bg-[oklch(0.98_0.002_160)] px-4 py-3">
            <div>
              <a
                href={`/${orgSlug}/staff/${staff.staffId}/training`}
                className="font-medium text-[oklch(0.22_0.04_160)] hover:text-[oklch(0.35_0.06_160)] hover:underline transition-colors"
              >
                {staff.staffName}
              </a>
              <span className="ml-2 text-xs text-[oklch(0.55_0_0)]">
                {staff.jobTitle}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[oklch(0.55_0_0)]">
                {staff.totalCompliant}/{staff.totalRequired} complete
              </span>
              <ComplianceBar percentage={staff.compliancePercentage} />
              <span
                className={`text-sm font-bold ${
                  staff.compliancePercentage >= 80
                    ? 'text-emerald-600'
                    : staff.compliancePercentage >= 50
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}
              >
                {staff.compliancePercentage}%
              </span>
            </div>
          </div>

          {/* Gap list */}
          <div className="divide-y divide-[oklch(0.95_0.003_160)]">
            {staff.gaps.map((gap) => (
              <div
                key={gap.courseId}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      gap.status === 'expired' ? 'bg-red-500' : 'bg-red-400'
                    }`}
                  />
                  <span className="text-sm text-[oklch(0.22_0.04_160)]">
                    {gap.courseName}
                  </span>
                  <TrainingCategoryBadge category={gap.category} />
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {gap.status === 'expired' ? (
                    <span className="text-red-600">
                      Expired{gap.expiryDate ? ` on ${gap.expiryDate}` : ''}
                    </span>
                  ) : (
                    <span className="text-red-500">Missing</span>
                  )}
                  {gap.lastCompleted && (
                    <span className="text-[oklch(0.55_0_0)]">
                      Last completed: {gap.lastCompleted}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compliance bar sub-component
// ---------------------------------------------------------------------------

function ComplianceBar({ percentage }: { percentage: number }) {
  const colour =
    percentage >= 80
      ? 'bg-emerald-500'
      : percentage >= 50
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className="h-2 w-24 rounded-full bg-[oklch(0.92_0.005_160)]">
      <div
        className={`h-full rounded-full ${colour} transition-all duration-300`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}
