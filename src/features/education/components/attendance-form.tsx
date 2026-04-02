'use client';

/**
 * Daily education attendance recording form.
 * VAL-EDU-004: On-time/late/absent/excluded tracking per day
 */

import { useActionState } from 'react';
import { attendanceMarkValues } from '../schema';

interface AttendanceFormProps {
  schoolRecordId: string;
  onSubmit: (prev: FormState, formData: FormData) => Promise<FormState>;
}

interface FormState {
  success: boolean;
  error?: string;
}

const MARK_LABELS: Record<string, string> = {
  present: 'Present (on time)',
  late: 'Late',
  authorised_absent: 'Authorised Absent',
  unauthorised_absent: 'Unauthorised Absent',
  excluded: 'Excluded',
  not_required: 'Not Required',
};

export function AttendanceForm({ schoolRecordId, onSubmit }: AttendanceFormProps) {
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="amMark" className="block text-sm font-medium text-gray-700">
            AM Session *
          </label>
          <select
            id="amMark"
            name="amMark"
            required
            defaultValue="present"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {attendanceMarkValues.map((m) => (
              <option key={m} value={m}>
                {MARK_LABELS[m]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pmMark" className="block text-sm font-medium text-gray-700">
            PM Session *
          </label>
          <select
            id="pmMark"
            name="pmMark"
            required
            defaultValue="present"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {attendanceMarkValues.map((m) => (
              <option key={m} value={m}>
                {MARK_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Recording...' : 'Record Attendance'}
        </button>
      </div>
    </form>
  );
}
