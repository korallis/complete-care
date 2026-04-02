'use client';

/**
 * Exclusion record form.
 * VAL-EDU-005: Fixed-term/permanent with reasons, dates, duration
 */

import { useActionState } from 'react';
import { exclusionTypeValues } from '../schema';

interface ExclusionFormProps {
  schoolRecordId: string;
  onSubmit: (prev: FormState, formData: FormData) => Promise<FormState>;
}

interface FormState {
  success: boolean;
  error?: string;
}

const TYPE_LABELS: Record<string, string> = {
  fixed_term: 'Fixed Term',
  permanent: 'Permanent',
};

export function ExclusionForm({ schoolRecordId, onSubmit }: ExclusionFormProps) {
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

      <input type="hidden" name="schoolRecordId" value={schoolRecordId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="exclusionType" className="block text-sm font-medium text-gray-700">
            Type *
          </label>
          <select
            id="exclusionType"
            name="exclusionType"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select type</option>
            {exclusionTypeValues.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700">
            Duration (school days)
          </label>
          <input
            type="number"
            id="durationDays"
            name="durationDays"
            min={0}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
          Reason *
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={2}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="appealLodged"
            value="true"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Appeal lodged
        </label>
      </div>

      <div>
        <label htmlFor="appealOutcome" className="block text-sm font-medium text-gray-700">
          Appeal Outcome
        </label>
        <input
          type="text"
          id="appealOutcome"
          name="appealOutcome"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Record Exclusion'}
        </button>
      </div>
    </form>
  );
}
