'use client';

/**
 * CancellationForm -- form to cancel a visit with reason code,
 * billing exclusion toggle, and carer notification.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { cancelVisit } from '@/features/rota/actions';
import {
  CANCELLATION_REASONS,
  CANCELLATION_REASON_LABELS,
  type CancellationReason,
} from '@/features/rota/constants';

type CancellationFormProps = {
  visitId: string;
  visitDate: string;
  visitTime: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function CancellationForm({
  visitId,
  visitDate,
  visitTime,
  onClose,
  onSuccess,
}: CancellationFormProps) {
  const [reasonCode, setReasonCode] = useState<CancellationReason | ''>('');
  const [reasonNotes, setReasonNotes] = useState('');
  const [billingExcluded, setBillingExcluded] = useState(true);
  const [carerNotified, setCarerNotified] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reasonCode) return;

    startTransition(async () => {
      const result = await cancelVisit({
        visitId,
        reasonCode,
        reasonNotes: reasonNotes || null,
        billingExcluded,
        carerNotified,
      });

      if (result.success) {
        toast.success('Visit cancelled successfully');
        onSuccess();
      } else {
        toast.error(result.error ?? 'Failed to cancel visit');
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-visit-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[oklch(0.91_0.005_160)] bg-white p-6 shadow-xl">
        <h2
          id="cancel-visit-title"
          className="text-lg font-semibold text-[oklch(0.18_0.02_160)]"
        >
          Cancel Visit
        </h2>
        <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
          Visit on {visitDate} at {visitTime}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Reason code */}
          <div>
            <label
              htmlFor="cancel-reason"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Cancellation reason <span className="text-red-500">*</span>
            </label>
            <select
              id="cancel-reason"
              value={reasonCode}
              onChange={(e) =>
                setReasonCode(e.target.value as CancellationReason)
              }
              required
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            >
              <option value="">Select reason...</option>
              {CANCELLATION_REASONS.map((code) => (
                <option key={code} value={code}>
                  {CANCELLATION_REASON_LABELS[code]}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="cancel-notes"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Additional notes
            </label>
            <textarea
              id="cancel-notes"
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Any additional details..."
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] resize-none"
            />
          </div>

          {/* Billing exclusion */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={billingExcluded}
              onChange={(e) => setBillingExcluded(e.target.checked)}
              className="h-4 w-4 rounded border-[oklch(0.75_0_0)] text-[oklch(0.45_0.1_160)] focus:ring-[oklch(0.5_0.1_160)/0.3]"
            />
            <span className="text-sm text-[oklch(0.35_0.04_160)]">
              Exclude from billing
            </span>
          </label>

          {/* Carer notified */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={carerNotified}
              onChange={(e) => setCarerNotified(e.target.checked)}
              className="h-4 w-4 rounded border-[oklch(0.75_0_0)] text-[oklch(0.45_0.1_160)] focus:ring-[oklch(0.5_0.1_160)/0.3]"
            />
            <span className="text-sm text-[oklch(0.35_0.04_160)]">
              Carer has been notified
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors disabled:opacity-50"
            >
              Keep Visit
            </button>
            <button
              type="submit"
              disabled={isPending || !reasonCode}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50',
                'bg-red-600 hover:bg-red-700',
              )}
            >
              {isPending ? 'Cancelling...' : 'Cancel Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
