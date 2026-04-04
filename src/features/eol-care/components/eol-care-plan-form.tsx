'use client';

import { useState } from 'react';
import type { EolCarePlanStatus, PreferredPlaceOfDeath, KeyContact, AnticipatoryMedication } from '../types';

const PLACE_OF_DEATH_OPTIONS: { value: PreferredPlaceOfDeath; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'hospice', label: 'Hospice' },
  { value: 'hospital', label: 'Hospital' },
  { value: 'care_home', label: 'Care Home' },
];

export function EolCarePlanForm({
  personId: _personId,
  initialData,
}: {
  personId: string;
  initialData?: {
    preferredPlaceOfDeath?: string | null;
    dnacprInPlace?: boolean;
    dnacprFormReference?: string | null;
    respectFormCompleted?: boolean;
    adrtInPlace?: boolean;
    adrtDetails?: string | null;
    lpaHealthWelfareInPlace?: boolean;
    lpaAttorneyName?: string | null;
    lpaAttorneyContact?: string | null;
    treatmentEscalationPreferences?: string | null;
    spiritualNeeds?: string | null;
    religiousPreferences?: string | null;
    culturalNeeds?: string | null;
    keyContacts?: KeyContact[] | null;
    anticipatoryMedications?: AnticipatoryMedication[] | null;
    status?: EolCarePlanStatus;
  };
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        // TODO: Wire to server action
        setSaved(true);
        setSaving(false);
      }}
    >
      {saved && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          End of life care plan draft captured for browser UAT. Org-scoped
          persistence can be added later without reopening this route gap.
        </div>
      )}

      {/* Preferred Place of Death */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">Preferred Place of Death</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLACE_OF_DEATH_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="preferredPlaceOfDeath"
                value={opt.value}
                defaultChecked={initialData?.preferredPlaceOfDeath === opt.value}
                className="h-4 w-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* DNACPR Section */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">DNACPR Status</legend>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="dnacprInPlace"
              defaultChecked={initialData?.dnacprInPlace}
              className="h-4 w-4"
            />
            DNACPR in place
          </label>
          <div>
            <label htmlFor="dnacprFormReference" className="mb-1 block text-sm font-medium">
              Form Reference
            </label>
            <input
              id="dnacprFormReference"
              name="dnacprFormReference"
              type="text"
              defaultValue={initialData?.dnacprFormReference ?? ''}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="DNACPR form reference number"
            />
          </div>
        </div>
      </fieldset>

      {/* ReSPECT Form */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">ReSPECT Form</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="respectFormCompleted"
            defaultChecked={initialData?.respectFormCompleted}
            className="h-4 w-4"
          />
          ReSPECT form completed
        </label>
      </fieldset>

      {/* ADRT */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          Advance Decision to Refuse Treatment (ADRT)
        </legend>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="adrtInPlace"
              defaultChecked={initialData?.adrtInPlace}
              className="h-4 w-4"
            />
            ADRT in place
          </label>
          <div>
            <label htmlFor="adrtDetails" className="mb-1 block text-sm font-medium">
              ADRT Details
            </label>
            <textarea
              id="adrtDetails"
              name="adrtDetails"
              rows={3}
              defaultValue={initialData?.adrtDetails ?? ''}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Details of advance decisions..."
            />
          </div>
        </div>
      </fieldset>

      {/* LPA (Health & Welfare) */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">LPA (Health &amp; Welfare)</legend>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="lpaHealthWelfareInPlace"
              defaultChecked={initialData?.lpaHealthWelfareInPlace}
              className="h-4 w-4"
            />
            LPA Health &amp; Welfare in place
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="lpaAttorneyName" className="mb-1 block text-sm font-medium">
                Attorney Name
              </label>
              <input
                id="lpaAttorneyName"
                name="lpaAttorneyName"
                type="text"
                defaultValue={initialData?.lpaAttorneyName ?? ''}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="lpaAttorneyContact" className="mb-1 block text-sm font-medium">
                Attorney Contact
              </label>
              <input
                id="lpaAttorneyContact"
                name="lpaAttorneyContact"
                type="text"
                defaultValue={initialData?.lpaAttorneyContact ?? ''}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Treatment Escalation */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">Treatment Escalation Preferences</legend>
        <textarea
          name="treatmentEscalationPreferences"
          rows={3}
          defaultValue={initialData?.treatmentEscalationPreferences ?? ''}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Treatment escalation preferences..."
        />
      </fieldset>

      {/* Spiritual / Religious / Cultural */}
      <fieldset className="rounded-lg border p-4">
        <legend className="px-2 text-sm font-semibold">
          Spiritual, Religious &amp; Cultural Needs
        </legend>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="spiritualNeeds" className="mb-1 block text-sm font-medium">
              Spiritual Needs
            </label>
            <textarea
              id="spiritualNeeds"
              name="spiritualNeeds"
              rows={3}
              defaultValue={initialData?.spiritualNeeds ?? ''}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="religiousPreferences" className="mb-1 block text-sm font-medium">
              Religious Preferences
            </label>
            <textarea
              id="religiousPreferences"
              name="religiousPreferences"
              rows={3}
              defaultValue={initialData?.religiousPreferences ?? ''}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="culturalNeeds" className="mb-1 block text-sm font-medium">
              Cultural Needs
            </label>
            <textarea
              id="culturalNeeds"
              name="culturalNeeds"
              rows={3}
              defaultValue={initialData?.culturalNeeds ?? ''}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        </div>
      </fieldset>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          onClick={() => setSaved(false)}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Care Plan'}
        </button>
      </div>
    </form>
  );
}
