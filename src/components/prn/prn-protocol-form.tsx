'use client';

/**
 * PrnProtocolForm — create or edit a PRN protocol.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  MIN_INTERVAL_OPTIONS,
  FOLLOW_UP_INTERVALS,
} from '@/features/prn/constants';
import type { CreatePrnProtocolInput, UpdatePrnProtocolInput } from '@/features/prn/schema';
import type { PrnProtocol } from '@/lib/db/schema/prn-protocols';
import type { Medication } from '@/lib/db/schema/medications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreateMode = {
  mode: 'create';
  medication: Medication;
  onSubmit: (data: CreatePrnProtocolInput) => Promise<{ success: boolean; error?: string; data?: PrnProtocol }>;
};

type EditMode = {
  mode: 'edit';
  protocol: PrnProtocol;
  medication: Medication;
  onSubmit: (data: UpdatePrnProtocolInput) => Promise<{ success: boolean; error?: string; data?: PrnProtocol }>;
};

type PrnProtocolFormProps = (CreateMode | EditMode) & {
  orgSlug: string;
  personId: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrnProtocolForm(props: PrnProtocolFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>(
    props.mode === 'edit'
      ? (props.protocol.signsSymptoms as Array<{ description: string }> ?? []).map((s) => s.description)
      : [],
  );
  const [newSymptom, setNewSymptom] = useState('');

  const form = useForm<{
    indication: string;
    doseRange: string;
    maxDose24hr: string;
    minInterval: string;
    nonPharmAlternatives: string;
    expectedEffect: string;
    escalationCriteria: string;
    followUpMinutes: string;
  }>({
    defaultValues:
      props.mode === 'edit'
        ? {
            indication: props.protocol.indication,
            doseRange: props.protocol.doseRange,
            maxDose24hr: props.protocol.maxDose24hr,
            minInterval: String(props.protocol.minInterval),
            nonPharmAlternatives: props.protocol.nonPharmAlternatives ?? '',
            expectedEffect: props.protocol.expectedEffect,
            escalationCriteria: props.protocol.escalationCriteria ?? '',
            followUpMinutes: String(props.protocol.followUpMinutes),
          }
        : {
            indication: '',
            doseRange: `${props.medication.dose} ${props.medication.doseUnit}`,
            maxDose24hr: '',
            minInterval: '240',
            nonPharmAlternatives: '',
            expectedEffect: '',
            escalationCriteria: '',
            followUpMinutes: '60',
          },
  });

  function addSymptom() {
    const trimmed = newSymptom.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms((prev) => [...prev, trimmed]);
    }
    setNewSymptom('');
  }

  function removeSymptom(symptom: string) {
    setSymptoms((prev) => prev.filter((s) => s !== symptom));
  }

  function handleSubmit(formData: Record<string, string>) {
    setServerError(null);

    startTransition(async () => {
      const signsSymptoms = symptoms.map((s) => ({ description: s }));

      let result: { success: boolean; error?: string; data?: PrnProtocol };

      if (props.mode === 'create') {
        result = await props.onSubmit({
          medicationId: props.medication.id,
          indication: formData.indication,
          signsSymptoms,
          doseRange: formData.doseRange,
          maxDose24hr: formData.maxDose24hr,
          minInterval: parseInt(formData.minInterval, 10),
          nonPharmAlternatives: formData.nonPharmAlternatives || null,
          expectedEffect: formData.expectedEffect,
          escalationCriteria: formData.escalationCriteria || null,
          followUpMinutes: parseInt(formData.followUpMinutes, 10),
        });
      } else {
        result = await props.onSubmit({
          indication: formData.indication,
          signsSymptoms,
          doseRange: formData.doseRange,
          maxDose24hr: formData.maxDose24hr,
          minInterval: parseInt(formData.minInterval, 10),
          nonPharmAlternatives: formData.nonPharmAlternatives || null,
          expectedEffect: formData.expectedEffect,
          escalationCriteria: formData.escalationCriteria || null,
          followUpMinutes: parseInt(formData.followUpMinutes, 10),
        });
      }

      if (result.success) {
        toast.success(
          props.mode === 'create' ? 'PRN protocol created' : 'Protocol updated',
        );
        if (result.data) {
          router.push(`/${props.orgSlug}/persons/${props.personId}/emar/prn/${result.data.id}`);
        } else {
          router.push(`/${props.orgSlug}/persons/${props.personId}/emar/prn`);
        }
      } else {
        setServerError(result.error ?? 'An error occurred');
        toast.error(result.error ?? 'Failed to save protocol');
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
      aria-label="PRN protocol form"
    >
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {serverError}
        </div>
      )}

      {/* Medication info header */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-[oklch(0.97_0.005_160)] p-4">
        <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide mb-1">
          PRN Medication
        </p>
        <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          {props.medication.drugName} &mdash; {props.medication.dose} {props.medication.doseUnit}
        </p>
      </div>

      {/* Indication and symptoms */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Indication & Symptoms
        </h2>
        <div className="space-y-5">
          <div>
            <label htmlFor="prn-indication" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Indication <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="prn-indication"
              type="text"
              {...form.register('indication')}
              placeholder="e.g., Pain relief, Anxiety management"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
              aria-required="true"
            />
          </div>

          {/* Signs & Symptoms */}
          <div>
            <label className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
              Signs & Symptoms to watch for
            </label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSymptom();
                  }
                }}
                placeholder="e.g., Facial grimacing, Guarding"
                className="flex-1 rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
                aria-label="Add symptom"
              />
              <button
                type="button"
                onClick={addSymptom}
                disabled={!newSymptom.trim()}
                className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] disabled:opacity-40 transition-colors"
              >
                Add
              </button>
            </div>
            {symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <span
                    key={symptom}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.94_0.015_160)] px-3 py-1 text-xs font-medium text-[oklch(0.3_0.08_160)]"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => removeSymptom(symptom)}
                      className="text-[oklch(0.55_0_0)] hover:text-red-600 transition-colors"
                      aria-label={`Remove ${symptom}`}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dosing parameters */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Dosing Parameters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="prn-dose-range" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Dose range <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="prn-dose-range"
              type="text"
              {...form.register('doseRange')}
              placeholder="e.g., 500mg - 1000mg"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="prn-max-dose" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Max dose in 24 hours <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="prn-max-dose"
              type="text"
              {...form.register('maxDose24hr')}
              placeholder="e.g., 4000mg"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="prn-min-interval" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Minimum interval between doses <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="prn-min-interval"
              {...form.register('minInterval')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            >
              {MIN_INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="prn-follow-up" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Follow-up assessment interval
            </label>
            <select
              id="prn-follow-up"
              {...form.register('followUpMinutes')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            >
              {FOLLOW_UP_INTERVALS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clinical guidance */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Clinical Guidance
        </h2>
        <div className="space-y-5">
          <div>
            <label htmlFor="prn-non-pharm" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Non-pharmacological alternatives
            </label>
            <textarea
              id="prn-non-pharm"
              {...form.register('nonPharmAlternatives')}
              placeholder="e.g., Repositioning, cold compress, distraction techniques"
              rows={3}
              className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            />
          </div>
          <div>
            <label htmlFor="prn-expected-effect" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Expected effect <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="prn-expected-effect"
              {...form.register('expectedEffect')}
              placeholder="e.g., Pain reduced to below 4/10 within 30 minutes"
              rows={2}
              className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
              aria-required="true"
            />
          </div>
          <div>
            <label htmlFor="prn-escalation" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Escalation criteria
            </label>
            <textarea
              id="prn-escalation"
              {...form.register('escalationCriteria')}
              placeholder="e.g., If pain persists above 7/10 after 2 doses, contact GP"
              rows={2}
              className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            />
          </div>
        </div>
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
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            props.mode === 'create' ? 'Create protocol' : 'Save changes'
          )}
        </button>
      </div>
    </form>
  );
}
