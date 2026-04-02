'use client';

/**
 * LacRecordForm — create and edit LAC records.
 *
 * Captures legal status, placing authority, social worker details,
 * and IRO contact information.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { LacRecord } from '@/lib/db/schema/lac';
import type {
  CreateLacRecordInput,
  UpdateLacRecordInput,
} from '@/features/lac/schema';
import {
  LAC_LEGAL_STATUSES,
  LAC_LEGAL_STATUS_LABELS,
  type LacLegalStatus,
} from '@/features/lac/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreateMode = {
  mode: 'create';
  personId: string;
  onSubmit: (
    data: CreateLacRecordInput,
  ) => Promise<{ success: boolean; error?: string; data?: LacRecord }>;
};

type EditMode = {
  mode: 'edit';
  record: LacRecord;
  onSubmit: (
    data: UpdateLacRecordInput,
  ) => Promise<{ success: boolean; error?: string; data?: LacRecord }>;
};

type LacRecordFormProps = (CreateMode | EditMode) & {
  orgSlug: string;
  personId: string;
};

// ---------------------------------------------------------------------------
// Form field component
// ---------------------------------------------------------------------------

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
};

function Field({ id, label, required, children, error }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
      >
        {label}{' '}
        {required && (
          <span className="text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

type FormValues = {
  legalStatus: LacLegalStatus;
  legalStatusDate: string;
  placingAuthority: string;
  socialWorkerName: string;
  socialWorkerEmail: string;
  socialWorkerPhone: string;
  iroName: string;
  iroEmail: string;
  iroPhone: string;
  admissionDate: string;
};

export function LacRecordForm(props: LacRecordFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    defaultValues:
      props.mode === 'edit'
        ? {
            legalStatus: props.record.legalStatus as LacLegalStatus,
            legalStatusDate: props.record.legalStatusDate,
            placingAuthority: props.record.placingAuthority,
            socialWorkerName: props.record.socialWorkerName ?? '',
            socialWorkerEmail: props.record.socialWorkerEmail ?? '',
            socialWorkerPhone: props.record.socialWorkerPhone ?? '',
            iroName: props.record.iroName ?? '',
            iroEmail: props.record.iroEmail ?? '',
            iroPhone: props.record.iroPhone ?? '',
            admissionDate: props.record.admissionDate,
          }
        : {
            legalStatus: 'section20',
            legalStatusDate: '',
            placingAuthority: '',
            socialWorkerName: '',
            socialWorkerEmail: '',
            socialWorkerPhone: '',
            iroName: '',
            iroEmail: '',
            iroPhone: '',
            admissionDate: '',
          },
  });

  const inputCls =
    'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors';

  function handleSubmit(formData: FormValues) {
    setServerError(null);

    startTransition(async () => {
      let result: { success: boolean; error?: string; data?: LacRecord };

      if (props.mode === 'create') {
        result = await props.onSubmit({
          personId: props.personId,
          legalStatus: formData.legalStatus,
          legalStatusDate: formData.legalStatusDate,
          placingAuthority: formData.placingAuthority,
          socialWorkerName: formData.socialWorkerName || null,
          socialWorkerEmail: formData.socialWorkerEmail || null,
          socialWorkerPhone: formData.socialWorkerPhone || null,
          iroName: formData.iroName || null,
          iroEmail: formData.iroEmail || null,
          iroPhone: formData.iroPhone || null,
          admissionDate: formData.admissionDate,
        });
      } else {
        result = await props.onSubmit({
          legalStatus: formData.legalStatus,
          legalStatusDate: formData.legalStatusDate,
          placingAuthority: formData.placingAuthority,
          socialWorkerName: formData.socialWorkerName || null,
          socialWorkerEmail: formData.socialWorkerEmail || null,
          socialWorkerPhone: formData.socialWorkerPhone || null,
          iroName: formData.iroName || null,
          iroEmail: formData.iroEmail || null,
          iroPhone: formData.iroPhone || null,
          admissionDate: formData.admissionDate,
        });
      }

      if (result.success) {
        toast.success(
          props.mode === 'create'
            ? 'LAC record created'
            : 'LAC record updated',
        );
        router.push(`/${props.orgSlug}/persons/${props.personId}/lac`);
      } else {
        setServerError(result.error ?? 'An error occurred');
        toast.error(result.error ?? 'Failed to save LAC record');
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
      aria-label="LAC record form"
    >
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

      {/* Legal status & admission details */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Legal status & admission
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field id="lac-legal-status" label="Legal status" required>
            <select
              id="lac-legal-status"
              {...form.register('legalStatus')}
              className={inputCls}
            >
              {LAC_LEGAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {LAC_LEGAL_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>

          <Field id="lac-status-date" label="Legal status date" required>
            <input
              id="lac-status-date"
              type="date"
              {...form.register('legalStatusDate')}
              className={inputCls}
              aria-required="true"
            />
          </Field>

          <Field id="lac-placing-authority" label="Placing authority" required>
            <input
              id="lac-placing-authority"
              type="text"
              {...form.register('placingAuthority')}
              placeholder="e.g., London Borough of Camden"
              className={inputCls}
              aria-required="true"
            />
          </Field>

          <Field id="lac-admission-date" label="Admission date" required>
            <input
              id="lac-admission-date"
              type="date"
              {...form.register('admissionDate')}
              className={inputCls}
              aria-required="true"
            />
          </Field>
        </div>
      </div>

      {/* Social worker */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Assigned social worker
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field id="lac-sw-name" label="Name">
            <input
              id="lac-sw-name"
              type="text"
              {...form.register('socialWorkerName')}
              placeholder="Full name"
              className={inputCls}
            />
          </Field>
          <Field id="lac-sw-email" label="Email">
            <input
              id="lac-sw-email"
              type="email"
              {...form.register('socialWorkerEmail')}
              placeholder="email@authority.gov.uk"
              className={inputCls}
            />
          </Field>
          <Field id="lac-sw-phone" label="Phone">
            <input
              id="lac-sw-phone"
              type="tel"
              {...form.register('socialWorkerPhone')}
              placeholder="020 1234 5678"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {/* IRO */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Independent Reviewing Officer (IRO)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field id="lac-iro-name" label="Name">
            <input
              id="lac-iro-name"
              type="text"
              {...form.register('iroName')}
              placeholder="Full name"
              className={inputCls}
            />
          </Field>
          <Field id="lac-iro-email" label="Email">
            <input
              id="lac-iro-email"
              type="email"
              {...form.register('iroEmail')}
              placeholder="email@authority.gov.uk"
              className={inputCls}
            />
          </Field>
          <Field id="lac-iro-phone" label="Phone">
            <input
              id="lac-iro-phone"
              type="tel"
              {...form.register('iroPhone')}
              placeholder="020 1234 5678"
              className={inputCls}
            />
          </Field>
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
              Saving...
            </>
          ) : props.mode === 'create' ? (
            'Create LAC record'
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </form>
  );
}
