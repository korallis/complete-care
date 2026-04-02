'use client';

/**
 * Goal review timeline — vertical timeline of traffic-light reviews for a goal.
 */

import { cn } from '@/lib/utils';
import { TRAFFIC_LIGHT_LABELS, type TrafficLightStatus } from '@/features/outcomes/schema';
import type { GoalReview } from '@/lib/db/schema/outcomes';

const dotColors: Record<string, string> = {
  red: 'bg-red-500 ring-red-100',
  amber: 'bg-amber-500 ring-amber-100',
  green: 'bg-emerald-500 ring-emerald-100',
};

const labelColors: Record<string, string> = {
  red: 'text-red-700 bg-red-50',
  amber: 'text-amber-700 bg-amber-50',
  green: 'text-emerald-700 bg-emerald-50',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function GoalReviewTimeline({
  reviews,
}: {
  reviews: GoalReview[];
}) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 py-8 text-center">
        <p className="text-sm text-slate-500">No reviews recorded yet</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-[17px] top-3 bottom-3 w-px bg-slate-200" />

      {reviews.map((review, idx) => {
        const status = review.status as TrafficLightStatus;
        return (
          <div key={review.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Dot */}
            <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center">
              <span
                className={cn(
                  'h-3.5 w-3.5 rounded-full ring-4',
                  dotColors[status] ?? 'bg-slate-400 ring-slate-100',
                )}
              />
            </div>

            {/* Content */}
            <div
              className={cn(
                'flex-1 rounded-lg border border-slate-200 bg-white p-3.5',
                idx === 0 && 'shadow-sm',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold',
                    labelColors[status] ?? 'text-slate-600 bg-slate-50',
                  )}
                >
                  {TRAFFIC_LIGHT_LABELS[status] ?? status}
                </span>
                <time className="text-xs text-slate-400">
                  {formatDate(review.reviewDate)}
                </time>
              </div>

              {review.currentValue && (
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    Measured value:
                  </span>{' '}
                  {review.currentValue}
                </p>
              )}

              {review.notes && (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {review.notes}
                </p>
              )}

              {review.evidence && (
                <div className="mt-2 rounded-md bg-slate-50 p-2">
                  <p className="text-xs font-medium text-slate-500">Evidence</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {review.evidence}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
