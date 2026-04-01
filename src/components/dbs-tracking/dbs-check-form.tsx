'use client';

/**
 * DbsCheckForm — add/edit DBS check form.
 * Uses controlled inputs with client-side validation via Zod.
 */

import { useState, useTransition } from 'react';
import {
  createDbsCheckSchema,
  updateDbsCheckSchema,
  DBS_LEVELS,
  DBS_LEVEL_LABELS,
  calculateDefaultRecheckDate,
} from '@/features/dbs-tracking/schema';
import type { CreateDbsCheckInput, UpdateDbsCheckInput, DbsLevel } from '@/features/dbs-tracking/schema';

type DbsCheckFormProps = {
  staffProfileId: string;
  initialData?: {
    id: string;
    certificateNumber: string;
    issueDate: string;
    level: string;
    updateServiceSubscribed: boolean;
    recheckDate: string;
    notes: string | null;
    verifiedByName: string | null;
  };
  onSubmit: (
    data: CreateDbsCheckInput | UpdateDbsCheckInput,
  ) => Promise<{ success: boolean; error?: string; field?: string }>;
  onCancel: () => void;
};

export function DbsCheckForm({
  staffProfileId,
  initialData,
  onSubmit,
  onCancel,
}: DbsCheckFormProps) {
  const isEditing = !!initialData;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [certificateNumber, setCertificateNumber] = useState(
    initialData?.certificateNumber ?? '',
  );
  const [issueDate, setIssueDate] = useState(initialData?.issueDate ?? '');
  const [level, setLevel] = useState<string>(initialData?.level ?? 'enhanced');
  const [updateServiceSubscribed, setUpdateServiceSubscribed] = useState(
    initialData?.updateServiceSubscribed ?? false,
  );
  const [recheckDate, setRecheckDate] = useState(
    initialData?.recheckDate ?? '',
  );
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [verifiedByName, setVerifiedByName] = useState(
    initialData?.verifiedByName ?? '',
  );

  // Auto-calculate recheck date when issue date changes (only for new records)
  const handleIssueDateChange = (value: string) => {
    setIssueDate(value);
    if (!isEditing && value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      setRecheckDate(calculateDefaultRecheckDate(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = isEditing
      ? {
          certificateNumber,
          issueDate,
          level: level as DbsLevel,
          updateServiceSubscribed,
          recheckDate,
          notes: notes || null,
          verifiedByName: verifiedByName || null,
        }
      : {
          staffProfileId,
          certificateNumber,
          issueDate,
          level: level as DbsLevel,
          updateServiceSubscribed,
          recheckDate,
          notes: notes || null,
          verifiedByName: verifiedByName || null,
        };

    // Client-side validation
    const schema = isEditing ? updateDbsCheckSchema : createDbsCheckSchema;
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

      {/* Certificate number */}
      <div>
        <label htmlFor="certificateNumber" className={labelClasses}>
          Certificate number <span className="text-red-500">*</span>
        </label>
        <input
          id="certificateNumber"
          type="text"
          value={certificateNumber}
          onChange={(e) => setCertificateNumber(e.target.value)}
          placeholder="e.g. 001234567890"
          className={inputClasses}
          required
        />
        {fieldErrors.certificateNumber && (
          <p className={errorClasses}>{fieldErrors.certificateNumber}</p>
        )}
      </div>

      {/* Issue date */}
      <div>
        <label htmlFor="issueDate" className={labelClasses}>
          Issue date <span className="text-red-500">*</span>
        </label>
        <input
          id="issueDate"
          type="date"
          value={issueDate}
          onChange={(e) => handleIssueDateChange(e.target.value)}
          className={inputClasses}
          required
        />
        {fieldErrors.issueDate && (
          <p className={errorClasses}>{fieldErrors.issueDate}</p>
        )}
      </div>

      {/* DBS level */}
      <div>
        <label htmlFor="level" className={labelClasses}>
          DBS level <span className="text-red-500">*</span>
        </label>
        <select
          id="level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className={inputClasses}
          required
        >
          {DBS_LEVELS.map((l) => (
            <option key={l} value={l}>
              {DBS_LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
        {fieldErrors.level && (
          <p className={errorClasses}>{fieldErrors.level}</p>
        )}
      </div>

      {/* Update Service subscription */}
      <div className="flex items-center gap-3">
        <input
          id="updateServiceSubscribed"
          type="checkbox"
          checked={updateServiceSubscribed}
          onChange={(e) => setUpdateServiceSubscribed(e.target.checked)}
          className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.35_0.06_160)] focus:ring-[oklch(0.35_0.06_160)]"
        />
        <label
          htmlFor="updateServiceSubscribed"
          className="text-sm text-[oklch(0.35_0.04_160)]"
        >
          Subscribed to DBS Update Service
        </label>
      </div>

      {/* Recheck date */}
      <div>
        <label htmlFor="recheckDate" className={labelClasses}>
          Recheck date <span className="text-red-500">*</span>
        </label>
        <input
          id="recheckDate"
          type="date"
          value={recheckDate}
          onChange={(e) => setRecheckDate(e.target.value)}
          className={inputClasses}
          required
        />
        <p className="text-xs text-[oklch(0.55_0_0)] mt-1">
          Standard recheck interval is 3 years from issue date
        </p>
        {fieldErrors.recheckDate && (
          <p className={errorClasses}>{fieldErrors.recheckDate}</p>
        )}
      </div>

      {/* Verified by */}
      <div>
        <label htmlFor="verifiedByName" className={labelClasses}>
          Verified by
        </label>
        <input
          id="verifiedByName"
          type="text"
          value={verifiedByName}
          onChange={(e) => setVerifiedByName(e.target.value)}
          placeholder="Name of person who verified the certificate"
          className={inputClasses}
        />
        {fieldErrors.verifiedByName && (
          <p className={errorClasses}>{fieldErrors.verifiedByName}</p>
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
          placeholder="Any additional notes about this DBS check..."
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
              ? 'Update DBS check'
              : 'Add DBS check'}
        </button>
      </div>
    </form>
  );
}
