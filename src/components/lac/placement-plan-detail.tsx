'use client';

import Link from 'next/link';
import type { PlacementPlan } from '@/lib/db/schema/lac';
import {
  PLACEMENT_PLAN_STATUS_COLOURS,
  PLACEMENT_PLAN_STATUS_LABELS,
  type PlacementPlanStatus,
  isPlacementPlanOverdue,
} from '@/features/lac/constants';
import { cn } from '@/lib/utils';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Not recorded';

  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status: string }) {
  const castStatus = status as PlacementPlanStatus;
  const colours =
    PLACEMENT_PLAN_STATUS_COLOURS[castStatus] ??
    'text-gray-700 bg-gray-50 border-gray-200';
  const label = PLACEMENT_PLAN_STATUS_LABELS[castStatus] ?? status;

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

type PlacementPlanDetailProps = {
  plan: PlacementPlan;
  orgSlug: string;
  personId: string;
  canEdit: boolean;
};

const CONTENT_SECTIONS = [
  ['objectives', 'Objectives'],
  ['arrangements', 'Placement arrangements'],
  ['educationPlan', 'Education plan'],
  ['healthPlan', 'Health plan'],
  ['contactArrangements', 'Contact arrangements'],
  ['notes', 'Additional notes'],
] as const;

export function PlacementPlanDetail({
  plan,
  orgSlug,
  personId,
  canEdit,
}: PlacementPlanDetailProps) {
  const content = (plan.content ?? {}) as Record<string, string | undefined>;
  const overdue = isPlacementPlanOverdue(plan.dueDate, plan.completedDate);
  const displayStatus = overdue ? 'overdue' : plan.status;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold text-[oklch(0.22_0.04_160)]">
                Placement Plan
              </h1>
              <StatusBadge status={displayStatus} />
            </div>
            <p className="text-sm text-[oklch(0.55_0_0)]">
              Due {formatDate(plan.dueDate)}
              {overdue ? ' · overdue' : ''}
            </p>
          </div>

          {canEdit && (
            <Link
              href={`/${orgSlug}/persons/${personId}/lac/placement-plans/${plan.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              Edit plan
            </Link>
          )}
        </div>

        <dl className="mt-4 pt-4 border-t border-[oklch(0.95_0.003_160)] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Due date
            </dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {formatDate(plan.dueDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Review date
            </dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {formatDate(plan.reviewDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Completed
            </dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {formatDate(plan.completedDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Last updated
            </dt>
            <dd className="mt-0.5 text-sm text-[oklch(0.22_0.04_160)]">
              {formatDate(plan.updatedAt.toISOString())}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-4">
        {CONTENT_SECTIONS.map(([key, label]) => (
          <section
            key={key}
            className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5"
          >
            <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
              {label}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[oklch(0.22_0.04_160)]">
              {content[key] || 'Not recorded yet.'}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
