'use client';

/**
 * RestraintList — displays restraint records for a child.
 */

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import type { Restraint } from '@/lib/db/schema';
import {
  RESTRAINT_TECHNIQUE_LABELS,
  type RestraintTechnique,
} from '../constants';
import type { reviewRestraint, updateRestraint } from '../actions';

type RestraintListProps = {
  restraints: Restraint[];
  orgSlug: string;
  personId: string;
  canCreate: boolean;
  canUpdate: boolean;
  canApprove: boolean;
  onUpdateDebrief: typeof updateRestraint;
  onReview: typeof reviewRestraint;
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RestraintCard({
  restraint,
  canUpdate,
  canApprove,
  onSaveDebrief,
  onSignOff,
}: {
  restraint: Restraint;
  canUpdate: boolean;
  canApprove: boolean;
  onSaveDebrief: (restraintId: string, input: { childDebrief: string; staffDebrief: string }) => Promise<void>;
  onSignOff: (restraintId: string, managementReview: string) => Promise<void>;
}) {
  const techniqueLabel =
    RESTRAINT_TECHNIQUE_LABELS[restraint.technique as RestraintTechnique] ??
    restraint.technique;

  const [childDebrief, setChildDebrief] = useState(restraint.childDebrief ?? '');
  const [staffDebrief, setStaffDebrief] = useState(restraint.staffDebrief ?? '');
  const [managementReview, setManagementReview] = useState('');
  const [isSavingDebrief, setIsSavingDebrief] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);

  const hasDebrief = !!restraint.childDebrief?.trim() && !!restraint.staffDebrief?.trim();
  const hasReview = !!restraint.managementReview;
  const injuryCheck = restraint.injuryCheck as {
    childInjured?: boolean;
    staffInjured?: boolean;
    medicalAttentionRequired?: boolean;
  } | null;
  const anyInjury = injuryCheck?.childInjured || injuryCheck?.staffInjured;
  const medicalRequired = injuryCheck?.medicalAttentionRequired;
  const canSubmitDebrief = childDebrief.trim().length > 0 && staffDebrief.trim().length > 0;

  async function handleSaveDebrief() {
    if (!canSubmitDebrief) return;
    setIsSavingDebrief(true);
    try {
      await onSaveDebrief(restraint.id, {
        childDebrief: childDebrief.trim(),
        staffDebrief: staffDebrief.trim(),
      });
    } finally {
      setIsSavingDebrief(false);
    }
  }

  async function handleSignOff() {
    if (!managementReview.trim()) return;
    setIsSavingReview(true);
    try {
      await onSignOff(restraint.id, managementReview.trim());
      setManagementReview('');
    } finally {
      setIsSavingReview(false);
    }
  }

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              anyInjury ? 'bg-red-50' : 'bg-orange-50'
            }`}
          >
            <svg
              className={`h-4 w-4 ${anyInjury ? 'text-red-600' : 'text-orange-600'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                {techniqueLabel}
              </span>
              <span className="text-xs text-[oklch(0.65_0_0)]">
                {formatDateTime(restraint.dateTime)}
              </span>
            </div>
            <p className="text-sm text-[oklch(0.45_0.02_160)] line-clamp-2 mb-3">
              {restraint.reason}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {restraint.duration} min
              </span>
              {anyInjury && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Injury
                </span>
              )}
              {medicalRequired && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Medical attention
                </span>
              )}
              {hasDebrief ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Debrief done
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Debrief needed
                </span>
              )}
              {hasReview && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  Reviewed
                </span>
              )}
            </div>

            {(restraint.childDebrief || restraint.staffDebrief || restraint.managementReview) && (
              <div className="mt-4 space-y-2 rounded-lg bg-[oklch(0.985_0.003_160)] p-3">
                {restraint.childDebrief && (
                  <p className="text-xs text-[oklch(0.5_0_0)]">
                    <span className="font-medium text-[oklch(0.35_0.04_160)]">Child debrief:</span>{' '}
                    {restraint.childDebrief}
                  </p>
                )}
                {restraint.staffDebrief && (
                  <p className="text-xs text-[oklch(0.5_0_0)]">
                    <span className="font-medium text-[oklch(0.35_0.04_160)]">Staff debrief:</span>{' '}
                    {restraint.staffDebrief}
                  </p>
                )}
                {restraint.managementReview && (
                  <p className="text-xs text-[oklch(0.5_0_0)]">
                    <span className="font-medium text-[oklch(0.35_0.04_160)]">Manager sign-off:</span>{' '}
                    {restraint.managementReview}
                  </p>
                )}
              </div>
            )}

            {canUpdate && !hasDebrief && (
              <div className="mt-4 space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">Complete mandatory debrief</h3>
                  <p className="text-xs text-amber-800">
                    Record both child and staff debriefs before management sign-off.
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-amber-900">
                      Child debrief
                    </label>
                    <textarea
                      aria-label="Child debrief"
                      value={childDebrief}
                      onChange={(event) => setChildDebrief(event.target.value)}
                      rows={2}
                      className="block w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-amber-900">
                      Staff debrief
                    </label>
                    <textarea
                      aria-label="Staff debrief"
                      value={staffDebrief}
                      onChange={(event) => setStaffDebrief(event.target.value)}
                      rows={2}
                      className="block w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canSubmitDebrief || isSavingDebrief}
                  onClick={() => void handleSaveDebrief()}
                  className="rounded-md bg-amber-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  {isSavingDebrief ? 'Saving…' : 'Save debrief'}
                </button>
              </div>
            )}

            {canApprove && hasDebrief && !hasReview && (
              <div className="mt-4 space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Manager sign-off</h3>
                  <p className="text-xs text-blue-800">
                    Record the management review once both debriefs are complete.
                  </p>
                </div>
                <textarea
                  aria-label="Manager sign-off"
                  value={managementReview}
                  onChange={(event) => setManagementReview(event.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)]"
                />
                <button
                  type="button"
                  disabled={!managementReview.trim() || isSavingReview}
                  onClick={() => void handleSignOff()}
                  className="rounded-md bg-blue-700 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                >
                  {isSavingReview ? 'Saving…' : 'Record manager sign-off'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RestraintList({
  restraints: initialRestraints,
  orgSlug,
  personId,
  canCreate,
  canUpdate,
  canApprove,
  onUpdateDebrief,
  onReview,
}: RestraintListProps) {
  const [restraints, setRestraints] = useState(initialRestraints);

  async function handleSaveDebrief(
    restraintId: string,
    input: { childDebrief: string; staffDebrief: string },
  ) {
    const result = await onUpdateDebrief(restraintId, input);
    if (!result.success || !result.data) {
      toast.error(!result.success ? result.error ?? 'Failed to save debrief' : 'Failed to save debrief');
      return;
    }

    setRestraints((current) =>
      current.map((item) => (item.id === restraintId ? result.data! : item)),
    );
    toast.success('Debrief saved');
  }

  async function handleSignOff(restraintId: string, managementReview: string) {
    const result = await onReview(restraintId, managementReview);
    if (!result.success || !result.data) {
      toast.error(
        !result.success
          ? result.error ?? 'Failed to record manager sign-off'
          : 'Failed to record manager sign-off',
      );
      return;
    }

    setRestraints((current) =>
      current.map((item) => (item.id === restraintId ? result.data! : item)),
    );
    toast.success('Manager sign-off recorded');
  }

  if (restraints.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-50">
          <svg
            className="h-5 w-5 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          No restraints recorded
        </h3>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-4">
          No physical interventions have been recorded for this child.
        </p>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/keyworker/restraints/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            Record restraint
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {restraints.map((r) => (
        <RestraintCard
          key={r.id}
          restraint={r}
          canUpdate={canUpdate}
          canApprove={canApprove}
          onSaveDebrief={handleSaveDebrief}
          onSignOff={handleSignOff}
        />
      ))}
    </div>
  );
}
