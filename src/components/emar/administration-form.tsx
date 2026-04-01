'use client';

/**
 * AdministrationForm — record medication administration status.
 * Opened as a modal/dialog from the MAR chart cell.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  ADMINISTRATION_STATUSES,
  ADMINISTRATION_STATUS_LABELS,
  STATUSES_REQUIRING_REASON,
} from '@/features/emar/constants';
import type { RecordAdministrationInput } from '@/features/emar/schema';
import type { Medication, MedicationAdministration } from '@/lib/db/schema/medications';
import { formatTime } from '@/features/emar/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdministrationFormProps = {
  medication: Medication;
  scheduledTime: string;
  existingAdministration?: MedicationAdministration | null;
  personId: string;
  onSubmit: (personId: string, input: RecordAdministrationInput) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdministrationForm({
  medication,
  scheduledTime,
  existingAdministration,
  personId,
  onSubmit,
  onClose,
}: AdministrationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string>(
    existingAdministration?.status ?? 'given',
  );
  const [reason, setReason] = useState(existingAdministration?.reason ?? '');
  const [witnessName, setWitnessName] = useState(existingAdministration?.witnessName ?? '');
  const [notes, setNotes] = useState(existingAdministration?.notes ?? '');

  const needsReason = STATUSES_REQUIRING_REASON.includes(
    status as typeof STATUSES_REQUIRING_REASON[number],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (needsReason && !reason.trim()) {
      toast.error('Reason is required for this status');
      return;
    }

    startTransition(async () => {
      const input: RecordAdministrationInput = {
        medicationId: medication.id,
        scheduledTime,
        administeredAt: status === 'given' || status === 'self_administered'
          ? new Date().toISOString()
          : null,
        status: status as typeof ADMINISTRATION_STATUSES[number],
        reason: reason || null,
        witnessName: witnessName || null,
        notes: notes || null,
      };

      const result = await onSubmit(personId, input);

      if (result.success) {
        toast.success('Administration recorded');
        onClose();
      } else {
        toast.error(result.error ?? 'Failed to record administration');
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Record administration"
    >
      <div className="w-full max-w-md rounded-2xl border border-[oklch(0.91_0.005_160)] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[oklch(0.91_0.005_160)] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">
              Record Administration
            </h2>
            <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
              {medication.drugName} {medication.dose}{medication.doseUnit} at {formatTime(scheduledTime)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[oklch(0.65_0_0)] hover:text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
              Status <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ADMINISTRATION_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    status === s
                      ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.3_0.08_160)] text-white'
                      : 'border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)]'
                  }`}
                  aria-pressed={status === s}
                >
                  {ADMINISTRATION_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Reason (conditional) */}
          {needsReason && (
            <div>
              <label htmlFor="admin-reason" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
                Reason <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <textarea
                id="admin-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Document the reason..."
                rows={3}
                className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
                aria-required="true"
              />
            </div>
          )}

          {/* Witness */}
          <div>
            <label htmlFor="admin-witness" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Witness name <span className="text-[oklch(0.65_0_0)]">(if required)</span>
            </label>
            <input
              id="admin-witness"
              type="text"
              value={witnessName}
              onChange={(e) => setWitnessName(e.target.value)}
              placeholder="e.g., Jane Doe"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="admin-notes" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Notes
            </label>
            <textarea
              id="admin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional observations..."
              rows={2}
              className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors"
              aria-busy={isPending}
            >
              {isPending ? 'Recording...' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
