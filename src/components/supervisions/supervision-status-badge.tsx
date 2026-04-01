'use client';

/**
 * SupervisionStatusBadge — displays scheduled/completed/overdue/cancelled status.
 * SupervisionTypeBadge — displays supervision or appraisal type.
 * SupervisionFrequencyBadge — displays the supervision frequency.
 */

import {
  SUPERVISION_STATUS_LABELS,
  SUPERVISION_TYPE_LABELS,
  SUPERVISION_FREQUENCY_LABELS,
} from '@/features/supervisions/schema';
import type {
  SupervisionStatus,
  SupervisionType,
  SupervisionFrequency,
} from '@/features/supervisions/schema';
import {
  SUPERVISION_STATUS_STYLES,
  SUPERVISION_TYPE_STYLES,
  SUPERVISION_FREQUENCY_STYLES,
} from '@/features/supervisions/constants';

export function SupervisionStatusBadge({ status }: { status: string }) {
  const style = SUPERVISION_STATUS_STYLES[status as SupervisionStatus] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
  };
  const label = SUPERVISION_STATUS_LABELS[status as SupervisionStatus] ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function SupervisionTypeBadge({ type }: { type: string }) {
  const style = SUPERVISION_TYPE_STYLES[type as SupervisionType] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
  };
  const label = SUPERVISION_TYPE_LABELS[type as SupervisionType] ?? type;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  );
}

export function SupervisionFrequencyBadge({ frequency }: { frequency: string }) {
  const style = SUPERVISION_FREQUENCY_STYLES[frequency as SupervisionFrequency] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
  };
  const label = SUPERVISION_FREQUENCY_LABELS[frequency as SupervisionFrequency] ?? frequency;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  );
}
