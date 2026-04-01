'use client';

/**
 * DbsStatusBadge — displays the current/expiring_soon/expired status of a DBS check.
 * DbsLevelBadge — displays the DBS level (basic/standard/enhanced/enhanced_barred).
 */

import { DBS_STATUS_LABELS, DBS_LEVEL_LABELS } from '@/features/dbs-tracking/schema';
import type { DbsStatus, DbsLevel } from '@/features/dbs-tracking/schema';
import { DBS_STATUS_STYLES, DBS_LEVEL_STYLES } from '@/features/dbs-tracking/constants';

export function DbsStatusBadge({ status }: { status: string }) {
  const style = DBS_STATUS_STYLES[status as DbsStatus] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
    dot: 'bg-gray-500',
  };
  const label = DBS_STATUS_LABELS[status as DbsStatus] ?? status;

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

export function DbsLevelBadge({ level }: { level: string }) {
  const style = DBS_LEVEL_STYLES[level as DbsLevel] ?? {
    bg: 'bg-gray-50 border-gray-200',
    text: 'text-gray-700',
  };
  const label = DBS_LEVEL_LABELS[level as DbsLevel] ?? level;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
    >
      {label}
    </span>
  );
}
