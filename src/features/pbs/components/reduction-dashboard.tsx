'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PERIOD_OPTIONS } from '../schema';

interface PeriodCount {
  period: string;
  count: number;
}

interface ReductionDashboardProps {
  /** Aggregated counts per period from the server */
  data: PeriodCount[];
  /** Current period selection */
  period: 'weekly' | 'monthly' | 'quarterly';
  onPeriodChange: (period: 'weekly' | 'monthly' | 'quarterly') => void;
  /** The reduction plan text from the active PBS plan */
  reductionPlan?: string | null;
}

function computeTrend(data: PeriodCount[]): 'increase' | 'stable' | 'decrease' {
  if (data.length < 2) return 'stable';
  const recent = data.slice(-3);
  if (recent.length < 2) return 'stable';
  const first = recent[0].count;
  const last = recent[recent.length - 1].count;
  const diff = last - first;
  if (diff > 0) return 'increase';
  if (diff < 0) return 'decrease';
  return 'stable';
}

const trendConfig = {
  increase: {
    label: 'Increasing',
    colour: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: (
      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  stable: {
    label: 'Stable',
    colour: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: (
      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
  },
  decrease: {
    label: 'Decreasing',
    colour: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: (
      <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
  },
};

function formatPeriodLabel(raw: string, period: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  if (period === 'weekly') {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }
  if (period === 'monthly') {
    return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
  }
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
}

export function ReductionDashboard({
  data,
  period,
  onPeriodChange,
  reductionPlan,
}: ReductionDashboardProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const trend = computeTrend(data);
  const tc = trendConfig[trend];

  const chartData = data.map((d) => ({
    ...d,
    label: formatPeriodLabel(d.period, period),
  }));

  const totalPractices = data.reduce((s, d) => s + d.count, 0);
  const periodLabel =
    period === 'weekly'
      ? 'weeks'
      : period === 'monthly'
        ? 'months'
        : 'quarters';

  return (
    <div className="space-y-6">
      {/* Top summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Practices ({data.length} {periodLabel})
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {totalPractices}
          </p>
        </div>
        <div className={`rounded-lg border p-5 shadow-sm ${tc.bg}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Trend
          </p>
          <div className="mt-2 flex items-center gap-2">
            {tc.icon}
            <span className={`text-lg font-bold ${tc.colour}`}>
              {tc.label}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Average / Period
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {data.length ? (totalPractices / data.length).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
                period === p
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
          <button
            onClick={() => setChartType('bar')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              chartType === 'bar'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              chartType === 'line'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Line
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
          Restrictive Practices Count — {period}
        </h4>
        {data.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            No data available for the selected period.
          </p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Practices"
                    fill="#0e7490"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0e7490"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0e7490' }}
                    name="Practices"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Reduction Plan */}
      {reductionPlan && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-emerald-800">
            Reduction Plan
          </h4>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
            {reductionPlan}
          </p>
        </div>
      )}
    </div>
  );
}
