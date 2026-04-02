'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BEHAVIOUR_TYPE_LABELS,
  type BehaviourType,
} from '../lib/constants';

export interface TrendDataPoint {
  /** Label for the x-axis (e.g. "Jan 2026", "Week 12") */
  period: string;
  /** Counts keyed by behaviour type */
  counts: Partial<Record<BehaviourType, number>>;
}

interface IncidentTrendChartProps {
  data: TrendDataPoint[];
  height?: number;
}

const TYPE_COLOURS: Record<BehaviourType, string> = {
  verbal_aggression: '#6366f1',
  physical_aggression: '#ef4444',
  self_harm: '#f59e0b',
  absconding: '#14b8a6',
  property_damage: '#f97316',
  other: '#94a3b8',
};

/**
 * Stacked bar chart showing incident frequency by type over time.
 * Enables care staff to spot trends and correlate with interventions.
 */
export function IncidentTrendChart({
  data,
  height = 320,
}: IncidentTrendChartProps) {
  // Flatten for recharts
  const chartData = data.map((dp) => ({
    period: dp.period,
    ...dp.counts,
  }));

  // Determine which types actually appear in the data
  const activeTypes = new Set<BehaviourType>();
  data.forEach((dp) => {
    (Object.keys(dp.counts) as BehaviourType[]).forEach((t) => {
      if ((dp.counts[t] ?? 0) > 0) activeTypes.add(t);
    });
  });

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-400"
        style={{ height }}
      >
        No incident data for this period
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} barCategoryGap="20%">
          <CartesianGrid
            strokeDasharray="3 6"
            stroke="#e2e8f0"
            vertical={false}
          />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          {[...activeTypes].map((type) => (
            <Bar
              key={type}
              dataKey={type}
              name={BEHAVIOUR_TYPE_LABELS[type]}
              stackId="incidents"
              fill={TYPE_COLOURS[type]}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
