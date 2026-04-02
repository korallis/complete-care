'use client';

/**
 * RestraintForm — record a physical intervention (restraint).
 * Captures technique, duration, injury check, and debrief.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createRestraintSchema } from '../schema';

type FormValues = {
  personId: string;
  dateTime: string;
  duration: number;
  technique: 'team_teach' | 'price' | 'mapa' | 'cpi' | 'other';
  reason: string;
  injuryCheck: {
    childInjured: boolean;
    childInjuryDetails?: string;
    staffInjured: boolean;
    staffInjuryDetails?: string;
    medicalAttentionRequired: boolean;
    medicalAttentionDetails?: string;
  };
  childDebrief?: string;
  staffDebrief?: string;
  managementReview?: string;
};
import { RESTRAINT_TECHNIQUE_LABELS, RESTRAINT_TECHNIQUES } from '../constants';
import type { createRestraint } from '../actions';

type RestraintFormProps = {
  personId: string;
  orgSlug: string;
  onCreate: typeof createRestraint;
};

export function RestraintForm({
  personId,
  orgSlug,
  onCreate,
}: RestraintFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const now = new Date();
  const localDatetime = `${now.toISOString().split('T')[0]}T${now.toTimeString().slice(0, 5)}`;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createRestraintSchema) as never,
    defaultValues: {
      personId,
      dateTime: localDatetime,
      duration: 5,
      technique: 'team_teach',
      reason: '',
      injuryCheck: {
        childInjured: false,
        childInjuryDetails: '',
        staffInjured: false,
        staffInjuryDetails: '',
        medicalAttentionRequired: false,
        medicalAttentionDetails: '',
      },
      childDebrief: '',
      staffDebrief: '',
      managementReview: '',
    },
  });

  const childInjured = watch('injuryCheck.childInjured');
  const staffInjured = watch('injuryCheck.staffInjured');
  const medicalRequired = watch('injuryCheck.medicalAttentionRequired');

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await onCreate(data as Parameters<typeof onCreate>[0]);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to save restraint record');
        return;
      }
      toast.success('Restraint record saved');
      router.push(`/${orgSlug}/persons/${personId}/keyworker`);
      router.refresh();
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Date/time and duration */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <div>
          <label
            htmlFor="duration"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
          >
            Duration (minutes) <span className="text-red-500">*</span>
          </label>
          <input
            id="duration"
            type="number"
            min={1}
            max={480}
            {...register('duration', { valueAsNumber: true })}
            className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
          />
          {errors.duration && (
            <p className="mt-1 text-xs text-red-600">{errors.duration.message}</p>
          )}
        </div>
      </div>

      {/* Technique */}
      <div>
        <label
          htmlFor="technique"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Technique used <span className="text-red-500">*</span>
        </label>
        <select
          id="technique"
          {...register('technique')}
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
        >
          {RESTRAINT_TECHNIQUES.map((t) => (
            <option key={t} value={t}>
              {RESTRAINT_TECHNIQUE_LABELS[t]}
            </option>
          ))}
        </select>
        {errors.technique && (
          <p className="mt-1 text-xs text-red-600">{errors.technique.message}</p>
        )}
      </div>

      {/* Reason */}
      <div>
        <label
          htmlFor="reason"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Reason for restraint <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          {...register('reason')}
          rows={4}
          placeholder="Describe what behaviour led to the restraint and why it was necessary..."
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
        {errors.reason && (
          <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>
        )}
      </div>

      {/* Injury check */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-[oklch(0.985_0.003_160)] p-5">
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
          Post-restraint injury check
        </h3>

        <div className="space-y-4">
          {/* Child injured */}
          <div>
            <div className="flex items-center gap-3">
              <input
                id="childInjured"
                type="checkbox"
                {...register('injuryCheck.childInjured')}
                className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.07_160)]"
              />
              <label htmlFor="childInjured" className="text-sm font-medium text-[oklch(0.35_0.04_160)]">
                Child was injured
              </label>
            </div>
            {childInjured && (
              <textarea
                {...register('injuryCheck.childInjuryDetails')}
                rows={2}
                placeholder="Describe the child's injuries..."
                className="mt-2 block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
              />
            )}
          </div>

          {/* Staff injured */}
          <div>
            <div className="flex items-center gap-3">
              <input
                id="staffInjured"
                type="checkbox"
                {...register('injuryCheck.staffInjured')}
                className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.07_160)]"
              />
              <label htmlFor="staffInjured" className="text-sm font-medium text-[oklch(0.35_0.04_160)]">
                Staff was injured
              </label>
            </div>
            {staffInjured && (
              <textarea
                {...register('injuryCheck.staffInjuryDetails')}
                rows={2}
                placeholder="Describe the staff injuries..."
                className="mt-2 block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
              />
            )}
          </div>

          {/* Medical attention */}
          <div>
            <div className="flex items-center gap-3">
              <input
                id="medicalAttentionRequired"
                type="checkbox"
                {...register('injuryCheck.medicalAttentionRequired')}
                className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.07_160)]"
              />
              <label htmlFor="medicalAttentionRequired" className="text-sm font-medium text-[oklch(0.35_0.04_160)]">
                Medical attention required
              </label>
            </div>
            {medicalRequired && (
              <textarea
                {...register('injuryCheck.medicalAttentionDetails')}
                rows={2}
                placeholder="Describe medical attention provided or sought..."
                className="mt-2 block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
              />
            )}
          </div>
        </div>
      </div>

      {/* Debrief */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="childDebrief"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
          >
            Child debrief
          </label>
          <p className="text-xs text-[oklch(0.55_0_0)] mb-2">
            Record the debrief conversation with the child about the restraint.
          </p>
          <textarea
            id="childDebrief"
            {...register('childDebrief')}
            rows={3}
            placeholder="What was discussed with the child during the debrief? How did they respond?"
            className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
          />
        </div>

        <div>
          <label
            htmlFor="staffDebrief"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
          >
            Staff debrief
          </label>
          <p className="text-xs text-[oklch(0.55_0_0)] mb-2">
            Record the debrief with all staff involved in the restraint.
          </p>
          <textarea
            id="staffDebrief"
            {...register('staffDebrief')}
            rows={3}
            placeholder="Staff debrief notes — what went well, what could be improved, any learning points..."
            className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
          />
        </div>
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
          className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save restraint record'
          )}
        </button>
      </div>
    </form>
  );
}
