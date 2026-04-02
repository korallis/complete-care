'use client';

/**
 * HospitalStatusBanner -- displays when a client is currently admitted to hospital.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { dischargeFromHospital } from '@/features/rota/actions';
import type { HospitalAdmission } from '@/lib/db/schema/rota';

type HospitalStatusBannerProps = {
  admission: HospitalAdmission;
  personName: string;
};

export function HospitalStatusBanner({
  admission,
  personName,
}: HospitalStatusBannerProps) {
  const [showDischarge, setShowDischarge] = useState(false);
  const [dischargeDate, setDischargeDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleDischarge(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await dischargeFromHospital({
        admissionId: admission.id,
        dischargedDate: dischargeDate,
        notes: dischargeNotes || null,
        resumeVisits: true,
      });

      if (result.success) {
        toast.success(`${personName} discharged from hospital`);
        setShowDischarge(false);
      } else {
        toast.error(result.error ?? 'Failed to record discharge');
      }
    });
  }

  if (admission.status === 'discharged') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-emerald-600 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium text-emerald-800">
            Discharged from {admission.hospital}
            {admission.dischargedDate && ` on ${formatDate(admission.dischargedDate)}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3" role="alert">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <svg
            className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">
              Currently admitted to hospital
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {admission.hospital}
              {admission.ward && ` - ${admission.ward}`}
              {' | '}
              Admitted {formatDate(admission.admittedDate)}
              {admission.expectedDischarge && (
                <> | Expected discharge: {formatDate(admission.expectedDischarge)}</>
              )}
            </p>
            {admission.reason && (
              <p className="text-xs text-red-600 mt-1">
                Reason: {admission.reason}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDischarge(!showDischarge)}
          className="flex-shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
        >
          Discharge
        </button>
      </div>

      {showDischarge && (
        <form onSubmit={handleDischarge} className="mt-3 border-t border-red-200 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="discharge-date"
                className="block text-xs font-medium text-red-700 mb-1"
              >
                Discharge date
              </label>
              <input
                type="date"
                id="discharge-date"
                value={dischargeDate}
                onChange={(e) => setDischargeDate(e.target.value)}
                required
                className="w-full rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
              />
            </div>
            <div>
              <label
                htmlFor="discharge-notes"
                className="block text-xs font-medium text-red-700 mb-1"
              >
                Notes
              </label>
              <input
                type="text"
                id="discharge-notes"
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
                placeholder="Discharge follow-up..."
                className="w-full rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50',
                'bg-emerald-600 hover:bg-emerald-700',
              )}
            >
              {isPending ? 'Recording...' : 'Confirm Discharge'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
