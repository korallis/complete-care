'use client';

/**
 * EscalationBadge — displays the current escalation level with appropriate styling.
 */

import { cn } from '@/lib/utils';
import {
  ESCALATION_LEVEL_LABELS,
  type EscalationLevel,
} from '@/features/clinical-alerts/constants';

type EscalationBadgeProps = {
  level: string;
  className?: string;
};

const LEVEL_STYLES: Record<string, string> = {
  staff: 'bg-slate-100 text-slate-700 border-slate-200',
  senior: 'bg-blue-50 text-blue-700 border-blue-200',
  nurse: 'bg-amber-50 text-amber-700 border-amber-200',
  gp: 'bg-orange-50 text-orange-700 border-orange-200',
  emergency: 'bg-red-50 text-red-700 border-red-200',
};

export function EscalationBadge({ level, className }: EscalationBadgeProps) {
  const label =
    ESCALATION_LEVEL_LABELS[level as EscalationLevel] ?? level;
  const style = LEVEL_STYLES[level] ?? LEVEL_STYLES.staff;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style,
        className,
      )}
    >
      {label}
    </span>
  );
}
