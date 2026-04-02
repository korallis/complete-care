'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  DEVELOPMENT_DOMAINS,
  DOMAIN_LABELS,
  MAX_DOMAIN_SCORE,
  type DevelopmentDomain,
} from '../lib/constants';

/**
 * A single assessment dataset to render on the radar chart.
 * `label` is shown in the legend; `scores` maps each domain to a 1–10 value.
 */
export interface AssessmentDataset {
  label: string;
  scores: Partial<Record<DevelopmentDomain, number>>;
}

interface OutcomesRadarChartProps {
  /** One or more assessment snapshots (e.g. baseline + latest) */
  datasets: AssessmentDataset[];
  /** Chart height in px — defaults to 420 */
  height?: number;
}

/**
 * Colour palette — warm, muted tones that layer well on a light background.
 * Ordered so the first dataset (baseline) is the softest, and subsequent
 * datasets become progressively more vivid to draw the eye to current state.
 */
const PALETTE = [
  { stroke: '#94a3b8', fill: '#94a3b8' }, // slate-400 — baseline
  { stroke: '#6366f1', fill: '#6366f1' }, // indigo-500 — current
  { stroke: '#14b8a6', fill: '#14b8a6' }, // teal-500
  { stroke: '#f59e0b', fill: '#f59e0b' }, // amber-500
] as const;

/** Custom axis tick — renders the domain label outside the polygon */
function DomainTick(props: Record<string, unknown>) {
  const x = props.x as number | undefined;
  const y = props.y as number | undefined;
  const payload = props.payload as { value: string } | undefined;
  if (!payload) return null;
  const label =
    DOMAIN_LABELS[payload.value as DevelopmentDomain] ?? payload.value;

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-slate-600 text-[11px] font-medium tracking-wide"
      style={{ fontFamily: 'inherit' }}
    >
      {label}
    </text>
  );
}

/**
 * Outcomes Star / BERRI radar chart.
 *
 * Renders one polygon per dataset so care staff can visually compare a
 * young person's baseline scores against their latest assessment. Designed
 * for clarity at a glance — soft grid, muted fills, and clean labels.
 */
export function OutcomesRadarChart({
  datasets,
  height = 420,
}: OutcomesRadarChartProps) {
  // Build the recharts data array: one entry per domain
  const chartData = DEVELOPMENT_DOMAINS.map((domain) => {
    const entry: Record<string, string | number> = { domain };
    datasets.forEach((ds, i) => {
      entry[`ds_${i}`] = ds.scores[domain] ?? 0;
    });
    return entry;
  });

  if (datasets.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-400"
        style={{ height }}
      >
        No assessment data available
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="72%"
          data={chartData}
        >
          {/* Concentric grid rings — soft dotted lines */}
          <PolarGrid
            stroke="#e2e8f0"
            strokeDasharray="2 4"
            strokeWidth={1}
          />

          {/* Domain labels around the perimeter */}
          <PolarAngleAxis
            dataKey="domain"
            tick={DomainTick}
            tickLine={false}
          />

          {/* Radial scale 0–10 */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, MAX_DOMAIN_SCORE]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickCount={6}
            axisLine={false}
          />

          {/* One radar polygon per dataset */}
          {datasets.map((ds, i) => {
            const colour = PALETTE[i % PALETTE.length];
            return (
              <Radar
                key={ds.label}
                name={ds.label}
                dataKey={`ds_${i}`}
                stroke={colour.stroke}
                fill={colour.fill}
                fillOpacity={i === datasets.length - 1 ? 0.25 : 0.08}
                strokeWidth={i === datasets.length - 1 ? 2 : 1.5}
                dot={{
                  r: 3,
                  fill: colour.fill,
                  stroke: '#fff',
                  strokeWidth: 1.5,
                }}
              />
            );
          })}

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
            formatter={(value: unknown, name: unknown) => {
              // name is like "ds_0" — find the dataset label
              const nameStr = String(name);
              const idx = parseInt(nameStr.replace('ds_', ''), 10);
              const dsLabel = datasets[idx]?.label ?? nameStr;
              return [`${value} / ${MAX_DOMAIN_SCORE}`, dsLabel];
            }}
            labelFormatter={(label: unknown) => {
              const labelStr = String(label);
              return DOMAIN_LABELS[labelStr as DevelopmentDomain] ?? labelStr;
            }}
          />

          {datasets.length > 1 && (
            <Legend
              wrapperStyle={{
                fontSize: '12px',
                paddingTop: '12px',
              }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
