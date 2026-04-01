'use client';

/**
 * Status badges for medications and administration records.
 */

import { cn } from '@/lib/utils';
import {
  MEDICATION_STATUS_LABELS,
  ADMINISTRATION_STATUS_LABELS,
} from '@/features/emar/constants';
import type { MedicationStatusValue, AdministrationStatusValue } from '@/features/emar/constants';

// ---------------------------------------------------------------------------
// MedicationStatusBadge
// ---------------------------------------------------------------------------

const MEDICATION_STATUS_STYLES: Record<string, string> = {
  active:
    'bg-emerald-50 text-emerald-700 border-emerald-200',
  discontinued:
    'bg-gray-50 text-gray-600 border-gray-200',
  suspended:
    'bg-amber-50 text-amber-700 border-amber-200',
  completed:
    'bg-blue-50 text-blue-700 border-blue-200',
};

type MedicationStatusBadgeProps = {
  status: string;
  className?: string;
};

export function MedicationStatusBadge({ status, className }: MedicationStatusBadgeProps) {
  const label = MEDICATION_STATUS_LABELS[status as MedicationStatusValue] ?? status;
  const styles = MEDICATION_STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        styles,
        className,
      )}
      aria-label={`Medication status: ${label}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// AdministrationStatusBadge
// ---------------------------------------------------------------------------

const ADMIN_STATUS_STYLES: Record<string, string> = {
  given:
    'bg-emerald-50 text-emerald-700 border-emerald-200',
  self_administered:
    'bg-blue-50 text-blue-700 border-blue-200',
  refused:
    'bg-red-50 text-red-700 border-red-200',
  withheld:
    'bg-amber-50 text-amber-700 border-amber-200',
  omitted:
    'bg-orange-50 text-orange-700 border-orange-200',
  not_available:
    'bg-gray-50 text-gray-600 border-gray-200',
};

type AdministrationStatusBadgeProps = {
  status: string;
  className?: string;
};

export function AdministrationStatusBadge({ status, className }: AdministrationStatusBadgeProps) {
  const label = ADMINISTRATION_STATUS_LABELS[status as AdministrationStatusValue] ?? status;
  const styles = ADMIN_STATUS_STYLES[status] ?? 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        styles,
        className,
      )}
      aria-label={`Administration status: ${label}`}
    >
      {label}
    </span>
  );
}
