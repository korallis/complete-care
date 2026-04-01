'use client';

/**
 * UnassignedQueue — lists visits that need staff assignment.
 */

import { useTransition } from 'react';
import { toast } from 'sonner';
import type { ScheduledVisit } from '@/lib/db/schema/care-packages';
import { assignStaffToVisit } from '@/features/care-packages/actions';

type UnassignedQueueProps = {
  visits: ScheduledVisit[];
  staffOptions: { id: string; name: string }[];
};

export function UnassignedQueue({ visits, staffOptions }: UnassignedQueueProps) {
  const [isPending, startTransition] = useTransition();

  if (visits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-6 text-center">
        <div className="mb-2">
          <svg className="mx-auto h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          All visits are assigned. No action required.
        </p>
      </div>
    );
  }

  function handleAssign(visitId: string, staffId: string) {
    startTransition(async () => {
      const result = await assignStaffToVisit(visitId, staffId);
      if (result.success) {
        toast.success('Staff member assigned to visit');
      } else {
        toast.error(result.error ?? 'Failed to assign staff');
      }
    });
  }

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-[oklch(0.95_0.003_160)] bg-amber-50">
        <h3 className="text-sm font-semibold text-amber-800">
          Unassigned visits
          <span className="ml-2 text-xs font-normal">
            ({visits.length} visit{visits.length !== 1 ? 's' : ''})
          </span>
        </h3>
      </div>
      <div className="divide-y divide-[oklch(0.95_0.003_160)]">
        {visits.map((visit) => (
          <div
            key={visit.id}
            className="flex items-center justify-between gap-4 px-5 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                {visit.date} at {visit.scheduledStart}
              </p>
              <p className="text-xs text-[oklch(0.55_0_0)]">
                {visit.scheduledStart} - {visit.scheduledEnd}
                {visit.isAdHoc && (
                  <span className="ml-1 text-amber-600">Ad-hoc</span>
                )}
              </p>
            </div>
            <select
              disabled={isPending}
              onChange={(e) => {
                if (e.target.value) handleAssign(visit.id, e.target.value);
              }}
              defaultValue=""
              className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs text-[oklch(0.35_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] disabled:opacity-50"
              aria-label={`Assign staff to visit on ${visit.date}`}
            >
              <option value="">Assign staff...</option>
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
