'use client';

/**
 * VisitSchedule — weekly/daily view of visits with status and assignment info.
 */

import type { ScheduledVisit } from '@/lib/db/schema/care-packages';
import { VisitStatusBadge } from './care-package-status-badge';
import { VISIT_TYPE_LABELS } from '@/features/care-packages/constants';
import type { VisitTypePreset } from '@/features/care-packages/constants';

type VisitScheduleProps = {
  visits: (ScheduledVisit & { staffName: string | null })[];
  visitTypeNames: Record<string, string>;
};

export function VisitSchedule({ visits, visitTypeNames }: VisitScheduleProps) {
  if (visits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          No visits scheduled for this period.
        </p>
      </div>
    );
  }

  // Group by date
  const byDate = new Map<string, typeof visits>();
  for (const v of visits) {
    const existing = byDate.get(v.date) ?? [];
    existing.push(v);
    byDate.set(v.date, existing);
  }

  const sortedDates = [...byDate.keys()].sort();

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const dayVisits = byDate.get(date) ?? [];
        const dayLabel = formatDateLabel(date);

        return (
          <div
            key={date}
            className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden"
          >
            <div className="px-5 py-2.5 border-b border-[oklch(0.95_0.003_160)] bg-[oklch(0.985_0.003_160)]">
              <h4 className="text-sm font-semibold text-[oklch(0.35_0.04_160)]">
                {dayLabel}
                <span className="ml-2 text-xs font-normal text-[oklch(0.55_0_0)]">
                  ({dayVisits.length} visit{dayVisits.length !== 1 ? 's' : ''})
                </span>
              </h4>
            </div>
            <div className="divide-y divide-[oklch(0.95_0.003_160)]">
              {dayVisits.map((visit) => {
                const vtName = visit.visitTypeId
                  ? visitTypeNames[visit.visitTypeId] ?? 'Visit'
                  : 'Ad-hoc Visit';
                const presetLabel =
                  VISIT_TYPE_LABELS[vtName.toLowerCase() as VisitTypePreset];

                return (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between gap-4 px-5 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-16 text-right">
                        <span className="text-sm font-mono text-[oklch(0.35_0.04_160)]">
                          {visit.scheduledStart}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] truncate">
                          {presetLabel ?? vtName}
                          {visit.isAdHoc && (
                            <span className="ml-2 text-xs text-amber-600 font-normal">
                              Ad-hoc
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[oklch(0.55_0_0)]">
                          {visit.scheduledStart} - {visit.scheduledEnd}
                          {visit.staffName && (
                            <span className="ml-2">
                              Assigned: {visit.staffName}
                            </span>
                          )}
                          {!visit.assignedStaffId && (
                            <span className="ml-2 text-amber-600">
                              Unassigned
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <VisitStatusBadge status={visit.status} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDateLabel(date: string): string {
  const d = new Date(date + 'T00:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
