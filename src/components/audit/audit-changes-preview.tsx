'use client';

/**
 * AuditChangesPreview — inline preview of before/after changes in an audit log entry.
 *
 * Shows a compact summary of changed fields. Expandable to see full JSON diff.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Changes = {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

interface AuditChangesPreviewProps {
  changes: unknown;
}

function isChanges(v: unknown): v is Changes {
  return (
    typeof v === 'object' &&
    v !== null &&
    ('before' in v || 'after' in v)
  );
}

function getChangedKeys(changes: Changes): string[] {
  const before = changes.before ?? {};
  const after = changes.after ?? {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return Array.from(allKeys).filter((k) => {
    return JSON.stringify((before as Record<string, unknown>)[k]) !==
      JSON.stringify((after as Record<string, unknown>)[k]);
  });
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function AuditChangesPreview({ changes }: AuditChangesPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  if (!changes) {
    return <span className="text-xs text-[oklch(0.7_0_0)]">—</span>;
  }

  if (!isChanges(changes)) {
    return (
      <span className="text-xs text-[oklch(0.7_0_0)] font-mono">
        {JSON.stringify(changes).slice(0, 60)}
        {JSON.stringify(changes).length > 60 ? '…' : ''}
      </span>
    );
  }

  const changedKeys = getChangedKeys(changes);

  if (changedKeys.length === 0) {
    return <span className="text-xs text-[oklch(0.7_0_0)]">No field changes</span>;
  }

  const preview = changedKeys.slice(0, 2);
  const hasMore = changedKeys.length > 2;

  return (
    <div className="space-y-0.5">
      {/* Compact summary */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-[oklch(0.35_0.04_160)] hover:text-[oklch(0.22_0.04_160)] transition-colors"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        )}
        <span className="font-medium">
          {changedKeys.length} field{changedKeys.length !== 1 ? 's' : ''} changed
        </span>
        {!expanded && (
          <span className="text-[oklch(0.6_0_0)]">
            ({preview.join(', ')}{hasMore ? ', …' : ''})
          </span>
        )}
      </button>

      {/* Expanded diff */}
      {expanded && (
        <div className="mt-2 rounded-md border border-[oklch(0.91_0.005_160)] bg-[oklch(0.98_0.003_160)] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[oklch(0.91_0.005_160)]">
                <th className="px-3 py-1.5 text-left font-medium text-[oklch(0.5_0_0)] w-1/4">
                  Field
                </th>
                <th className="px-3 py-1.5 text-left font-medium text-rose-600 w-[37.5%]">
                  Before
                </th>
                <th className="px-3 py-1.5 text-left font-medium text-emerald-600 w-[37.5%]">
                  After
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[oklch(0.94_0.005_160)]">
              {changedKeys.map((key) => {
                const before = changes.before ?? {};
                const after = changes.after ?? {};
                return (
                  <tr key={key}>
                    <td className="px-3 py-1.5 font-mono text-[oklch(0.35_0_0)]">
                      {key}
                    </td>
                    <td className={cn(
                      'px-3 py-1.5 font-mono max-w-0',
                      (before as Record<string, unknown>)[key] !== undefined
                        ? 'text-rose-700 bg-rose-50/50'
                        : 'text-[oklch(0.7_0_0)]',
                    )}>
                      <span className="block truncate">
                        {formatValue((before as Record<string, unknown>)[key])}
                      </span>
                    </td>
                    <td className={cn(
                      'px-3 py-1.5 font-mono max-w-0',
                      (after as Record<string, unknown>)[key] !== undefined
                        ? 'text-emerald-700 bg-emerald-50/50'
                        : 'text-[oklch(0.7_0_0)]',
                    )}>
                      <span className="block truncate">
                        {formatValue((after as Record<string, unknown>)[key])}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
