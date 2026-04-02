'use client';

/**
 * StatusChangeHistory — audit timeline of legal status changes
 * for a LAC record.
 */

import type { LacStatusChange } from '@/lib/db/schema/lac';
import {
  LAC_LEGAL_STATUS_LABELS,
  LAC_LEGAL_STATUS_SHORT_LABELS,
  type LacLegalStatus,
} from '@/features/lac/constants';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

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

function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Timeline item
// ---------------------------------------------------------------------------

type TimelineItemProps = {
  change: LacStatusChange;
  isFirst: boolean;
  isLast: boolean;
};

function TimelineItem({ change, isFirst, isLast }: TimelineItemProps) {
  const prevLabel =
    LAC_LEGAL_STATUS_SHORT_LABELS[change.previousStatus as LacLegalStatus] ??
    change.previousStatus;
  const newLabel =
    LAC_LEGAL_STATUS_SHORT_LABELS[change.newStatus as LacLegalStatus] ??
    change.newStatus;
  const newFullLabel =
    LAC_LEGAL_STATUS_LABELS[change.newStatus as LacLegalStatus] ??
    change.newStatus;

  return (
    <div className="relative flex gap-4">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full border-2 flex-shrink-0',
            isFirst
              ? 'border-[oklch(0.3_0.08_160)] bg-[oklch(0.3_0.08_160)] text-white'
              : 'border-[oklch(0.85_0.005_160)] bg-white text-[oklch(0.55_0_0)]',
          )}
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
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 bg-[oklch(0.88_0.005_160)]"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Content */}
      <div className={cn('pb-6', isLast && 'pb-0')}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center rounded-full border border-[oklch(0.85_0.005_160)] bg-[oklch(0.97_0.003_160)] px-2 py-0.5 text-xs text-[oklch(0.45_0.05_160)]">
            {prevLabel}
          </span>
          <svg
            className="h-3.5 w-3.5 text-[oklch(0.6_0_0)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {newLabel}
          </span>
        </div>

        <p className="mt-1 text-sm text-[oklch(0.22_0.04_160)]">
          Status changed to{' '}
          <span className="font-medium">{newFullLabel}</span>
        </p>

        {change.reason && (
          <p className="mt-1 text-sm text-[oklch(0.45_0.03_160)] italic">
            &ldquo;{change.reason}&rdquo;
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-2 text-xs text-[oklch(0.55_0_0)]">
          <span>{formatDate(change.changedDate)}</span>
          {change.changedByName && (
            <>
              <span aria-hidden="true">|</span>
              <span>by {change.changedByName}</span>
            </>
          )}
          <span aria-hidden="true">|</span>
          <span>Recorded {formatDateTime(change.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type StatusChangeHistoryProps = {
  changes: LacStatusChange[];
};

export function StatusChangeHistory({ changes }: StatusChangeHistoryProps) {
  if (changes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          No status changes recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
        Status change history
      </h3>
      <div className="space-y-0">
        {changes.map((change, index) => (
          <TimelineItem
            key={change.id}
            change={change}
            isFirst={index === 0}
            isLast={index === changes.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
