/**
 * SeverityBadge + StatusBadge — visual indicators for incident severity and workflow status.
 */

import { cn } from '@/lib/utils';
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  type SeverityLevel,
  type IncidentStatusValue,
} from '@/features/incidents/constants';

// ---------------------------------------------------------------------------
// Severity badge
// ---------------------------------------------------------------------------

type SeverityBadgeProps = {
  severity: string;
  className?: string;
};

const SEVERITY_STYLES: Record<string, string> = {
  minor:
    'bg-[oklch(0.95_0.02_160)] text-[oklch(0.3_0.08_160)] border-[oklch(0.85_0.04_160)]',
  moderate:
    'bg-[oklch(0.97_0.01_75)] text-[oklch(0.45_0.1_75)] border-[oklch(0.88_0.04_75)]',
  serious:
    'bg-[oklch(0.95_0.03_25)] text-[oklch(0.4_0.12_25)] border-[oklch(0.85_0.06_25)]',
  death: 'bg-red-50 text-red-700 border-red-200',
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const styles = SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.minor;
  const label = SEVERITY_LABELS[severity as SeverityLevel] ?? severity;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles,
        className,
      )}
      role="status"
      aria-label={`Severity: ${label}`}
    >
      {(severity === 'serious' || severity === 'death') && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            severity === 'death' ? 'bg-red-500' : 'bg-[oklch(0.5_0.15_25)]',
          )}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

type StatusBadgeProps = {
  status: string;
  className?: string;
};

const STATUS_STYLES: Record<string, string> = {
  reported:
    'bg-[oklch(0.95_0.03_25)] text-[oklch(0.4_0.12_25)] border-[oklch(0.85_0.06_25)]',
  under_review:
    'bg-[oklch(0.97_0.01_75)] text-[oklch(0.45_0.1_75)] border-[oklch(0.88_0.04_75)]',
  investigating:
    'bg-blue-50 text-blue-700 border-blue-200',
  resolved:
    'bg-[oklch(0.95_0.02_160)] text-[oklch(0.3_0.08_160)] border-[oklch(0.85_0.04_160)]',
  closed:
    'bg-[oklch(0.97_0.005_0)] text-[oklch(0.5_0_0)] border-[oklch(0.9_0_0)]',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.reported;
  const label = STATUS_LABELS[status as IncidentStatusValue] ?? status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Notifiable badge
// ---------------------------------------------------------------------------

type NotifiableBadgeProps = {
  isNotifiable: string;
  regulatoryBody?: string | null;
  className?: string;
};

export function NotifiableBadge({
  isNotifiable,
  regulatoryBody,
  className,
}: NotifiableBadgeProps) {
  if (isNotifiable !== 'yes') return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700',
        className,
      )}
      role="status"
      aria-label={`Notifiable${regulatoryBody ? ` to ${regulatoryBody}` : ''}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-purple-500"
        aria-hidden="true"
      />
      Notifiable{regulatoryBody && regulatoryBody !== 'none' ? ` (${regulatoryBody})` : ''}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Duty of Candour badge
// ---------------------------------------------------------------------------

type DutyOfCandourBadgeProps = {
  triggered: string;
  className?: string;
};

export function DutyOfCandourBadge({
  triggered,
  className,
}: DutyOfCandourBadgeProps) {
  if (triggered !== 'yes') return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700',
        className,
      )}
      role="status"
      aria-label="Duty of Candour required"
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-amber-500"
        aria-hidden="true"
      />
      Duty of Candour
    </span>
  );
}
