/**
 * Leave feature constants -- labels, display helpers, and static config.
 */

import type { LeaveStatus, LeaveType } from './schema';

// ---------------------------------------------------------------------------
// Status styling -- used by LeaveStatusBadge
// ---------------------------------------------------------------------------

export const LEAVE_STATUS_STYLES: Record<
  LeaveStatus,
  { bg: string; text: string; dot: string }
> = {
  pending: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  approved: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  denied: {
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
// Type styling -- used by LeaveTypeBadge
// ---------------------------------------------------------------------------

export const LEAVE_TYPE_STYLES: Record<
  LeaveType,
  { bg: string; text: string }
> = {
  annual: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  sick: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  compassionate: { bg: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
  unpaid: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700' },
};

// ---------------------------------------------------------------------------
// Calendar dot colours for leave types on the calendar view
// ---------------------------------------------------------------------------

export const LEAVE_CALENDAR_COLORS: Record<LeaveType, string> = {
  annual: 'bg-blue-500',
  sick: 'bg-orange-500',
  compassionate: 'bg-violet-500',
  unpaid: 'bg-slate-400',
};

// ---------------------------------------------------------------------------
// Default entitlements (UK statutory minimum is 28 days for full-time)
// ---------------------------------------------------------------------------

export const DEFAULT_ANNUAL_ENTITLEMENT = 28;

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

export const LEAVE_PAGE_SIZE = 20;
