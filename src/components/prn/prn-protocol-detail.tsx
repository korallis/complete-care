'use client';

/**
 * PrnProtocolDetail — displays protocol information with administration history.
 */

import Link from 'next/link';
import type { PrnProtocolDetail as PrnProtocolDetailType } from '@/features/prn/actions';
import type { PrnAdministrationListItem } from '@/features/prn/actions';
import type { PrnSignSymptom, PrnPreDoseAssessment, PrnPostDoseAssessment } from '@/lib/db/schema/prn-protocols';
import {
  getPainSeverity,
  getPainSeverityColor,
  getEffectColor,
  EFFECT_OUTCOME_LABELS,
  type EffectOutcome,
} from '@/features/prn/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PrnProtocolDetailProps = {
  protocol: PrnProtocolDetailType;
  administrations: PrnAdministrationListItem[];
  orgSlug: string;
  personId: string;
  canAdminister: boolean;
  canEdit: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
  return `${hours}h ${remaining}m`;
}

function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ---------------------------------------------------------------------------
// Pain score badge
// ---------------------------------------------------------------------------

function PainScoreBadge({ score }: { score: number }) {
  const severity = getPainSeverity(score);
  const colors = getPainSeverityColor(severity);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
    >
      {score}/10
    </span>
  );
}

// ---------------------------------------------------------------------------
// Effect badge
// ---------------------------------------------------------------------------

function EffectBadge({ outcome }: { outcome: string }) {
  const colors = getEffectColor(outcome);
  const label = EFFECT_OUTCOME_LABELS[outcome as EffectOutcome] ?? outcome;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PrnProtocolDetail({
  protocol,
  administrations,
  orgSlug,
  personId,
  canAdminister,
  canEdit,
}: PrnProtocolDetailProps) {
  const symptoms = (protocol.signsSymptoms as PrnSignSymptom[]) ?? [];

  return (
    <div className="space-y-6">
      {/* Protocol header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            {protocol.medication.drugName} PRN Protocol
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            {protocol.medication.dose} {protocol.medication.doseUnit} &mdash;{' '}
            {protocol.indication}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canAdminister && (
            <Link
              href={`/${orgSlug}/persons/${personId}/emar/prn/administer?protocolId=${protocol.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Administer
            </Link>
          )}
          {canEdit && (
            <Link
              href={`/${orgSlug}/persons/${personId}/emar/prn/${protocol.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              Edit
            </Link>
          )}
        </div>
      </div>

      {/* Protocol details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinical info */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Clinical Information
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Indication</dt>
              <dd className="text-sm text-[oklch(0.22_0.04_160)] mt-0.5">{protocol.indication}</dd>
            </div>
            {symptoms.length > 0 && (
              <div>
                <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Signs & Symptoms</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {symptoms.map((s) => (
                    <span
                      key={s.description}
                      className="inline-flex rounded-full bg-[oklch(0.94_0.015_160)] px-2.5 py-0.5 text-xs text-[oklch(0.3_0.08_160)]"
                    >
                      {s.description}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Expected Effect</dt>
              <dd className="text-sm text-[oklch(0.22_0.04_160)] mt-0.5">{protocol.expectedEffect}</dd>
            </div>
            {protocol.nonPharmAlternatives && (
              <div>
                <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Non-Pharmacological Alternatives</dt>
                <dd className="text-sm text-[oklch(0.22_0.04_160)] mt-0.5">{protocol.nonPharmAlternatives}</dd>
              </div>
            )}
            {protocol.escalationCriteria && (
              <div>
                <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Escalation Criteria</dt>
                <dd className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 mt-0.5">
                  {protocol.escalationCriteria}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Dosing parameters */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Dosing Parameters
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Dose Range</dt>
              <dd className="text-sm font-medium text-[oklch(0.22_0.04_160)] mt-0.5">{protocol.doseRange}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Max 24-Hour Dose</dt>
              <dd className="text-sm font-medium text-[oklch(0.22_0.04_160)] mt-0.5">{protocol.maxDose24hr}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Minimum Interval</dt>
              <dd className="text-sm text-[oklch(0.22_0.04_160)] mt-0.5">{formatMinutes(protocol.minInterval)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Follow-Up Assessment</dt>
              <dd className="text-sm text-[oklch(0.22_0.04_160)] mt-0.5">{formatMinutes(protocol.followUpMinutes)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Administration history */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Administration History
        </h3>

        {administrations.length === 0 ? (
          <p className="text-sm text-[oklch(0.55_0_0)] py-4 text-center">
            No PRN administrations recorded yet.
          </p>
        ) : (
          <div className="space-y-3">
            {administrations.map((admin) => {
              const pre = admin.preDoseAssessment as PrnPreDoseAssessment;
              const post = admin.postDoseAssessment as PrnPostDoseAssessment | null;

              return (
                <div
                  key={admin.id}
                  className="rounded-lg border border-[oklch(0.92_0.003_160)] bg-[oklch(0.985_0.003_160)] p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                        {formatDateTime(admin.administeredAt)}
                      </p>
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        By: {admin.administeredByName ?? 'Unknown'}
                      </p>
                    </div>
                    {post ? (
                      <EffectBadge outcome={post.effectAchieved} />
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                        Awaiting follow-up
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-medium text-[oklch(0.55_0_0)] mb-1">Pre-dose</p>
                      <p className="text-[oklch(0.35_0.04_160)]">
                        Pain: <PainScoreBadge score={pre.painScore} />
                      </p>
                      {pre.symptoms && pre.symptoms.length > 0 && (
                        <p className="text-[oklch(0.45_0.03_160)] mt-1">
                          {pre.symptoms.join(', ')}
                        </p>
                      )}
                    </div>
                    {post && (
                      <div>
                        <p className="font-medium text-[oklch(0.55_0_0)] mb-1">Post-dose</p>
                        <p className="text-[oklch(0.35_0.04_160)]">
                          Pain: <PainScoreBadge score={post.painScore} />
                        </p>
                        {post.notes && (
                          <p className="text-[oklch(0.45_0.03_160)] mt-1">{post.notes}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {admin.followUpActions && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                      Follow-up: {admin.followUpActions}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
