'use client';

/**
 * CarePackageForm — create / edit a domiciliary care package.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FUNDING_TYPES,
  FUNDING_TYPE_LABELS,
} from '@/features/care-packages/constants';
import type { CreateCarePackageInput, UpdateCarePackageInput } from '@/features/care-packages/schema';
import type { CarePackage } from '@/lib/db/schema/care-packages';

type CreateMode = {
  mode: 'create';
  personId: string;
  onSubmit: (data: CreateCarePackageInput) => Promise<{ success: boolean; error?: string; data?: CarePackage }>;
};

type EditMode = {
  mode: 'edit';
  carePackage: CarePackage;
  onSubmit: (data: UpdateCarePackageInput) => Promise<{ success: boolean; error?: string; data?: CarePackage }>;
};

type CarePackageFormProps = (CreateMode | EditMode) & {
  orgSlug: string;
  personId: string;
};

export function CarePackageForm(props: CarePackageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const existing = props.mode === 'edit' ? props.carePackage : null;

  const [startDate, setStartDate] = useState(existing?.startDate ?? '');
  const [endDate, setEndDate] = useState(existing?.endDate ?? '');
  const [reviewDate, setReviewDate] = useState(existing?.reviewDate ?? '');
  const [fundingType, setFundingType] = useState(existing?.fundingType ?? 'private');
  const [weeklyHours, setWeeklyHours] = useState(existing?.weeklyHours ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  // Environment notes
  const env = existing?.environmentNotes ?? {};
  const [keySafeCode, setKeySafeCode] = useState((env as Record<string, string>).keySafeCode ?? '');
  const [entryInstructions, setEntryInstructions] = useState((env as Record<string, string>).entryInstructions ?? '');
  const [hazards, setHazards] = useState((env as Record<string, string>).hazards ?? '');
  const [parking, setParking] = useState((env as Record<string, string>).parking ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    startTransition(async () => {
      const environmentNotes = {
        keySafeCode: keySafeCode || undefined,
        entryInstructions: entryInstructions || undefined,
        hazards: hazards || undefined,
        parking: parking || undefined,
      };

      let result: { success: boolean; error?: string; data?: CarePackage };

      if (props.mode === 'create') {
        result = await props.onSubmit({
          personId: props.personId,
          status: 'active',
          startDate,
          endDate: endDate || null,
          reviewDate: reviewDate || null,
          fundingType: (fundingType as 'local_authority' | 'nhs_chc' | 'private' | 'mixed') ?? 'private',
          commissioners: [],
          environmentNotes,
          weeklyHours: weeklyHours || null,
          notes: notes || null,
        });
      } else {
        result = await props.onSubmit({
          startDate,
          endDate: endDate || null,
          reviewDate: reviewDate || null,
          fundingType: fundingType as 'local_authority' | 'nhs_chc' | 'private' | 'mixed',
          environmentNotes,
          weeklyHours: weeklyHours || null,
          notes: notes || null,
        });
      }

      if (result.success) {
        toast.success(
          props.mode === 'create' ? 'Care package created' : 'Care package updated',
        );
        router.push(`/${props.orgSlug}/persons/${props.personId}/care-package`);
      } else {
        setServerError(result.error ?? 'An error occurred');
        toast.error(result.error ?? 'Failed to save care package');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Care package form">
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      )}

      {/* Package details */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Package details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="cp-start" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Start date <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="cp-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
          </div>
          <div>
            <label htmlFor="cp-end" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              End date
            </label>
            <input
              id="cp-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
          </div>
          <div>
            <label htmlFor="cp-review" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Review date
            </label>
            <input
              id="cp-review"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
          </div>
          <div>
            <label htmlFor="cp-funding" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Funding type
            </label>
            <select
              id="cp-funding"
              value={fundingType}
              onChange={(e) => setFundingType(e.target.value)}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            >
              {FUNDING_TYPES.map((f) => (
                <option key={f} value={f}>
                  {FUNDING_TYPE_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cp-hours" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Weekly hours
            </label>
            <input
              id="cp-hours"
              type="text"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(e.target.value)}
              placeholder="e.g., 10.5"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
          </div>
        </div>
      </div>

      {/* Environment notes */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Client environment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="cp-keysafe" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Key safe code
            </label>
            <input
              id="cp-keysafe"
              type="text"
              value={keySafeCode}
              onChange={(e) => setKeySafeCode(e.target.value)}
              placeholder="e.g., 1234"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
            <p className="mt-1 text-[10px] text-[oklch(0.6_0_0)]">
              Only visible to assigned carers
            </p>
          </div>
          <div>
            <label htmlFor="cp-parking" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Parking information
            </label>
            <input
              id="cp-parking"
              type="text"
              value={parking}
              onChange={(e) => setParking(e.target.value)}
              placeholder="e.g., Free parking on driveway"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="cp-entry" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Entry instructions
            </label>
            <textarea
              id="cp-entry"
              value={entryInstructions}
              onChange={(e) => setEntryInstructions(e.target.value)}
              rows={3}
              placeholder="How to enter the property..."
              className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="cp-hazards" className="block text-xs font-medium text-red-600 mb-1.5">
              Hazard notes
            </label>
            <textarea
              id="cp-hazards"
              value={hazards}
              onChange={(e) => setHazards(e.target.value)}
              rows={3}
              placeholder="Known hazards at the property..."
              className="w-full resize-y rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-300/30"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <label htmlFor="cp-notes" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
          Additional notes
        </label>
        <textarea
          id="cp-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Any additional notes about this care package..."
          className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-5 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors"
          aria-busy={isPending}
        >
          {isPending ? 'Saving...' : props.mode === 'create' ? 'Create care package' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
