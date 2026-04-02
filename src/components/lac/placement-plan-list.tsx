'use client';

/**
 * PlacementPlanList — displays placement plans for a child
 * with overdue indicators and status badges.
 */

import Link from 'next/link';
import type { PlacementPlan } from '@/lib/db/schema/lac';
import {
  PLACEMENT_PLAN_STATUS_LABELS,
  PLACEMENT_PLAN_STATUS_COLOURS,
  type PlacementPlanStatus,
  isPlacementPlanOverdue,
} from '@/features/lac/constants';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Date formatters
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
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

function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const s = status as PlacementPlanStatus;
  const colours =
    PLACEMENT_PLAN_STATUS_COLOURS[s] ??
    'text-gray-700 bg-gray-50 border-gray-200';
  const label = PLACEMENT_PLAN_STATUS_LABELS[s] ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        colours,
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Plan card
// ---------------------------------------------------------------------------

type PlanCardProps = {
  plan: PlacementPlan;
  orgSlug: string;
  personId: string;
};

function PlanCard({ plan, orgSlug, personId }: PlanCardProps) {
  const overdue = isPlacementPlanOverdue(plan.dueDate, plan.completedDate);
  const displayStatus = overdue ? 'overdue' : plan.status;

  return (
    <Link
      href={`/${orgSlug}/persons/${personId}/lac/placement-plans/${plan.id}`}
      className="group block rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.6_0.06_160)] hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
      aria-label={`Open placement plan due ${formatDate(plan.dueDate)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] group-hover:text-[oklch(0.3_0.08_160)] transition-colors">
              Placement Plan
            </h3>
            <StatusBadge status={displayStatus} />
          </div>

          <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-[oklch(0.55_0_0)]">
            <span
              className={cn(
                'flex items-center gap-1',
                overdue ? 'text-red-600 font-medium' : '',
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
              Due: {formatDate(plan.dueDate)}
            </span>
            {plan.completedDate && (
              <span className="flex items-center gap-1 text-[oklch(0.35_0.06_160)]">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Completed: {formatDate(plan.completedDate)}
              </span>
            )}
            {plan.reviewDate && (
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Review: {formatDate(plan.reviewDate)}
              </span>
            )}
          </div>
        </div>

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

      <div className="mt-3 pt-3 border-t border-[oklch(0.95_0.003_160)] text-xs text-[oklch(0.65_0_0)]">
        Last updated {formatRelativeDate(plan.updatedAt)}
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
        No placement plans yet
      </h3>
      <p className="text-sm text-[oklch(0.55_0_0)] mb-5">
        Placement plans are required within 5 working days of admission.
      </p>
      {canCreate && (
        <Link
          href={`/${orgSlug}/persons/${personId}/lac/placement-plans/new`}
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
          Create placement plan
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type PlacementPlanListProps = {
  plans: PlacementPlan[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
};

export function PlacementPlanList({
  plans,
  orgSlug,
  personId,
  canCreate,
}: PlacementPlanListProps) {
  if (plans.length === 0) {
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
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          {plans.length} placement plan{plans.length !== 1 ? 's' : ''}
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/lac/placement-plans/new`}
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
            New placement plan
          </Link>
        )}
      </div>

      <ul className="space-y-3" role="list" aria-label="Placement plans">
        {plans.map((plan) => (
          <li key={plan.id}>
            <PlanCard plan={plan} orgSlug={orgSlug} personId={personId} />
          </li>
        ))}
      </ul>
    </div>
  );
}
