'use client';

/**
 * VisitorLogList — displays the visitor log entries.
 * Used at org level for all visitors, or at person level for child's visitors.
 */

import type { VisitorLogEntry } from '@/lib/db/schema';
import { VISITOR_RELATIONSHIP_LABELS, type VisitorRelationship } from '../constants';

type VisitorLogListProps = {
  entries: VisitorLogEntry[];
  onSignOut?: (id: string) => void;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function VisitorRow({ entry }: { entry: VisitorLogEntry }) {
  const relationshipLabel =
    VISITOR_RELATIONSHIP_LABELS[entry.relationship as VisitorRelationship] ??
    entry.relationship;
  const isSignedOut = !!entry.departureTime;

  return (
    <div className="grid grid-cols-12 gap-3 items-center px-4 py-3 border-b border-[oklch(0.95_0.003_160)] last:border-0 hover:bg-[oklch(0.985_0.003_160)] transition-colors">
      {/* Visitor name + relationship */}
      <div className="col-span-3 min-w-0">
        <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] truncate">
          {entry.visitorName}
        </p>
        <p className="text-xs text-[oklch(0.55_0_0)]">{relationshipLabel}</p>
      </div>

      {/* Date */}
      <div className="col-span-2">
        <p className="text-xs text-[oklch(0.45_0.02_160)]">{formatDate(entry.visitDate)}</p>
      </div>

      {/* Arrival / departure */}
      <div className="col-span-2">
        <p className="text-xs text-[oklch(0.45_0.02_160)]">
          {entry.arrivalTime}
          {entry.departureTime && (
            <>
              {' — '}
              {entry.departureTime}
            </>
          )}
        </p>
        {!isSignedOut && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            In
          </span>
        )}
      </div>

      {/* Checks */}
      <div className="col-span-3 flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
            entry.idChecked
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {entry.idChecked ? '✓' : '✗'} ID
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium ${
            entry.dbsChecked
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {entry.dbsChecked ? '✓' : '—'} DBS
        </span>
      </div>

      {/* Notes */}
      <div className="col-span-2">
        {entry.notes && (
          <p className="text-xs text-[oklch(0.55_0_0)] line-clamp-1" title={entry.notes}>
            {entry.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export function VisitorLogList({ entries }: VisitorLogListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
          <svg
            className="h-5 w-5 text-[oklch(0.45_0.07_160)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          No visitors recorded
        </h3>
        <p className="text-xs text-[oklch(0.55_0_0)]">
          No visitor log entries have been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-[oklch(0.97_0.003_160)] border-b border-[oklch(0.91_0.005_160)]">
        <div className="col-span-3">
          <span className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Visitor
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Date
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Time
          </span>
        </div>
        <div className="col-span-3">
          <span className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Checks
          </span>
        </div>
        <div className="col-span-2">
          <span className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Notes
          </span>
        </div>
      </div>

      {entries.map((entry) => (
        <VisitorRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
