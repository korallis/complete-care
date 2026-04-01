'use client';

/**
 * TrainingStatusBadge — displays the current/expiring_soon/expired/not_completed status.
 * QualificationStatusBadge — displays completed/working_towards status.
 * TrainingCategoryBadge — displays the training category.
 */

import {
  TRAINING_STATUS_LABELS,
  QUALIFICATION_STATUS_LABELS,
  TRAINING_CATEGORY_LABELS,
} from '@/features/training/schema';
import type {
  TrainingStatus,
  QualificationStatus,
  TrainingCategory,
} from '@/features/training/schema';
import {
  TRAINING_STATUS_STYLES,
  QUALIFICATION_STATUS_STYLES,
  TRAINING_CATEGORY_STYLES,
} from '@/features/training/constants';

export function TrainingStatusBadge({ status }: { status: string }) {
  const style = TRAINING_STATUS_STYLES[status as TrainingStatus] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
  };
  const label = TRAINING_STATUS_LABELS[status as TrainingStatus] ?? status;

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

export function QualificationStatusBadge({ status }: { status: string }) {
  const style = QUALIFICATION_STATUS_STYLES[status as QualificationStatus] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
  };
  const label = QUALIFICATION_STATUS_LABELS[status as QualificationStatus] ?? status;

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

export function TrainingCategoryBadge({ category }: { category: string }) {
  const style = TRAINING_CATEGORY_STYLES[category as TrainingCategory] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
  };
  const label = TRAINING_CATEGORY_LABELS[category as TrainingCategory] ?? category;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  );
}
