'use client';

/**
 * Status badges for care packages and visit statuses.
 */

import {
  PACKAGE_STATUS_LABELS,
  PACKAGE_STATUS_STYLES,
  VISIT_STATUS_LABELS,
  VISIT_STATUS_STYLES,
} from '@/features/care-packages/constants';
import type { PackageStatus, VisitStatus } from '@/features/care-packages/constants';

type PackageStatusBadgeProps = {
  status: string;
};

export function PackageStatusBadge({ status }: PackageStatusBadgeProps) {
  const label = PACKAGE_STATUS_LABELS[status as PackageStatus] ?? status;
  const style = PACKAGE_STATUS_STYLES[status as PackageStatus] ?? {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

type VisitStatusBadgeProps = {
  status: string;
};

export function VisitStatusBadge({ status }: VisitStatusBadgeProps) {
  const label = VISIT_STATUS_LABELS[status as VisitStatus] ?? status;
  const style = VISIT_STATUS_STYLES[status as VisitStatus] ?? {
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
