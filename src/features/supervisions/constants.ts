/**
 * Supervision feature constants — labels, display helpers, and static config.
 */

import type { SupervisionStatus, SupervisionType, SupervisionFrequency, GoalStatus } from './schema';

// ---------------------------------------------------------------------------
// Status styling — used by SupervisionStatusBadge
// ---------------------------------------------------------------------------

export const SUPERVISION_STATUS_STYLES: Record<
  SupervisionStatus,
  { bg: string; text: string; dot: string }
> = {
  scheduled: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  completed: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  overdue: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  cancelled: {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  },
};

// ---------------------------------------------------------------------------
// Type styling
// ---------------------------------------------------------------------------

export const SUPERVISION_TYPE_STYLES: Record<
  SupervisionType,
  { bg: string; text: string }
> = {
  supervision: { bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
  appraisal: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
};

// ---------------------------------------------------------------------------
// Frequency styling
// ---------------------------------------------------------------------------

export const SUPERVISION_FREQUENCY_STYLES: Record<
  SupervisionFrequency,
  { bg: string; text: string }
> = {
  monthly: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-700' },
  six_weekly: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700' },
  quarterly: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
  annual: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
};

// ---------------------------------------------------------------------------
// Goal status styling
// ---------------------------------------------------------------------------

export const GOAL_STATUS_STYLES: Record<
  GoalStatus,
  { bg: string; text: string; dot: string }
> = {
  not_started: {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
  in_progress: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  completed: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

// ---------------------------------------------------------------------------
// Alert thresholds
// ---------------------------------------------------------------------------

/** Amber alert threshold — 7 days before scheduled supervision */
export const AMBER_ALERT_DAYS = 7;

/** Red alert threshold — supervision is overdue (past scheduled date) */
export const RED_ALERT_DAYS = 0;

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

export const SUPERVISION_PAGE_SIZE = 20;
