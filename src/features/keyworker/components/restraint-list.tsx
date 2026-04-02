'use client';

/**
 * RestraintList — displays restraint records for a child.
 */

import Link from 'next/link';
import type { Restraint } from '@/lib/db/schema';
import {
  RESTRAINT_TECHNIQUE_LABELS,
  type RestraintTechnique,
} from '../constants';

type RestraintListProps = {
  restraints: Restraint[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RestraintCard({ restraint }: { restraint: Restraint }) {
  const techniqueLabel =
    RESTRAINT_TECHNIQUE_LABELS[restraint.technique as RestraintTechnique] ??
    restraint.technique;

  const hasDebrief = restraint.childDebrief || restraint.staffDebrief;
  const hasReview = !!restraint.managementReview;
  const injuryCheck = restraint.injuryCheck as {
    childInjured?: boolean;
    staffInjured?: boolean;
    medicalAttentionRequired?: boolean;
  } | null;
  const anyInjury = injuryCheck?.childInjured || injuryCheck?.staffInjured;
  const medicalRequired = injuryCheck?.medicalAttentionRequired;

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              anyInjury ? 'bg-red-50' : 'bg-orange-50'
            }`}
          >
            <svg
              className={`h-4 w-4 ${anyInjury ? 'text-red-600' : 'text-orange-600'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                {techniqueLabel}
              </span>
              <span className="text-xs text-[oklch(0.65_0_0)]">
                {formatDateTime(restraint.dateTime)}
              </span>
            </div>
            <p className="text-sm text-[oklch(0.45_0.02_160)] line-clamp-2 mb-3">
              {restraint.reason}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {restraint.duration} min
              </span>
              {anyInjury && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Injury
                </span>
              )}
              {medicalRequired && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Medical attention
                </span>
              )}
              {hasDebrief ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Debrief done
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Debrief needed
                </span>
              )}
              {hasReview && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Reviewed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RestraintList({
  restraints,
  orgSlug,
  personId,
  canCreate,
}: RestraintListProps) {
  if (restraints.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
          <svg
            className="h-5 w-5 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          No restraints recorded
        </h3>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-4">
          No physical interventions have been recorded for this child.
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/keyworker/restraints/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Record restraint
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {restraints.map((r) => (
        <RestraintCard key={r.id} restraint={r} />
      ))}
    </div>
  );
}
