/**
 * Care Packages feature constants — labels, display helpers, and static config.
 */

// ---------------------------------------------------------------------------
// Package statuses
// ---------------------------------------------------------------------------

export const PACKAGE_STATUSES = ['active', 'suspended', 'ended'] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  ended: 'Ended',
};

export const PACKAGE_STATUS_STYLES: Record<
  PackageStatus,
  { bg: string; text: string; dot: string }
> = {
  active: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  suspended: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  ended: {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
};

// ---------------------------------------------------------------------------
// Funding types
// ---------------------------------------------------------------------------

export const FUNDING_TYPES = [
  'local_authority',
  'nhs_chc',
  'private',
  'mixed',
] as const;
export type FundingType = (typeof FUNDING_TYPES)[number];

export const FUNDING_TYPE_LABELS: Record<FundingType, string> = {
  local_authority: 'Local Authority',
  nhs_chc: 'NHS CHC',
  private: 'Private',
  mixed: 'Mixed',
};

// ---------------------------------------------------------------------------
// Visit type names (presets)
// ---------------------------------------------------------------------------

export const VISIT_TYPE_PRESETS = [
  'morning',
  'lunch',
  'tea',
  'bedtime',
  'custom',
] as const;
export type VisitTypePreset = (typeof VISIT_TYPE_PRESETS)[number];

export const VISIT_TYPE_LABELS: Record<VisitTypePreset, string> = {
  morning: 'Morning',
  lunch: 'Lunch',
  tea: 'Tea',
  bedtime: 'Bedtime',
  custom: 'Custom',
};

/** Default time windows for visit type presets (HH:MM 24h) */
export const VISIT_TYPE_DEFAULTS: Record<
  VisitTypePreset,
  { start: string; end: string; duration: number }
> = {
  morning: { start: '07:00', end: '10:00', duration: 30 },
  lunch: { start: '12:00', end: '14:00', duration: 30 },
  tea: { start: '16:00', end: '18:00', duration: 30 },
  bedtime: { start: '20:00', end: '22:00', duration: 30 },
  custom: { start: '09:00', end: '17:00', duration: 60 },
};

// ---------------------------------------------------------------------------
// Visit frequencies
// ---------------------------------------------------------------------------

export const VISIT_FREQUENCIES = ['daily', 'weekdays', 'custom'] as const;
export type VisitFrequency = (typeof VISIT_FREQUENCIES)[number];

export const VISIT_FREQUENCY_LABELS: Record<VisitFrequency, string> = {
  daily: 'Daily (7 days)',
  weekdays: 'Weekdays (Mon-Fri)',
  custom: 'Custom pattern',
};

// ---------------------------------------------------------------------------
// Scheduled visit statuses
// ---------------------------------------------------------------------------

export const VISIT_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'missed',
  'cancelled',
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  missed: 'Missed',
  cancelled: 'Cancelled',
};

export const VISIT_STATUS_STYLES: Record<
  VisitStatus,
  { bg: string; text: string; dot: string }
> = {
  scheduled: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  in_progress: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  completed: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  missed: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  cancelled: {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
};

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const CARE_PACKAGES_PAGE_SIZE = 25;
