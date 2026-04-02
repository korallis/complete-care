'use client';

/**
 * Contact Schedule Form — schedule a visit from the contact plan.
 *
 * VAL-CHILD-014: Validates against approved register. Restricted contacts
 * trigger a blocking alert requiring manager override with justification.
 */

import { useState } from 'react';
import type { ApprovedContact } from '@/lib/db/schema';
import type { CreateContactScheduleInput } from '../schema';

const SUPERVISION_OPTIONS = [
  { value: 'unsupervised', label: 'Unsupervised' },
  { value: 'supervised_by_staff', label: 'Supervised by Staff' },
  { value: 'supervised_by_sw', label: 'Supervised by Social Worker' },
] as const;

const CONTACT_TYPE_LABELS: Record<string, string> = {
  face_to_face: 'Face-to-Face',
  phone: 'Phone',
  video: 'Video',
  letter: 'Letter',
};

export function ContactScheduleForm({
  personId,
  approvedContacts,
  defaultContactId,
  onSubmit,
  onCancel,
}: {
  personId: string;
  approvedContacts: ApprovedContact[];
  defaultContactId?: string;
  onSubmit: (data: CreateContactScheduleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [selectedContactId, setSelectedContactId] = useState(defaultContactId ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedContact = approvedContacts.find(
    (c) => c.id === selectedContactId,
  );
  const isRestricted = selectedContact?.hasRestrictions ?? false;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data: CreateContactScheduleInput = {
      personId,
      approvedContactId: formData.get('approvedContactId') as string,
      contactType: formData.get('contactType') as CreateContactScheduleInput['contactType'],
      scheduledAt: formData.get('scheduledAt') as string,
      durationMinutes: Number(formData.get('durationMinutes')) || undefined,
      supervisionLevel: formData.get('supervisionLevel') as CreateContactScheduleInput['supervisionLevel'],
      location: formData.get('location') as string,
      managerOverride: isRestricted
        ? (formData.get('managerOverride') === 'on')
        : false,
      overrideJustification: formData.get('overrideJustification') as string,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule');
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
        <div className="sm:col-span-2 space-y-1.5">
          <label htmlFor="approvedContactId" className="text-sm font-medium">
            Contact Person <span className="text-red-500">*</span>
          </label>
          <select
            id="approvedContactId"
            name="approvedContactId"
            required
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select approved contact...</option>
            {approvedContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.relationship})
                {c.hasRestrictions ? ' [RESTRICTED]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Restriction warning */}
        {isRestricted && selectedContact && (
          <div className="sm:col-span-2 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
            <h4 className="text-sm font-semibold text-red-800 dark:text-red-300">
              Court Order Restriction Active
            </h4>
            {selectedContact.courtOrderReference && (
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                Order: {selectedContact.courtOrderReference}
                {selectedContact.courtOrderDate &&
                  ` (${selectedContact.courtOrderDate})`}
              </p>
            )}
            {selectedContact.courtOrderConditions && (
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                Conditions: {selectedContact.courtOrderConditions}
              </p>
            )}
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-300">
                <input type="checkbox" name="managerOverride" className="rounded" />
                I am a manager and authorise this contact override
              </label>
              <div className="space-y-1.5">
                <label
                  htmlFor="overrideJustification"
                  className="text-sm font-medium text-red-800 dark:text-red-300"
                >
                  Justification (required)
                </label>
                <textarea
                  id="overrideJustification"
                  name="overrideJustification"
                  rows={2}
                  className="w-full rounded-md border border-red-300 bg-background px-3 py-2 text-sm dark:border-red-700"
                  placeholder="Provide justification for overriding this restriction..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Contact type */}
        <div className="space-y-1.5">
          <label htmlFor="contactType" className="text-sm font-medium">
            Contact Type <span className="text-red-500">*</span>
          </label>
          <select
            id="contactType"
            name="contactType"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {selectedContact
              ? selectedContact.allowedContactTypes.map((type) => (
                  <option key={type} value={type}>
                    {CONTACT_TYPE_LABELS[type] ?? type}
                  </option>
                ))
              : Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
          </select>
        </div>

        {/* Date/time */}
        <div className="space-y-1.5">
          <label htmlFor="scheduledAt" className="text-sm font-medium">
            Scheduled Date &amp; Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="scheduledAt"
            name="scheduledAt"
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
            placeholder="60"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Supervision */}
        <div className="space-y-1.5">
          <label htmlFor="supervisionLevel" className="text-sm font-medium">
            Supervision Level <span className="text-red-500">*</span>
          </label>
          <select
            key={selectedContact?.id ?? 'supervision-default'}
            id="supervisionLevel"
            name="supervisionLevel"
            required
            defaultValue={selectedContact?.supervisionLevel ?? 'supervised_by_staff'}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {SUPERVISION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
            placeholder="e.g. Home visiting room"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
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
          {isSubmitting ? 'Scheduling...' : 'Schedule Contact'}
        </button>
      </div>
    </form>
  );
}
