'use client';

/**
 * QualificationForm — add/edit qualifications (e.g. NVQ/QCF Diplomas).
 * QualificationList — displays qualifications for a staff member.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createQualificationSchema,
  updateQualificationSchema,
  QUALIFICATION_STATUSES,
  QUALIFICATION_STATUS_LABELS,
  QUALIFICATION_LEVELS,
} from '@/features/training/schema';
import type {
  CreateQualificationInput,
  UpdateQualificationInput,
  QualificationStatus,
} from '@/features/training/schema';
import type { QualificationListItem } from '@/features/training/actions';
import { QualificationStatusBadge } from './training-status-badge';

// ---------------------------------------------------------------------------
// QualificationList
// ---------------------------------------------------------------------------

type QualificationListProps = {
  staffProfileId: string;
  staffName: string;
  qualifications: QualificationListItem[];
  canEdit: boolean;
  onCreate: (
    data: CreateQualificationInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onUpdate: (
    id: string,
    data: UpdateQualificationInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onDelete: (
    id: string,
  ) => Promise<{ success: boolean; error?: string }>;
};

export function QualificationList({
  staffProfileId,
  staffName,
  qualifications: quals,
  canEdit,
  onCreate,
  onUpdate,
  onDelete,
}: QualificationListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingQual, setEditingQual] = useState<QualificationListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (data: CreateQualificationInput | UpdateQualificationInput) => {
    const result = await onCreate(data as CreateQualificationInput);
    if (result.success) {
      setShowForm(false);
      router.refresh();
    }
    return result;
  };

  const handleUpdate = async (data: CreateQualificationInput | UpdateQualificationInput) => {
    if (!editingQual) return { success: false, error: 'No qualification selected' };
    const result = await onUpdate(editingQual.id, data as UpdateQualificationInput);
    if (result.success) {
      setEditingQual(null);
      router.refresh();
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await onDelete(id);
    if (result.success) {
      router.refresh();
    }
    setDeletingId(null);
  };

  if (showForm) {
    return (
      <div className="rounded-xl border border-[oklch(0.88_0.005_160)] bg-white p-6">
        <h3 className="text-lg font-semibold text-[oklch(0.18_0.02_160)] mb-4">
          Add qualification
        </h3>
        <QualificationForm
          staffProfileId={staffProfileId}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  if (editingQual) {
    return (
      <div className="rounded-xl border border-[oklch(0.88_0.005_160)] bg-white p-6">
        <h3 className="text-lg font-semibold text-[oklch(0.18_0.02_160)] mb-4">
          Edit qualification
        </h3>
        <QualificationForm
          staffProfileId={staffProfileId}
          initialData={editingQual}
          onSubmit={handleUpdate}
          onCancel={() => setEditingQual(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-[oklch(0.35_0.06_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.30_0.06_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2"
          >
            + Add qualification
          </button>
        </div>
      )}

      {quals.length === 0 ? (
        <div className="rounded-xl border border-[oklch(0.92_0.005_160)] bg-white p-8 text-center">
          <p className="text-sm text-[oklch(0.55_0_0)]">
            No qualifications recorded for {staffName}.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {quals.map((qual) => {
            const isOverdue =
              qual.status === 'working_towards' &&
              qual.targetDate &&
              qual.targetDate < new Date().toISOString().slice(0, 10);

            return (
              <div
                key={qual.id}
                className={`rounded-xl border p-4 ${
                  isOverdue
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-[oklch(0.92_0.005_160)] bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-[oklch(0.22_0.04_160)]">
                      {qual.name}
                    </h4>
                    <p className="text-xs text-[oklch(0.55_0_0)]">{qual.level}</p>
                  </div>
                  <QualificationStatusBadge status={qual.status} />
                </div>

                <div className="space-y-1 text-xs text-[oklch(0.45_0.02_160)]">
                  {qual.status === 'completed' && qual.completedDate && (
                    <p>Achieved: {qual.completedDate}</p>
                  )}
                  {qual.status === 'working_towards' && qual.targetDate && (
                    <p className={isOverdue ? 'text-red-600 font-medium' : ''}>
                      Target: {qual.targetDate}
                      {isOverdue ? ' (overdue)' : ''}
                    </p>
                  )}
                  {qual.notes && (
                    <p className="text-[oklch(0.55_0_0)] mt-1">{qual.notes}</p>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[oklch(0.95_0.003_160)]">
                    <button
                      onClick={() => setEditingQual(qual)}
                      className="text-xs font-medium text-[oklch(0.35_0.06_160)] hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(qual.id)}
                      disabled={deletingId === qual.id}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deletingId === qual.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QualificationForm
// ---------------------------------------------------------------------------

type QualificationFormProps = {
  staffProfileId: string;
  initialData?: {
    id: string;
    name: string;
    level: string;
    status: string;
    completedDate: string | null;
    targetDate: string | null;
    notes: string | null;
  };
  onSubmit: (
    data: CreateQualificationInput | UpdateQualificationInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onCancel: () => void;
};

function QualificationForm({
  staffProfileId,
  initialData,
  onSubmit,
  onCancel,
}: QualificationFormProps) {
  const isEditing = !!initialData;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState(initialData?.name ?? '');
  const [level, setLevel] = useState(initialData?.level ?? '');
  const [status, setStatus] = useState(initialData?.status ?? 'working_towards');
  const [completedDate, setCompletedDate] = useState(
    initialData?.completedDate ?? '',
  );
  const [targetDate, setTargetDate] = useState(initialData?.targetDate ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = isEditing
      ? {
          name,
          level,
          status: status as QualificationStatus,
          completedDate: completedDate || null,
          targetDate: targetDate || null,
          notes: notes || null,
        }
      : {
          staffProfileId,
          name,
          level,
          status: status as QualificationStatus,
          completedDate: completedDate || null,
          targetDate: targetDate || null,
          notes: notes || null,
        };

    const schema = isEditing ? updateQualificationSchema : createQualificationSchema;
    const parsed = schema.safeParse(formData);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? 'form';
        errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const result = await onSubmit(parsed.data);
      if (!result.success) {
        if (result.field) {
          setFieldErrors({ [result.field]: result.error ?? 'Validation error' });
        } else {
          setError(result.error ?? 'An error occurred');
        }
      }
    });
  };

  const inputClasses =
    'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.65_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-colors';
  const labelClasses = 'block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1';
  const errorClasses = 'text-xs text-red-600 mt-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClasses}>
          Qualification name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Health & Social Care"
          className={inputClasses}
          required
        />
        {fieldErrors.name && <p className={errorClasses}>{fieldErrors.name}</p>}
      </div>

      <div>
        <label htmlFor="level" className={labelClasses}>
          Level <span className="text-red-500">*</span>
        </label>
        <select
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className={inputClasses}
          required
        >
          <option value="">Select level...</option>
          {QUALIFICATION_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        {fieldErrors.level && <p className={errorClasses}>{fieldErrors.level}</p>}
      </div>

      <div>
        <label htmlFor="status" className={labelClasses}>
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputClasses}
        >
          {QUALIFICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {QUALIFICATION_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {status === 'completed' && (
        <div>
          <label htmlFor="completedDate" className={labelClasses}>
            Date achieved
          </label>
          <input
            id="completedDate"
            type="date"
            value={completedDate}
            onChange={(e) => setCompletedDate(e.target.value)}
            className={inputClasses}
          />
          {fieldErrors.completedDate && (
            <p className={errorClasses}>{fieldErrors.completedDate}</p>
          )}
        </div>
      )}

      {status === 'working_towards' && (
        <div>
          <label htmlFor="targetDate" className={labelClasses}>
            Target completion date
          </label>
          <input
            id="targetDate"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={inputClasses}
          />
          {fieldErrors.targetDate && (
            <p className={errorClasses}>{fieldErrors.targetDate}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="notes" className={labelClasses}>
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any additional notes..."
          className={inputClasses}
        />
        {fieldErrors.notes && <p className={errorClasses}>{fieldErrors.notes}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[oklch(0.35_0.06_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.30_0.06_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending
            ? 'Saving...'
            : isEditing
              ? 'Update qualification'
              : 'Add qualification'}
        </button>
      </div>
    </form>
  );
}
