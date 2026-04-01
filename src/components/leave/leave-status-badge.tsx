'use client';

/**
 * LeaveStatusBadge and LeaveTypeBadge -- display badges for leave status and type.
 */

import {
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
  type LeaveStatus,
  type LeaveType,
} from '@/features/leave/schema';
import { LEAVE_STATUS_STYLES, LEAVE_TYPE_STYLES } from '@/features/leave/constants';

type LeaveStatusBadgeProps = {
  status: string;
};

export function LeaveStatusBadge({ status }: LeaveStatusBadgeProps) {
  const style = LEAVE_STATUS_STYLES[status as LeaveStatus] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  };
  const label = LEAVE_STATUS_LABELS[status as LeaveStatus] ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

type LeaveTypeBadgeProps = {
  type: string;
};

export function LeaveTypeBadge({ type }: LeaveTypeBadgeProps) {
  const style = LEAVE_TYPE_STYLES[type as LeaveType] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
  };
  const label = LEAVE_TYPE_LABELS[type as LeaveType] ?? type;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  );
}
