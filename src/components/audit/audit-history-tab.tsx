/**
 * AuditHistoryTab — entity-level audit history display.
 *
 * Renders a timeline of all audit entries for a specific entity.
 * Designed for use as a tab on entity detail pages (persons, care plans, staff, etc.).
 *
 * Usage:
 * ```tsx
 * // Server Component — fetch history and pass to this component
 * import { getEntityAuditHistory } from '@/features/audit/actions';
 * import { AuditHistoryTab } from '@/components/audit/audit-history-tab';
 *
 * const history = await getEntityAuditHistory('person', personId);
 * <AuditHistoryTab entries={history} entityType="person" />
 * ```
 */

import { Monitor, Clock } from 'lucide-react';
import { AuditActionBadge } from './audit-action-badge';
import { AuditChangesPreview } from './audit-changes-preview';
import type { AuditLogEntry } from '@/features/audit/actions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatAbsoluteTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyHistoryState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[oklch(0.96_0.005_160)] flex items-center justify-center mb-4">
        <Clock className="h-6 w-6 text-[oklch(0.7_0_0)]" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[oklch(0.25_0.02_160)]">
        No history yet
      </h3>
      <p className="mt-1 text-sm text-[oklch(0.55_0_0)] max-w-xs">
        Changes to this record will appear here automatically.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline entry
// ---------------------------------------------------------------------------

function HistoryEntry({ entry, isLast }: { entry: AuditLogEntry; isLast: boolean }) {
  return (
    <li className="relative flex gap-3 pb-6">
      {/* Connecting line */}
      {!isLast && (
        <div
          className="absolute left-[15px] top-8 bottom-0 w-px bg-[oklch(0.91_0.005_160)]"
          aria-hidden="true"
        />
      )}

      {/* Avatar / icon */}
      <div className="relative flex-shrink-0 mt-0.5">
        {entry.user ? (
          <div className="h-8 w-8 rounded-full bg-[oklch(0.22_0.04_160)] flex items-center justify-center ring-2 ring-white">
            <span className="text-[10px] font-bold text-white uppercase">
              {entry.user.name.slice(0, 2)}
            </span>
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-[oklch(0.92_0.005_160)] flex items-center justify-center ring-2 ring-white">
            <Monitor className="h-3.5 w-3.5 text-[oklch(0.55_0_0)]" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-[oklch(0.2_0.02_160)]">
            {entry.user?.name ?? 'System'}
          </span>
          <AuditActionBadge action={entry.action} />
          <time
            dateTime={new Date(entry.createdAt).toISOString()}
            title={formatAbsoluteTime(entry.createdAt)}
            className="text-xs text-[oklch(0.6_0_0)] ml-auto"
          >
            {formatRelativeTime(entry.createdAt)}
          </time>
        </div>

        {/* Changes */}
        {entry.changes != null && (
          <div className="mt-2">
            <AuditChangesPreview changes={entry.changes} />
          </div>
        )}

        {/* Absolute timestamp */}
        <p className="mt-1 text-[10px] text-[oklch(0.7_0_0)]">
          {formatAbsoluteTime(entry.createdAt)}
          {entry.ipAddress && (
            <span className="ml-2 font-mono">· {entry.ipAddress}</span>
          )}
        </p>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface AuditHistoryTabProps {
  entries: AuditLogEntry[];
  /** The entity type (for display copy) */
  entityType?: string;
}

export function AuditHistoryTab({ entries, entityType }: AuditHistoryTabProps) {
  if (entries.length === 0) {
    return <EmptyHistoryState />;
  }

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[oklch(0.2_0.02_160)]">
            Change history
          </h3>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            {entityType ? ` for this ${entityType.replace(/_/g, ' ')}` : ''}
            . Entries cannot be modified or deleted.
          </p>
        </div>
        {/* Immutability badge */}
        <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.005_160)] px-3 py-1 text-[10px] font-medium text-[oklch(0.45_0_0)] ring-1 ring-inset ring-[oklch(0.88_0.005_160)]">
          Immutable audit trail
        </span>
      </div>

      {/* Timeline */}
      <ol className="space-y-0" aria-label="Audit history timeline">
        {entries.map((entry, i) => (
          <HistoryEntry
            key={entry.id}
            entry={entry}
            isLast={i === entries.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}
