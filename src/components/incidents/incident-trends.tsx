'use client';

/**
 * IncidentTrends — simple statistics showing incidents by severity, location, and status.
 */

import type { IncidentTrends as TrendsData } from '@/features/incidents/actions';
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  LOCATION_LABELS,
} from '@/features/incidents/constants';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IncidentTrendsProps = {
  trends: TrendsData;
  periodLabel: string;
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center',
        className,
      )}
    >
      <p className="text-2xl font-bold text-[oklch(0.22_0.04_160)]">{value}</p>
      <p className="text-xs text-[oklch(0.55_0_0)] mt-1">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar chart (simple CSS-based)
// ---------------------------------------------------------------------------

function BarChart({
  data,
  labelMap,
  colorMap,
}: {
  data: Record<string, number>;
  labelMap: Record<string, string>;
  colorMap?: Record<string, string>;
}) {
  const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);

  if (entries.length === 0) {
    return (
      <p className="text-xs text-[oklch(0.65_0_0)] italic">No data</p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-[oklch(0.45_0.02_160)] w-24 truncate text-right">
            {labelMap[key] ?? key}
          </span>
          <div className="flex-1 h-5 bg-[oklch(0.96_0.003_160)] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                colorMap?.[key] ?? 'bg-[oklch(0.5_0.1_160)]',
              )}
              style={{ width: `${(value / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[oklch(0.45_0.02_160)] w-8 text-right">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-[oklch(0.7_0.08_160)]',
  moderate: 'bg-[oklch(0.65_0.1_75)]',
  serious: 'bg-[oklch(0.6_0.12_25)]',
  death: 'bg-red-500',
};

const STATUS_COLORS: Record<string, string> = {
  reported: 'bg-[oklch(0.6_0.12_25)]',
  under_review: 'bg-[oklch(0.65_0.1_75)]',
  investigating: 'bg-blue-500',
  resolved: 'bg-[oklch(0.5_0.1_160)]',
  closed: 'bg-[oklch(0.7_0_0)]',
};

export function IncidentTrends({ trends, periodLabel }: IncidentTrendsProps) {
  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total incidents" value={trends.totalIncidents} />
        <StatCard
          label="Serious / Death"
          value={(trends.bySeverity.serious ?? 0) + (trends.bySeverity.death ?? 0)}
          className={
            (trends.bySeverity.serious ?? 0) + (trends.bySeverity.death ?? 0) > 0
              ? 'border-red-200 bg-red-50'
              : undefined
          }
        />
        <StatCard
          label="Open"
          value={
            (trends.byStatus.reported ?? 0) +
            (trends.byStatus.under_review ?? 0) +
            (trends.byStatus.investigating ?? 0)
          }
        />
        <StatCard
          label="Resolved / Closed"
          value={(trends.byStatus.resolved ?? 0) + (trends.byStatus.closed ?? 0)}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By severity */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
            By severity
          </h3>
          <BarChart
            data={trends.bySeverity}
            labelMap={SEVERITY_LABELS}
            colorMap={SEVERITY_COLORS}
          />
        </div>

        {/* By status */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
            By status
          </h3>
          <BarChart
            data={trends.byStatus}
            labelMap={STATUS_LABELS}
            colorMap={STATUS_COLORS}
          />
        </div>

        {/* By location */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 md:col-span-2">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
            By location
          </h3>
          <BarChart
            data={trends.byLocation}
            labelMap={LOCATION_LABELS}
          />
        </div>
      </div>

      <p className="text-xs text-[oklch(0.65_0_0)] text-center">
        Showing data for {periodLabel}
      </p>
    </div>
  );
}
