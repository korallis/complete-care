'use client';

/**
 * Contact Record Form — records a contact event with emotional presentation.
 *
 * VAL-CHILD-015: Captures emotional state before/during/after contact,
 * plus concerns and disclosures.
 */

import { useState } from 'react';
import type { ApprovedContact } from '@/lib/db/schema';
import type { CreateContactRecordInput } from '../schema';

const CONTACT_TYPE_OPTIONS = [
  { value: 'face_to_face', label: 'Face-to-Face' },
  { value: 'phone', label: 'Phone' },
  { value: 'video', label: 'Video' },
  { value: 'letter', label: 'Letter' },
] as const;

const SUPERVISION_OPTIONS = [
  { value: 'unsupervised', label: 'Unsupervised' },
  { value: 'supervised_by_staff', label: 'Supervised by Staff' },
  { value: 'supervised_by_sw', label: 'Supervised by Social Worker' },
] as const;

const EMOTIONAL_PRESETS = [
  'Calm',
  'Happy',
  'Excited',
  'Anxious',
  'Upset',
  'Angry',
  'Withdrawn',
  'Tearful',
  'Agitated',
  'Neutral',
];

export function ContactRecordForm({
  personId,
  approvedContacts,
  scheduleId,
  defaultContactId,
  onSubmit,
  onCancel,
}: {
  personId: string;
  approvedContacts: ApprovedContact[];
  scheduleId?: string;
  defaultContactId?: string;
  onSubmit: (data: CreateContactRecordInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState(defaultContactId ?? '');
  const selectedContact = approvedContacts.find(
    (contact) => contact.id === selectedContactId,
  );
  const contactTypeOptions = selectedContact
    ? CONTACT_TYPE_OPTIONS.filter((option) =>
        selectedContact.allowedContactTypes.includes(option.value),
      )
    : CONTACT_TYPE_OPTIONS;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data: CreateContactRecordInput = {
      personId,
      approvedContactId: formData.get('approvedContactId') as string,
      contactScheduleId: scheduleId || '',
      contactType: formData.get('contactType') as CreateContactRecordInput['contactType'],
      contactDate: formData.get('contactDate') as string,
      durationMinutes: Number(formData.get('durationMinutes')) || undefined,
      supervisionLevel: formData.get('supervisionLevel') as CreateContactRecordInput['supervisionLevel'],
      whoPresent: formData.get('whoPresent') as string,
      location: formData.get('location') as string,
      emotionalBefore: formData.get('emotionalBefore') as string,
      emotionalDuring: formData.get('emotionalDuring') as string,
      emotionalAfter: formData.get('emotionalAfter') as string,
      notes: formData.get('notes') as string,
      concerns: formData.get('concerns') as string,
      disclosures: formData.get('disclosures') as string,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Contact selection */}
        <div className="space-y-1.5">
          <label htmlFor="approvedContactId" className="text-sm font-medium">
            Contact Person <span className="text-red-500">*</span>
          </label>
          <select
            id="approvedContactId"
            name="approvedContactId"
            required
            value={selectedContactId}
            onChange={(event) => setSelectedContactId(event.target.value)}
            disabled={Boolean(scheduleId && defaultContactId)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select contact...</option>
            {approvedContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.relationship})
                {c.hasRestrictions ? ' [RESTRICTED]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Contact type */}
        <div className="space-y-1.5">
          <label htmlFor="contactType" className="text-sm font-medium">
            Contact Type <span className="text-red-500">*</span>
          </label>
          <select
            key={selectedContact?.id ?? 'contact-type-default'}
            id="contactType"
            name="contactType"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {contactTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date/time */}
        <div className="space-y-1.5">
          <label htmlFor="contactDate" className="text-sm font-medium">
            Date &amp; Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="contactDate"
            name="contactDate"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <label htmlFor="durationMinutes" className="text-sm font-medium">
            Duration (minutes)
          </label>
          <input
            type="number"
            id="durationMinutes"
            name="durationMinutes"
            min={1}
            max={480}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Supervision */}
        <div className="space-y-1.5">
          <label htmlFor="supervisionLevel" className="text-sm font-medium">
            Supervision Level <span className="text-red-500">*</span>
          </label>
          <select
            id="supervisionLevel"
            name="supervisionLevel"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {SUPERVISION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Who present */}
        <div className="space-y-1.5">
          <label htmlFor="whoPresent" className="text-sm font-medium">
            Who Was Present
          </label>
          <input
            type="text"
            id="whoPresent"
            name="whoPresent"
            placeholder="e.g. Child, Mother, Staff Member A"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Location */}
        <div className="sm:col-span-2 space-y-1.5">
          <label htmlFor="location" className="text-sm font-medium">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="e.g. Home visiting room, Phone call"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Emotional Presentation — VAL-CHILD-015 */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          Emotional Presentation
        </legend>
        <p className="text-xs text-muted-foreground">
          Record the child&apos;s emotional state before, during, and after
          contact. Use preset options or describe in your own words.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="emotionalBefore" className="text-sm font-medium">
              Before Contact
            </label>
            <input
              type="text"
              id="emotionalBefore"
              name="emotionalBefore"
              list="emotional-presets"
              placeholder="e.g. Calm, Anxious"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="emotionalDuring" className="text-sm font-medium">
              During Contact
            </label>
            <input
              type="text"
              id="emotionalDuring"
              name="emotionalDuring"
              list="emotional-presets"
              placeholder="e.g. Happy, Tearful"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="emotionalAfter" className="text-sm font-medium">
              After Contact
            </label>
            <input
              type="text"
              id="emotionalAfter"
              name="emotionalAfter"
              list="emotional-presets"
              placeholder="e.g. Withdrawn, Calm"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <datalist id="emotional-presets">
          {EMOTIONAL_PRESETS.map((preset) => (
            <option key={preset} value={preset} />
          ))}
        </datalist>
      </fieldset>

      {/* Notes */}
      <div className="space-y-1.5">
        <label htmlFor="notes" className="text-sm font-medium">
          Notes / Observations
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="General observations about the contact..."
        />
      </div>

      {/* Concerns */}
      <div className="space-y-1.5">
        <label htmlFor="concerns" className="text-sm font-medium">
          Concerns
        </label>
        <textarea
          id="concerns"
          name="concerns"
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Any concerns raised during or after the contact..."
        />
      </div>

      {/* Disclosures */}
      <div className="space-y-1.5">
        <label htmlFor="disclosures" className="text-sm font-medium">
          Disclosures
        </label>
        <textarea
          id="disclosures"
          name="disclosures"
          rows={2}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Any disclosures made by the child (record verbatim where possible)..."
        />
        <p className="text-xs text-muted-foreground">
          Record exact words where possible. Disclosures are flagged for
          safeguarding review.
        </p>
      </div>

      {/* Actions */}
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
          {isSubmitting ? 'Saving...' : 'Save Contact Record'}
        </button>
      </div>
    </form>
  );
}
