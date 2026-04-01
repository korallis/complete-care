'use client';

/**
 * TrainingRecordForm — add/edit training record form.
 * Uses controlled inputs with client-side validation via Zod.
 */

import { useState, useTransition } from 'react';
import {
  createTrainingRecordSchema,
  updateTrainingRecordSchema,
  calculateExpiryDate,
} from '@/features/training/schema';
import type {
  CreateTrainingRecordInput,
  UpdateTrainingRecordInput,
} from '@/features/training/schema';

type TrainingRecordFormProps = {
  staffProfileId: string;
  courses?: Array<{
    id: string;
    name: string;
    defaultProvider: string | null;
    validityMonths: number | null;
  }>;
  initialData?: {
    id: string;
    courseId: string | null;
    courseName: string;
    provider: string | null;
    completedDate: string;
    expiryDate: string | null;
    certificateUrl: string | null;
    notes: string | null;
  };
  onSubmit: (
    data: CreateTrainingRecordInput | UpdateTrainingRecordInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onCancel: () => void;
};

export function TrainingRecordForm({
  staffProfileId,
  courses = [],
  initialData,
  onSubmit,
  onCancel,
}: TrainingRecordFormProps) {
  const isEditing = !!initialData;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [courseId, setCourseId] = useState(initialData?.courseId ?? '');
  const [courseName, setCourseName] = useState(initialData?.courseName ?? '');
  const [provider, setProvider] = useState(initialData?.provider ?? '');
  const [completedDate, setCompletedDate] = useState(
    initialData?.completedDate ?? '',
  );
  const [expiryDate, setExpiryDate] = useState(initialData?.expiryDate ?? '');
  const [certificateUrl, setCertificateUrl] = useState(
    initialData?.certificateUrl ?? '',
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  // When a course is selected, auto-fill name, provider, and compute expiry
  const handleCourseChange = (selectedCourseId: string) => {
    setCourseId(selectedCourseId);
    if (selectedCourseId) {
      const course = courses.find((c) => c.id === selectedCourseId);
      if (course) {
        setCourseName(course.name);
        if (course.defaultProvider) setProvider(course.defaultProvider);
        // Auto-compute expiry if completed date is set
        if (completedDate && course.validityMonths) {
          setExpiryDate(calculateExpiryDate(completedDate, course.validityMonths));
        }
      }
    }
  };

  const handleCompletedDateChange = (value: string) => {
    setCompletedDate(value);
    // Auto-compute expiry when date changes and course has validity
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value) && courseId) {
      const course = courses.find((c) => c.id === courseId);
      if (course?.validityMonths) {
        setExpiryDate(calculateExpiryDate(value, course.validityMonths));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = isEditing
      ? {
          courseName,
          provider: provider || null,
          completedDate,
          expiryDate: expiryDate || null,
          certificateUrl: certificateUrl || null,
          notes: notes || null,
        }
      : {
          staffProfileId,
          courseId: courseId || null,
          courseName,
          provider: provider || null,
          completedDate,
          expiryDate: expiryDate || null,
          certificateUrl: certificateUrl || null,
          notes: notes || null,
        };

    const schema = isEditing ? updateTrainingRecordSchema : createTrainingRecordSchema;
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

      {/* Course selection (only for new records) */}
      {!isEditing && courses.length > 0 && (
        <div>
          <label htmlFor="courseId" className={labelClasses}>
            Select course
          </label>
          <select
            id="courseId"
            value={courseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className={inputClasses}
          >
            <option value="">-- Custom / ad-hoc course --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Course name */}
      <div>
        <label htmlFor="courseName" className={labelClasses}>
          Course name <span className="text-red-500">*</span>
        </label>
        <input
          id="courseName"
          type="text"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="e.g. Moving and Handling"
          className={inputClasses}
          required
        />
        {fieldErrors.courseName && (
          <p className={errorClasses}>{fieldErrors.courseName}</p>
        )}
      </div>

      {/* Provider */}
      <div>
        <label htmlFor="provider" className={labelClasses}>
          Training provider
        </label>
        <input
          id="provider"
          type="text"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g. Blue Stream Academy"
          className={inputClasses}
        />
        {fieldErrors.provider && (
          <p className={errorClasses}>{fieldErrors.provider}</p>
        )}
      </div>

      {/* Completed date */}
      <div>
        <label htmlFor="completedDate" className={labelClasses}>
          Date completed <span className="text-red-500">*</span>
        </label>
        <input
          id="completedDate"
          type="date"
          value={completedDate}
          onChange={(e) => handleCompletedDateChange(e.target.value)}
          className={inputClasses}
          required
        />
        {fieldErrors.completedDate && (
          <p className={errorClasses}>{fieldErrors.completedDate}</p>
        )}
      </div>

      {/* Expiry date */}
      <div>
        <label htmlFor="expiryDate" className={labelClasses}>
          Expiry date
        </label>
        <input
          id="expiryDate"
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          className={inputClasses}
        />
        <p className="text-xs text-[oklch(0.55_0_0)] mt-1">
          Auto-calculated from course validity if a catalogue course is selected
        </p>
        {fieldErrors.expiryDate && (
          <p className={errorClasses}>{fieldErrors.expiryDate}</p>
        )}
      </div>

      {/* Certificate URL */}
      <div>
        <label htmlFor="certificateUrl" className={labelClasses}>
          Certificate URL
        </label>
        <input
          id="certificateUrl"
          type="url"
          value={certificateUrl}
          onChange={(e) => setCertificateUrl(e.target.value)}
          placeholder="https://..."
          className={inputClasses}
        />
        {fieldErrors.certificateUrl && (
          <p className={errorClasses}>{fieldErrors.certificateUrl}</p>
        )}
      </div>

      {/* Notes */}
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
        {fieldErrors.notes && (
          <p className={errorClasses}>{fieldErrors.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] disabled:opacity-50"
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
              ? 'Update record'
              : 'Add record'}
        </button>
      </div>
    </form>
  );
}
