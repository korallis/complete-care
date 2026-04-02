'use client';

/**
 * ConflictWarning -- inline warning for detected scheduling conflicts.
 */

import { cn } from '@/lib/utils';
import type { Conflict } from '@/features/rota/conflicts';
import {
  CONFLICT_TYPE_LABELS,
  CONFLICT_SEVERITY,
} from '@/features/rota/constants';

type ConflictWarningProps = {
  conflicts: Conflict[];
  className?: string;
};

export function ConflictWarning({ conflicts, className }: ConflictWarningProps) {
  if (conflicts.length === 0) return null;

  const errors = conflicts.filter(
    (c) => CONFLICT_SEVERITY[c.type] === 'error',
  );
  const warnings = conflicts.filter(
    (c) => CONFLICT_SEVERITY[c.type] === 'warning',
  );

  return (
    <div className={cn('space-y-2', className)}>
      {errors.length > 0 && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-red-800">
                {errors.length} conflict{errors.length !== 1 ? 's' : ''} detected
              </h4>
              <ul className="mt-1 space-y-0.5">
                {errors.map((c, i) => (
                  <li key={`${c.visitId}-${c.type}-${i}`} className="text-xs text-red-700">
                    <span className="font-medium">
                      {CONFLICT_TYPE_LABELS[c.type]}:
                    </span>{' '}
                    {c.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-amber-800">
                {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
              </h4>
              <ul className="mt-1 space-y-0.5">
                {warnings.map((c, i) => (
                  <li key={`${c.visitId}-${c.type}-${i}`} className="text-xs text-amber-700">
                    <span className="font-medium">
                      {CONFLICT_TYPE_LABELS[c.type]}:
                    </span>{' '}
                    {c.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact conflict indicator for use inside visit cards.
 */
export function ConflictDot({ type }: { type: Conflict['type'] }) {
  const severity = CONFLICT_SEVERITY[type];

  return (
    <span
      className={cn(
        'inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white',
        severity === 'error' ? 'bg-red-500' : 'bg-amber-500',
      )}
      title={CONFLICT_TYPE_LABELS[type]}
      aria-label={`${CONFLICT_TYPE_LABELS[type]} conflict`}
    >
      !
    </span>
  );
}
