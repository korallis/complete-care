'use client';

/**
 * SupervisionList — list of supervision records with status badges and due dates.
 * Includes schedule, complete, and cancel functionality.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  SupervisionStatusBadge,
  SupervisionTypeBadge,
  SupervisionFrequencyBadge,
} from './supervision-status-badge';
import { OverdueAlertBanner } from './overdue-alert-banner';
import { ScheduleSupervisionForm } from './supervision-form';
import type { SupervisionListItem } from '@/features/supervisions/actions';
import type { ScheduleSupervisionInput } from '@/features/supervisions/schema';
import type { StaffOption } from '@/features/supervisions/actions';

type SupervisionListProps = {
  staffProfileId: string;
  staffName: string;
  supervisions: SupervisionListItem[];
  staffOptions: StaffOption[];
  overdueCount: number;
  upcomingCount: number;
  canEdit: boolean;
  onSchedule: (data: ScheduleSupervisionInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: (id: string) => Promise<{ success: boolean; error?: string }>;
  orgSlug: string;
};

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '--';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

export function SupervisionList({
  staffProfileId,
  staffName,
  supervisions,
  staffOptions,
  overdueCount,
  upcomingCount,
  canEdit,
  onSchedule,
  onCancel,
  orgSlug,
}: SupervisionListProps) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const router = useRouter();

  const handleSchedule = async (data: ScheduleSupervisionInput) => {
    const result = await onSchedule(data);
    if (result.success) {
      setShowForm(false);
      router.refresh();
    }
    return result;
  };

  const handleCancel = (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this supervision? This cannot be undone.')) {
      return;
    }
    setCancelError(null);
    startTransition(async () => {
      const result = await onCancel(id);
      if (!result.success) {
        setCancelError(result.error ?? 'Failed to cancel');
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Alert banner */}
      <OverdueAlertBanner overdueCount={overdueCount} upcomingCount={upcomingCount} />

      {/* Header with schedule button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
          Supervision history
        </h3>
        {canEdit && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.35_0.06_160)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[oklch(0.30_0.06_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Schedule supervision
          </button>
        )}
      </div>

      {/* Cancel error */}
      {cancelError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {cancelError}
        </div>
      )}

      {/* Schedule form */}
      {showForm && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
            Schedule new supervision
          </h4>
          <ScheduleSupervisionForm
            staffProfileId={staffProfileId}
            staffOptions={staffOptions}
            onSubmit={handleSchedule}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Empty state */}
      {supervisions.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-[oklch(0.45_0.07_160)]" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] mb-1">
            No supervisions recorded
          </p>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            {canEdit
              ? `Schedule a supervision to start tracking sessions for ${staffName}.`
              : `No supervision sessions have been recorded for ${staffName} yet.`}
          </p>
        </div>
      )}

      {/* Supervision list */}
      {supervisions.length > 0 && (
        <div className="space-y-3">
          {supervisions.map((supervision) => (
            <div
              key={supervision.id}
              className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                      {formatDate(supervision.scheduledDate)}
                    </span>
                    <SupervisionStatusBadge status={supervision.status} />
                    <SupervisionTypeBadge type={supervision.type} />
                    <SupervisionFrequencyBadge frequency={supervision.frequency} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[oklch(0.55_0_0)]">
                    {supervision.completedDate && (
                      <div>
                        <span className="font-medium text-[oklch(0.45_0_0)]">Completed:</span>{' '}
                        {formatDate(supervision.completedDate)}
                      </div>
                    )}
                    {supervision.nextDueDate && (
                      <div>
                        <span className="font-medium text-[oklch(0.45_0_0)]">Next due:</span>{' '}
                        {formatDate(supervision.nextDueDate)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {(supervision.status === 'completed') && (
                    <a
                      href={`/${orgSlug}/staff/${staffProfileId}/supervision/${supervision.id}`}
                      className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-2.5 py-1.5 text-xs font-medium text-[oklch(0.45_0_0)] hover:text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                    >
                      View
                    </a>
                  )}
                  {canEdit && (supervision.status === 'scheduled' || supervision.status === 'overdue') && (
                    <>
                      <a
                        href={`/${orgSlug}/staff/${staffProfileId}/supervision/${supervision.id}/complete`}
                        className="rounded-lg bg-[oklch(0.35_0.06_160)] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.30_0.06_160)] transition-colors"
                      >
                        Complete
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCancel(supervision.id)}
                        disabled={isPending}
                        className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-2.5 py-1.5 text-xs font-medium text-[oklch(0.55_0_0)] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
