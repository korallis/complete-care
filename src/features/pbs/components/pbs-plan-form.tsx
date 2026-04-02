'use client';

import { useState } from 'react';
import type { CreatePbsPlanInput } from '../schema';
import type { PbsPlan } from '@/lib/db/schema/pbs';

interface MdiContribution {
  name: string;
  role: string;
  date: string;
  notes: string;
}

interface PbsPlanFormProps {
  personId: string;
  existingPlan?: PbsPlan | null;
  onSubmit: (data: CreatePbsPlanInput) => Promise<void>;
}

export function PbsPlanForm({
  personId,
  existingPlan,
  onSubmit,
}: PbsPlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mdiContributions, setMdiContributions] = useState<MdiContribution[]>(
    (existingPlan?.mdiContributions as MdiContribution[] | undefined) ?? [],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const data: CreatePbsPlanInput = {
      personId,
      functionalAssessmentSummary: fd.get('functionalAssessmentSummary') as string,
      identifiedBehaviours: fd.get('identifiedBehaviours') as string,
      hypothesisedFunction: fd.get('hypothesisedFunction') as string,
      primaryStrategies: fd.get('primaryStrategies') as string,
      secondaryStrategies: fd.get('secondaryStrategies') as string,
      reactiveStrategies: fd.get('reactiveStrategies') as string,
      postIncidentSupport: fd.get('postIncidentSupport') as string,
      reductionPlan: (fd.get('reductionPlan') as string) || undefined,
      mdiContributions,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  function addMdiContribution() {
    setMdiContributions((prev) => [
      ...prev,
      { name: '', role: '', date: '', notes: '' },
    ]);
  }

  function updateMdiContribution(
    index: number,
    field: keyof MdiContribution,
    value: string,
  ) {
    setMdiContributions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function removeMdiContribution(index: number) {
    setMdiContributions((prev) => prev.filter((_, i) => i !== index));
  }

  const sectionClass =
    'rounded-lg border border-slate-200 bg-white p-6 shadow-sm';
  const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';
  const textareaClass =
    'w-full rounded-md border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors min-h-[100px] resize-y';
  const inputClass =
    'w-full rounded-md border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Version badge */}
      {existingPlan && (
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
            Version {existingPlan.version}
          </span>
          <span className="text-xs text-slate-500">
            Creating new version will supersede the current plan
          </span>
        </div>
      )}

      {/* Functional Assessment */}
      <section className={sectionClass}>
        <h3 className="mb-5 text-base font-bold tracking-tight text-slate-900">
          Functional Assessment
        </h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="functionalAssessmentSummary" className={labelClass}>
              Assessment Summary
            </label>
            <textarea
              id="functionalAssessmentSummary"
              name="functionalAssessmentSummary"
              className={textareaClass}
              defaultValue={existingPlan?.functionalAssessmentSummary ?? ''}
              placeholder="Summarise the findings of the functional assessment..."
              required
            />
          </div>
          <div>
            <label htmlFor="identifiedBehaviours" className={labelClass}>
              Identified Behaviour Descriptions
            </label>
            <textarea
              id="identifiedBehaviours"
              name="identifiedBehaviours"
              className={textareaClass}
              defaultValue={existingPlan?.identifiedBehaviours ?? ''}
              placeholder="Describe the behaviours identified for support..."
              required
            />
          </div>
          <div>
            <label htmlFor="hypothesisedFunction" className={labelClass}>
              Hypothesised Function of Behaviour
            </label>
            <textarea
              id="hypothesisedFunction"
              name="hypothesisedFunction"
              className={textareaClass}
              defaultValue={existingPlan?.hypothesisedFunction ?? ''}
              placeholder="What is the hypothesised function driving the behaviour..."
              required
            />
          </div>
        </div>
      </section>

      {/* Strategies */}
      <section className={sectionClass}>
        <h3 className="mb-5 text-base font-bold tracking-tight text-slate-900">
          Support Strategies
        </h3>
        <div className="space-y-5">
          <div>
            <label htmlFor="primaryStrategies" className={labelClass}>
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Primary (Proactive) Strategies
            </label>
            <textarea
              id="primaryStrategies"
              name="primaryStrategies"
              className={textareaClass}
              defaultValue={existingPlan?.primaryStrategies ?? ''}
              placeholder="Environmental and lifestyle changes to reduce likelihood..."
              required
            />
          </div>
          <div>
            <label htmlFor="secondaryStrategies" className={labelClass}>
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
              Secondary (Active) Strategies
            </label>
            <textarea
              id="secondaryStrategies"
              name="secondaryStrategies"
              className={textareaClass}
              defaultValue={existingPlan?.secondaryStrategies ?? ''}
              placeholder="Early intervention when warning signs are noticed..."
              required
            />
          </div>
          <div>
            <label htmlFor="reactiveStrategies" className={labelClass}>
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
              Reactive Strategies
            </label>
            <textarea
              id="reactiveStrategies"
              name="reactiveStrategies"
              className={textareaClass}
              defaultValue={existingPlan?.reactiveStrategies ?? ''}
              placeholder="Responses when behaviour of concern is occurring..."
              required
            />
          </div>
        </div>
      </section>

      {/* Post-Incident Support */}
      <section className={sectionClass}>
        <h3 className="mb-5 text-base font-bold tracking-tight text-slate-900">
          Post-Incident Support
        </h3>
        <div>
          <label htmlFor="postIncidentSupport" className={labelClass}>
            Post-Incident Support Protocol
          </label>
          <textarea
            id="postIncidentSupport"
            name="postIncidentSupport"
            className={textareaClass}
            defaultValue={existingPlan?.postIncidentSupport ?? ''}
            placeholder="Steps to support the person and staff after an incident..."
            required
          />
        </div>
      </section>

      {/* Reduction Plan */}
      <section className={sectionClass}>
        <h3 className="mb-5 text-base font-bold tracking-tight text-slate-900">
          Restrictive Practice Reduction Plan
        </h3>
        <div>
          <label htmlFor="reductionPlan" className={labelClass}>
            Reduction Strategy
          </label>
          <textarea
            id="reductionPlan"
            name="reductionPlan"
            className={textareaClass}
            defaultValue={existingPlan?.reductionPlan ?? ''}
            placeholder="Document the strategy for reducing restrictive practices over time..."
          />
        </div>
      </section>

      {/* MDI Contributions */}
      <section className={sectionClass}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            Multi-Disciplinary Input
          </h3>
          <button
            type="button"
            onClick={addMdiContribution}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
          >
            + Add Contributor
          </button>
        </div>

        {mdiContributions.length === 0 && (
          <p className="text-sm text-slate-500">
            No multi-disciplinary contributions recorded yet.
          </p>
        )}

        <div className="space-y-4">
          {mdiContributions.map((c, i) => (
            <div
              key={i}
              className="rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contributor {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeMdiContribution(i)}
                  className="text-xs text-red-600 hover:text-red-800 transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) =>
                      updateMdiContribution(i, 'name', e.target.value)
                    }
                    className={inputClass}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={c.role}
                    onChange={(e) =>
                      updateMdiContribution(i, 'role', e.target.value)
                    }
                    className={inputClass}
                    placeholder="e.g. Psychologist"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={c.date}
                    onChange={(e) =>
                      updateMdiContribution(i, 'date', e.target.value)
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Notes
                </label>
                <textarea
                  value={c.notes}
                  onChange={(e) =>
                    updateMdiContribution(i, 'notes', e.target.value)
                  }
                  className={`${textareaClass} min-h-[60px]`}
                  placeholder="Contribution notes..."
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting
            ? 'Saving...'
            : existingPlan
              ? 'Create New Version'
              : 'Create PBS Plan'}
        </button>
      </div>
    </form>
  );
}
