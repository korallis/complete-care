/**
 * AuditActionBadge — visual badge for audit log action types.
 *
 * Semantic colour coding:
 * - create  → emerald (positive / additive)
 * - update  → blue (neutral / informational)
 * - delete  → rose/red (destructive / removal)
 * - other   → amber (caution / system)
 */

import { cn } from '@/lib/utils';

type ActionBadgeVariant = 'create' | 'update' | 'delete' | 'other';

function getVariant(action: string): ActionBadgeVariant {
  const a = action.toLowerCase();
  if (a === 'create') return 'create';
  if (a === 'update') return 'update';
  if (a === 'delete') return 'delete';
  return 'other';
}

const VARIANT_STYLES: Record<ActionBadgeVariant, string> = {
  create:
    'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  update:
    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  delete:
    'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
  other:
    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
};

interface AuditActionBadgeProps {
  action: string;
  className?: string;
}

export function AuditActionBadge({ action, className }: AuditActionBadgeProps) {
  const variant = getVariant(action);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize',
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {action}
    </span>
  );
}
