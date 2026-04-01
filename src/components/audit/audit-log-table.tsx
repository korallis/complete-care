/**
 * AuditLogTable — data table for displaying audit log entries.
 *
 * Displays: timestamp, user, action badge, entity type, entity ID, changes preview.
 * Optimised for dense data display with expandable change diffs.
 */

import { Monitor } from 'lucide-react';
import { AuditActionBadge } from './audit-action-badge';
import { AuditChangesPreview } from './audit-changes-preview';
import type { AuditLogEntry } from '@/features/audit/actions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(date: Date): { date: string; time: string } {
  const d = new Date(date);
  return {
    date: d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
}

function formatEntityType(entityType: string): string {
  return entityType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-[oklch(0.96_0.005_160)] flex items-center justify-center mb-4">
        <Monitor className="h-6 w-6 text-[oklch(0.7_0_0)]" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-[oklch(0.25_0.02_160)]">
        {hasFilters ? 'No entries match your filters' : 'No audit entries yet'}
      </h3>
      <p className="mt-1 text-sm text-[oklch(0.55_0_0)] max-w-xs">
        {hasFilters
          ? 'Try adjusting or clearing your filters to see more results.'
          : 'Audit entries are automatically created whenever data is created, updated, or deleted.'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const { date, time } = formatDateTime(entry.createdAt);

  return (
    <tr className="border-b border-[oklch(0.95_0.003_160)] hover:bg-[oklch(0.985_0.003_160)] transition-colors">
      {/* Timestamp */}
      <td className="py-3 pl-4 pr-3 text-xs">
        <div className="font-medium text-[oklch(0.25_0.02_160)] tabular-nums">{date}</div>
        <div className="text-[oklch(0.6_0_0)] tabular-nums mt-0.5">{time}</div>
      </td>

      {/* User */}
      <td className="px-3 py-3">
        {entry.user ? (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[oklch(0.22_0.04_160)] flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] font-bold text-white uppercase">
                {entry.user.name.slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-[oklch(0.22_0.02_160)] truncate max-w-[120px]">
                {entry.user.name}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-[oklch(0.92_0.005_160)] flex items-center justify-center flex-shrink-0">
              <Monitor className="h-3 w-3 text-[oklch(0.55_0_0)]" aria-hidden="true" />
            </div>
            <span className="text-xs text-[oklch(0.6_0_0)] italic">System</span>
          </div>
        )}
      </td>

      {/* Action */}
      <td className="px-3 py-3">
        <AuditActionBadge action={entry.action} />
      </td>

      {/* Entity type */}
      <td className="px-3 py-3">
        <span className="text-xs font-medium text-[oklch(0.35_0.02_160)]">
          {formatEntityType(entry.entityType)}
        </span>
      </td>

      {/* Entity ID */}
      <td className="px-3 py-3">
        <span
          className="text-xs font-mono text-[oklch(0.45_0.04_160)] bg-[oklch(0.96_0.004_160)] px-1.5 py-0.5 rounded"
          title={entry.entityId}
        >
          {entry.entityId.length > 12
            ? `${entry.entityId.slice(0, 8)}…`
            : entry.entityId}
        </span>
      </td>

      {/* Changes */}
      <td className="px-3 py-3 pr-4">
        <AuditChangesPreview changes={entry.changes} />
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  hasFilters: boolean;
}

export function AuditLogTable({ entries, hasFilters }: AuditLogTableProps) {
  if (entries.length === 0) {
    return <EmptyState hasFilters={hasFilters} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" role="table" aria-label="Audit log entries">
        <thead>
          <tr className="border-b border-[oklch(0.91_0.005_160)] bg-[oklch(0.975_0.004_160)]">
            <th scope="col" className="py-2.5 pl-4 pr-3 text-left text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
              Timestamp
            </th>
            <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
              User
            </th>
            <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
              Action
            </th>
            <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
              Entity type
            </th>
            <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
              Entity ID
            </th>
            <th scope="col" className="px-3 py-2.5 pr-4 text-left text-xs font-semibold text-[oklch(0.45_0_0)] uppercase tracking-wide">
              Changes
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {entries.map((entry) => (
            <AuditLogRow key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
