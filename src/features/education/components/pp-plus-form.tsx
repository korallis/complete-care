'use client';

/**
 * Pupil Premium Plus tracking form.
 * VAL-EDU-006: Allocation amount, planned use, actual spend
 */

import { useActionState } from 'react';
import type { PupilPremiumPlusFormData } from '../schema';

interface PpPlusFormProps {
  defaultValues?: Partial<PupilPremiumPlusFormData>;
  onSubmit: (prev: FormState, formData: FormData) => Promise<FormState>;
}

interface FormState {
  success: boolean;
  error?: string;
}

export function PpPlusForm({ defaultValues, onSubmit }: PpPlusFormProps) {
  const [state, formAction, isPending] = useActionState(onSubmit, {
    success: false,
  });

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700">
            Academic Year *
          </label>
          <input
            type="text"
            id="academicYear"
            name="academicYear"
            placeholder="2025-2026"
            required
            defaultValue={defaultValues?.academicYear ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            placeholder="e.g. Tutoring, Resources"
            defaultValue={defaultValues?.category ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="allocationAmount" className="block text-sm font-medium text-gray-700">
            Allocation Amount (pence) *
          </label>
          <input
            type="number"
            id="allocationAmount"
            name="allocationAmount"
            min={0}
            required
            defaultValue={defaultValues?.allocationAmount ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            e.g. 250000 = {'\u00A3'}2,500.00
          </p>
        </div>

        <div>
          <label htmlFor="actualSpend" className="block text-sm font-medium text-gray-700">
            Actual Spend (pence)
          </label>
          <input
            type="number"
            id="actualSpend"
            name="actualSpend"
            min={0}
            defaultValue={defaultValues?.actualSpend ?? 0}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="plannedUse" className="block text-sm font-medium text-gray-700">
          Planned Use *
        </label>
        <textarea
          id="plannedUse"
          name="plannedUse"
          rows={3}
          required
          defaultValue={defaultValues?.plannedUse ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="evidenceOfImpact" className="block text-sm font-medium text-gray-700">
          Evidence of Impact
        </label>
        <textarea
          id="evidenceOfImpact"
          name="evidenceOfImpact"
          rows={3}
          defaultValue={defaultValues?.evidenceOfImpact ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save PP+ Record'}
        </button>
      </div>
    </form>
  );
}
