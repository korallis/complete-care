'use client';

/**
 * Support hours chart — planned vs actual hours with variance reporting.
 * Pure CSS bar chart (no recharts dependency needed for this view).
 */

import { cn } from '@/lib/utils';
import type { SupportHour } from '@/lib/db/schema/outcomes';

function formatWeek(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

interface VarianceSummary {
  totalPlanned: number;
  totalActual: number;
  variancePercent: number;
  weeksRecorded: number;
}

function computeVariance(records: SupportHour[]): VarianceSummary {
  const totalPlanned = records.reduce(
    (sum, r) => sum + Number(r.plannedHours),
    0,
  );
  const totalActual = records.reduce(
    (sum, r) => sum + Number(r.actualHours),
    0,
  );
  const variancePercent =
    totalPlanned > 0
      ? Math.round(((totalActual - totalPlanned) / totalPlanned) * 100)
      : 0;

  return {
    totalPlanned,
    totalActual,
    variancePercent,
    weeksRecorded: records.length,
  };
}

export function SupportHoursChart({
  records,
  period = 'weekly',
}: {
  records: SupportHour[];
  period?: 'weekly' | 'monthly';
}) {
  const summary = computeVariance(records);

  // Show most recent 12 weeks
  const chartData = records.slice(0, 12).reverse();
  const maxHours = Math.max(
    ...chartData.map((r) =>
      Math.max(Number(r.plannedHours), Number(r.actualHours)),
    ),
    1,
  );

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-center">
          <p className="text-lg font-bold tabular-nums text-slate-800">
            {summary.totalPlanned}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Planned Hrs
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-center">
          <p className="text-lg font-bold tabular-nums text-slate-800">
            {summary.totalActual}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Actual Hrs
          </p>
        </div>
        <div
          className={cn(
            'rounded-lg border px-3 py-2.5 text-center',
            summary.variancePercent < 0
              ? 'border-red-200 bg-red-50'
              : summary.variancePercent > 0
                ? 'border-amber-200 bg-amber-50'
                : 'border-slate-200 bg-slate-50/50',
          )}
        >
          <p
            className={cn(
              'text-lg font-bold tabular-nums',
              summary.variancePercent < 0
                ? 'text-red-700'
                : summary.variancePercent > 0
                  ? 'text-amber-700'
                  : 'text-slate-800',
            )}
          >
            {summary.variancePercent > 0 ? '+' : ''}
            {summary.variancePercent}%
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Variance
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-center">
          <p className="text-lg font-bold tabular-nums text-slate-800">
            {summary.weeksRecorded}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Weeks
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-400" />
          <span className="text-xs text-slate-500">Planned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          <span className="text-xs text-slate-500">Actual</span>
        </div>
        <span className="text-xs text-slate-400">
          {period === 'weekly' ? 'Weekly' : 'Monthly'} view
        </span>
      </div>

      {/* Bar chart */}
      {chartData.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-10 text-center">
          <p className="text-sm text-slate-500">
            No support hours recorded yet
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {chartData.map((record) => {
            const planned = Number(record.plannedHours);
            const actual = Number(record.actualHours);
            const variance = actual - planned;
            const plannedPct = (planned / maxHours) * 100;
            const actualPct = (actual / maxHours) * 100;

            return (
              <div key={record.id} className="group">
                <div className="flex items-center gap-3">
                  <span className="w-14 shrink-0 text-right text-xs tabular-nums text-slate-400">
                    {formatWeek(record.weekStarting)}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    {/* Planned bar */}
                    <div className="flex h-3 items-center">
                      <div
                        className="h-full rounded-sm bg-blue-200 transition-all duration-300"
                        style={{ width: `${plannedPct}%` }}
                      />
                      <span className="ml-1 text-[10px] tabular-nums text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                        {planned}h
                      </span>
                    </div>
                    {/* Actual bar */}
                    <div className="flex h-3 items-center">
                      <div
                        className={cn(
                          'h-full rounded-sm transition-all duration-300',
                          variance < 0 ? 'bg-red-400' : 'bg-emerald-500',
                        )}
                        style={{ width: `${actualPct}%` }}
                      />
                      <span className="ml-1 text-[10px] tabular-nums text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
                        {actual}h
                      </span>
                    </div>
                  </div>
                  {/* Variance indicator */}
                  <span
                    className={cn(
                      'w-12 shrink-0 text-right text-[10px] font-medium tabular-nums',
                      variance < 0
                        ? 'text-red-600'
                        : variance > 0
                          ? 'text-emerald-600'
                          : 'text-slate-400',
                    )}
                  >
                    {variance > 0 ? '+' : ''}
                    {variance}h
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
