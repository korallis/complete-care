'use client';

/**
 * CarePlanList — displays a list of care plans for a person.
 * Shows status, version, review date, and quick actions.
 */

import Link from 'next/link';
import { CarePlanStatusBadge, ReviewStatusBadge } from './care-plan-status-badge';
import type { CarePlanListItem } from '@/features/care-plans/actions';
import { REVIEW_FREQUENCY_LABELS } from '@/features/care-plans/utils';
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
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// CarePlanListItem card
// ---------------------------------------------------------------------------

type CarePlanCardProps = {
  plan: CarePlanListItem;
  orgSlug: string;
  personId: string;
};

function CarePlanCard({ plan, orgSlug, personId }: CarePlanCardProps) {
  const href = `/${orgSlug}/persons/${personId}/care-plans/${plan.id}`;

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.6_0.06_160)] hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
      aria-label={`Open care plan: ${plan.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] group-hover:text-[oklch(0.3_0.08_160)] transition-colors truncate max-w-sm">
              {plan.title}
            </h3>
            <span className="text-xs text-[oklch(0.65_0_0)] font-mono flex-shrink-0">
              v{plan.version}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <CarePlanStatusBadge status={plan.status} />
            <ReviewStatusBadge nextReviewDate={plan.nextReviewDate} />
          </div>

          <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-[oklch(0.55_0_0)]">
            {plan.reviewFrequency && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {REVIEW_FREQUENCY_LABELS[plan.reviewFrequency] ?? plan.reviewFrequency} review
              </span>
            )}
            {plan.nextReviewDate && (
              <span className={cn(
                'flex items-center gap-1',
                plan.nextReviewDate < new Date().toISOString().slice(0, 10)
                  ? 'text-red-600 font-medium'
                  : '',
              )}>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Review: {formatDate(plan.nextReviewDate)}
              </span>
            )}
            {plan.approvedAt && (
              <span className="flex items-center gap-1 text-[oklch(0.35_0.06_160)]">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approved {formatRelativeDate(plan.approvedAt)}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-[oklch(0.95_0.003_160)] flex items-center justify-between text-xs text-[oklch(0.65_0_0)]">
        <span>Last updated {formatRelativeDate(plan.updatedAt)}</span>
        {plan.template && (
          <span className="capitalize">
            {plan.template.replace(/_/g, ' ')} template
          </span>
        )}
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
        <svg className="h-6 w-6 text-[oklch(0.45_0.07_160)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
        No care plans yet
      </h3>
      <p className="text-sm text-[oklch(0.55_0_0)] mb-5">
        Create a care plan from a template or start with a blank plan.
      </p>
      {canCreate && (
        <Link
          href={`/${orgSlug}/persons/${personId}/care-plans/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create care plan
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type CarePlanListProps = {
  carePlans: CarePlanListItem[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
  totalCount: number;
};

export function CarePlanList({
  carePlans,
  orgSlug,
  personId,
  canCreate,
  totalCount,
}: CarePlanListProps) {
  if (carePlans.length === 0) {
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
          {totalCount} care plan{totalCount !== 1 ? 's' : ''}
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/care-plans/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New care plan
          </Link>
        )}
      </div>

      {/* List */}
      <ul className="space-y-3" role="list" aria-label="Care plans">
        {carePlans.map((plan) => (
          <li key={plan.id}>
            <CarePlanCard plan={plan} orgSlug={orgSlug} personId={personId} />
          </li>
        ))}
      </ul>
    </div>
  );
}
