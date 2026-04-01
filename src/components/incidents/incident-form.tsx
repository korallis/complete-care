'use client';

/**
 * IncidentForm — full incident reporting form with severity picker,
 * persons involved, witness details, injury details, and body map link.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { CreateIncidentInput } from '@/features/incidents/schema';
import type { Incident } from '@/lib/db/schema/incidents';
import {
  SEVERITY_LEVELS,
  SEVERITY_LABELS,
  SEVERITY_DESCRIPTIONS,
  INCIDENT_LOCATIONS,
  LOCATION_LABELS,
  REGULATORY_BODIES,
  REGULATORY_BODY_LABELS,
  INVOLVED_PERSON_ROLES,
  INVOLVED_PERSON_ROLE_LABELS,
  triggersDutyOfCandour,
  isPotentiallyNotifiable,
  type SeverityLevel,
  type RegulatoryBody,
} from '@/features/incidents/constants';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IncidentFormProps = {
  personId: string;
  orgSlug: string;
  onCreate: (data: CreateIncidentInput) => Promise<{
    success: boolean;
    error?: string;
    data?: Incident;
  }>;
};

type InvolvedPersonEntry = {
  name: string;
  role: string;
  personId?: string;
};

type WitnessEntry = {
  name: string;
  role: string;
  contactInfo?: string;
  statement?: string;
};

type InjuryDetailEntry = {
  bodyRegion: string;
  description: string;
  severity: string;
  treatment?: string;
};

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function IncidentForm({ personId, orgSlug, onCreate }: IncidentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Form state
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [immediateActions, setImmediateActions] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('minor');
  const [involvedPersons, setInvolvedPersons] = useState<InvolvedPersonEntry[]>([]);
  const [witnesses, setWitnesses] = useState<WitnessEntry[]>([]);
  const [injuryDetails, setInjuryDetails] = useState<InjuryDetailEntry[]>([]);
  const [isNotifiable, setIsNotifiable] = useState<'yes' | 'no'>('no');
  const [regulatoryBody, setRegulatoryBody] = useState<RegulatoryBody>('none');

  // Derived state
  const dutyOfCandour = triggersDutyOfCandour(severity);
  const autoNotifiable = isPotentiallyNotifiable(severity);

  function addInvolvedPerson() {
    setInvolvedPersons((prev) => [...prev, { name: '', role: 'resident' }]);
  }

  function removeInvolvedPerson(index: number) {
    setInvolvedPersons((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInvolvedPerson(index: number, field: string, value: string) {
    setInvolvedPersons((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  }

  function addWitness() {
    setWitnesses((prev) => [...prev, { name: '', role: 'staff' }]);
  }

  function removeWitness(index: number) {
    setWitnesses((prev) => prev.filter((_, i) => i !== index));
  }

  function updateWitness(index: number, field: string, value: string) {
    setWitnesses((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    );
  }

  function addInjuryDetail() {
    setInjuryDetails((prev) => [
      ...prev,
      { bodyRegion: '', description: '', severity: 'minor' },
    ]);
  }

  function removeInjuryDetail(index: number) {
    setInjuryDetails((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInjuryDetail(index: number, field: string, value: string) {
    setInjuryDetails((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    startTransition(async () => {
      const result = await onCreate({
        personId,
        dateTime,
        location,
        description,
        immediateActions: immediateActions || undefined,
        severity,
        involvedPersons: involvedPersons.filter((p) => p.name.trim()),
        witnesses: witnesses.filter((w) => w.name.trim()),
        injuryDetails: injuryDetails.filter((d) => d.bodyRegion.trim() && d.description.trim()),
        linkedBodyMapEntryIds: [],
        isNotifiable: autoNotifiable ? 'yes' : isNotifiable,
        regulatoryBody: regulatoryBody !== 'none' ? regulatoryBody : undefined,
      });

      if (result.success) {
        toast.success('Incident reported');
        router.push(`/${orgSlug}/persons/${personId}/incidents`);
      } else {
        setServerError(result.error ?? 'Failed to report incident');
        toast.error(result.error ?? 'Failed to report incident');
      }
    });
  }

  const inputClass =
    'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors';
  const labelClass = 'block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5';
  const sectionClass = 'rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 space-y-4';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Server error */}
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {serverError}
        </div>
      )}

      {/* Date/Time + Location */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          When and where
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="incident-datetime" className={labelClass}>
              Date and time of incident *
            </label>
            <input
              id="incident-datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="incident-location" className={labelClass}>
              Location *
            </label>
            <select
              id="incident-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select location</option>
              {INCIDENT_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCATION_LABELS[loc]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Severity */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          Severity classification
        </h2>

        <fieldset aria-label="Severity level">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SEVERITY_LEVELS.map((level) => (
              <label
                key={level}
                className={cn(
                  'flex flex-col gap-1 rounded-lg border px-4 py-3 cursor-pointer transition-all',
                  severity === level
                    ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.97_0.005_160)] ring-1 ring-[oklch(0.5_0.1_160)/0.3]'
                    : 'border-[oklch(0.91_0.005_160)] hover:border-[oklch(0.8_0.03_160)] hover:bg-[oklch(0.99_0.001_160)]',
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="severity"
                    value={level}
                    checked={severity === level}
                    onChange={() => setSeverity(level)}
                    className="h-4 w-4 border-[oklch(0.7_0_0)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
                  />
                  <span className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                    {SEVERITY_LABELS[level]}
                  </span>
                </div>
                <p className="text-xs text-[oklch(0.55_0_0)] ml-7">
                  {SEVERITY_DESCRIPTIONS[level]}
                </p>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Duty of Candour warning */}
        {dutyOfCandour && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              Duty of Candour applies
            </p>
            <p className="text-xs text-amber-700 mt-1">
              This severity level triggers Duty of Candour requirements. Ensure the affected
              person and/or their family are informed openly and honestly about what happened.
            </p>
          </div>
        )}

        {/* Auto-notifiable warning */}
        {autoNotifiable && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
            <p className="text-sm font-medium text-purple-800">
              Potentially notifiable incident
            </p>
            <p className="text-xs text-purple-700 mt-1">
              This severity level may require notification to a regulatory body (CQC/Ofsted).
              Managers and directors will be automatically notified.
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          What happened
        </h2>

        <div>
          <label htmlFor="incident-description" className={labelClass}>
            Description of incident *
          </label>
          <textarea
            id="incident-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            minLength={10}
            placeholder="Describe what happened, including events leading up to the incident..."
            className={cn(inputClass, 'resize-y')}
          />
        </div>

        <div>
          <label htmlFor="incident-actions" className={labelClass}>
            Immediate actions taken
          </label>
          <textarea
            id="incident-actions"
            value={immediateActions}
            onChange={(e) => setImmediateActions(e.target.value)}
            rows={3}
            placeholder="What was done immediately after the incident..."
            className={cn(inputClass, 'resize-y')}
          />
        </div>
      </div>

      {/* Persons involved */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Persons involved
          </h2>
          <button
            type="button"
            onClick={addInvolvedPerson}
            className="text-xs font-medium text-[oklch(0.35_0.08_160)] hover:text-[oklch(0.25_0.08_160)] transition-colors"
          >
            + Add person
          </button>
        </div>

        {involvedPersons.length === 0 && (
          <p className="text-xs text-[oklch(0.65_0_0)]">
            No additional persons involved. Click &quot;Add person&quot; to record others involved.
          </p>
        )}

        {involvedPersons.map((person, idx) => (
          <div key={idx} className="flex items-start gap-3 border-t border-[oklch(0.95_0.003_160)] pt-3">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updateInvolvedPerson(idx, 'name', e.target.value)}
                  placeholder="Full name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Role</label>
                <select
                  value={person.role}
                  onChange={(e) => updateInvolvedPerson(idx, 'role', e.target.value)}
                  className={inputClass}
                >
                  {INVOLVED_PERSON_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {INVOLVED_PERSON_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeInvolvedPerson(idx)}
              className="mt-6 text-[oklch(0.55_0_0)] hover:text-red-600 transition-colors"
              aria-label="Remove person"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Witnesses */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Witnesses
          </h2>
          <button
            type="button"
            onClick={addWitness}
            className="text-xs font-medium text-[oklch(0.35_0.08_160)] hover:text-[oklch(0.25_0.08_160)] transition-colors"
          >
            + Add witness
          </button>
        </div>

        {witnesses.length === 0 && (
          <p className="text-xs text-[oklch(0.65_0_0)]">
            No witnesses recorded. Click &quot;Add witness&quot; to add.
          </p>
        )}

        {witnesses.map((witness, idx) => (
          <div key={idx} className="border-t border-[oklch(0.95_0.003_160)] pt-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Name</label>
                  <input
                    type="text"
                    value={witness.name}
                    onChange={(e) => updateWitness(idx, 'name', e.target.value)}
                    placeholder="Full name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Role</label>
                  <select
                    value={witness.role}
                    onChange={(e) => updateWitness(idx, 'role', e.target.value)}
                    className={inputClass}
                  >
                    {INVOLVED_PERSON_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {INVOLVED_PERSON_ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeWitness(idx)}
                className="mt-6 text-[oklch(0.55_0_0)] hover:text-red-600 transition-colors"
                aria-label="Remove witness"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <label className={labelClass}>Statement (optional)</label>
              <textarea
                value={witness.statement ?? ''}
                onChange={(e) => updateWitness(idx, 'statement', e.target.value)}
                rows={2}
                placeholder="Witness account of events..."
                className={cn(inputClass, 'resize-y')}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Injury details */}
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Injury details
          </h2>
          <button
            type="button"
            onClick={addInjuryDetail}
            className="text-xs font-medium text-[oklch(0.35_0.08_160)] hover:text-[oklch(0.25_0.08_160)] transition-colors"
          >
            + Add injury
          </button>
        </div>

        {injuryDetails.length === 0 && (
          <p className="text-xs text-[oklch(0.65_0_0)]">
            No injuries recorded. Click &quot;Add injury&quot; to document.
          </p>
        )}

        {injuryDetails.map((detail, idx) => (
          <div key={idx} className="border-t border-[oklch(0.95_0.003_160)] pt-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Body region</label>
                  <input
                    type="text"
                    value={detail.bodyRegion}
                    onChange={(e) => updateInjuryDetail(idx, 'bodyRegion', e.target.value)}
                    placeholder="e.g. Left arm, Head"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Injury severity</label>
                  <select
                    value={detail.severity}
                    onChange={(e) => updateInjuryDetail(idx, 'severity', e.target.value)}
                    className={inputClass}
                  >
                    {SEVERITY_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {SEVERITY_LABELS[level]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeInjuryDetail(idx)}
                className="mt-6 text-[oklch(0.55_0_0)] hover:text-red-600 transition-colors"
                aria-label="Remove injury"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <label className={labelClass}>Description *</label>
              <textarea
                value={detail.description}
                onChange={(e) => updateInjuryDetail(idx, 'description', e.target.value)}
                rows={2}
                placeholder="Describe the injury..."
                className={cn(inputClass, 'resize-y')}
              />
            </div>
            <div>
              <label className={labelClass}>Treatment provided</label>
              <input
                type="text"
                value={detail.treatment ?? ''}
                onChange={(e) => updateInjuryDetail(idx, 'treatment', e.target.value)}
                placeholder="Treatment given..."
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Regulatory notification */}
      <div className={sectionClass}>
        <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          Regulatory notification
        </h2>

        {!autoNotifiable && (
          <div>
            <label className={labelClass}>Is this a notifiable incident?</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="isNotifiable"
                  value="no"
                  checked={isNotifiable === 'no'}
                  onChange={() => setIsNotifiable('no')}
                  className="h-4 w-4 border-[oklch(0.7_0_0)] text-[oklch(0.3_0.08_160)]"
                />
                No
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="isNotifiable"
                  value="yes"
                  checked={isNotifiable === 'yes'}
                  onChange={() => setIsNotifiable('yes')}
                  className="h-4 w-4 border-[oklch(0.7_0_0)] text-[oklch(0.3_0.08_160)]"
                />
                Yes
              </label>
            </div>
          </div>
        )}

        {(autoNotifiable || isNotifiable === 'yes') && (
          <div>
            <label htmlFor="regulatory-body" className={labelClass}>
              Regulatory body to notify
            </label>
            <select
              id="regulatory-body"
              value={regulatoryBody}
              onChange={(e) => setRegulatoryBody(e.target.value as RegulatoryBody)}
              className={inputClass}
            >
              {REGULATORY_BODIES.map((body) => (
                <option key={body} value={body}>
                  {REGULATORY_BODY_LABELS[body]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-5 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          aria-busy={isPending}
        >
          {isPending ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Submitting...
            </>
          ) : (
            'Report incident'
          )}
        </button>
      </div>
    </form>
  );
}
