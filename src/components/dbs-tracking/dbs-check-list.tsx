'use client';

/**
 * DbsCheckList — list of DBS records per staff member with status badges.
 * Includes add/edit functionality and alert banners.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DbsStatusBadge, DbsLevelBadge } from './dbs-status-badge';
import { DbsAlertBanner } from './dbs-alert-banner';
import { DbsCheckForm } from './dbs-check-form';
import type { DbsCheckListItem } from '@/features/dbs-tracking/actions';
import type { CreateDbsCheckInput, UpdateDbsCheckInput } from '@/features/dbs-tracking/schema';
import { getAlertsForDbsChecks } from '@/features/dbs-tracking/alerts';

type DbsCheckListProps = {
  staffProfileId: string;
  staffName: string;
  checks: DbsCheckListItem[];
  canEdit: boolean;
  onCreate: (
    data: CreateDbsCheckInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onUpdate: (
    id: string,
    data: UpdateDbsCheckInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
};

function formatDate(date: string | null | undefined): string {
  if (!date) return '--';
  try {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

export function DbsCheckList({
  staffProfileId,
  staffName,
  checks,
  canEdit,
  onCreate,
  onUpdate,
  onDelete,
}: DbsCheckListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  // Compute alerts for current checks
  const alerts = getAlertsForDbsChecks(
    checks.map((c) => ({
      id: c.id,
      staffProfileId: c.staffProfileId,
      recheckDate: c.recheckDate,
      certificateNumber: c.certificateNumber,
      staffName,
    })),
  );

  const handleCreate = async (
    data: CreateDbsCheckInput | UpdateDbsCheckInput,
  ) => {
    const result = await onCreate(data as CreateDbsCheckInput);
    if (result.success) {
      setShowForm(false);
      router.refresh();
    }
    return result;
  };

  const handleUpdate = async (
    data: CreateDbsCheckInput | UpdateDbsCheckInput,
  ) => {
    if (!editingId) return { success: false, error: 'No record selected' };
    const result = await onUpdate(editingId, data as UpdateDbsCheckInput);
    if (result.success) {
      setEditingId(null);
      router.refresh();
    }
    return result;
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this DBS check record? This cannot be undone.')) {
      return;
    }
    setDeleteError(null);
    startTransition(async () => {
      const result = await onDelete(id);
      if (!result.success) {
        setDeleteError(result.error ?? 'Failed to delete');
      } else {
        router.refresh();
      }
    });
  };

  const editingCheck = editingId
    ? checks.find((c) => c.id === editingId)
    : null;

  return (
    <div className="space-y-4">
      {/* Alert banner */}
      <DbsAlertBanner alerts={alerts} />

      {/* Header with add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
          DBS check history
        </h3>
        {canEdit && !showForm && !editingId && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.35_0.06_160)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[oklch(0.30_0.06_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add DBS check
          </button>
        )}
      </div>

      {/* Delete error */}
      {deleteError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {deleteError}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
            Add new DBS check
          </h4>
          <DbsCheckForm
            staffProfileId={staffProfileId}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editingCheck && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
            Edit DBS check
          </h4>
          <DbsCheckForm
            staffProfileId={staffProfileId}
            initialData={editingCheck}
            onSubmit={handleUpdate}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {/* Empty state */}
      {checks.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-[oklch(0.45_0.07_160)]"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] mb-1">
            No DBS checks recorded
          </p>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            {canEdit
              ? 'Add a DBS check to start tracking compliance for this staff member.'
              : 'No DBS check records have been added for this staff member yet.'}
          </p>
        </div>
      )}

      {/* Check list */}
      {checks.length > 0 && !editingId && (
        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[oklch(0.22_0.04_160)] font-mono">
                      {check.certificateNumber}
                    </span>
                    <DbsStatusBadge status={check.status} />
                    <DbsLevelBadge level={check.level} />
                    {check.updateServiceSubscribed && (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        Update Service
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[oklch(0.55_0_0)]">
                    <div>
                      <span className="font-medium text-[oklch(0.45_0_0)]">Issued:</span>{' '}
                      {formatDate(check.issueDate)}
                    </div>
                    <div>
                      <span className="font-medium text-[oklch(0.45_0_0)]">Recheck due:</span>{' '}
                      {formatDate(check.recheckDate)}
                    </div>
                    {check.verifiedByName && (
                      <div>
                        <span className="font-medium text-[oklch(0.45_0_0)]">Verified by:</span>{' '}
                        {check.verifiedByName}
                      </div>
                    )}
                  </div>
                  {check.notes && (
                    <p className="text-xs text-[oklch(0.55_0_0)] italic mt-1">
                      {check.notes}
                    </p>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingId(check.id)}
                      className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white p-1.5 text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                      aria-label="Edit DBS check"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(check.id)}
                      disabled={isPending}
                      className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white p-1.5 text-[oklch(0.55_0_0)] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      aria-label="Delete DBS check"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
