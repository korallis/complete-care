'use client';

/**
 * OfstedDashboard — Overview of the 9 Quality Standards with compliance scores.
 *
 * Displays a grid of standards with progress indicators, overall score,
 * and quick links to each standard's detail page.
 */

import Link from 'next/link';
import type { ComplianceDashboardData } from '@/features/ofsted/actions';
import {
  scoreToRag,
  scoreToLabel,
} from '@/features/ofsted/constants';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreBadge({ score }: { score: number }) {
  const rag = scoreToRag(score);
  const colours = {
    green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    red: 'text-red-700 bg-red-50 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colours[rag]}`}
    >
      {score}%
    </span>
  );
}

function ProgressBar({ score }: { score: number }) {
  const rag = scoreToRag(score);
  const colours = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  return (
    <div className="h-2 w-full rounded-full bg-[oklch(0.93_0.003_160)]">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${colours[rag]}`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: 'green' | 'amber' | 'red';
}) {
  const bg = {
    green: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
  };
  const text = {
    green: 'text-emerald-700',
    amber: 'text-amber-700',
    red: 'text-red-700',
  };

  return (
    <div className={`rounded-xl border p-4 ${bg[colour]}`}>
      <p className={`text-2xl font-bold ${text[colour]}`}>{value}</p>
      <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">{label}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface OfstedDashboardProps {
  data: ComplianceDashboardData;
  orgSlug: string;
}

export function OfstedDashboard({ data, orgSlug }: OfstedDashboardProps) {
  const { standards, overallScore, totalEvidenced, totalPartial, totalMissing } =
    data;

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-1 rounded-xl border border-[oklch(0.85_0.003_160)] bg-white p-4">
          <p className="text-sm text-[oklch(0.55_0_0)]">Overall Score</p>
          <p className="text-3xl font-bold text-[oklch(0.18_0.02_160)] mt-1">
            {overallScore}%
          </p>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            {scoreToLabel(overallScore)}
          </p>
          <ProgressBar score={overallScore} />
        </div>
        <SummaryCard
          label="Fully Evidenced"
          value={totalEvidenced}
          colour="green"
        />
        <SummaryCard
          label="Partially Evidenced"
          value={totalPartial}
          colour="amber"
        />
        <SummaryCard label="Missing Evidence" value={totalMissing} colour="red" />
      </div>

      {/* Standards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {standards.map((standard) => (
          <Link
            key={standard.id}
            href={`/${orgSlug}/ofsted/standards/${standard.id}`}
            className="group rounded-xl border border-[oklch(0.85_0.003_160)] bg-white p-5 hover:border-[oklch(0.70_0.05_160)] hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wider">
                  Regulation {standard.regulationNumber}
                </p>
                <h3 className="text-sm font-semibold text-[oklch(0.18_0.02_160)] mt-1 line-clamp-2 group-hover:text-[oklch(0.35_0.15_160)]">
                  {standard.standardName}
                </h3>
              </div>
              <ScoreBadge score={standard.score} />
            </div>

            <div className="mt-4">
              <ProgressBar score={standard.score} />
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-[oklch(0.55_0_0)]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {standard.evidenced}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {standard.partial}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {standard.missing}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
