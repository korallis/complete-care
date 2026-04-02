'use client';

/**
 * School record form — add/edit a school placement for a child.
 * VAL-EDU-001: School record per child
 */

import { useActionState } from 'react';
import { senStatusValues, type SchoolRecordFormData } from '../schema';

interface SchoolRecordFormProps {
  defaultValues?: Partial<SchoolRecordFormData>;
  onSubmit: (prev: FormState, formData: FormData) => Promise<FormState>;
}

interface FormState {
  success: boolean;
  error?: string;
}

const SEN_LABELS: Record<string, string> = {
  none: 'None',
  sen_support: 'SEN Support',
  ehcp: 'EHCP',
  assessment_pending: 'Assessment Pending',
};

export function SchoolRecordForm({ defaultValues, onSubmit }: SchoolRecordFormProps) {
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
          <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
            School Name *
          </label>
          <input
            type="text"
            id="schoolName"
            name="schoolName"
            required
            defaultValue={defaultValues?.schoolName ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="yearGroup" className="block text-sm font-medium text-gray-700">
            Year Group
          </label>
          <input
            type="text"
            id="yearGroup"
            name="yearGroup"
            placeholder="e.g. 9"
            defaultValue={defaultValues?.yearGroup ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="schoolAddress" className="block text-sm font-medium text-gray-700">
          School Address
        </label>
        <textarea
          id="schoolAddress"
          name="schoolAddress"
          rows={2}
          defaultValue={defaultValues?.schoolAddress ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="schoolPhone" className="block text-sm font-medium text-gray-700">
            School Phone
          </label>
          <input
            type="tel"
            id="schoolPhone"
            name="schoolPhone"
            defaultValue={defaultValues?.schoolPhone ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="senStatus" className="block text-sm font-medium text-gray-700">
            SEN Status
          </label>
          <select
            id="senStatus"
            name="senStatus"
            defaultValue={defaultValues?.senStatus ?? 'none'}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {senStatusValues.map((s) => (
              <option key={s} value={s}>
                {SEN_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="ehcpInPlace"
            value="true"
            defaultChecked={defaultValues?.ehcpInPlace}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          EHCP in place
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="isCurrent"
            value="true"
            defaultChecked={defaultValues?.isCurrent !== false}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Current school
        </label>
      </div>

      {/* Designated teacher for LAC */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-2 text-sm font-medium text-gray-700">
          Designated Teacher for LAC
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="designatedTeacherName" className="block text-sm text-gray-600">
              Name
            </label>
            <input
              type="text"
              id="designatedTeacherName"
              name="designatedTeacherName"
              defaultValue={defaultValues?.designatedTeacherName ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="designatedTeacherEmail" className="block text-sm text-gray-600">
              Email
            </label>
            <input
              type="email"
              id="designatedTeacherEmail"
              name="designatedTeacherEmail"
              defaultValue={defaultValues?.designatedTeacherEmail ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            defaultValue={defaultValues?.startDate ?? ''}
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
            defaultValue={defaultValues?.endDate ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
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
          defaultValue={defaultValues?.notes ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save School Record'}
        </button>
      </div>
    </form>
  );
}
