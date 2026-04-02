'use client';

/**
 * ChildrenVoiceForm — record a child's wishes and feelings.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createVoiceSchema } from '../schema';

type FormValues = {
  personId: string;
  recordedDate: string;
  category: 'daily_life' | 'education' | 'health' | 'family_contact' | 'placement' | 'activities' | 'food' | 'safety' | 'complaints' | 'compliments' | 'wishes' | 'other';
  content: string;
  method?: string;
  actionTaken?: string;
};
import {
  VOICE_CATEGORIES,
  VOICE_CATEGORY_LABELS,
  VOICE_METHODS,
  VOICE_METHOD_LABELS,
} from '../constants';
import type { createChildrensVoiceEntry } from '../actions';

type ChildrenVoiceFormProps = {
  personId: string;
  orgSlug: string;
  onCreate: typeof createChildrensVoiceEntry;
};

export function ChildrenVoiceForm({
  personId,
  orgSlug,
  onCreate,
}: ChildrenVoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0]!;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createVoiceSchema) as never,
    defaultValues: {
      personId,
      recordedDate: today,
      category: 'daily_life',
      content: '',
      method: 'direct_conversation',
      actionTaken: '',
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await onCreate(data as Parameters<typeof onCreate>[0]);
      if (!result.success) {
        toast.error(result.error ?? 'Failed to save entry');
        return;
      }
      toast.success('Views recorded');
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
      {/* Date and category */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="recordedDate"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
          >
            Date recorded <span className="text-red-500">*</span>
          </label>
          <input
            id="recordedDate"
            type="date"
            {...register('recordedDate')}
            className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
          />
          {errors.recordedDate && (
            <p className="mt-1 text-xs text-red-600">{errors.recordedDate.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
          >
            Topic / Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            {...register('category')}
            className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
          >
            {VOICE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {VOICE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Method */}
      <div>
        <label
          htmlFor="method"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          How was this captured?
        </label>
        <select
          id="method"
          {...register('method')}
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20"
        >
          <option value="">Select method...</option>
          {VOICE_METHODS.map((m) => (
            <option key={m} value={m}>
              {VOICE_METHOD_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Child&apos;s views and wishes <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-2">
          Record the child&apos;s views in their own words as much as possible.
        </p>
        <textarea
          id="content"
          {...register('content')}
          rows={5}
          placeholder="&quot;I feel...&quot; or describe the child&apos;s expressed wishes and feelings..."
          className="block w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder-[oklch(0.65_0_0)] focus:border-[oklch(0.5_0.07_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.07_160)]/20 resize-none"
        />
        {errors.content && (
          <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>
        )}
      </div>

      {/* Action taken */}
      <div>
        <label
          htmlFor="actionTaken"
          className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
        >
          Action taken in response
        </label>
        <p className="text-xs text-[oklch(0.55_0_0)] mb-2">
          What action was taken or is planned to address the child&apos;s wishes?
        </p>
        <textarea
          id="actionTaken"
          {...register('actionTaken')}
          rows={3}
          placeholder="Describe what was done or what is planned in response to the child's views..."
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
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
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
            'Record views'
          )}
        </button>
      </div>
    </form>
  );
}
