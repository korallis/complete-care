'use client';

/**
 * MedicationForm — prescribe new medication or edit existing.
 * Uses react-hook-form for form state management.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  MEDICATION_ROUTES,
  MEDICATION_ROUTE_LABELS,
  MEDICATION_FREQUENCIES,
  MEDICATION_FREQUENCY_LABELS,
  DOSE_UNITS,
  DOSE_UNIT_LABELS,
  COMMON_TIME_PRESETS,
  DAYS_OF_WEEK,
} from '@/features/emar/constants';
import type { CreateMedicationInput, UpdateMedicationInput } from '@/features/emar/schema';
import type { Medication } from '@/lib/db/schema/medications';
import type { FrequencyDetail } from '@/lib/db/schema/medications';
import type { FrequencyDetailInput } from '@/features/emar/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

type CreateMode = {
  mode: 'create';
  personId: string;
  onSubmit: (data: CreateMedicationInput) => Promise<{ success: boolean; error?: string; data?: Medication }>;
};

type EditMode = {
  mode: 'edit';
  medication: Medication;
  onSubmit: (data: UpdateMedicationInput) => Promise<{ success: boolean; error?: string; data?: Medication }>;
};

type MedicationFormProps = (CreateMode | EditMode) & {
  orgSlug: string;
  personId: string;
};

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function MedicationForm(props: MedicationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const existingDetail = props.mode === 'edit'
    ? (props.medication.frequencyDetail as FrequencyDetail | null)
    : null;

  const [timesOfDay, setTimesOfDay] = useState<string[]>(
    existingDetail?.timesOfDay ?? [],
  );
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(
    (existingDetail?.daysOfWeek ?? []) as DayOfWeek[],
  );
  const [newTime, setNewTime] = useState('');

  const form = useForm<{
    drugName: string;
    dose: string;
    doseUnit: string;
    route: string;
    frequency: string;
    prescribedDate: string;
    prescriberName: string;
    pharmacy: string;
    specialInstructions: string;
  }>({
    defaultValues:
      props.mode === 'edit'
        ? {
            drugName: props.medication.drugName,
            dose: props.medication.dose,
            doseUnit: props.medication.doseUnit,
            route: props.medication.route,
            frequency: props.medication.frequency,
            prescribedDate: props.medication.prescribedDate ?? '',
            prescriberName: props.medication.prescriberName ?? '',
            pharmacy: props.medication.pharmacy ?? '',
            specialInstructions: props.medication.specialInstructions ?? '',
          }
        : {
            drugName: '',
            dose: '',
            doseUnit: 'mg',
            route: 'oral',
            frequency: 'regular',
            prescribedDate: new Date().toISOString().slice(0, 10),
            prescriberName: '',
            pharmacy: '',
            specialInstructions: '',
          },
  });

  const watchFrequency = form.watch('frequency');

  function addTime(time: string) {
    if (time && !timesOfDay.includes(time)) {
      setTimesOfDay((prev) => [...prev, time].sort());
    }
    setNewTime('');
  }

  function removeTime(time: string) {
    setTimesOfDay((prev) => prev.filter((t) => t !== time));
  }

  function toggleDay(day: DayOfWeek) {
    setDaysOfWeek((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day],
    );
  }

  function handleSubmit(formData: Record<string, string>) {
    setServerError(null);

    startTransition(async () => {
      const frequencyDetail: FrequencyDetailInput = {
        timesOfDay,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined,
      };

      let result: { success: boolean; error?: string; data?: Medication };

      if (props.mode === 'create') {
        result = await props.onSubmit({
          personId: props.personId,
          drugName: formData.drugName,
          dose: formData.dose,
          doseUnit: formData.doseUnit as typeof DOSE_UNITS[number],
          route: formData.route as typeof MEDICATION_ROUTES[number],
          frequency: formData.frequency as typeof MEDICATION_FREQUENCIES[number],
          frequencyDetail,
          prescribedDate: formData.prescribedDate,
          prescriberName: formData.prescriberName,
          pharmacy: formData.pharmacy || null,
          specialInstructions: formData.specialInstructions || null,
        });
      } else {
        result = await props.onSubmit({
          drugName: formData.drugName,
          dose: formData.dose,
          doseUnit: formData.doseUnit as typeof DOSE_UNITS[number],
          route: formData.route as typeof MEDICATION_ROUTES[number],
          frequency: formData.frequency as typeof MEDICATION_FREQUENCIES[number],
          frequencyDetail,
          prescriberName: formData.prescriberName,
          pharmacy: formData.pharmacy || null,
          specialInstructions: formData.specialInstructions || null,
        });
      }

      if (result.success) {
        toast.success(
          props.mode === 'create' ? 'Medication prescribed' : 'Medication updated',
        );
        if (result.data) {
          router.push(`/${props.orgSlug}/persons/${props.personId}/emar/medications/${result.data.id}`);
        } else {
          router.push(`/${props.orgSlug}/persons/${props.personId}/emar/medications`);
        }
      } else {
        setServerError(result.error ?? 'An error occurred');
        toast.error(result.error ?? 'Failed to save medication');
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
      aria-label="Medication form"
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

      {/* Drug details */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Drug details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Drug name */}
          <div className="md:col-span-2">
            <label htmlFor="med-drug-name" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Drug name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="med-drug-name"
              type="text"
              {...form.register('drugName')}
              placeholder="e.g., Paracetamol"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
              aria-required="true"
            />
          </div>

          {/* Dose */}
          <div>
            <label htmlFor="med-dose" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Dose <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="med-dose"
              type="text"
              {...form.register('dose')}
              placeholder="e.g., 500"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
              aria-required="true"
            />
          </div>

          {/* Dose unit */}
          <div>
            <label htmlFor="med-dose-unit" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Unit <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="med-dose-unit"
              {...form.register('doseUnit')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            >
              {DOSE_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {DOSE_UNIT_LABELS[unit]}
                </option>
              ))}
            </select>
          </div>

          {/* Route */}
          <div>
            <label htmlFor="med-route" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Route <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="med-route"
              {...form.register('route')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            >
              {MEDICATION_ROUTES.map((route) => (
                <option key={route} value={route}>
                  {MEDICATION_ROUTE_LABELS[route]}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label htmlFor="med-frequency" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Frequency <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="med-frequency"
              {...form.register('frequency')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            >
              {MEDICATION_FREQUENCIES.map((freq) => (
                <option key={freq} value={freq}>
                  {MEDICATION_FREQUENCY_LABELS[freq]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schedule (for regular medications) */}
      {watchFrequency === 'regular' && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Schedule
          </h2>

          {/* Times of day */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
              Times of day
            </label>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_TIME_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => addTime(preset.value)}
                  disabled={timesOfDay.includes(preset.value)}
                  className="rounded-md border border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] px-2.5 py-1 text-xs text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] disabled:opacity-40 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom time input */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
                aria-label="Custom time"
              />
              <button
                type="button"
                onClick={() => addTime(newTime)}
                disabled={!newTime}
                className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] disabled:opacity-40 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Selected times */}
            {timesOfDay.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {timesOfDay.map((time) => (
                  <span
                    key={time}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.94_0.015_160)] px-3 py-1 text-xs font-medium text-[oklch(0.3_0.08_160)]"
                  >
                    {time}
                    <button
                      type="button"
                      onClick={() => removeTime(time)}
                      className="text-[oklch(0.55_0_0)] hover:text-red-600 transition-colors"
                      aria-label={`Remove ${time}`}
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

          {/* Days of week (optional) */}
          <div>
            <label className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
              Days of week <span className="text-[oklch(0.65_0_0)]">(leave empty for every day)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value as DayOfWeek)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    daysOfWeek.includes(day.value)
                      ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.3_0.08_160)] text-white'
                      : 'border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)]'
                  }`}
                  aria-pressed={daysOfWeek.includes(day.value)}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prescriber details */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Prescriber details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Prescribed date (only for create) */}
          {props.mode === 'create' && (
            <div>
              <label htmlFor="med-prescribed-date" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
                Prescribed date <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="med-prescribed-date"
                type="date"
                {...form.register('prescribedDate')}
                className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
                aria-required="true"
              />
            </div>
          )}

          {/* Prescriber name */}
          <div>
            <label htmlFor="med-prescriber" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Prescriber name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="med-prescriber"
              type="text"
              {...form.register('prescriberName')}
              placeholder="e.g., Dr. Smith"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
              aria-required="true"
            />
          </div>

          {/* Pharmacy */}
          <div>
            <label htmlFor="med-pharmacy" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Pharmacy
            </label>
            <input
              id="med-pharmacy"
              type="text"
              {...form.register('pharmacy')}
              placeholder="e.g., Boots Pharmacy"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            />
          </div>

          {/* Special instructions */}
          <div className="md:col-span-2">
            <label htmlFor="med-instructions" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Special instructions
            </label>
            <textarea
              id="med-instructions"
              {...form.register('specialInstructions')}
              placeholder="e.g., Take with food, crush before giving"
              rows={3}
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
            props.mode === 'create' ? 'Prescribe medication' : 'Save changes'
          )}
        </button>
      </div>
    </form>
  );
}
