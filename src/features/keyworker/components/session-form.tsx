'use client';

/**
 * SessionForm — create a new key worker session.
 * Uses react-hook-form + zod for validation.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createSessionSchema } from '../schema';
import type { createKeyworkerSession } from '../actions';

// Form-local type using input inference (defaults not yet applied)
type FormValues = {
  personId: string;
  keyworkerId: string;
  sessionDate: string;
  checkIn?: string;
  weekReview?: string;
  goals?: { shortTerm?: string[]; longTerm?: string[]; progress?: string };
  education?: string;
  health?: string;
  family?: string;
  wishesAndFeelings?: string;
  actions: { action: string; assignedTo: string; deadline: string; completed: boolean }[];
};

type SessionFormProps = {
  personId: string;
  keyworkerId: string;
  orgSlug: string;
  onCreate: typeof createKeyworkerSession;
};

export function SessionForm({
  personId,
  keyworkerId,
  orgSlug,
  onCreate,
}: SessionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0]!;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createSessionSchema) as never,
    defaultValues: {
      personId,
      keyworkerId,
      sessionDate: today,
      checkIn: '',
      weekReview: '',
      goals: { shortTerm: [], longTerm: [], progress: '' },
      education: '',
      health: '',
      family: '',
      wishesAndFeelings: '',
      actions: [],
    },
  });

  const { fields: actionFields, append: appendAction, remove: removeAction } = useFieldArray({
    control,
    name: 'actions',
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      // Convert undefined string fields to null where the action allows it
      const result = await onCreate({
        ...data,
        checkIn: data.checkIn || undefined,
        weekReview: data.weekReview || undefined,
        education: data.education || undefined,
        health: data.health || undefined,
        family: data.family || undefined,
        wishesAndFeelings: data.wishesAndFeelings || undefined,
      } as Parameters<typeof onCreate>[0]);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to save session');
        return;
      }
      toast.success('Session recorded');
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
      {/* Session date */}
      <div>
        <label
          htmlFor="sessionDate"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Session date <span className="text-red-500">*</span>
        </label>
        <input
          id="sessionDate"
          type="date"
          {...register('sessionDate')}
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
        />
        {errors.sessionDate && (
          <p className="mt-1 text-xs text-red-600">{errors.sessionDate.message}</p>
        )}
      </div>

      {/* Check-in */}
      <div>
        <label
          htmlFor="checkIn"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Check-in
        </label>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-2">
          How is the child feeling today? What is their current mood?
        </p>
        <textarea
          id="checkIn"
          {...register('checkIn')}
          rows={3}
          placeholder="Describe the child's mood, presentation, and initial check-in..."
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
      </div>

      {/* Week review */}
      <div>
        <label
          htmlFor="weekReview"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Week review
        </label>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-2">
          Review of how the past week has gone — achievements, challenges, key events.
        </p>
        <textarea
          id="weekReview"
          {...register('weekReview')}
          rows={3}
          placeholder="How has the week gone? Any notable events, achievements or concerns..."
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
      </div>

      {/* Education */}
      <div>
        <label
          htmlFor="education"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Education
        </label>
        <textarea
          id="education"
          {...register('education')}
          rows={3}
          placeholder="School attendance, academic progress, any issues at school..."
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
      </div>

      {/* Health */}
      <div>
        <label
          htmlFor="health"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Health &amp; wellbeing
        </label>
        <textarea
          id="health"
          {...register('health')}
          rows={3}
          placeholder="Physical health, mental health, any appointments, medication, concerns..."
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
      </div>

      {/* Family */}
      <div>
        <label
          htmlFor="family"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Family &amp; contact
        </label>
        <textarea
          id="family"
          {...register('family')}
          rows={3}
          placeholder="Family contact, relationships, any concerns or positive developments..."
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
      </div>

      {/* Wishes and feelings */}
      <div>
        <label
          htmlFor="wishesAndFeelings"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Wishes &amp; feelings
        </label>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-2">
          Record the child&apos;s own words and views. Capture their voice directly.
        </p>
        <textarea
          id="wishesAndFeelings"
          {...register('wishesAndFeelings')}
          rows={4}
          placeholder="What does the child say they want? What are their feelings about their placement, family, school?"
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
      </div>

      {/* Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="block text-sm font-medium text-[oklch(0.35_0.04_160)]">
              Action items
            </label>
            <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
              Actions arising from this session with deadlines.
            </p>
          </div>
          <button
            type="button"
            onClick={() => appendAction({ action: '', assignedTo: '', deadline: today, completed: false })}
            className="inline-flex items-center gap-1 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-2.5 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add action
          </button>
        </div>

        {actionFields.length === 0 && (
          <div className="rounded-lg border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] px-4 py-3 text-center">
            <p className="text-xs text-[oklch(0.65_0_0)]">No action items added yet</p>
          </div>
        )}

        <div className="space-y-3">
          {actionFields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-[oklch(0.985_0.003_160)] p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <input
                    {...register(`actions.${index}.action`)}
                    placeholder="Describe the action..."
                    className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
                  />
                  <input
                    {...register(`actions.${index}.assignedTo`)}
                    placeholder="Assign to staff member..."
                    className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[oklch(0.55_0_0)]">Due:</label>
                      <input
                        type="date"
                        {...register(`actions.${index}.deadline`)}
                        className="rounded border border-[oklch(0.88_0.005_160)] bg-white px-2 py-1 text-xs text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.5_0.07_160)]/20"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAction(index)}
                  className="mt-1 rounded-md p-1 text-[oklch(0.65_0_0)] hover:text-red-600 hover:bg-red-50 transition-colors"
                  aria-label="Remove action"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
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
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
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
            'Save session'
          )}
        </button>
      </div>
    </form>
  );
}
