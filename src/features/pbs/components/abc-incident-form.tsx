'use client';

import { useState } from 'react';
import {
  ANTECEDENT_CATEGORIES,
  ANTECEDENT_CATEGORY_LABELS,
  INTENSITY_LABELS,
  type CreateAbcIncidentInput,
} from '../schema';

interface AbcIncidentFormProps {
  personId: string;
  pbsPlanId?: string;
  onSubmit: (data: CreateAbcIncidentInput) => Promise<void>;
  onCancel?: () => void;
}

export function AbcIncidentForm({
  personId,
  pbsPlanId,
  onSubmit,
  onCancel,
}: AbcIncidentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const data: CreateAbcIncidentInput = {
      personId,
      pbsPlanId: pbsPlanId || undefined,
      occurredAt: fd.get('occurredAt') as string,
      antecedentCategory: fd.get('antecedentCategory') as CreateAbcIncidentInput['antecedentCategory'],
      antecedentDescription: fd.get('antecedentDescription') as string,
      behaviourTopography: fd.get('behaviourTopography') as string,
      behaviourDuration: fd.get('behaviourDuration')
        ? Number(fd.get('behaviourDuration'))
        : undefined,
      behaviourIntensity: Number(fd.get('behaviourIntensity')),
      consequenceStaffResponse: fd.get('consequenceStaffResponse') as string,
      settingEnvironment: (fd.get('settingEnvironment') as string) || undefined,
      settingPeoplePresent:
        (fd.get('settingPeoplePresent') as string) || undefined,
      settingActivity: (fd.get('settingActivity') as string) || undefined,
      settingSensoryFactors:
        (fd.get('settingSensoryFactors') as string) || undefined,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  const sectionClass =
    'rounded-lg border border-slate-200 bg-white p-6 shadow-sm';
  const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';
  const inputClass =
    'w-full rounded-md border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors';
  const textareaClass = `${inputClass} min-h-[80px] resize-y`;
  const selectClass = `${inputClass} appearance-none cursor-pointer`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Date/Time */}
      <section className={sectionClass}>
        <h3 className="mb-4 text-base font-bold tracking-tight text-slate-900">
          Incident Details
        </h3>
        <div>
          <label htmlFor="occurredAt" className={labelClass}>
            Date &amp; Time of Incident
          </label>
          <input
            id="occurredAt"
            name="occurredAt"
            type="datetime-local"
            className={inputClass}
            required
          />
        </div>
      </section>

      {/* Antecedent */}
      <section className={sectionClass}>
        <h3 className="mb-4 text-base font-bold tracking-tight text-slate-900">
          <span className="mr-2 inline-block h-3 w-3 rounded bg-blue-500" />
          Antecedent
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="antecedentCategory" className={labelClass}>
              Category
            </label>
            <select
              id="antecedentCategory"
              name="antecedentCategory"
              className={selectClass}
              required
            >
              <option value="">Select category...</option>
              {ANTECEDENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {ANTECEDENT_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="antecedentDescription" className={labelClass}>
              Description
            </label>
            <textarea
              id="antecedentDescription"
              name="antecedentDescription"
              className={textareaClass}
              placeholder="What happened immediately before the behaviour..."
              required
            />
          </div>
        </div>
      </section>

      {/* Behaviour */}
      <section className={sectionClass}>
        <h3 className="mb-4 text-base font-bold tracking-tight text-slate-900">
          <span className="mr-2 inline-block h-3 w-3 rounded bg-amber-500" />
          Behaviour
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="behaviourTopography" className={labelClass}>
              Topography (Description)
            </label>
            <textarea
              id="behaviourTopography"
              name="behaviourTopography"
              className={textareaClass}
              placeholder="Describe what the behaviour looked like..."
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="behaviourDuration" className={labelClass}>
                Duration (minutes)
              </label>
              <input
                id="behaviourDuration"
                name="behaviourDuration"
                type="number"
                min="0"
                className={inputClass}
                placeholder="e.g. 15"
              />
            </div>
            <div>
              <label htmlFor="behaviourIntensity" className={labelClass}>
                Intensity (1-5)
              </label>
              <select
                id="behaviourIntensity"
                name="behaviourIntensity"
                className={selectClass}
                required
              >
                <option value="">Select intensity...</option>
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>
                    {level} - {INTENSITY_LABELS[level]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Consequence */}
      <section className={sectionClass}>
        <h3 className="mb-4 text-base font-bold tracking-tight text-slate-900">
          <span className="mr-2 inline-block h-3 w-3 rounded bg-red-500" />
          Consequence
        </h3>
        <div>
          <label htmlFor="consequenceStaffResponse" className={labelClass}>
            Staff Response
          </label>
          <textarea
            id="consequenceStaffResponse"
            name="consequenceStaffResponse"
            className={textareaClass}
            placeholder="How staff responded to the behaviour..."
            required
          />
        </div>
      </section>

      {/* Setting Conditions */}
      <section className={sectionClass}>
        <h3 className="mb-4 text-base font-bold tracking-tight text-slate-900">
          Setting Conditions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="settingEnvironment" className={labelClass}>
              Environment
            </label>
            <input
              id="settingEnvironment"
              name="settingEnvironment"
              className={inputClass}
              placeholder="e.g. Living room, garden"
            />
          </div>
          <div>
            <label htmlFor="settingPeoplePresent" className={labelClass}>
              People Present
            </label>
            <input
              id="settingPeoplePresent"
              name="settingPeoplePresent"
              className={inputClass}
              placeholder="e.g. 2 staff, 1 peer"
            />
          </div>
          <div>
            <label htmlFor="settingActivity" className={labelClass}>
              Activity
            </label>
            <input
              id="settingActivity"
              name="settingActivity"
              className={inputClass}
              placeholder="e.g. Mealtime, transition to bed"
            />
          </div>
          <div>
            <label htmlFor="settingSensoryFactors" className={labelClass}>
              Sensory Factors
            </label>
            <input
              id="settingSensoryFactors"
              name="settingSensoryFactors"
              className={inputClass}
              placeholder="e.g. Loud TV, bright lighting"
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Saving...' : 'Record Incident'}
        </button>
      </div>
    </form>
  );
}
