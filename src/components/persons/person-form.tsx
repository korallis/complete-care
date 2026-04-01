'use client';

/**
 * PersonForm — create or edit a person record.
 * Uses react-hook-form + zod for validation.
 */

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useTransition, useState } from 'react';
import { createPersonSchema } from '@/features/persons/schema';
import type { CreatePersonInput } from '@/features/persons/schema';
import type { PersonTerminology } from '@/features/persons/utils';

// Use the full create schema for both create and edit modes
// (edit form pre-populates all fields via defaultValues)
type PersonFormValues = CreatePersonInput;

type PersonFormProps = {
  orgSlug: string;
  terminology: PersonTerminology;
  defaultType?: 'resident' | 'client' | 'young_person';
  /** Pass existing person data for edit mode */
  defaultValues?: Partial<PersonFormValues>;
  /** Called with form data on submit */
  onSubmit: (data: CreatePersonInput) => Promise<{ success: boolean; error?: string; personId?: string }>;
  mode: 'create' | 'edit';
};

const GENDER_OPTIONS = [
  'Male',
  'Female',
  'Non-binary',
  'Prefer not to say',
  'Other',
];

const ETHNICITY_OPTIONS = [
  'White — British',
  'White — Irish',
  'White — Any other White background',
  'Mixed — White and Black Caribbean',
  'Mixed — White and Black African',
  'Mixed — White and Asian',
  'Mixed — Any other mixed background',
  'Asian or Asian British — Indian',
  'Asian or Asian British — Pakistani',
  'Asian or Asian British — Bangladeshi',
  'Asian or Asian British — Chinese',
  'Asian or Asian British — Any other Asian background',
  'Black or Black British — African',
  'Black or Black British — Caribbean',
  'Black or Black British — Any other Black background',
  'Other ethnic group — Arab',
  'Other ethnic group — Any other ethnic group',
  'Not stated',
];

