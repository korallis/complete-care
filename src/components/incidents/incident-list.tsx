'use client';

/**
 * IncidentList — displays a filterable list of incidents for a person.
 * Shows severity, status, date/time, location, and key flags.
 */

import Link from 'next/link';
import { SeverityBadge, StatusBadge, NotifiableBadge, DutyOfCandourBadge } from './severity-badge';
import { LOCATION_LABELS } from '@/features/incidents/constants';
import type { IncidentListItem } from '@/features/incidents/actions';

// ---------------------------------------------------------------------------
// Date formatters
// ---------------------------------------------------------------------------

function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Incident card
// ---------------------------------------------------------------------------

type IncidentCardProps = {
  incident: IncidentListItem;
  orgSlug: string;
  personId: string;
};

function IncidentCard({ incident, orgSlug, personId }: IncidentCardProps) {
  const href = `/${orgSlug}/persons/${personId}/incidents/${incident.id}`;
  const locationLabel = LOCATION_LABELS[incident.location] ?? incident.location;

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.6_0.06_160)] hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
      aria-label={`View incident at ${locationLabel}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] group-hover:text-[oklch(0.3_0.08_160)] transition-colors truncate max-w-sm">
              {locationLabel}
            </h3>
            <span className="text-xs text-[oklch(0.65_0_0)]">
              {formatDateTime(incident.dateTime)}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            <NotifiableBadge isNotifiable={incident.isNotifiable} />
            <DutyOfCandourBadge triggered={incident.dutyOfCandourTriggered} />
          </div>

          <p className="mt-2 text-sm text-[oklch(0.45_0.02_160)] line-clamp-2">
            {incident.description}
          </p>

          <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-[oklch(0.55_0_0)]">
            {incident.reportedByName && (
              <span className="flex items-center gap-1">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {incident.reportedByName}
              </span>
            )}
          </div>
        </div>

        {/* Right: arrow */}
        <div className="flex-shrink-0 self-center">
          <svg
            className="h-4 w-4 text-[oklch(0.75_0_0)] group-hover:text-[oklch(0.35_0.06_160)] transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-[oklch(0.95_0.003_160)] flex items-center justify-between text-xs text-[oklch(0.65_0_0)]">
        <span>Reported {formatRelativeDate(incident.createdAt)}</span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

type EmptyStateProps = {
  orgSlug: string;
  personId: string;
  canCreate: boolean;
};

function EmptyState({ orgSlug, personId, canCreate }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
        <svg
          className="h-6 w-6 text-[oklch(0.45_0.07_160)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
        No incidents recorded
      </h3>
      <p className="text-sm text-[oklch(0.55_0_0)] mb-5">
        Record an incident or accident to track and investigate.
      </p>
      {canCreate && (
        <Link
          href={`/${orgSlug}/persons/${personId}/incidents/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Report incident
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type IncidentListProps = {
  incidents: IncidentListItem[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
  totalCount: number;
};

export function IncidentList({
  incidents,
  orgSlug,
  personId,
  canCreate,
  totalCount,
}: IncidentListProps) {
  if (incidents.length === 0) {
    return (
      <EmptyState
        orgSlug={orgSlug}
        personId={personId}
        canCreate={canCreate}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          {totalCount} incident{totalCount !== 1 ? 's' : ''}
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/incidents/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Report incident
          </Link>
        )}
      </div>

      {/* List */}
      <ul className="space-y-3" role="list" aria-label="Incidents">
        {incidents.map((incident) => (
          <li key={incident.id}>
            <IncidentCard
              incident={incident}
              orgSlug={orgSlug}
              personId={personId}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
