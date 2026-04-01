'use client';

/**
 * PrnAdministrationForm — pre-dose assessment + record PRN administration.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PrnProtocolListItem } from '@/features/prn/actions';
import type { RecordPrnAdministrationInput } from '@/features/prn/schema';
import type { PrnSignSymptom } from '@/lib/db/schema/prn-protocols';
import {
  PAIN_SCORES,
  PAIN_SCORE_LABELS,
  getPainSeverity,
  getPainSeverityColor,
} from '@/features/prn/constants';
import type { PrnAdministration } from '@/lib/db/schema/prn-protocols';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PrnAdministrationFormProps = {
  protocols: PrnProtocolListItem[];
  selectedProtocolId?: string;
  personId: string;
  orgSlug: string;
  onSubmit: (data: RecordPrnAdministrationInput) => Promise<{ success: boolean; error?: string; data?: PrnAdministration }>;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrnAdministrationForm({
  protocols,
  selectedProtocolId,
  personId,
  orgSlug,
  onSubmit,
}: PrnAdministrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const [protocolId, setProtocolId] = useState(selectedProtocolId ?? '');
  const [painScore, setPainScore] = useState<number>(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const selectedProtocol = protocols.find((p) => p.id === protocolId);
  const protocolSymptoms = selectedProtocol
    ? (selectedProtocol.signsSymptoms as PrnSignSymptom[] ?? [])
    : [];

  function toggleSymptom(symptom: string) {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!protocolId || !selectedProtocol) {
      setServerError('Please select a PRN protocol');
      return;
    }

    startTransition(async () => {
      const result = await onSubmit({
        prnProtocolId: protocolId,
        medicationId: selectedProtocol.medicationId,
        personId,
        preDoseAssessment: {
          painScore,
          symptoms: selectedSymptoms,
          notes: notes || undefined,
        },
      });

      if (result.success) {
        toast.success('PRN medication administered');
        router.push(`/${orgSlug}/persons/${personId}/emar/prn`);
      } else {
        setServerError(result.error ?? 'An error occurred');
        toast.error(result.error ?? 'Failed to record administration');
      }
    });
  }

  const severity = getPainSeverity(painScore);
  const severityColors = getPainSeverityColor(severity);

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="PRN administration form">
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {serverError}
        </div>
      )}

      {/* Protocol selection */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Select PRN Medication
        </h2>

        {protocols.length === 0 ? (
          <p className="text-sm text-[oklch(0.55_0_0)] py-4 text-center">
            No PRN protocols available. Create a protocol first.
          </p>
        ) : (
          <div className="space-y-2">
            {protocols.map((p) => (
              <label
                key={p.id}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  protocolId === p.id
                    ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.97_0.01_160)]'
                    : 'border-[oklch(0.91_0.005_160)] hover:bg-[oklch(0.985_0.003_160)]'
                }`}
              >
                <input
                  type="radio"
                  name="protocolId"
                  value={p.id}
                  checked={protocolId === p.id}
                  onChange={() => {
                    setProtocolId(p.id);
                    setSelectedSymptoms([]);
                  }}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                    {p.medication.drugName}
                  </p>
                  <p className="text-xs text-[oklch(0.55_0_0)]">
                    {p.indication} &mdash; {p.doseRange}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Pre-dose assessment */}
      {selectedProtocol && (
        <>
          {/* Non-pharmacological alternatives reminder */}
          {selectedProtocol.nonPharmAlternatives && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                Consider Non-Pharmacological Alternatives First
              </p>
              <p className="text-sm text-blue-800">
                {selectedProtocol.nonPharmAlternatives}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
            <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
              Pre-Dose Assessment
            </h2>

            {/* Pain score */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
                Pain Score (0-10) <span className="text-red-500" aria-hidden="true">*</span>
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
              <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${severityColors.bg} ${severityColors.text} ${severityColors.border} border`}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)} pain ({painScore}/10)
              </div>
            </div>

            {/* Observed symptoms */}
            {protocolSymptoms.length > 0 && (
              <div className="mb-5">
                <label className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
                  Observed Symptoms
                </label>
                <div className="flex flex-wrap gap-2">
                  {protocolSymptoms.map((s) => (
                    <button
                      key={s.description}
                      type="button"
                      onClick={() => toggleSymptom(s.description)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedSymptoms.includes(s.description)
                          ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.3_0.08_160)] text-white'
                          : 'border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)]'
                      }`}
                      aria-pressed={selectedSymptoms.includes(s.description)}
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label htmlFor="prn-admin-notes" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
                Assessment Notes
              </label>
              <textarea
                id="prn-admin-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional observations..."
                rows={2}
                className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
              />
            </div>
          </div>

          {/* Protocol guidance reminder */}
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-[oklch(0.97_0.005_160)] p-4">
            <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide mb-1">
              Protocol Reminder
            </p>
            <p className="text-sm text-[oklch(0.35_0.04_160)]">
              Dose range: <strong>{selectedProtocol.doseRange}</strong> &mdash;
              Max 24hr: <strong>{selectedProtocol.maxDose24hr}</strong> &mdash;
              Follow up in <strong>{selectedProtocol.followUpMinutes} minutes</strong>
            </p>
            {selectedProtocol.expectedEffect && (
              <p className="text-sm text-[oklch(0.45_0.03_160)] mt-1">
                Expected: {selectedProtocol.expectedEffect}
              </p>
            )}
          </div>
        </>
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
          disabled={isPending || !protocolId}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-5 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          aria-busy={isPending}
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Recording...
            </>
          ) : (
            'Record Administration'
          )}
        </button>
      </div>
    </form>
  );
}
