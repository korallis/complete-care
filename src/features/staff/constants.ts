/**
 * Staff feature constants — labels, display helpers, and static config.
 */

import type { StaffContractType, StaffStatus } from './schema';

// ---------------------------------------------------------------------------
// Job title suggestions (common care sector roles)
// ---------------------------------------------------------------------------

export const JOB_TITLE_SUGGESTIONS = [
  'Care Worker',
  'Senior Care Worker',
  'Team Leader',
  'Deputy Manager',
  'Registered Manager',
  'Nurse',
  'Healthcare Assistant',
  'Support Worker',
  'Activities Coordinator',
  'Chef / Cook',
  'Domestic / Housekeeper',
  'Maintenance',
  'Administrator',
  'Office Manager',
] as const;

// ---------------------------------------------------------------------------
// Status styling — used by StaffStatusBadge
// ---------------------------------------------------------------------------

export const STATUS_STYLES: Record<
  StaffStatus,
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
  on_leave: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  terminated: {
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

// ---------------------------------------------------------------------------
// Contract type styling
// ---------------------------------------------------------------------------

export const CONTRACT_TYPE_STYLES: Record<
  StaffContractType,
  { bg: string; text: string }
> = {
  full_time: { bg: 'bg-[oklch(0.94_0.015_160)]', text: 'text-[oklch(0.3_0.08_160)]' },
  part_time: { bg: 'bg-violet-50', text: 'text-violet-700' },
  zero_hours: { bg: 'bg-orange-50', text: 'text-orange-700' },
  agency: { bg: 'bg-sky-50', text: 'text-sky-700' },
  bank: { bg: 'bg-slate-50', text: 'text-slate-700' },
};

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

export const STAFF_PAGE_SIZE = 25;
