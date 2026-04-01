'use client';

/**
 * TrainingRecordList — displays training records for a staff member
 * with add/edit/delete capabilities.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TrainingRecordListItem } from '@/features/training/actions';
import type {
  CreateTrainingRecordInput,
  UpdateTrainingRecordInput,
} from '@/features/training/schema';
import { TrainingStatusBadge } from './training-status-badge';
import { TrainingRecordForm } from './training-record-form';

type TrainingRecordListProps = {
  staffProfileId: string;
  staffName: string;
  records: TrainingRecordListItem[];
  courses: Array<{
    id: string;
    name: string;
    defaultProvider: string | null;
    validityMonths: number | null;
  }>;
  canEdit: boolean;
  onCreate: (
    data: CreateTrainingRecordInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onUpdate: (
    id: string,
    data: UpdateTrainingRecordInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onDelete: (
    id: string,
  ) => Promise<{ success: boolean; error?: string }>;
};

export function TrainingRecordList({
  staffProfileId,
  staffName,
  records,
  courses,
  canEdit,
  onCreate,
  onUpdate,
  onDelete,
}: TrainingRecordListProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TrainingRecordListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (data: CreateTrainingRecordInput | UpdateTrainingRecordInput) => {
    const result = await onCreate(data as CreateTrainingRecordInput);
    if (result.success) {
      setShowForm(false);
      router.refresh();
    }
    return result;
  };

  const handleUpdate = async (data: CreateTrainingRecordInput | UpdateTrainingRecordInput) => {
    if (!editingRecord) return { success: false, error: 'No record selected' };
    const result = await onUpdate(editingRecord.id, data as UpdateTrainingRecordInput);
    if (result.success) {
      setEditingRecord(null);
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
          Add training record
        </h3>
        <TrainingRecordForm
          staffProfileId={staffProfileId}
          courses={courses}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  if (editingRecord) {
    return (
      <div className="rounded-xl border border-[oklch(0.88_0.005_160)] bg-white p-6">
        <h3 className="text-lg font-semibold text-[oklch(0.18_0.02_160)] mb-4">
          Edit training record
        </h3>
        <TrainingRecordForm
          staffProfileId={staffProfileId}
          courses={courses}
          initialData={editingRecord}
          onSubmit={handleUpdate}
          onCancel={() => setEditingRecord(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-[oklch(0.35_0.06_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.30_0.06_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2"
          >
            + Add training record
          </button>
        </div>
      )}

      {/* Records list */}
      {records.length === 0 ? (
        <div className="rounded-xl border border-[oklch(0.92_0.005_160)] bg-white p-8 text-center">
          <p className="text-sm text-[oklch(0.55_0_0)]">
            No training records found for {staffName}.
          </p>
          {canEdit && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm font-medium text-[oklch(0.35_0.06_160)] hover:underline"
            >
              Add the first training record
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[oklch(0.92_0.005_160)] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[oklch(0.92_0.005_160)] bg-[oklch(0.98_0.002_160)]">
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.4_0.02_160)]">
                  Course
                </th>
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.4_0.02_160)]">
                  Provider
                </th>
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.4_0.02_160)]">
                  Completed
                </th>
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.4_0.02_160)]">
                  Expires
                </th>
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.4_0.02_160)]">
                  Status
                </th>
                {canEdit && (
                  <th className="px-4 py-3 text-right font-medium text-[oklch(0.4_0.02_160)]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-[oklch(0.95_0.003_160)] last:border-b-0 hover:bg-[oklch(0.99_0.002_160)] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[oklch(0.22_0.04_160)]">
                    {record.courseName}
                  </td>
                  <td className="px-4 py-3 text-[oklch(0.45_0.02_160)]">
                    {record.provider ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-[oklch(0.45_0.02_160)]">
                    {record.completedDate}
                  </td>
                  <td className="px-4 py-3 text-[oklch(0.45_0.02_160)]">
                    {record.expiryDate ?? 'No expiry'}
                  </td>
                  <td className="px-4 py-3">
                    <TrainingStatusBadge status={record.status} />
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingRecord(record)}
                          className="text-xs font-medium text-[oklch(0.35_0.06_160)] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          disabled={deletingId === record.id}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingId === record.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
