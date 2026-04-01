'use client';

/**
 * StaffForm — create or edit a staff profile.
 * Uses react-hook-form + zod for validation.
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { createStaffSchema } from '@/features/staff/schema';
import type { CreateStaffInput } from '@/features/staff/schema';
import {
  STAFF_CONTRACT_TYPES,
  CONTRACT_TYPE_LABELS,
} from '@/features/staff/schema';
import { JOB_TITLE_SUGGESTIONS } from '@/features/staff/constants';

type StaffFormValues = CreateStaffInput;

type StaffFormProps = {
  orgSlug: string;
  defaultValues?: Partial<StaffFormValues>;
  onSubmit: (
    data: CreateStaffInput,
  ) => Promise<{ success: boolean; error?: string; staffId?: string }>;
  mode: 'create' | 'edit';
};

export function StaffForm({
  orgSlug,
  defaultValues,
  onSubmit,
  mode,
}: StaffFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(createStaffSchema) as unknown as Resolver<StaffFormValues>,
    defaultValues: {
      contractType: 'full_time',
      ...defaultValues,
    },
  });

  const handleFormSubmit = (data: StaffFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await onSubmit(data);
      if (!result.success) {
        setServerError(result.error ?? 'Something went wrong');
      } else if (result.staffId) {
        router.push(`/${orgSlug}/staff/${result.staffId}`);
      } else {
        router.push(`/${orgSlug}/staff`);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-8"
      noValidate
    >
      {/* Server error */}
      {serverError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {serverError}
        </div>
      )}

      {/* Section: Personal details */}
      <section aria-labelledby="section-personal">
        <div className="mb-4 border-b border-[oklch(0.91_0.005_160)] pb-2">
          <h2
            id="section-personal"
            className="text-base font-semibold text-[oklch(0.22_0.04_160)]"
          >
            Personal details
          </h2>
          <p className="mt-0.5 text-xs text-[oklch(0.55_0_0)]">
            Staff member identity and contact information
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* First name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              First name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              {...register('firstName')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow ${
                errors.firstName
                  ? 'border-red-400'
                  : 'border-[oklch(0.88_0.005_160)]'
              }`}
              aria-describedby={errors.firstName ? 'firstName-error' : undefined}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && (
              <p
                id="firstName-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Last name <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              {...register('lastName')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow ${
                errors.lastName
                  ? 'border-red-400'
                  : 'border-[oklch(0.88_0.005_160)]'
              }`}
              aria-describedby={errors.lastName ? 'lastName-error' : undefined}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && (
              <p
                id="lastName-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow ${
                errors.email
                  ? 'border-red-400'
                  : 'border-[oklch(0.88_0.005_160)]'
              }`}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              {...register('phone')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow"
            />
          </div>
        </div>
      </section>

      {/* Section: Employment details */}
      <section aria-labelledby="section-employment">
        <div className="mb-4 border-b border-[oklch(0.91_0.005_160)] pb-2">
          <h2
            id="section-employment"
            className="text-base font-semibold text-[oklch(0.22_0.04_160)]"
          >
            Employment details
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Job title */}
          <div>
            <label
              htmlFor="jobTitle"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Job title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="jobTitle"
              type="text"
              list="job-title-suggestions"
              {...register('jobTitle')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow ${
                errors.jobTitle
                  ? 'border-red-400'
                  : 'border-[oklch(0.88_0.005_160)]'
              }`}
              aria-describedby={errors.jobTitle ? 'jobTitle-error' : undefined}
              aria-invalid={!!errors.jobTitle}
            />
            <datalist id="job-title-suggestions">
              {JOB_TITLE_SUGGESTIONS.map((title) => (
                <option key={title} value={title} />
              ))}
            </datalist>
            {errors.jobTitle && (
              <p
                id="jobTitle-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {errors.jobTitle.message}
              </p>
            )}
          </div>

          {/* Contract type */}
          <div>
            <label
              htmlFor="contractType"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Contract type
            </label>
            <select
              id="contractType"
              {...register('contractType')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
            >
              {STAFF_CONTRACT_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {CONTRACT_TYPE_LABELS[ct]}
                </option>
              ))}
            </select>
          </div>

          {/* Weekly hours */}
          <div>
            <label
              htmlFor="weeklyHours"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Weekly hours
            </label>
            <input
              id="weeklyHours"
              type="number"
              step="0.5"
              min="0"
              max="168"
              placeholder="e.g. 37.5"
              {...register('weeklyHours')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow"
            />
          </div>

          {/* NI number */}
          <div>
            <label
              htmlFor="niNumber"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              National Insurance number
            </label>
            <input
              id="niNumber"
              type="text"
              placeholder="e.g. AB 12 34 56 C"
              {...register('niNumber')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow font-mono ${
                errors.niNumber
                  ? 'border-red-400'
                  : 'border-[oklch(0.88_0.005_160)]'
              }`}
              aria-describedby={errors.niNumber ? 'ni-error' : undefined}
            />
            {errors.niNumber && (
              <p id="ni-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.niNumber.message}
              </p>
            )}
          </div>

          {/* Start date */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              {...register('startDate')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow ${
                errors.startDate
                  ? 'border-red-400'
                  : 'border-[oklch(0.88_0.005_160)]'
              }`}
              aria-describedby={errors.startDate ? 'start-date-error' : undefined}
            />
            {errors.startDate && (
              <p
                id="start-date-error"
                className="mt-1 text-xs text-red-600"
                role="alert"
              >
                {errors.startDate.message}
              </p>
            )}
          </div>

          {/* End date */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              End date{' '}
              <span className="text-[oklch(0.65_0_0)] font-normal">(if applicable)</span>
            </label>
            <input
              id="endDate"
              type="date"
              {...register('endDate')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow"
            />
          </div>
        </div>
      </section>

      {/* Section: Emergency contact */}
      <section aria-labelledby="section-emergency">
        <div className="mb-4 border-b border-[oklch(0.91_0.005_160)] pb-2">
          <h2
            id="section-emergency"
            className="text-base font-semibold text-[oklch(0.22_0.04_160)]"
          >
            Emergency contact
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="emergencyContactName"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Contact name
            </label>
            <input
              id="emergencyContactName"
              type="text"
              {...register('emergencyContactName')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label
              htmlFor="emergencyContactPhone"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Contact phone
            </label>
            <input
              id="emergencyContactPhone"
              type="tel"
              {...register('emergencyContactPhone')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label
              htmlFor="emergencyContactRelation"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Relationship
            </label>
            <input
              id="emergencyContactRelation"
              type="text"
              placeholder="e.g. Spouse, Parent"
              {...register('emergencyContactRelation')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow"
            />
          </div>
        </div>
      </section>

      {/* Form actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[oklch(0.91_0.005_160)]">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-5 py-2.5 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[oklch(0.22_0.04_160)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[oklch(0.28_0.06_160)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2"
        >
          {isPending
            ? mode === 'create'
              ? 'Saving...'
              : 'Updating...'
            : mode === 'create'
              ? 'Add staff member'
              : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
