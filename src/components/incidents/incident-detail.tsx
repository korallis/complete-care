'use client';

/**
 * IncidentDetail — full incident view with investigation workflow stepper.
 * Shows all incident data, allows investigation updates, and closing.
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Incident } from '@/lib/db/schema/incidents';
import type { UpdateInvestigationInput, CloseIncidentInput } from '@/features/incidents/schema';
import {
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  LOCATION_LABELS,
  type IncidentStatusValue,
} from '@/features/incidents/constants';
import {
  SeverityBadge,
  StatusBadge,
  NotifiableBadge,
  DutyOfCandourBadge,
} from './severity-badge';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IncidentDetailProps = {
  incident: Incident;
  orgSlug: string;
  personId: string;
  personName: string;
  canUpdate: boolean;
  onUpdateInvestigation: (
    incidentId: string,
    data: UpdateInvestigationInput,
  ) => Promise<{ success: boolean; error?: string }>;
  onCloseIncident: (
    incidentId: string,
    data: CloseIncidentInput,
  ) => Promise<{ success: boolean; error?: string }>;
};

// ---------------------------------------------------------------------------
// Workflow stepper
// ---------------------------------------------------------------------------

function WorkflowStepper({ currentStatus }: { currentStatus: string }) {
  const statusOrder: IncidentStatusValue[] = [
    'reported',
    'under_review',
    'investigating',
    'resolved',
    'closed',
  ];
  const currentIdx = statusOrder.indexOf(currentStatus as IncidentStatusValue);

  return (
    <div className="flex items-center gap-1" role="list" aria-label="Investigation workflow">
      {statusOrder.map((status, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={status} className="flex items-center gap-1" role="listitem">
            <div
              className={cn(
                'flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-colors',
                isComplete
                  ? 'bg-[oklch(0.3_0.08_160)] text-white'
                  : isCurrent
                    ? 'bg-[oklch(0.5_0.1_160)] text-white ring-2 ring-[oklch(0.5_0.1_160)/0.3]'
                    : 'bg-[oklch(0.94_0.005_160)] text-[oklch(0.55_0_0)]',
              )}
              aria-label={`${STATUS_LABELS[status]}: ${isComplete ? 'complete' : isCurrent ? 'current' : 'pending'}`}
            >
              {isComplete ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={cn(
                'text-xs hidden sm:inline',
                isCurrent ? 'font-semibold text-[oklch(0.22_0.04_160)]' : 'text-[oklch(0.55_0_0)]',
              )}
            >
              {STATUS_LABELS[status]}
            </span>
            {idx < statusOrder.length - 1 && (
              <div
                className={cn(
                  'h-px w-4 sm:w-8',
                  idx < currentIdx ? 'bg-[oklch(0.3_0.08_160)]' : 'bg-[oklch(0.88_0.005_160)]',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function IncidentDetail({
  incident,
  orgSlug,
  personId,
  personName,
  canUpdate,
  onUpdateInvestigation,
  onCloseIncident,
}: IncidentDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState(
    incident.investigationNotes ?? '',
  );
  const [outcome, setOutcome] = useState(incident.outcome ?? '');

  const locationLabel = LOCATION_LABELS[incident.location] ?? incident.location;
  const currentStatus = incident.status as IncidentStatusValue;
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  const involvedPersons = (incident.involvedPersons ?? []) as Array<{
    name: string;
    role: string;
  }>;
  const witnesses = (incident.witnesses ?? []) as Array<{
    name: string;
    role: string;
    statement?: string;
  }>;
  const injuryDetails = (incident.injuryDetails ?? []) as Array<{
    bodyRegion: string;
    description: string;
    severity: string;
    treatment?: string;
  }>;

  function handleStatusTransition(newStatus: IncidentStatusValue) {
    setServerError(null);
    startTransition(async () => {
      const result = await onUpdateInvestigation(incident.id, {
        status: newStatus,
        investigationNotes: investigationNotes || undefined,
        outcome: outcome || undefined,
      });

      if (result.success) {
        toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
        router.refresh();
      } else {
        setServerError(result.error ?? 'Failed to update');
        toast.error(result.error ?? 'Failed to update');
      }
    });
  }

  function handleClose() {
    if (!outcome.trim()) {
      setServerError('Outcome is required to close an incident');
      return;
    }
    setServerError(null);
    startTransition(async () => {
      const result = await onCloseIncident(incident.id, { outcome });

      if (result.success) {
        toast.success('Incident closed');
        router.refresh();
      } else {
        setServerError(result.error ?? 'Failed to close incident');
        toast.error(result.error ?? 'Failed to close incident');
      }
    });
  }

  function handleSaveNotes() {
    setServerError(null);
    startTransition(async () => {
      const result = await onUpdateInvestigation(incident.id, {
        investigationNotes: investigationNotes || undefined,
        outcome: outcome || undefined,
      });

      if (result.success) {
        toast.success('Notes saved');
      } else {
        setServerError(result.error ?? 'Failed to save notes');
        toast.error(result.error ?? 'Failed to save notes');
      }
    });
  }

  const inputClass =
    'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors';

  return (
    <div className="space-y-6">
      {/* Server error */}
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {serverError}
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
              Incident Report
            </h1>
            <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
              {personName} — {locationLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            <NotifiableBadge
              isNotifiable={incident.isNotifiable}
              regulatoryBody={incident.regulatoryBody}
            />
            <DutyOfCandourBadge triggered={incident.dutyOfCandourTriggered} />
          </div>
        </div>

        {/* Workflow stepper */}
        <div className="mb-4 overflow-x-auto pb-1">
          <WorkflowStepper currentStatus={incident.status} />
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-[oklch(0.55_0_0)]">
          <span>
            Occurred:{' '}
            {new Date(incident.dateTime).toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {incident.reportedByName && (
            <span>Reported by: {incident.reportedByName}</span>
          )}
          {incident.closedAt && (
            <span>
              Closed:{' '}
              {new Date(incident.closedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-2">
          Description
        </h2>
        <p className="text-sm text-[oklch(0.35_0.02_160)] whitespace-pre-wrap">
          {incident.description}
        </p>
      </div>

      {/* Immediate actions */}
      {incident.immediateActions && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-2">
            Immediate actions taken
          </h2>
          <p className="text-sm text-[oklch(0.35_0.02_160)] whitespace-pre-wrap">
            {incident.immediateActions}
          </p>
        </div>
      )}

      {/* Involved persons */}
      {involvedPersons.length > 0 && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
            Persons involved
          </h2>
          <ul className="space-y-2">
            {involvedPersons.map((person, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(0.94_0.01_160)] text-[oklch(0.35_0.06_160)] text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="text-[oklch(0.22_0.04_160)] font-medium">
                  {person.name}
                </span>
                <span className="text-xs text-[oklch(0.55_0_0)]">
                  ({person.role})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Witnesses */}
      {witnesses.length > 0 && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
            Witnesses
          </h2>
          <ul className="space-y-3">
            {witnesses.map((witness, idx) => (
              <li key={idx} className="border-b border-[oklch(0.95_0.003_160)] last:border-0 pb-2 last:pb-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[oklch(0.22_0.04_160)] font-medium">
                    {witness.name}
                  </span>
                  <span className="text-xs text-[oklch(0.55_0_0)]">
                    ({witness.role})
                  </span>
                </div>
                {witness.statement && (
                  <p className="mt-1 text-xs text-[oklch(0.45_0.02_160)] italic">
                    &ldquo;{witness.statement}&rdquo;
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Injury details */}
      {injuryDetails.length > 0 && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
            Injury details
          </h2>
          <ul className="space-y-3">
            {injuryDetails.map((detail, idx) => (
              <li key={idx} className="rounded-lg border border-[oklch(0.91_0.005_160)] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                    {detail.bodyRegion}
                  </span>
                  <SeverityBadge severity={detail.severity} />
                </div>
                <p className="text-sm text-[oklch(0.45_0.02_160)]">
                  {detail.description}
                </p>
                {detail.treatment && (
                  <p className="mt-1 text-xs text-[oklch(0.55_0_0)]">
                    Treatment: {detail.treatment}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Investigation section (editable when user has update permission) */}
      {canUpdate && currentStatus !== 'closed' && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Investigation
          </h2>

          <div>
            <label htmlFor="investigation-notes" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Investigation notes
            </label>
            <textarea
              id="investigation-notes"
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              rows={4}
              placeholder="Record investigation findings..."
              className={cn(inputClass, 'resize-y')}
            />
          </div>

          <div>
            <label htmlFor="incident-outcome" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Outcome
            </label>
            <textarea
              id="incident-outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={3}
              placeholder="Record the outcome and any actions required..."
              className={cn(inputClass, 'resize-y')}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleSaveNotes}
              disabled={isPending}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              Save notes
            </button>

            {/* Status transition buttons */}
            {allowedTransitions.map((nextStatus) =>
              nextStatus === 'closed' ? (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={handleClose}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
                >
                  Close incident
                </button>
              ) : (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={() => handleStatusTransition(nextStatus)}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
                >
                  Move to {STATUS_LABELS[nextStatus]}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {/* Read-only investigation notes (when closed or no update permission) */}
      {(!canUpdate || currentStatus === 'closed') && incident.investigationNotes && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-2">
            Investigation notes
          </h2>
          <p className="text-sm text-[oklch(0.35_0.02_160)] whitespace-pre-wrap">
            {incident.investigationNotes}
          </p>
        </div>
      )}

      {/* Read-only outcome (when closed) */}
      {currentStatus === 'closed' && incident.outcome && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-2">
            Outcome
          </h2>
          <p className="text-sm text-[oklch(0.35_0.02_160)] whitespace-pre-wrap">
            {incident.outcome}
          </p>
        </div>
      )}

      {/* Back link */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/persons/${personId}/incidents`}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          Back to incidents
        </Link>
      </div>
    </div>
  );
}
