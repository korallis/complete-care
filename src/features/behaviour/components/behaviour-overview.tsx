'use client';

import { useState } from 'react';
import {
  OutcomesRadarChart,
  type AssessmentDataset,
} from './outcomes-radar-chart';
import {
  IncidentTrendChart,
  type TrendDataPoint,
} from './incident-trend-chart';
import { SEVERITY_COLOURS, type SeverityLevel } from '../lib/constants';

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span
        className="text-2xl font-semibold tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Severity badge
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize text-white"
      style={{ backgroundColor: SEVERITY_COLOURS[severity] }}
    >
      {severity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Demo data — in production these come from server actions / queries
// ---------------------------------------------------------------------------

const DEMO_ASSESSMENTS: AssessmentDataset[] = [
  {
    label: 'Baseline (Sep 2025)',
    scores: {
      physical: 4,
      emotional: 3,
      identity: 5,
      relationships: 3,
      social: 4,
      self_care: 6,
      education: 4,
    },
  },
  {
    label: 'Current (Mar 2026)',
    scores: {
      physical: 6,
      emotional: 5,
      identity: 6,
      relationships: 5,
      social: 6,
      self_care: 7,
      education: 6,
    },
  },
];

const DEMO_TRENDS: TrendDataPoint[] = [
  { period: 'Oct', counts: { verbal_aggression: 5, physical_aggression: 2, absconding: 1 } },
  { period: 'Nov', counts: { verbal_aggression: 4, physical_aggression: 1, self_harm: 1 } },
  { period: 'Dec', counts: { verbal_aggression: 3, physical_aggression: 1 } },
  { period: 'Jan', counts: { verbal_aggression: 2, absconding: 1 } },
  { period: 'Feb', counts: { verbal_aggression: 2, property_damage: 1 } },
  { period: 'Mar', counts: { verbal_aggression: 1 } },
];

interface RecentIncident {
  id: string;
  date: string;
  behaviourType: string;
  severity: SeverityLevel;
  summary: string;
}

const DEMO_RECENT_INCIDENTS: RecentIncident[] = [
  {
    id: '1',
    date: '2026-03-28',
    behaviourType: 'Verbal Aggression',
    severity: 'low',
    summary: 'Raised voice during homework time — resolved with calm redirection.',
  },
  {
    id: '2',
    date: '2026-03-15',
    behaviourType: 'Property Damage',
    severity: 'medium',
    summary: 'Threw plate in kitchen after disagreement with peer.',
  },
  {
    id: '3',
    date: '2026-02-22',
    behaviourType: 'Absconding',
    severity: 'high',
    summary: 'Left premises without permission — returned after 20 minutes.',
  },
];

interface PositiveEntry {
  id: string;
  date: string;
  description: string;
  points: number;
  category: string;
}

const DEMO_POSITIVES: PositiveEntry[] = [
  { id: '1', date: '2026-03-30', description: 'Helped younger resident with reading', points: 5, category: 'Kindness' },
  { id: '2', date: '2026-03-27', description: 'Completed maths homework independently', points: 3, category: 'Achievement' },
  { id: '3', date: '2026-03-25', description: 'Resolved conflict with peer calmly', points: 4, category: 'Resilience' },
  { id: '4', date: '2026-03-20', description: 'Volunteered to set the dinner table', points: 2, category: 'Cooperation' },
];

// ---------------------------------------------------------------------------
// Tab toggle
// ---------------------------------------------------------------------------

type TabKey = 'outcomes' | 'behaviour' | 'positives';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'outcomes', label: 'Outcomes & Progress' },
  { key: 'behaviour', label: 'Behaviour Incidents' },
  { key: 'positives', label: 'Positive Behaviour' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BehaviourOverview() {
  const [activeTab, setActiveTab] = useState<TabKey>('outcomes');

  const totalPoints = DEMO_POSITIVES.reduce((sum, p) => sum + p.points, 0);
  const totalIncidents = DEMO_TRENDS.reduce(
    (sum, d) =>
      sum + Object.values(d.counts).reduce((a, b) => a + (b ?? 0), 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Assessments" value={DEMO_ASSESSMENTS.length} />
        <StatCard label="Incidents (6 mo)" value={totalIncidents} accent="#ef4444" />
        <StatCard label="Positive Points" value={totalPoints} accent="#22c55e" />
        <StatCard
          label="Trend"
          value="Improving"
          accent="#6366f1"
        />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'outcomes' && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">
              Development Domains — Outcomes Star
            </h3>
            <p className="text-xs text-slate-400">
              Comparing baseline assessment against the most recent review across
              all seven development domains.
            </p>
          </div>
          <OutcomesRadarChart datasets={DEMO_ASSESSMENTS} />
        </div>
      )}

      {activeTab === 'behaviour' && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">
              Incident Frequency — Last 6 Months
            </h3>
            <p className="text-xs text-slate-400">
              Incidents grouped by type per month. A downward trend indicates
              effective intervention strategies.
            </p>
          </div>
          <IncidentTrendChart data={DEMO_TRENDS} />

          {/* Recent incidents table */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Recent Incidents
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                      Type
                    </th>
                    <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                      Severity
                    </th>
                    <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                      Summary
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_RECENT_INCIDENTS.map((inc) => (
                    <tr
                      key={inc.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {inc.date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700">
                        {inc.behaviourType}
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={inc.severity} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {inc.summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'positives' && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-700">
              Positive Behaviour Log
            </h3>
            <p className="text-xs text-slate-400">
              Recognising positive actions and awarding points to reinforce good
              behaviour.
            </p>
          </div>

          <div className="space-y-3">
            {DEMO_POSITIVES.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
              >
                {/* Points badge */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-600">
                  +{entry.points}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    {entry.description}
                  </p>
                  <div className="mt-1 flex gap-3 text-xs text-slate-400">
                    <span>{entry.date}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500">
                      {entry.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
