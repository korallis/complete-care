'use client';

/**
 * PrnFollowUpForm — post-dose assessment and effectiveness recording.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PrnAdministrationListItem } from '@/features/prn/actions';
import type { RecordFollowUpInput } from '@/features/prn/schema';
import type { PrnPreDoseAssessment, PrnAdministration } from '@/lib/db/schema/prn-protocols';
import {
  PAIN_SCORES,
  PAIN_SCORE_LABELS,
  getPainSeverity,
  getPainSeverityColor,
  EFFECT_OUTCOMES,
  EFFECT_OUTCOME_LABELS,
  type EffectOutcome,
} from '@/features/prn/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PrnFollowUpFormProps = {
  administration: PrnAdministrationListItem;
  orgSlug: string;
  personId: string;
  onSubmit: (data: RecordFollowUpInput) => Promise<{ success: boolean; error?: string; data?: PrnAdministration }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
// Component
// ---------------------------------------------------------------------------

export function PrnFollowUpForm({
  administration,
  orgSlug,
  personId,
  onSubmit,
}: PrnFollowUpFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const [painScore, setPainScore] = useState<number>(0);
  const [effectAchieved, setEffectAchieved] = useState<EffectOutcome | ''>('');
  const [notes, setNotes] = useState('');
  const [followUpActions, setFollowUpActions] = useState('');

  const pre = administration.preDoseAssessment as PrnPreDoseAssessment;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!effectAchieved) {
      setServerError('Please select the effectiveness outcome');
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        prnAdministrationId: administration.id,
        postDoseAssessment: {
          painScore,
          effectAchieved,
          notes: notes || undefined,
        },
        followUpActions: followUpActions || null,
      });

      if (result.success) {
        toast.success('Follow-up assessment recorded');
        router.push(`/${orgSlug}/persons/${personId}/emar/prn`);
      } else {
        setServerError(result.error ?? 'An error occurred');
        toast.error(result.error ?? 'Failed to record follow-up');
      }
    });
  }

  const severity = getPainSeverity(painScore);
  const severityColors = getPainSeverityColor(severity);
  const preSeverity = getPainSeverity(pre.painScore);
  const preSeverityColors = getPainSeverityColor(preSeverity);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="PRN follow-up form">
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {serverError}
        </div>
      )}

      {/* Pre-dose summary */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-[oklch(0.97_0.005_160)] p-4">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
          Administration Summary
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-[oklch(0.55_0_0)]">Medication</p>
            <p className="font-medium text-[oklch(0.22_0.04_160)]">
              {administration.medication.drugName} {administration.medication.dose}{administration.medication.doseUnit}
            </p>
          </div>
          <div>
            <p className="text-xs text-[oklch(0.55_0_0)]">Administered</p>
            <p className="font-medium text-[oklch(0.22_0.04_160)]">
              {formatDateTime(administration.administeredAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[oklch(0.55_0_0)]">Pre-dose Pain Score</p>
            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${preSeverityColors.bg} ${preSeverityColors.text} ${preSeverityColors.border} border mt-0.5`}>
              {pre.painScore}/10
            </div>
          </div>
          <div>
            <p className="text-xs text-[oklch(0.55_0_0)]">By</p>
            <p className="font-medium text-[oklch(0.22_0.04_160)]">
              {administration.administeredByName ?? 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Post-dose assessment */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Post-Dose Assessment
        </h2>

        {/* Pain score */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
            Current Pain Score (0-10) <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="flex items-center gap-1 mb-2">
            {PAIN_SCORES.map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setPainScore(score)}
                className={`w-9 h-9 rounded-lg text-xs font-medium transition-colors ${
                  painScore === score
                    ? 'bg-[oklch(0.3_0.08_160)] text-white'
                    : 'border border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)]'
                }`}
                aria-label={PAIN_SCORE_LABELS[score]}
                aria-pressed={painScore === score}
              >
                {score}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${severityColors.bg} ${severityColors.text} ${severityColors.border} border`}>
              {severity.charAt(0).toUpperCase() + severity.slice(1)} ({painScore}/10)
            </span>
            {painScore < pre.painScore && (
              <span className="text-xs text-emerald-600">
                Improved by {pre.painScore - painScore} points
              </span>
            )}
            {painScore > pre.painScore && (
              <span className="text-xs text-red-600">
                Increased by {painScore - pre.painScore} points
              </span>
            )}
            {painScore === pre.painScore && (
              <span className="text-xs text-[oklch(0.55_0_0)]">No change</span>
            )}
          </div>
        </div>

        {/* Effectiveness */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
            Was the expected effect achieved? <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="space-y-2">
            {EFFECT_OUTCOMES.map((outcome) => (
              <label
                key={outcome}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  effectAchieved === outcome
                    ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.97_0.01_160)]'
                    : 'border-[oklch(0.91_0.005_160)] hover:bg-[oklch(0.985_0.003_160)]'
                }`}
              >
                <input
                  type="radio"
                  name="effectAchieved"
                  value={outcome}
                  checked={effectAchieved === outcome}
                  onChange={() => setEffectAchieved(outcome)}
                />
                <span className="text-sm text-[oklch(0.22_0.04_160)]">
                  {EFFECT_OUTCOME_LABELS[outcome]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="prn-followup-notes" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
            Notes
          </label>
          <textarea
            id="prn-followup-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observations about effectiveness..."
            rows={2}
            className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
          />
        </div>
      </div>

      {/* Follow-up actions (shown when not fully effective) */}
      {(effectAchieved === 'partial' || effectAchieved === 'no') && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-3">
            Follow-Up Actions Required
          </h2>
          <textarea
            id="prn-followup-actions"
            value={followUpActions}
            onChange={(e) => setFollowUpActions(e.target.value)}
            placeholder="e.g., Repositioned, applied cold compress, will reassess in 30 minutes, contacted GP..."
            rows={3}
            className="w-full resize-y rounded-lg border border-amber-300 bg-white px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !effectAchieved}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-5 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          aria-busy={isPending}
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            'Record Follow-Up'
          )}
        </button>
      </div>
    </form>
  );
}
