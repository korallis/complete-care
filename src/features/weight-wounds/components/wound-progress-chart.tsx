'use client';

/**
 * Wound progress chart — visualises wound healing trend over time.
 * Shows wound area (L x W) and depth over assessments. VAL-CLIN-013.
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import type { WoundAssessment } from '@/lib/db/schema/weight-wounds';

interface WoundProgressChartProps {
  assessments: WoundAssessment[];
}

export function WoundProgressChart({ assessments }: WoundProgressChartProps) {
  // Sort chronologically
  const sorted = [...assessments].sort(
    (a, b) =>
      new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime(),
  );

  const data = sorted.map((a) => ({
    date: new Date(a.assessmentDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
    area:
      a.lengthCm && a.widthCm
        ? Math.round(a.lengthCm * a.widthCm * 10) / 10
        : null,
    depth: a.depthCm,
    painLevel: a.painLevel,
    fullDate: a.assessmentDate,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
        <p className="text-sm text-gray-500">No assessments recorded yet</p>
      </div>
    );
  }

  const hasArea = data.some((d) => d.area !== null);
  const hasDepth = data.some((d) => d.depth !== null);

  return (
    <div className="space-y-4">
      {/* Wound area trend */}
      {hasArea && (
        <div>
          <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
            Wound Area (cm2)
          </h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="area"
                  stroke="#f97316"
                  fill="#fed7aa"
                  strokeWidth={2}
                  name="Area (cm2)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Depth trend */}
      {hasDepth && (
        <div>
          <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
            Wound Depth (cm)
          </h4>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="depth"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Depth (cm)"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="painLevel"
                  stroke="#8b5cf6"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={{ r: 2 }}
                  name="Pain (0-10)"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
