'use client';

/**
 * MealEntryForm — record a meal with portion consumed.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  PORTION_OPTIONS,
  PORTION_LABELS,
  type MealType,
  type PortionConsumed,
} from '@/features/clinical-monitoring/constants';
import type { RecordMealEntryInput } from '@/features/clinical-monitoring/schema';

type MealEntryFormProps = {
  personId: string;
  onSubmit: (
    input: RecordMealEntryInput,
  ) => Promise<{ success: boolean; error?: string }>;
};

export function MealEntryForm({ personId, onSubmit }: MealEntryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [description, setDescription] = useState('');
  const [portionConsumed, setPortionConsumed] = useState<PortionConsumed>('all');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please describe the meal');
      return;
    }

    startTransition(async () => {
      const input: RecordMealEntryInput = {
        personId,
        mealType,
        description: description.trim(),
        portionConsumed,
        recordedAt: new Date().toISOString(),
      };

      const result = await onSubmit(input);

      if (result.success) {
        toast.success(`${MEAL_TYPE_LABELS[mealType]} recorded`);
        setDescription('');
        setPortionConsumed('all');
      } else {
        toast.error(result.error ?? 'Failed to record meal');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
        Record Meal
      </h3>

      {/* Meal type */}
      <div>
        <label
          htmlFor="meal-type"
          className="block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1"
        >
          Meal Type
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setMealType(type)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                mealType === type
                  ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.95_0.02_160)] text-[oklch(0.3_0.08_160)]'
                  : 'border-[oklch(0.88_0.005_160)] text-[oklch(0.55_0_0)] hover:border-[oklch(0.7_0.03_160)]'
              }`}
            >
              {MEAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="meal-description"
          className="block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1"
        >
          Description
        </label>
        <textarea
          id="meal-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What was offered/eaten..."
          className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
        />
      </div>

      {/* Portion consumed */}
      <div>
        <label className="block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1">
          Portion Consumed
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PORTION_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPortionConsumed(option)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                portionConsumed === option
                  ? option === 'refused'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.95_0.02_160)] text-[oklch(0.3_0.08_160)]'
                  : 'border-[oklch(0.88_0.005_160)] text-[oklch(0.55_0_0)] hover:border-[oklch(0.7_0.03_160)]'
              }`}
            >
              {PORTION_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Recording...' : 'Record Meal'}
      </button>
    </form>
  );
}
