'use client';

/**
 * Weight trend chart — displays weight over time with optional BMI overlay.
 * Uses recharts for visualisation. VAL-CLIN-010.
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { WeightRecord } from '@/lib/db/schema/weight-wounds';

interface WeightTrendChartProps {
  records: WeightRecord[];
  showBmi?: boolean;
}

export function WeightTrendChart({ records, showBmi = true }: WeightTrendChartProps) {
  // Sort chronologically (oldest first for chart)
  const sorted = [...records].sort(
    (a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime(),
  );

  const data = sorted.map((r) => ({
    date: new Date(r.recordedDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
    weight: r.weightKg,
    bmi: r.bmi,
    fullDate: r.recordedDate,
  }));

  const hasBmiData = showBmi && data.some((d) => d.bmi !== null);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <p className="text-sm text-gray-500">No weight records yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Weight Trend</h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              yAxisId="weight"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              label={{
                value: 'kg',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: 12 },
              }}
            />
            {hasBmiData && (
              <YAxis
                yAxisId="bmi"
                orientation="right"
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                label={{
                  value: 'BMI',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 12 },
                }}
              />
            )}
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '13px',
              }}
            />
            <Legend />
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: '#2563eb' }}
              activeDot={{ r: 6 }}
              name="Weight (kg)"
            />
            {hasBmiData && (
              <>
                <Line
                  yAxisId="bmi"
                  type="monotone"
                  dataKey="bmi"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#8b5cf6' }}
                  name="BMI"
                />
                {/* BMI category reference lines */}
                <ReferenceLine
                  yAxisId="bmi"
                  y={18.5}
                  stroke="#3b82f6"
                  strokeDasharray="2 4"
                  label={{ value: '18.5', position: 'right', fontSize: 10 }}
                />
                <ReferenceLine
                  yAxisId="bmi"
                  y={25}
                  stroke="#f59e0b"
                  strokeDasharray="2 4"
                  label={{ value: '25', position: 'right', fontSize: 10 }}
                />
                <ReferenceLine
                  yAxisId="bmi"
                  y={30}
                  stroke="#ef4444"
                  strokeDasharray="2 4"
                  label={{ value: '30', position: 'right', fontSize: 10 }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