export function PersonForm({
  orgSlug,
  terminology,
  defaultType = 'resident',
  defaultValues,
  onSubmit,
  mode,
}: PersonFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(createPersonSchema) as unknown as Resolver<PersonFormValues>,
    defaultValues: {
      type: defaultType,
      allergies: [],
      medicalConditions: [],
      emergencyContacts: [],
      ...defaultValues,
    },
  });

  const {
    fields: allergyFields,
    append: appendAllergy,
    remove: removeAllergy,
  } = useFieldArray({ control, name: 'allergies' as never });

  const {
    fields: conditionFields,
    append: appendCondition,
    remove: removeCondition,
  } = useFieldArray({ control, name: 'medicalConditions' as never });

  const {
    fields: emergencyFields,
    append: appendEmergency,
    remove: removeEmergency,
  } = useFieldArray({ control, name: 'emergencyContacts' });

  const handleFormSubmit = (data: PersonFormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = await onSubmit(data as CreatePersonInput);
      if (!result.success) {
        setServerError(result.error ?? 'Something went wrong');
      } else if (result.personId) {
        router.push(`/${orgSlug}/persons/${result.personId}`);
      } else {
        router.push(`/${orgSlug}/persons`);
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

      {/* Section: Identity */}
      <section aria-labelledby="section-identity">
        <div className="mb-4 border-b border-[oklch(0.91_0.005_160)] pb-2">
          <h2
            id="section-identity"
            className="text-base font-semibold text-[oklch(0.22_0.04_160)]"
          >
            Personal details
          </h2>
          <p className="mt-0.5 text-xs text-[oklch(0.55_0_0)]">
            Core identifying information for {terminology.singularLower}
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
              <p id="firstName-error" className="mt-1 text-xs text-red-600" role="alert">
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
              <p id="lastName-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Preferred name */}
          <div>
            <label
              htmlFor="preferredName"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Preferred name{' '}
              <span className="text-[oklch(0.65_0_0)] font-normal">(known as)</span>
            </label>
            <input
              id="preferredName"
              type="text"
              {...register('preferredName')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow"
            />
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              {terminology.singular} type <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <select
              id="type"
              {...register('type')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
            >
              <option value="resident">Resident</option>
              <option value="client">Client</option>
              <option value="young_person">Young Person</option>
            </select>
          </div>

          {/* Date of birth */}
          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              {...register('dateOfBirth')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent transition-shadow ${
                errors.dateOfBirth
                  ? 'border-red-400'
                  : 'border-[oklch(0.88_0.005_160)]'
              }`}
              aria-describedby={errors.dateOfBirth ? 'dob-error' : undefined}
            />
            {errors.dateOfBirth && (
              <p id="dob-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Gender
            </label>
            <select
              id="gender"
              {...register('gender')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Ethnicity */}
          <div>
            <label
              htmlFor="ethnicity"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Ethnicity
            </label>
            <select
              id="ethnicity"
              {...register('ethnicity')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
            >
              <option value="">Select ethnicity</option>
              {ETHNICITY_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          {/* Religion */}
          <div>
            <label
              htmlFor="religion"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Religion
            </label>
            <input
              id="religion"
              type="text"
              placeholder="e.g. Christianity, Islam, None"
              {...register('religion')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
            />
          </div>

          {/* First language */}
          <div>
            <label
              htmlFor="firstLanguage"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              First language
            </label>
            <input
              id="firstLanguage"
              type="text"
              placeholder="e.g. English, Polish, Bengali"
              {...register('firstLanguage')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* Section: Medical */}
      <section aria-labelledby="section-medical">
        <div className="mb-4 border-b border-[oklch(0.91_0.005_160)] pb-2">
          <h2
            id="section-medical"
            className="text-base font-semibold text-[oklch(0.22_0.04_160)]"
          >
            Medical information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* NHS Number */}
          <div>
            <label
              htmlFor="nhsNumber"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              NHS Number
            </label>
            <input
              id="nhsNumber"
              type="text"
              placeholder="123 456 7890"
              {...register('nhsNumber')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent font-mono ${
                errors.nhsNumber
                  ? 'border-red-400'
                  : 'border-[oklch(0.88_0.005_160)]'
              }`}
              aria-describedby={errors.nhsNumber ? 'nhs-error' : undefined}
            />
            {errors.nhsNumber && (
              <p id="nhs-error" className="mt-1 text-xs text-red-600" role="alert">
                {errors.nhsNumber.message}
              </p>
            )}
          </div>

          {/* GP Name */}
          <div>
            <label
              htmlFor="gpName"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              GP name
            </label>
            <input
              id="gpName"
              type="text"
              placeholder="Dr. Smith"
              {...register('gpName')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
            />
          </div>

          {/* GP Practice */}
          <div className="sm:col-span-2">
            <label
              htmlFor="gpPractice"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              GP practice
            </label>
            <input
              id="gpPractice"
              type="text"
              placeholder="City Medical Centre"
              {...register('gpPractice')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
            />
          </div>
        </div>

        {/* Allergies */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-2">
            Known allergies
          </label>
          <div className="space-y-2">
            {allergyFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Allergy ${index + 1}`}
                  {...register(`allergies.${index}` as const)}
                  className="flex-1 rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                />
                <button
                  type="button"
                  onClick={() => removeAllergy(index)}
                  className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                  aria-label={`Remove allergy ${index + 1}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendAllergy('' as never)}
              className="inline-flex items-center gap-1.5 text-sm text-[oklch(0.35_0.06_160)] hover:text-[oklch(0.25_0.06_160)] font-medium transition-colors focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Add allergy
            </button>
          </div>
        </div>

        {/* Medical conditions */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-2">
            Medical conditions
          </label>
          <div className="space-y-2">
            {conditionFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Condition ${index + 1}`}
                  {...register(`medicalConditions.${index}` as const)}
                  className="flex-1 rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                />
                <button
                  type="button"
                  onClick={() => removeCondition(index)}
                  className="rounded-lg p-2 text-[oklch(0.55_0_0)] hover:bg-[oklch(0.93_0.003_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                  aria-label={`Remove condition ${index + 1}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendCondition('' as never)}
              className="inline-flex items-center gap-1.5 text-sm text-[oklch(0.35_0.06_160)] hover:text-[oklch(0.25_0.06_160)] font-medium transition-colors focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Add condition
            </button>
          </div>
        </div>
      </section>

      {/* Section: Contact */}
      <section aria-labelledby="section-contact">
        <div className="mb-4 border-b border-[oklch(0.91_0.005_160)] pb-2">
          <h2
            id="section-contact"
            className="text-base font-semibold text-[oklch(0.22_0.04_160)]"
          >
            Contact details
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contactPhone"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Phone number
            </label>
            <input
              id="contactPhone"
              type="tel"
              autoComplete="tel"
              {...register('contactPhone')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Email address
            </label>
            <input
              id="contactEmail"
              type="email"
              autoComplete="email"
              {...register('contactEmail')}
              className={`w-full rounded-lg border px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent ${
                errors.contactEmail
                  ? 'border-red-400'
                  : 'border-[oklch(0.88_0.005_160)]'
              }`}
            />
            {errors.contactEmail && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.contactEmail.message}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-[oklch(0.35_0.04_160)] mb-1.5"
            >
              Address
            </label>
            <textarea
              id="address"
              rows={3}
              autoComplete="street-address"
              {...register('address')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] px-3 py-2.5 text-sm text-[oklch(0.22_0.04_160)] bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:border-transparent resize-none"
            />
          </div>
        </div>
      </section>

      {/* Section: Emergency contacts */}
      <section aria-labelledby="section-emergency">
        <div className="mb-4 border-b border-[oklch(0.91_0.005_160)] pb-2">
          <h2
            id="section-emergency"
            className="text-base font-semibold text-[oklch(0.22_0.04_160)]"
          >
            Emergency contacts
          </h2>
          <p className="mt-0.5 text-xs text-[oklch(0.55_0_0)]">
            Add contacts in priority order (1 = primary contact)
          </p>
        </div>

        <div className="space-y-4">
          {emergencyFields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-[oklch(0.985_0.003_160)] p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[oklch(0.45_0.04_160)] uppercase tracking-wide">
                  Contact {index + 1} {index === 0 ? '(Primary)' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => removeEmergency(index)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium transition-colors focus:outline-none"
                  aria-label={`Remove contact ${index + 1}`}
                >
                  Remove
                </button>
              </div>

              <input type="hidden" {...register(`emergencyContacts.${index}.id`)} />
              <input
                type="hidden"
                value={index + 1}
                {...register(`emergencyContacts.${index}.priority`, { valueAsNumber: true })}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`ec-name-${index}`}
                    className="block text-xs font-medium text-[oklch(0.45_0.04_160)] mb-1"
                  >
                    Full name *
                  </label>
                  <input
                    id={`ec-name-${index}`}
                    type="text"
                    {...register(`emergencyContacts.${index}.name`)}
                    className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`ec-rel-${index}`}
                    className="block text-xs font-medium text-[oklch(0.45_0.04_160)] mb-1"
                  >
                    Relationship *
                  </label>
                  <input
                    id={`ec-rel-${index}`}
                    type="text"
                    placeholder="e.g. Daughter, Husband"
                    {...register(`emergencyContacts.${index}.relationship`)}
                    className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`ec-phone-${index}`}
                    className="block text-xs font-medium text-[oklch(0.45_0.04_160)] mb-1"
                  >
                    Phone number *
                  </label>
                  <input
                    id={`ec-phone-${index}`}
                    type="tel"
                    {...register(`emergencyContacts.${index}.phone`)}
                    className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`ec-email-${index}`}
                    className="block text-xs font-medium text-[oklch(0.45_0.04_160)] mb-1"
                  >
                    Email
                  </label>
                  <input
                    id={`ec-email-${index}`}
                    type="email"
                    {...register(`emergencyContacts.${index}.email`)}
                    className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              appendEmergency({
                id: `ec-${Date.now()}`,
                name: '',
                relationship: '',
                phone: '',
                priority: emergencyFields.length + 1,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[oklch(0.78_0.01_160)] px-4 py-2.5 text-sm font-medium text-[oklch(0.45_0.06_160)] hover:border-[oklch(0.35_0.06_160)] hover:text-[oklch(0.35_0.06_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors w-full justify-center focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add emergency contact
          </button>
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
              ? 'Saving…'
              : 'Updating…'
            : mode === 'create'
            ? `Save ${terminology.singular}`
            : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
