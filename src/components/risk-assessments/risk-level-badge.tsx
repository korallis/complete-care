/**
 * RiskLevelBadge — displays the risk level with appropriate colour coding.
 * Also includes a ReviewStatusBadge for overdue/due-soon indicators.
 */

import { cn } from '@/lib/utils';
import { RISK_LEVEL_LABELS } from '@/features/risk-assessments/scoring';
import { isReviewOverdue, isReviewDueSoon } from '@/features/risk-assessments/schema';
import type { RiskLevel } from '@/lib/db/schema/risk-assessments';

// ---------------------------------------------------------------------------
// Risk level badge
// ---------------------------------------------------------------------------

type RiskLevelBadgeProps = {
  riskLevel: string;
  className?: string;
};

const RISK_LEVEL_STYLES: Record<string, string> = {
  low: 'bg-[oklch(0.95_0.03_160)] text-[oklch(0.3_0.08_160)] border-[oklch(0.85_0.05_160)]',
  medium:
    'bg-[oklch(0.97_0.01_75)] text-[oklch(0.45_0.1_75)] border-[oklch(0.88_0.04_75)]',
  high: 'bg-[oklch(0.95_0.03_25)] text-[oklch(0.4_0.12_25)] border-[oklch(0.85_0.06_25)]',
  critical:
    'bg-red-50 text-red-700 border-red-200',
};

export function RiskLevelBadge({ riskLevel, className }: RiskLevelBadgeProps) {
  const styles = RISK_LEVEL_STYLES[riskLevel] ?? RISK_LEVEL_STYLES.low;
  const label =
    RISK_LEVEL_LABELS[riskLevel as RiskLevel] ?? riskLevel;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles,
        className,
      )}
      role="status"
      aria-label={`Risk level: ${label}`}
    >
      {riskLevel === 'high' || riskLevel === 'critical' ? (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            riskLevel === 'critical' ? 'bg-red-500' : 'bg-[oklch(0.5_0.15_25)]',
          )}
          aria-hidden="true"
        />
      ) : null}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Assessment status badge
// ---------------------------------------------------------------------------

type AssessmentStatusBadgeProps = {
  status: string;
  className?: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft:
    'bg-[oklch(0.97_0.005_0)] text-[oklch(0.4_0.08_20)] border-[oklch(0.88_0.02_20)]',
  completed:
    'bg-[oklch(0.95_0.02_160)] text-[oklch(0.3_0.08_160)] border-[oklch(0.85_0.04_160)]',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  completed: 'Completed',
};

export function AssessmentStatusBadge({
  status,
  className,
}: AssessmentStatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  const label = STATUS_LABELS[status] ?? status;

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
  reviewDate: string | null | undefined;
  className?: string;
};

export function ReviewStatusBadge({
  reviewDate,
  className,
}: ReviewStatusBadgeProps) {
  if (!reviewDate) return null;

  const overdue = isReviewOverdue(reviewDate);
  const dueSoon = isReviewDueSoon(reviewDate);

  if (overdue) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700',
          className,
        )}
        role="status"
        aria-label={`Review overdue since ${reviewDate}`}
      >
        <span
          className="h-1.5 w-1.5 rounded-full bg-red-500"
          aria-hidden="true"
        />
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
        aria-label={`Review due on ${reviewDate}`}
      >
        <span
          className="h-1.5 w-1.5 rounded-full bg-amber-500"
          aria-hidden="true"
        />
        Due soon
      </span>
    );
  }

  return null;
}
