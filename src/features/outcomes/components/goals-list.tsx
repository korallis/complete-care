'use client';

/**
 * Goals list — displays SMART goals with category badges and traffic-light status.
 */

import { cn } from '@/lib/utils';
import {
  GOAL_CATEGORY_LABELS,
  type GoalCategory,
} from '@/features/outcomes/schema';
import type { Goal } from '@/lib/db/schema/outcomes';

const categoryStyles: Record<GoalCategory, string> = {
  independent_living:
    'bg-blue-50 text-blue-700 border-blue-200',
  health_wellbeing:
    'bg-rose-50 text-rose-700 border-rose-200',
  social_community:
    'bg-violet-50 text-violet-700 border-violet-200',
  communication:
    'bg-cyan-50 text-cyan-700 border-cyan-200',
  emotional_wellbeing:
    'bg-teal-50 text-teal-700 border-teal-200',
};

const statusDot: Record<string, string> = {
  active: 'bg-emerald-500',
  completed: 'bg-blue-500',
  paused: 'bg-amber-500',
  cancelled: 'bg-slate-400',
};

interface GoalWithLatestReview extends Goal {
  latestReviewStatus?: 'red' | 'amber' | 'green' | null;
}

const trafficDot: Record<string, string> = {
  red: 'bg-red-500 shadow-red-200',
  amber: 'bg-amber-500 shadow-amber-200',
  green: 'bg-emerald-500 shadow-emerald-200',
};

export function GoalsList({
  goals,
  onSelect,
}: {
  goals: GoalWithLatestReview[];
  onSelect?: (goalId: string) => void;
}) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-12 text-center">
        <svg
          className="mb-3 h-10 w-10 text-slate-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
          />
        </svg>
        <p className="text-sm font-medium text-slate-500">No goals yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Create a SMART goal to start tracking outcomes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {goals.map((goal) => {
        const cat = goal.category as GoalCategory;
        return (
          <button
            key={goal.id}
            type="button"
            onClick={() => onSelect?.(goal.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left',
              'transition-all hover:border-slate-300 hover:shadow-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            {/* Traffic light dot */}
            <div className="flex flex-col items-center gap-1">
              {goal.latestReviewStatus ? (
                <span
                  className={cn(
                    'h-3.5 w-3.5 rounded-full shadow-sm',
                    trafficDot[goal.latestReviewStatus],
                  )}
                />
              ) : (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-slate-300" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate text-sm font-semibold text-slate-900">
                  {goal.title}
                </h4>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                    categoryStyles[cat],
                  )}
                >
                  {GOAL_CATEGORY_LABELS[cat]}
                </span>
              </div>
              {goal.description && (
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {goal.description}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  statusDot[goal.status] ?? 'bg-slate-300',
                )}
              />
              <span className="text-xs capitalize text-slate-500">
                {goal.status}
              </span>
            </div>

            {/* Chevron */}
            <svg
              className="h-4 w-4 shrink-0 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
