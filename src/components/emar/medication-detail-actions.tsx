'use client';

/**
 * MedicationDetailActions — discontinue/suspend/complete medication actions.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { DiscontinueMedicationInput } from '@/features/emar/schema';
import type { Medication } from '@/lib/db/schema/medications';

type MedicationDetailActionsProps = {
  medicationId: string;
  onDiscontinue: (
    id: string,
    input: DiscontinueMedicationInput,
  ) => Promise<{ success: boolean; error?: string; data?: Medication }>;
  orgSlug?: string;
  personId?: string;
};

export function MedicationDetailActions({
  medicationId,
  onDiscontinue,
}: MedicationDetailActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'discontinued' | 'suspended' | 'completed'>('discontinued');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    startTransition(async () => {
      const result = await onDiscontinue(medicationId, {
        reason,
        status: action,
      });

      if (result.success) {
        toast.success(
          action === 'discontinued'
            ? 'Medication discontinued'
            : action === 'suspended'
              ? 'Medication suspended'
              : 'Medication completed',
        );
        setShowModal(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to update medication');
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { setAction('discontinued'); setShowModal(true); }}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
        >
          Discontinue
        </button>
        <button
          type="button"
          onClick={() => { setAction('suspended'); setShowModal(true); }}
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
        >
          Suspend
        </button>
        <button
          type="button"
          onClick={() => { setAction('completed'); setShowModal(true); }}
          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          Complete
        </button>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${action} medication`}
        >
          <div className="w-full max-w-md rounded-2xl border border-[oklch(0.91_0.005_160)] bg-white shadow-xl">
            <div className="border-b border-[oklch(0.91_0.005_160)] px-5 py-4">
              <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)] capitalize">
                {action === 'discontinued' ? 'Discontinue' : action === 'suspended' ? 'Suspend' : 'Complete'} Medication
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label htmlFor="discontinue-reason" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
                  Reason <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="discontinue-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Document the reason..."
                  rows={4}
                  className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
                  aria-required="true"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                  aria-busy={isPending}
                >
                  {isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
