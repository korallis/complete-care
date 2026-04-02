'use client';

/**
 * BulkAssignModal -- modal to assign multiple visits to a staff member at once.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { bulkAssign } from '@/features/rota/actions';
import { ConflictWarning } from './conflict-warning';
import type { Conflict } from '@/features/rota/conflicts';

type BulkAssignModalProps = {
  visitIds: string[];
  staffOptions: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
};

export function BulkAssignModal({
  visitIds,
  staffOptions,
  onClose,
  onSuccess,
}: BulkAssignModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleAssign() {
    if (!selectedStaffId) return;

    startTransition(async () => {
      const result = await bulkAssign({
        visitIds,
        staffId: selectedStaffId,
      });

      if (result.success) {
        if (result.data.conflicts.length > 0) {
          setConflicts(result.data.conflicts);
          toast.warning(
            `${result.data.assignedCount} visits assigned with ${result.data.conflicts.length} conflict(s)`,
          );
        } else {
          toast.success(`${result.data.assignedCount} visits assigned successfully`);
        }
        onSuccess();
      } else {
        toast.error(result.error ?? 'Failed to assign visits');
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-assign-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[oklch(0.91_0.005_160)] bg-white p-6 shadow-xl">
        <h2
          id="bulk-assign-title"
          className="text-lg font-semibold text-[oklch(0.18_0.02_160)]"
        >
          Bulk Assign Visits
        </h2>
        <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
          Assign {visitIds.length} visit{visitIds.length !== 1 ? 's' : ''} to a
          staff member.
        </p>

        <div className="mt-4">
          <label
            htmlFor="bulk-staff-select"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
          >
            Select staff member
          </label>
          <select
            id="bulk-staff-select"
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
          >
            <option value="">Choose staff member...</option>
            {staffOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {conflicts.length > 0 && (
          <div className="mt-4">
            <ConflictWarning conflicts={conflicts} />
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={isPending || !selectedStaffId}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50',
              'bg-[oklch(0.45_0.1_160)] hover:bg-[oklch(0.4_0.1_160)]',
            )}
          >
            {isPending ? 'Assigning...' : `Assign ${visitIds.length} visit${visitIds.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
