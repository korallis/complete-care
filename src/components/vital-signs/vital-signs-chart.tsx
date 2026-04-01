'use client';

/**
 * VitalSignsChart — displays recent vital sign readings with NEWS2 trend.
 * Uses a simple table-based chart for server-rendered compatibility.
 */

import type { VitalTrendPoint } from '@/features/vital-signs/actions';

type VitalSignsChartProps = {
  data: VitalTrendPoint[];
};

function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDate(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function News2Bar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-[oklch(0.7_0_0)]">--</span>;

  const maxScore = 20;
  const widthPercent = Math.min((score / maxScore) * 100, 100);

  let barColor = 'bg-emerald-500';
  if (score >= 7) barColor = 'bg-purple-600';
  else if (score >= 5) barColor = 'bg-red-500';
  else if (score >= 1) barColor = 'bg-amber-500';

  return (
    <div className="flex items-center gap-2">
      <div className="h-3 w-20 rounded-full bg-[oklch(0.95_0_0)] overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <span className="text-xs font-medium text-[oklch(0.35_0.04_160)] tabular-nums">
        {score}
      </span>
    </div>
  );
}

export function VitalSignsChart({ data }: VitalSignsChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-6 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          No vital sign data available for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-[oklch(0.95_0.005_160)]">
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          Vital Signs Trend
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[oklch(0.95_0.005_160)] bg-[oklch(0.985_0.005_160)]">
              <th className="px-3 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                Date/Time
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-[oklch(0.55_0_0)]">
                Temp
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-[oklch(0.55_0_0)]">
                BP
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-[oklch(0.55_0_0)]">
                Pulse
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-[oklch(0.55_0_0)]">
                RR
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-[oklch(0.55_0_0)]">
                SpO2
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                NEWS2
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((point, i) => {
              const d =
                point.recordedAt instanceof Date
                  ? point.recordedAt
                  : new Date(point.recordedAt);
              return (
                <tr
                  key={i}
                  className="border-b border-[oklch(0.95_0.005_160)] last:border-0"
                >
                  <td className="px-3 py-2 text-xs text-[oklch(0.4_0.02_160)] whitespace-nowrap">
                    <span className="font-medium">{formatDate(d)}</span>{' '}
                    <span className="text-[oklch(0.6_0_0)]">{formatTime(d)}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-[oklch(0.35_0.04_160)]">
                    {point.temperature?.toFixed(1) ?? '--'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-[oklch(0.35_0.04_160)]">
                    {point.systolicBp != null && point.diastolicBp != null
                      ? `${point.systolicBp}/${point.diastolicBp}`
                      : point.systolicBp ?? '--'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-[oklch(0.35_0.04_160)]">
                    {point.pulseRate ?? '--'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-[oklch(0.35_0.04_160)]">
                    {point.respiratoryRate ?? '--'}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-[oklch(0.35_0.04_160)]">
                    {point.spo2 != null ? `${point.spo2}%` : '--'}
                  </td>
                  <td className="px-3 py-2">
                    <News2Bar score={point.news2Score} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
