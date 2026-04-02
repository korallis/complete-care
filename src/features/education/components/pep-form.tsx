'use client';

/**
 * PEP creation/edit form.
 * VAL-EDU-002: PEP creation & versioning (termly)
 */

import { useActionState } from 'react';
import {
  pepTermValues,
  pepStatusValues,
  type PepFormData,
} from '../schema';

interface SchoolOption {
  id: string;
  schoolName: string;
}

interface PepFormProps {
  schools: SchoolOption[];
  defaultValues?: Partial<PepFormData>;
  onSubmit: (prev: FormState, formData: FormData) => Promise<FormState>;
}

interface FormState {
  success: boolean;
  error?: string;
}

const TERM_LABELS: Record<string, string> = {
  autumn: 'Autumn',
  spring: 'Spring',
  summer: 'Summer',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  completed: 'Completed',
  reviewed: 'Reviewed',
};

export function PepForm({ schools, defaultValues, onSubmit }: PepFormProps) {
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
        {/* School */}
        <div>
          <label htmlFor="schoolRecordId" className="block text-sm font-medium text-gray-700">
            School *
          </label>
          <select
            id="schoolRecordId"
            name="schoolRecordId"
            required
            defaultValue={defaultValues?.schoolRecordId ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select school</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.schoolName}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Year */}
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

        {/* Term */}
        <div>
          <label htmlFor="term" className="block text-sm font-medium text-gray-700">
            Term *
          </label>
          <select
            id="term"
            name="term"
            required
            defaultValue={defaultValues?.term ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select term</option>
            {pepTermValues.map((t) => (
              <option key={t} value={t}>
                {TERM_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaultValues?.status ?? 'draft'}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {pepStatusValues.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meeting date */}
      <div>
        <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700">
          PEP Meeting Date
        </label>
        <input
          type="datetime-local"
          id="meetingDate"
          name="meetingDate"
          defaultValue={defaultValues?.meetingDate ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Current attainment */}
      <div>
        <label htmlFor="currentAttainment" className="block text-sm font-medium text-gray-700">
          Current Attainment
        </label>
        <textarea
          id="currentAttainment"
          name="currentAttainment"
          rows={3}
          defaultValue={defaultValues?.currentAttainment ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Targets */}
      <div>
        <label htmlFor="targets" className="block text-sm font-medium text-gray-700">
          SMART Targets
        </label>
        <textarea
          id="targets"
          name="targets"
          rows={3}
          defaultValue={defaultValues?.targets ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Barriers to learning */}
      <div>
        <label htmlFor="barriersToLearning" className="block text-sm font-medium text-gray-700">
          Barriers to Learning
        </label>
        <textarea
          id="barriersToLearning"
          name="barriersToLearning"
          rows={2}
          defaultValue={defaultValues?.barriersToLearning ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Emotional wellbeing */}
      <div>
        <label htmlFor="emotionalWellbeing" className="block text-sm font-medium text-gray-700">
          Emotional Wellbeing at School
        </label>
        <textarea
          id="emotionalWellbeing"
          name="emotionalWellbeing"
          rows={2}
          defaultValue={defaultValues?.emotionalWellbeing ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Attendance summary */}
        <div>
          <label htmlFor="attendanceSummary" className="block text-sm font-medium text-gray-700">
            Attendance Summary
          </label>
          <textarea
            id="attendanceSummary"
            name="attendanceSummary"
            rows={2}
            defaultValue={defaultValues?.attendanceSummary ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Extra-curricular */}
        <div>
          <label htmlFor="extraCurricular" className="block text-sm font-medium text-gray-700">
            Extra-curricular Activities
          </label>
          <textarea
            id="extraCurricular"
            name="extraCurricular"
            rows={2}
            defaultValue={defaultValues?.extraCurricular ?? ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Pupil Premium Plus section */}
      <fieldset className="rounded-md border border-gray-200 p-4">
        <legend className="px-2 text-sm font-medium text-gray-700">
          Pupil Premium Plus
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="ppPlusAllocation" className="block text-sm text-gray-600">
              Allocation (pence)
            </label>
            <input
              type="number"
              id="ppPlusAllocation"
              name="ppPlusAllocation"
              min={0}
              defaultValue={defaultValues?.ppPlusAllocation ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="ppPlusActualSpend" className="block text-sm text-gray-600">
              Actual Spend (pence)
            </label>
            <input
              type="number"
              id="ppPlusActualSpend"
              name="ppPlusActualSpend"
              min={0}
              defaultValue={defaultValues?.ppPlusActualSpend ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="ppPlusPlannedUse" className="block text-sm text-gray-600">
              Planned Use
            </label>
            <input
              type="text"
              id="ppPlusPlannedUse"
              name="ppPlusPlannedUse"
              defaultValue={defaultValues?.ppPlusPlannedUse ?? ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </fieldset>

      {/* Meeting notes */}
      <div>
        <label htmlFor="meetingNotes" className="block text-sm font-medium text-gray-700">
          Meeting Notes
        </label>
        <textarea
          id="meetingNotes"
          name="meetingNotes"
          rows={4}
          defaultValue={defaultValues?.meetingNotes ?? ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save PEP'}
        </button>
      </div>
    </form>
  );
}
