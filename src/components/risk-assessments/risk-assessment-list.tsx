'use client';

/**
 * RiskAssessmentList — displays a list of risk assessments for a person.
 * Shows template name, risk level, version, review date, and status.
 */

import Link from 'next/link';
import { RiskLevelBadge, AssessmentStatusBadge, ReviewStatusBadge } from './risk-level-badge';
import { TEMPLATE_LABELS } from '@/features/risk-assessments/templates';
import type { RiskAssessmentTemplateId } from '@/features/risk-assessments/templates';
import type { RiskAssessmentListItem } from '@/features/risk-assessments/actions';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Date formatters
// ---------------------------------------------------------------------------

function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Assessment card
// ---------------------------------------------------------------------------

type AssessmentCardProps = {
  assessment: RiskAssessmentListItem;
  orgSlug: string;
  personId: string;
};

function AssessmentCard({ assessment, orgSlug, personId }: AssessmentCardProps) {
  const href = `/${orgSlug}/persons/${personId}/risk-assessments/${assessment.id}`;
  const templateLabel =
    TEMPLATE_LABELS[assessment.templateId as RiskAssessmentTemplateId] ??
    assessment.templateId;

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.6_0.06_160)] hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
      aria-label={`Open ${templateLabel} assessment`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] group-hover:text-[oklch(0.3_0.08_160)] transition-colors truncate max-w-sm">
              {templateLabel}
            </h3>
            <span className="text-xs text-[oklch(0.65_0_0)] font-mono flex-shrink-0">
              v{assessment.version}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <AssessmentStatusBadge status={assessment.status} />
            {assessment.status === 'completed' && (
              <RiskLevelBadge riskLevel={assessment.riskLevel} />
            )}
            <ReviewStatusBadge reviewDate={assessment.reviewDate} />
          </div>

          <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-[oklch(0.55_0_0)]">
            {assessment.status === 'completed' && (
              <span className="flex items-center gap-1">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Score: {assessment.totalScore}
              </span>
            )}
            {assessment.reviewDate && (
              <span
                className={cn(
                  'flex items-center gap-1',
                  assessment.reviewDate <
                    new Date().toISOString().slice(0, 10)
                    ? 'text-red-600 font-medium'
                    : '',
                )}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Review: {formatDate(assessment.reviewDate)}
              </span>
            )}
            {assessment.completedByName && (
              <span className="flex items-center gap-1">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {assessment.completedByName}
              </span>
            )}
          </div>
        </div>

        {/* Right: arrow */}
        <div className="flex-shrink-0 self-center">
          <svg
            className="h-4 w-4 text-[oklch(0.75_0_0)] group-hover:text-[oklch(0.35_0.06_160)] transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-[oklch(0.95_0.003_160)] flex items-center justify-between text-xs text-[oklch(0.65_0_0)]">
        <span>
          {assessment.completedAt
            ? `Completed ${formatRelativeDate(assessment.completedAt)}`
            : `Created ${formatRelativeDate(assessment.createdAt)}`}
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

type EmptyStateProps = {
  orgSlug: string;
  personId: string;
  canCreate: boolean;
};

function EmptyState({ orgSlug, personId, canCreate }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
        <svg
          className="h-6 w-6 text-[oklch(0.45_0.07_160)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
        No risk assessments yet
      </h3>
      <p className="text-sm text-[oklch(0.55_0_0)] mb-5">
        Create a risk assessment to evaluate and track clinical risks.
      </p>
      {canCreate && (
        <Link
          href={`/${orgSlug}/persons/${personId}/risk-assessments/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New assessment
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type RiskAssessmentListProps = {
  assessments: RiskAssessmentListItem[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
  totalCount: number;
};

export function RiskAssessmentList({
  assessments,
  orgSlug,
  personId,
  canCreate,
  totalCount,
}: RiskAssessmentListProps) {
  if (assessments.length === 0) {
    return (
      <EmptyState
        orgSlug={orgSlug}
        personId={personId}
        canCreate={canCreate}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          {totalCount} assessment{totalCount !== 1 ? 's' : ''}
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/risk-assessments/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New assessment
          </Link>
        )}
      </div>

      {/* List */}
      <ul className="space-y-3" role="list" aria-label="Risk assessments">
        {assessments.map((a) => (
          <li key={a.id}>
            <AssessmentCard
              assessment={a}
              orgSlug={orgSlug}
              personId={personId}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
