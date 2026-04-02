'use client';

/**
 * SDQ Trend Chart — line chart showing SDQ subscale scores over time.
 * Uses recharts for visualisation.
 *
 * VAL-EDU-007: SDQ scoring with trend visualisation
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SdqDataPoint {
  date: string;
  emotional: number;
  conduct: number;
  hyperactivity: number;
  peer: number;
  prosocial: number;
  totalDifficulties: number;
}

interface SdqTrendChartProps {
  data: SdqDataPoint[];
}

const SUBSCALE_COLORS = {
  emotional: '#6366f1', // indigo
  conduct: '#ef4444', // red
  hyperactivity: '#f59e0b', // amber
  peer: '#3b82f6', // blue
  prosocial: '#10b981', // emerald
  totalDifficulties: '#1f2937', // grey-800
} as const;

const SUBSCALE_LABELS: Record<string, string> = {
  emotional: 'Emotional',
  conduct: 'Conduct',
  hyperactivity: 'Hyperactivity',
  peer: 'Peer Problems',
  prosocial: 'Prosocial',
  totalDifficulties: 'Total Difficulties',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

export function SdqTrendChart({ data }: SdqTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <p className="text-sm text-gray-500">
          No SDQ assessments recorded yet. Add an assessment to see trends.
        </p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-base font-semibold text-gray-900">
        SDQ Score Trends
      </h3>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={formatted} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            domain={[0, 40]}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              fontSize: '13px',
            }}
            formatter={(value, name) => [
              String(value),
              SUBSCALE_LABELS[String(name)] ?? String(name),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
            formatter={(value: string) => SUBSCALE_LABELS[value] ?? value}
          />

          <Line
            type="monotone"
            dataKey="totalDifficulties"
            stroke={SUBSCALE_COLORS.totalDifficulties}
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="emotional"
            stroke={SUBSCALE_COLORS.emotional}
            strokeWidth={1.5}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="conduct"
            stroke={SUBSCALE_COLORS.conduct}
            strokeWidth={1.5}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="hyperactivity"
            stroke={SUBSCALE_COLORS.hyperactivity}
            strokeWidth={1.5}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="peer"
            stroke={SUBSCALE_COLORS.peer}
            strokeWidth={1.5}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="prosocial"
            stroke={SUBSCALE_COLORS.prosocial}
            strokeWidth={1.5}
            strokeDasharray="5 3"
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Clinical threshold indicators */}
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
        <ThresholdBand label="Normal" range="0-13" color="bg-emerald-100 text-emerald-800" />
        <ThresholdBand label="Borderline" range="14-16" color="bg-amber-100 text-amber-800" />
        <ThresholdBand label="Abnormal" range="17-40" color="bg-red-100 text-red-800" />
      </div>
    </div>
  );
}

function ThresholdBand({
  label,
  range,
  color,
}: {
  label: string;
  range: string;
  color: string;
}) {
  return (
    <div className={`rounded-md px-3 py-1.5 text-center text-xs font-medium ${color}`}>
      {label}: {range}
    </div>
  );
}
