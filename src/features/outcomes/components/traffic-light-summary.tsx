'use client';

/**
 * Traffic-light summary cards — aggregate red/amber/green distribution
 * for a person's active goals.
 */

import { cn } from '@/lib/utils';

export interface TrafficLightData {
  red: number;
  amber: number;
  green: number;
  unreviewed: number;
}

const indicators = [
  {
    key: 'green' as const,
    label: 'Progressing',
    color: 'bg-emerald-500',
    bgCard: 'bg-emerald-50 border-emerald-200',
    textColor: 'text-emerald-700',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    key: 'amber' as const,
    label: 'Maintaining',
    color: 'bg-amber-500',
    bgCard: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-700',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    key: 'red' as const,
    label: 'Regression',
    color: 'bg-red-500',
    bgCard: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    key: 'unreviewed' as const,
    label: 'Awaiting Review',
    color: 'bg-slate-400',
    bgCard: 'bg-slate-50 border-slate-200',
    textColor: 'text-slate-600',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
] as const;

export function TrafficLightSummary({ data }: { data: TrafficLightData }) {
  const total = data.red + data.amber + data.green + data.unreviewed;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Goal Progress Overview
        </h3>
        <span className="text-xs text-muted-foreground">
          {total} active {total === 1 ? 'goal' : 'goals'}
        </span>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          {data.green > 0 && (
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${(data.green / total) * 100}%` }}
            />
          )}
          {data.amber > 0 && (
            <div
              className="bg-amber-500 transition-all duration-500"
              style={{ width: `${(data.amber / total) * 100}%` }}
            />
          )}
          {data.red > 0 && (
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${(data.red / total) * 100}%` }}
            />
          )}
          {data.unreviewed > 0 && (
            <div
              className="bg-slate-300 transition-all duration-500"
              style={{ width: `${(data.unreviewed / total) * 100}%` }}
            />
          )}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {indicators.map((ind) => (
          <div
            key={ind.key}
            className={cn(
              'rounded-lg border p-3.5 transition-shadow hover:shadow-sm',
              ind.bgCard,
            )}
          >
            <div className="flex items-center gap-2">
              <span className={ind.textColor}>{ind.icon}</span>
              <span
                className={cn('text-2xl font-bold tabular-nums', ind.textColor)}
              >
                {data[ind.key]}
              </span>
            </div>
            <p className={cn('mt-1 text-xs font-medium', ind.textColor)}>
              {ind.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
