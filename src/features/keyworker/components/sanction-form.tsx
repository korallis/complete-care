'use client';

/**
 * SanctionForm — log a sanction applied to a child.
 * Warns when a prohibited measure is selected.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createSanctionSchema } from '../schema';

type FormValues = {
  personId: string;
  dateTime: string;
  description: string;
  sanctionType: 'other' | 'loss_of_privilege' | 'additional_chore' | 'earlier_bedtime' | 'reduced_screen_time' | 'grounding' | 'verbal_warning' | 'written_warning' | 'reparation';
  isProhibited: boolean;
  justification?: string;
};
import {
  SANCTION_TYPES,
  SANCTION_TYPE_LABELS,
  PROHIBITED_MEASURES,
  PROHIBITED_MEASURE_LABELS,
} from '../constants';
import type { createSanction } from '../actions';

type SanctionFormProps = {
  personId: string;
  orgSlug: string;
  onCreate: typeof createSanction;
};

export function SanctionForm({
  personId,
  orgSlug,
  onCreate,
}: SanctionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProhibited, setIsProhibited] = useState(false);

  const now = new Date();
  const localDatetime = `${now.toISOString().split('T')[0]}T${now.toTimeString().slice(0, 5)}`;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(createSanctionSchema) as never,
    defaultValues: {
      personId,
      dateTime: localDatetime,
      description: '',
      sanctionType: 'verbal_warning',
      isProhibited: false,
      justification: '',
    },
  });

  function handleProhibitedToggle(checked: boolean) {
    setIsProhibited(checked);
    setValue('isProhibited', checked);
  }

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await onCreate(data as Parameters<typeof onCreate>[0]);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to save sanction');
        return;
      }
      toast.success('Sanction recorded');
      router.push(`/${orgSlug}/persons/${personId}/keyworker`);
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Date/time */}
      <div>
        <label
          htmlFor="dateTime"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Date &amp; time <span className="text-red-500">*</span>
        </label>
        <input
          id="dateTime"
          type="datetime-local"
          {...register('dateTime')}
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
        />
        {errors.dateTime && (
          <p className="mt-1 text-xs text-red-600">{errors.dateTime.message}</p>
        )}
      </div>

      {/* Sanction type */}
      <div>
        <label
          htmlFor="sanctionType"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Sanction type <span className="text-red-500">*</span>
        </label>
        <select
          id="sanctionType"
          {...register('sanctionType')}
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
        >
          {SANCTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {SANCTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        {errors.sanctionType && (
          <p className="mt-1 text-xs text-red-600">{errors.sanctionType.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          placeholder="Describe what happened and what sanction was applied..."
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Prohibited measure flag */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-[oklch(0.985_0.003_160)] p-5">
        <div className="flex items-start gap-3 mb-3">
          <input
            id="isProhibited"
            type="checkbox"
            checked={isProhibited}
            onChange={(e) => handleProhibitedToggle(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-red-600 focus:ring-red-500"
          />
          <div>
            <label htmlFor="isProhibited" className="text-sm font-medium text-[oklch(0.35_0.04_160)]">
              This is a prohibited measure
            </label>
            <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
              Check this if the sanction falls under the prohibited measures listed in the Children&apos;s
              Homes (England) Regulations 2015.
            </p>
          </div>
        </div>

        {isProhibited && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
            <p className="text-xs font-medium text-red-800 mb-2">
              ⚠ Prohibited measures include:
            </p>
            <ul className="text-xs text-red-700 space-y-1">
              {PROHIBITED_MEASURES.slice(0, 5).map((m) => (
                <li key={m} className="flex items-start gap-1.5">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                  {PROHIBITED_MEASURE_LABELS[m]}
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-700 font-medium mt-2">
              This selection is blocked and cannot be saved.
            </p>
          </div>
        )}
      </div>

      {/* Justification */}
      <div>
        <label
          htmlFor="justification"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Justification
        </label>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-2">
          Provide context or justification for this sanction.
        </p>
        <textarea
          id="justification"
          {...register('justification')}
          rows={3}
          placeholder="Why was this sanction used? What alternatives were considered?"
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[oklch(0.91_0.005_160)]">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="inline-flex items-center rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            isProhibited
              ? 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500'
              : 'bg-[oklch(0.3_0.08_160)] hover:bg-[oklch(0.25_0.08_160)] focus-visible:ring-[oklch(0.5_0.1_160)]'
          }`}
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : isProhibited ? (
            'Blocked: prohibited measure'
          ) : (
            'Save sanction'
          )}
        </button>
      </div>
    </form>
  );
}
