'use client';

/**
 * MedicationList — displays active medications for a person.
 */

import Link from 'next/link';
import { MedicationStatusBadge } from './medication-status-badge';
import {
  MEDICATION_ROUTE_LABELS,
  MEDICATION_FREQUENCY_LABELS,
} from '@/features/emar/constants';
import type { MedicationListItem } from '@/features/emar/actions';

// ---------------------------------------------------------------------------
// Medication card
// ---------------------------------------------------------------------------

type MedicationCardProps = {
  medication: MedicationListItem;
  orgSlug: string;
  personId: string;
};

function MedicationCard({ medication, orgSlug, personId }: MedicationCardProps) {
  const href = `/${orgSlug}/persons/${personId}/emar/medications/${medication.id}`;
  const routeLabel = MEDICATION_ROUTE_LABELS[medication.route as keyof typeof MEDICATION_ROUTE_LABELS] ?? medication.route;
  const frequencyLabel = MEDICATION_FREQUENCY_LABELS[medication.frequency as keyof typeof MEDICATION_FREQUENCY_LABELS] ?? medication.frequency;

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.6_0.06_160)] hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
      aria-label={`View medication: ${medication.drugName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] group-hover:text-[oklch(0.3_0.08_160)] transition-colors">
              {medication.drugName}
            </h3>
            <MedicationStatusBadge status={medication.status} />
          </div>

          <p className="text-sm text-[oklch(0.45_0.03_160)] mb-2">
            {medication.dose} {medication.doseUnit} &mdash; {routeLabel}
          </p>

          <div className="flex items-center gap-3 flex-wrap text-xs text-[oklch(0.55_0_0)]">
            <span>{frequencyLabel}</span>
            <span className="text-[oklch(0.8_0_0)]">|</span>
            <span>Prescribed: {medication.prescribedDate}</span>
            <span className="text-[oklch(0.8_0_0)]">|</span>
            <span>By: {medication.prescriberName}</span>
            {medication.pharmacy && (
              <>
                <span className="text-[oklch(0.8_0_0)]">|</span>
                <span>Pharmacy: {medication.pharmacy}</span>
              </>
            )}
          </div>

          {medication.specialInstructions && (
            <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
              {medication.specialInstructions}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 self-center">
          <svg
            className="h-4 w-4 text-[oklch(0.75_0_0)] group-hover:text-[oklch(0.35_0.06_160)] transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
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
        <svg className="h-6 w-6 text-[oklch(0.45_0.07_160)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
        No medications prescribed
      </h3>
      <p className="text-sm text-[oklch(0.55_0_0)] mb-5">
        Add medication records to begin tracking administration.
      </p>
      {canCreate && (
        <Link
          href={`/${orgSlug}/persons/${personId}/emar/medications/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add medication
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type MedicationListProps = {
  medications: MedicationListItem[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
  totalCount: number;
};

export function MedicationList({
  medications,
  orgSlug,
  personId,
  canCreate,
  totalCount,
}: MedicationListProps) {
  if (medications.length === 0) {
    return (
      <EmptyState orgSlug={orgSlug} personId={personId} canCreate={canCreate} />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          {totalCount} medication{totalCount !== 1 ? 's' : ''}
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/emar/medications/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add medication
          </Link>
        )}
      </div>

      <ul className="space-y-3" role="list" aria-label="Medications">
        {medications.map((med) => (
          <li key={med.id}>
            <MedicationCard medication={med} orgSlug={orgSlug} personId={personId} />
          </li>
        ))}
      </ul>
    </div>
  );
}
