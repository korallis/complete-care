'use client';

/**
 * CourseManagement — configure required training courses per role.
 * Add, edit, and delete courses from the organisation's training catalogue.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { TrainingCourseListItem } from '@/features/training/actions';
import type { CreateTrainingCourseInput, UpdateTrainingCourseInput } from '@/features/training/schema';
import {
  TRAINING_CATEGORIES,
  TRAINING_CATEGORY_LABELS,
} from '@/features/training/schema';
import { TrainingCategoryBadge } from './training-status-badge';
import { JOB_TITLE_SUGGESTIONS } from '@/features/staff/constants';

type CourseManagementProps = {
  courses: TrainingCourseListItem[];
  canManage: boolean;
  onSeedDefaults: () => Promise<void>;
  onCreate: (
    data: CreateTrainingCourseInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onUpdate: (
    id: string,
    data: UpdateTrainingCourseInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onDelete: (
    id: string,
  ) => Promise<{ success: boolean; error?: string }>;
};

export function CourseManagement({
  courses,
  canManage,
  onSeedDefaults,
  onCreate,
  onUpdate,
  onDelete,
}: CourseManagementProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainingCourseListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSeedDefaults = () => {
    startTransition(async () => {
      await onSeedDefaults();
      router.refresh();
    });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await onDelete(id);
    if (result.success) {
      router.refresh();
    }
    setDeletingId(null);
  };

  if (showForm || editingCourse) {
    return (
      <CourseForm
        initialData={editingCourse}
        onSubmit={async (data) => {
          if (editingCourse) {
            const result = await onUpdate(editingCourse.id, data);
            if (result.success) {
              setEditingCourse(null);
              router.refresh();
            }
            return result;
          }
          const result = await onCreate(data);
          if (result.success) {
            setShowForm(false);
            router.refresh();
          }
          return result;
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingCourse(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      {canManage && (
        <div className="flex items-center justify-between">
          {courses.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={isPending}
              className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors disabled:opacity-50"
            >
              {isPending ? 'Loading...' : 'Load default care sector courses'}
            </button>
          )}
          <div className="ml-auto">
            <button
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-[oklch(0.35_0.06_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.30_0.06_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2"
            >
              + Add course
            </button>
          </div>
        </div>
      )}

      {/* Courses list */}
      {courses.length === 0 ? (
        <div className="rounded-xl border border-[oklch(0.92_0.005_160)] bg-white p-8 text-center">
          <p className="text-sm text-[oklch(0.55_0_0)]">
            No training courses configured yet.
          </p>
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
                  Category
                </th>
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.4_0.02_160)]">
                  Required for
                </th>
                <th className="px-4 py-3 text-left font-medium text-[oklch(0.4_0.02_160)]">
                  Validity
                </th>
                {canManage && (
                  <th className="px-4 py-3 text-right font-medium text-[oklch(0.4_0.02_160)]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr
                  key={course.id}
                  className="border-b border-[oklch(0.95_0.003_160)] last:border-b-0 hover:bg-[oklch(0.99_0.002_160)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-[oklch(0.22_0.04_160)]">
                      {course.name}
                    </span>
                    {course.defaultProvider && (
                      <span className="block text-xs text-[oklch(0.55_0_0)]">
                        Provider: {course.defaultProvider}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TrainingCategoryBadge category={course.category} />
                  </td>
                  <td className="px-4 py-3 text-xs text-[oklch(0.45_0.02_160)]">
                    {course.requiredForRoles.length === 0
                      ? 'All roles'
                      : course.requiredForRoles.length <= 3
                        ? course.requiredForRoles.join(', ')
                        : `${course.requiredForRoles.slice(0, 2).join(', ')} +${course.requiredForRoles.length - 2} more`}
                  </td>
                  <td className="px-4 py-3 text-[oklch(0.45_0.02_160)]">
                    {course.validityMonths
                      ? `${course.validityMonths} month${course.validityMonths !== 1 ? 's' : ''}`
                      : 'No expiry'}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingCourse(course)}
                          className="text-xs font-medium text-[oklch(0.35_0.06_160)] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          disabled={deletingId === course.id}
                          className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingId === course.id ? 'Deleting...' : 'Delete'}
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

// ---------------------------------------------------------------------------
// Course form sub-component
// ---------------------------------------------------------------------------

function CourseForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData: TrainingCourseListItem | null;
  onSubmit: (
    data: CreateTrainingCourseInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onCancel: () => void;
}) {
  const isEditing = !!initialData;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? '');
  const [category, setCategory] = useState(initialData?.category ?? 'mandatory');
  const [requiredForRoles, setRequiredForRoles] = useState<string[]>(
    initialData?.requiredForRoles ?? [],
  );
  const [defaultProvider, setDefaultProvider] = useState(
    initialData?.defaultProvider ?? '',
  );
  const [validityMonths, setValidityMonths] = useState(
    initialData?.validityMonths?.toString() ?? '',
  );

  const handleRoleToggle = (role: string) => {
    setRequiredForRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await onSubmit({
        name,
        category: category as CreateTrainingCourseInput['category'],
        requiredForRoles,
        defaultProvider: defaultProvider || null,
        validityMonths: validityMonths ? Number(validityMonths) : null,
        isDefault: false,
      });
      if (!result.success) {
        setError(result.error ?? 'An error occurred');
      }
    });
  };

  const inputClasses =
    'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.65_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-colors';
  const labelClasses = 'block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1';

  return (
    <div className="rounded-xl border border-[oklch(0.88_0.005_160)] bg-white p-6">
      <h3 className="text-lg font-semibold text-[oklch(0.18_0.02_160)] mb-4">
        {isEditing ? 'Edit course' : 'Add course'}
      </h3>

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
            Course name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Moving and Handling"
            className={inputClasses}
            required
          />
        </div>

        <div>
          <label htmlFor="category" className={labelClasses}>
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClasses}
          >
            {TRAINING_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {TRAINING_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="defaultProvider" className={labelClasses}>
            Default provider
          </label>
          <input
            id="defaultProvider"
            type="text"
            value={defaultProvider}
            onChange={(e) => setDefaultProvider(e.target.value)}
            placeholder="e.g. Blue Stream Academy"
            className={inputClasses}
          />
        </div>

        <div>
          <label htmlFor="validityMonths" className={labelClasses}>
            Validity period (months)
          </label>
          <input
            id="validityMonths"
            type="number"
            min="1"
            max="120"
            value={validityMonths}
            onChange={(e) => setValidityMonths(e.target.value)}
            placeholder="e.g. 12"
            className={inputClasses}
          />
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">
            Leave blank for no expiry
          </p>
        </div>

        <div>
          <p className={labelClasses}>Required for roles</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {JOB_TITLE_SUGGESTIONS.map((role) => (
              <label
                key={role}
                className="flex items-center gap-2 text-sm text-[oklch(0.35_0.04_160)]"
              >
                <input
                  type="checkbox"
                  checked={requiredForRoles.includes(role)}
                  onChange={() => handleRoleToggle(role)}
                  className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.35_0.06_160)]"
                />
                {role}
              </label>
            ))}
          </div>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">
            Leave all unchecked to require for all roles
          </p>
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
                ? 'Update course'
                : 'Add course'}
          </button>
        </div>
      </form>
    </div>
  );
}
