'use client';

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
  Cell,
} from 'recharts';
import { ANTECEDENT_CATEGORY_LABELS } from '../schema';
import type { AbcIncident } from '@/lib/db/schema/pbs';

interface AbcPatternAnalysisProps {
  incidents: AbcIncident[];
}

// Colour palette — deliberately chosen warm/cool tones for clear differentiation
const CHART_COLOURS = [
  '#0e7490', // cyan-700
  '#7c3aed', // violet-600
  '#dc2626', // red-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#db2777', // pink-600
  '#2563eb', // blue-600
  '#84cc16', // lime-500
  '#f97316', // orange-500
];

function getFrequencyOverTime(incidents: AbcIncident[]) {
  const byWeek = new Map<string, number>();
  for (const inc of incidents) {
    const d = new Date(inc.occurredAt);
    // ISO week start (Monday)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(d.setDate(diff));
    const key = weekStart.toISOString().slice(0, 10);
    byWeek.set(key, (byWeek.get(key) ?? 0) + 1);
  }
  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));
}

function getAntecedentDistribution(incidents: AbcIncident[]) {
  const counts = new Map<string, number>();
  for (const inc of incidents) {
    const cat = inc.antecedentCategory;
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category:
        ANTECEDENT_CATEGORY_LABELS[
          category as keyof typeof ANTECEDENT_CATEGORY_LABELS
        ] ?? category,
      count,
    }));
}

function getTimeOfDayDistribution(incidents: AbcIncident[]) {
  // 4-hour buckets
  const buckets = [
    { label: '00-04', min: 0, max: 3 },
    { label: '04-08', min: 4, max: 7 },
    { label: '08-12', min: 8, max: 11 },
    { label: '12-16', min: 12, max: 15 },
    { label: '16-20', min: 16, max: 19 },
    { label: '20-24', min: 20, max: 23 },
  ];
  const result = buckets.map((b) => ({ ...b, count: 0 }));
  for (const inc of incidents) {
    const hour = new Date(inc.occurredAt).getHours();
    const bucket = result.find((b) => hour >= b.min && hour <= b.max);
    if (bucket) bucket.count++;
  }
  return result.map(({ label, count }) => ({ timeSlot: label, count }));
}

function getSettingDistribution(incidents: AbcIncident[]) {
  const counts = new Map<string, number>();
  for (const inc of incidents) {
    const env = inc.settingEnvironment ?? 'Not recorded';
    counts.set(env, (counts.get(env) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([environment, count]) => ({ environment, count }));
}

export function AbcPatternAnalysis({ incidents }: AbcPatternAnalysisProps) {
  if (incidents.length < 5) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
          <svg className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700">
          {incidents.length} of 5 incidents recorded
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Pattern analysis becomes available once 5 or more ABC incidents have been
          recorded.
        </p>
        <div className="mt-4 h-1.5 w-48 mx-auto rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${(incidents.length / 5) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  const frequencyData = getFrequencyOverTime(incidents);
  const antecedentData = getAntecedentDistribution(incidents);
  const timeOfDayData = getTimeOfDayDistribution(incidents);
  const settingData = getSettingDistribution(incidents);

  const chartCardClass =
    'rounded-lg border border-slate-200 bg-white p-5 shadow-sm';

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-slate-900 p-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total Incidents
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {incidents.length}
          </p>
        </div>
        <div className="rounded-lg bg-cyan-700 p-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-cyan-200">
            Top Antecedent
          </p>
          <p className="mt-1 text-sm font-bold truncate">
            {antecedentData[0]?.category ?? '—'}
          </p>
        </div>
        <div className="rounded-lg bg-violet-700 p-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-200">
            Peak Time
          </p>
          <p className="mt-1 text-sm font-bold">
            {timeOfDayData.reduce((max, d) =>
              d.count > max.count ? d : max,
            ).timeSlot}
          </p>
        </div>
        <div className="rounded-lg bg-amber-600 p-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-200">
            Avg Intensity
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {(
              incidents.reduce((s, i) => s + i.behaviourIntensity, 0) /
              incidents.length
            ).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Frequency Over Time */}
      <div className={chartCardClass}>
        <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
          Frequency Over Time (Weekly)
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={frequencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v: string) => v.slice(5)}
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
                name="Incidents"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Antecedent Distribution */}
        <div className={chartCardClass}>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
            By Antecedent Category
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={antecedentData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={120}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]}>
                  {antecedentData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={CHART_COLOURS[idx % CHART_COLOURS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time of Day */}
        <div className={chartCardClass}>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
            By Time of Day
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeOfDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="timeSlot"
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
                  name="Incidents"
                  fill="#7c3aed"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Setting / Environment Distribution */}
      <div className={chartCardClass}>
        <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-600">
          By Setting / Environment
        </h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={settingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="environment"
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
                name="Incidents"
                fill="#059669"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
