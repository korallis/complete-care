/**
 * DBS Tracking feature constants — labels, display helpers, and static config.
 */

import type { DbsLevel, DbsStatus } from './schema';

// ---------------------------------------------------------------------------
// DBS level styling — used by DbsStatusBadge
// ---------------------------------------------------------------------------

export const DBS_LEVEL_STYLES: Record<
  DbsLevel,
  { bg: string; text: string }
> = {
  basic: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' },
  standard: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  enhanced: { bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
  enhanced_barred: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
};

// ---------------------------------------------------------------------------
// DBS status styling — used by DbsStatusBadge
// ---------------------------------------------------------------------------

export const DBS_STATUS_STYLES: Record<
  DbsStatus,
  { bg: string; text: string; dot: string }
> = {
  current: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  expiring_soon: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  expired: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

// ---------------------------------------------------------------------------
// Alert thresholds (days before recheck date)
// ---------------------------------------------------------------------------

/** Amber alert threshold — 30 days before recheck date */
export const AMBER_ALERT_DAYS = 30;

/** Red alert threshold — 7 days before (or past) recheck date */
export const RED_ALERT_DAYS = 7;

// ---------------------------------------------------------------------------
// Default recheck interval
// ---------------------------------------------------------------------------

/** Default DBS recheck interval in years (standard UK care sector) */
export const DEFAULT_RECHECK_INTERVAL_YEARS = 3;
