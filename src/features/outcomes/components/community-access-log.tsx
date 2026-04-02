'use client';

/**
 * Community access log — recent community activities with summary stats.
 */

import { cn } from '@/lib/utils';
import type { CommunityAccess } from '@/lib/db/schema/outcomes';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

interface CommunityAccessStats {
  totalActivities: number;
  totalHours: number;
  uniqueDestinations: number;
  thisMonth: number;
}

function computeStats(records: CommunityAccess[]): CommunityAccessStats {
  const now = new Date();
  const thisMonth = records.filter((r) => {
    const d = new Date(r.activityDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const destinations = new Set(records.map((r) => r.destination.toLowerCase()));
  const totalMinutes = records.reduce((sum, r) => sum + r.durationMinutes, 0);

  return {
    totalActivities: records.length,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    uniqueDestinations: destinations.size,
    thisMonth: thisMonth.length,
  };
}

export function CommunityAccessLog({
  records,
}: {
  records: CommunityAccess[];
}) {
  const stats = computeStats(records);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Total Activities', value: stats.totalActivities },
          { label: 'Total Hours', value: stats.totalHours },
          { label: 'Unique Places', value: stats.uniqueDestinations },
          { label: 'This Month', value: stats.thisMonth },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-center"
          >
            <p className="text-lg font-bold tabular-nums text-slate-800">
              {stat.value}
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Activity list */}
      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center">
          <p className="text-sm text-slate-500">
            No community access records yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.slice(0, 10).map((record) => {
            const skillsList = Array.isArray(record.skillsPractised)
              ? (record.skillsPractised as string[])
              : [];

            return (
              <div
                key={record.id}
                className="rounded-lg border border-slate-200 bg-white p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {record.destination}
                      </span>
                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        {formatDuration(record.durationMinutes)}
                      </span>
                    </div>
                    {record.accompaniedBy && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        With {record.accompaniedBy}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">
                    {formatDate(record.activityDate)}
                  </time>
                </div>

                {record.outcomes && (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {record.outcomes}
                  </p>
                )}

                {skillsList.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {skillsList.map((skill) => (
                      <span
                        key={skill}
                        className={cn(
                          'inline-flex items-center rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5',
                          'text-[10px] font-medium text-violet-700',
                        )}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
