'use client';

/**
 * HospitalAdmissionForm -- record a hospital admission for a client.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { admitToHospital } from '@/features/rota/actions';

type HospitalAdmissionFormProps = {
  personId: string;
  personName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function HospitalAdmissionForm({
  personId,
  personName,
  onClose,
  onSuccess,
}: HospitalAdmissionFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [admittedDate, setAdmittedDate] = useState(today);
  const [hospital, setHospital] = useState('');
  const [ward, setWard] = useState('');
  const [expectedDischarge, setExpectedDischarge] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [suspendVisits, setSuspendVisits] = useState(true);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await admitToHospital({
        personId,
        admittedDate,
        hospital,
        ward: ward || null,
        expectedDischarge: expectedDischarge || null,
        reason: reason || null,
        notes: notes || null,
        suspendVisits,
      });

      if (result.success) {
        toast.success(
          suspendVisits
            ? 'Hospital admission recorded and visits suspended'
            : 'Hospital admission recorded',
        );
        onSuccess();
      } else {
        toast.error(result.error ?? 'Failed to record admission');
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hospital-admission-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[oklch(0.91_0.005_160)] bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2
          id="hospital-admission-title"
          className="text-lg font-semibold text-[oklch(0.18_0.02_160)]"
        >
          Hospital Admission
        </h2>
        <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
          Record hospital admission for {personName}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Admission date */}
            <div>
              <label
                htmlFor="admitted-date"
                className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
              >
                Admission date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="admitted-date"
                value={admittedDate}
                onChange={(e) => setAdmittedDate(e.target.value)}
                required
                className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
              />
            </div>

            {/* Expected discharge */}
            <div>
              <label
                htmlFor="expected-discharge"
                className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
              >
                Expected discharge
              </label>
              <input
                type="date"
                id="expected-discharge"
                value={expectedDischarge}
                onChange={(e) => setExpectedDischarge(e.target.value)}
                className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
              />
            </div>
          </div>

          {/* Hospital */}
          <div>
            <label
              htmlFor="hospital-name"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Hospital <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="hospital-name"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              required
              maxLength={255}
              placeholder="e.g. Royal Infirmary"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
          </div>

          {/* Ward */}
          <div>
            <label
              htmlFor="ward-name"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Ward
            </label>
            <input
              type="text"
              id="ward-name"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              maxLength={100}
              placeholder="e.g. Ward 7B"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
          </div>

          {/* Reason */}
          <div>
            <label
              htmlFor="admission-reason"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Reason for admission
            </label>
            <input
              type="text"
              id="admission-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={2000}
              placeholder="e.g. Fall at home, suspected fracture"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="admission-notes"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Notes
            </label>
            <textarea
              id="admission-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Any additional information..."
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] resize-none"
            />
          </div>

          {/* Suspend visits */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={suspendVisits}
              onChange={(e) => setSuspendVisits(e.target.checked)}
              className="h-4 w-4 rounded border-[oklch(0.75_0_0)] text-[oklch(0.45_0.1_160)] focus:ring-[oklch(0.5_0.1_160)/0.3]"
            />
            <span className="text-sm text-[oklch(0.35_0.04_160)]">
              Auto-suspend scheduled visits during admission
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !hospital || !admittedDate}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50',
                'bg-red-600 hover:bg-red-700',
              )}
            >
              {isPending ? 'Recording...' : 'Record Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
