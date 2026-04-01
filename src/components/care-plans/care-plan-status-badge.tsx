/**
 * CarePlanStatusBadge — displays the approval status and review status
 * of a care plan with appropriate colour coding.
 */

import { cn } from '@/lib/utils';
import { APPROVAL_STATUS_LABELS } from '@/features/care-plans/utils';
import { isReviewOverdue, isReviewDueSoon } from '@/features/care-plans/schema';

// ---------------------------------------------------------------------------
// Approval status badge
// ---------------------------------------------------------------------------

type ApprovalStatusBadgeProps = {
  status: string;
  className?: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft:
    'bg-[oklch(0.97_0.005_0)] text-[oklch(0.4_0.08_20)] border-[oklch(0.88_0.02_20)]',
  review:
    'bg-[oklch(0.97_0.01_75)] text-[oklch(0.45_0.1_75)] border-[oklch(0.88_0.04_75)]',
  approved:
    'bg-[oklch(0.95_0.02_160)] text-[oklch(0.3_0.08_160)] border-[oklch(0.85_0.04_160)]',
  archived:
    'bg-[oklch(0.97_0_0)] text-[oklch(0.55_0_0)] border-[oklch(0.88_0_0)]',
};

export function CarePlanStatusBadge({ status, className }: ApprovalStatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const label = APPROVAL_STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Review status badge
// ---------------------------------------------------------------------------

type ReviewStatusBadgeProps = {
  nextReviewDate: string | null | undefined;
  className?: string;
};

export function ReviewStatusBadge({ nextReviewDate, className }: ReviewStatusBadgeProps) {
  if (!nextReviewDate) return null;

  const overdue = isReviewOverdue(nextReviewDate);
  const dueSoon = isReviewDueSoon(nextReviewDate);

  if (overdue) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700',
          className,
        )}
        role="status"
        aria-label={`Review overdue since ${nextReviewDate}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
        Overdue
      </span>
    );
  }

  if (dueSoon) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700',
          className,
        )}
        role="status"
        aria-label={`Review due on ${nextReviewDate}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        Due soon
      </span>
    );
  }

  return null;
}
