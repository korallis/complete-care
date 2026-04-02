'use client';

import { useState } from 'react';
import type { CreateApprovedContactInput } from '../schema';

const RELATIONSHIP_OPTIONS = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'aunt_uncle', label: 'Aunt / Uncle' },
  { value: 'social_worker', label: 'Social Worker' },
  { value: 'other', label: 'Other' },
] as const;

const CONTACT_TYPE_OPTIONS = [
  { value: 'face_to_face', label: 'Face-to-face' },
  { value: 'phone', label: 'Phone' },
  { value: 'video', label: 'Video' },
  { value: 'letter', label: 'Letter' },
] as const;

const SUPERVISION_OPTIONS = [
  { value: 'unsupervised', label: 'Unsupervised' },
  { value: 'supervised_by_staff', label: 'Supervised by staff' },
  { value: 'supervised_by_sw', label: 'Supervised by social worker' },
] as const;

type ApprovedContactFormProps = {
  personId: string;
  onSubmit: (data: CreateApprovedContactInput) => Promise<void>;
  onCancel: () => void;
};

export function ApprovedContactForm({
  personId,
  onSubmit,
  onCancel,
}: ApprovedContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRestrictions, setHasRestrictions] = useState(false);
  const [allowedContactTypes, setAllowedContactTypes] = useState<string[]>([
    'face_to_face',
  ]);
  const [error, setError] = useState<string | null>(null);

  function toggleContactType(value: string) {
    setAllowedContactTypes((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (allowedContactTypes.length === 0) {
      setError('Select at least one permitted contact type.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);

    const data: CreateApprovedContactInput = {
      personId,
      name: (formData.get('name') as string) ?? '',
      relationship: formData.get(
        'relationship',
      ) as CreateApprovedContactInput['relationship'],
      phone: ((formData.get('phone') as string) ?? '').trim(),
      email: ((formData.get('email') as string) ?? '').trim(),
      address: ((formData.get('address') as string) ?? '').trim(),
      allowedContactTypes:
        allowedContactTypes as CreateApprovedContactInput['allowedContactTypes'],
      frequency: ((formData.get('frequency') as string) ?? '').trim(),
      supervisionLevel: formData.get(
        'supervisionLevel',
      ) as CreateApprovedContactInput['supervisionLevel'],
      hasRestrictions,
      courtOrderReference: ((formData.get('courtOrderReference') as string) ?? '').trim(),
      courtOrderDate: ((formData.get('courtOrderDate') as string) ?? '').trim(),
      courtOrderConditions: ((formData.get('courtOrderConditions') as string) ?? '').trim(),
    };

    try {
      await onSubmit(data);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to save approved contact.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border bg-white p-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">
            Contact name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="relationship" className="text-sm font-medium">
            Relationship <span className="text-red-500">*</span>
          </label>
          <select
            id="relationship"
            name="relationship"
            defaultValue="mother"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-sm font-medium">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <label htmlFor="address" className="text-sm font-medium">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <p className="text-sm font-medium">
            Permitted contact types <span className="text-red-500">*</span>
          </p>
          <div className="flex flex-wrap gap-3">
            {CONTACT_TYPE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={allowedContactTypes.includes(option.value)}
                  onChange={() => toggleContactType(option.value)}
                  className="rounded"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="frequency" className="text-sm font-medium">
            Contact frequency
          </label>
          <input
            id="frequency"
            name="frequency"
            placeholder="e.g. Weekly phone call"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="supervisionLevel" className="text-sm font-medium">
            Supervision level <span className="text-red-500">*</span>
          </label>
          <select
            id="supervisionLevel"
            name="supervisionLevel"
            defaultValue="supervised_by_staff"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {SUPERVISION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-amber-950">
          <input
            type="checkbox"
            checked={hasRestrictions}
            onChange={(event) => setHasRestrictions(event.target.checked)}
            className="rounded"
          />
          This contact has court-order or safeguarding restrictions
        </label>

        {hasRestrictions && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="courtOrderReference"
                className="text-sm font-medium text-amber-950"
              >
                Court order reference <span className="text-red-500">*</span>
              </label>
              <input
                id="courtOrderReference"
                name="courtOrderReference"
                className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="courtOrderDate"
                className="text-sm font-medium text-amber-950"
              >
                Court order date
              </label>
              <input
                id="courtOrderDate"
                name="courtOrderDate"
                type="date"
                className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label
                htmlFor="courtOrderConditions"
                className="text-sm font-medium text-amber-950"
              >
                Conditions <span className="text-red-500">*</span>
              </label>
              <textarea
                id="courtOrderConditions"
                name="courtOrderConditions"
                rows={3}
                className="w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
                placeholder="Describe the restriction, supervision expectations, and any prohibited contact modes."
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Add approved contact'}
        </button>
      </div>
    </form>
  );
}
