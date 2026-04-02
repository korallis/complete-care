'use client';

/**
 * SDQ Assessment form.
 * VAL-EDU-007: SDQ scoring — 5 subscales, total difficulties, trend
 */

import { useActionState } from 'react';
import { sdqRespondentValues } from '../schema';

interface SdqFormProps {
  onSubmit: (prev: FormState, formData: FormData) => Promise<FormState>;
}

interface FormState {
  success: boolean;
  error?: string;
}

const RESPONDENT_LABELS: Record<string, string> = {
  self: 'Self-report',
  parent_carer: 'Parent/Carer',
  teacher: 'Teacher',
};

const SUBSCALES = [
  { name: 'emotionalScore', label: 'Emotional Symptoms', max: 10 },
  { name: 'conductScore', label: 'Conduct Problems', max: 10 },
  { name: 'hyperactivityScore', label: 'Hyperactivity/Inattention', max: 10 },
  { name: 'peerScore', label: 'Peer Relationship Problems', max: 10 },
  { name: 'prosocialScore', label: 'Prosocial Behaviour', max: 10 },
] as const;

export function SdqForm({ onSubmit }: SdqFormProps) {
  const [state, formAction, isPending] = useActionState(onSubmit, {
    success: false,
  });

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="assessmentDate" className="block text-sm font-medium text-gray-700">
            Assessment Date *
          </label>
          <input
            type="date"
            id="assessmentDate"
            name="assessmentDate"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="respondent" className="block text-sm font-medium text-gray-700">
            Respondent *
          </label>
          <select
            id="respondent"
            name="respondent"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select respondent</option>
            {sdqRespondentValues.map((r) => (
              <option key={r} value={r}>
                {RESPONDENT_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscale scores */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-2 text-sm font-semibold text-gray-700">
          Subscale Scores (0-10)
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBSCALES.map((scale) => (
            <div key={scale.name}>
              <label htmlFor={scale.name} className="block text-sm text-gray-600">
                {scale.label}
              </label>
              <input
                type="number"
                id={scale.name}
                name={scale.name}
                min={0}
                max={scale.max}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ))}

          <div>
            <label htmlFor="impactScore" className="block text-sm text-gray-600">
              Impact Score (optional)
            </label>
            <input
              type="number"
              id="impactScore"
              name="impactScore"
              min={0}
              max={10}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Total Difficulties Score = Emotional + Conduct + Hyperactivity + Peer (auto-calculated, max 40).
          Prosocial is scored separately.
        </p>
      </fieldset>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save SDQ Assessment'}
        </button>
      </div>
    </form>
  );
}
