'use client';

/**
 * Philomena Protocol Profile Form — Client Component
 * Creates or updates a Philomena Protocol profile for a child.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { PhilomenaProfile } from '@/lib/db/schema';

type SubmitFn = (
  data: unknown,
) => Promise<{ success: boolean; error?: string }>;

interface PhilomenaFormClientProps {
  personId: string;
  orgSlug: string;
  existingProfile?: PhilomenaProfile | null;
  onSubmit: SubmitFn;
}

const inputCls =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors';

const textareaCls = `${inputCls} resize-y min-h-[80px]`;

export function PhilomenaFormClient({
  personId,
  orgSlug,
  existingProfile,
  onSubmit,
}: PhilomenaFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const ep = existingProfile;

  const [formData, setFormData] = useState({
    heightCm: ep?.heightCm?.toString() ?? '',
    build: ep?.build ?? '',
    hairDescription: ep?.hairDescription ?? '',
    eyeColour: ep?.eyeColour ?? '',
    distinguishingFeatures: ep?.distinguishingFeatures ?? '',
    ethnicity: ep?.ethnicity ?? '',
    riskCse: ep?.riskCse ?? false,
    riskCce: ep?.riskCce ?? false,
    riskCountyLines: ep?.riskCountyLines ?? false,
    riskTrafficking: ep?.riskTrafficking ?? false,
    riskNotes: ep?.riskNotes ?? '',
    medicalNeeds: ep?.medicalNeeds ?? '',
    allergies: ep?.allergies ?? '',
    medications: ep?.medications ?? '',
    gpDetails: ep?.gpDetails ?? '',
    phoneNumbers: ((ep?.phoneNumbers as string[] | null) ?? []).join('\n'),
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const phoneNumbers = formData.phoneNumbers
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        ...(ep ? { id: ep.id } : { personId }),
        heightCm: formData.heightCm ? parseInt(formData.heightCm, 10) : null,
        build: formData.build || null,
        hairDescription: formData.hairDescription || null,
        eyeColour: formData.eyeColour || null,
        distinguishingFeatures: formData.distinguishingFeatures || null,
        ethnicity: formData.ethnicity || null,
        riskCse: formData.riskCse,
        riskCce: formData.riskCce,
        riskCountyLines: formData.riskCountyLines,
        riskTrafficking: formData.riskTrafficking,
        riskNotes: formData.riskNotes || null,
        medicalNeeds: formData.medicalNeeds || null,
        allergies: formData.allergies || null,
        medications: formData.medications || null,
        gpDetails: formData.gpDetails || null,
        phoneNumbers,
        ...(!ep ? { personId } : {}),
      };

      const result = await onSubmit(payload);
      if (result.success) {
        toast.success(
          ep
            ? 'Philomena profile updated'
            : 'Philomena profile created',
        );
        router.push(
          `/${orgSlug}/persons/${personId}/missing`,
        );
      } else {
        toast.error(result.error ?? 'Failed to save profile');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Physical description */}
      <div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
          Physical Description
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="heightCm"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Height (cm)
            </label>
            <input
              id="heightCm"
              name="heightCm"
              type="number"
              min="50"
              max="250"
              value={formData.heightCm}
              onChange={handleChange}
              className={inputCls}
              placeholder="e.g. 165"
            />
          </div>
          <div>
            <label
              htmlFor="build"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Build
            </label>
            <select
              id="build"
              name="build"
              value={formData.build}
              onChange={handleChange}
              className={inputCls}
            >
              <option value="">Select build</option>
              <option value="slim">Slim</option>
              <option value="average">Average</option>
              <option value="stocky">Stocky</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="hairDescription"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Hair description
            </label>
            <input
              id="hairDescription"
              name="hairDescription"
              type="text"
              value={formData.hairDescription}
              onChange={handleChange}
              className={inputCls}
              placeholder="e.g. Brown, shoulder-length, straight"
            />
          </div>
          <div>
            <label
              htmlFor="eyeColour"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Eye colour
            </label>
            <input
              id="eyeColour"
              name="eyeColour"
              type="text"
              value={formData.eyeColour}
              onChange={handleChange}
              className={inputCls}
              placeholder="e.g. Brown"
            />
          </div>
          <div>
            <label
              htmlFor="ethnicity"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Ethnicity
            </label>
            <input
              id="ethnicity"
              name="ethnicity"
              type="text"
              value={formData.ethnicity}
              onChange={handleChange}
              className={inputCls}
              placeholder="As self-defined"
            />
          </div>
          <div>
            <label
              htmlFor="phoneNumbers"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Phone numbers (one per line)
            </label>
            <textarea
              id="phoneNumbers"
              name="phoneNumbers"
              value={formData.phoneNumbers}
              onChange={handleChange}
              className={textareaCls}
              placeholder="07700 900000&#10;07700 900001"
              rows={3}
            />
          </div>
        </div>
        <div className="mt-4">
          <label
            htmlFor="distinguishingFeatures"
            className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
          >
            Distinguishing features
          </label>
          <textarea
            id="distinguishingFeatures"
            name="distinguishingFeatures"
            value={formData.distinguishingFeatures}
            onChange={handleChange}
            className={textareaCls}
            placeholder="Tattoos, birthmarks, scars, piercings, etc."
          />
        </div>
      </div>

      {/* Risk factors */}
      <div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
          Risk Flags
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
          {[
            { name: 'riskCse', label: 'CSE Risk' },
            { name: 'riskCce', label: 'CCE Risk' },
            { name: 'riskCountyLines', label: 'County Lines' },
            { name: 'riskTrafficking', label: 'Trafficking' },
          ].map(({ name, label }) => (
            <label
              key={name}
              className="flex items-center gap-2.5 rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-3 cursor-pointer hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              <input
                type="checkbox"
                name={name}
                checked={formData[name as keyof typeof formData] as boolean}
                onChange={handleChange}
                className="h-4 w-4 rounded border-[oklch(0.75_0_0)] text-red-600 focus:ring-red-500"
              />
              <span className="text-xs font-medium text-[oklch(0.35_0.04_160)]">
                {label}
              </span>
            </label>
          ))}
        </div>
        <div>
          <label
            htmlFor="riskNotes"
            className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
          >
            Risk notes
          </label>
          <textarea
            id="riskNotes"
            name="riskNotes"
            value={formData.riskNotes}
            onChange={handleChange}
            className={textareaCls}
            placeholder="Additional context about risks..."
          />
        </div>
      </div>

      {/* Medical information */}
      <div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
          Medical Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="medicalNeeds"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Medical needs
            </label>
            <textarea
              id="medicalNeeds"
              name="medicalNeeds"
              value={formData.medicalNeeds}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Conditions, needs, requirements..."
            />
          </div>
          <div>
            <label
              htmlFor="allergies"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Allergies
            </label>
            <textarea
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Known allergies..."
            />
          </div>
          <div>
            <label
              htmlFor="medications"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Medications
            </label>
            <textarea
              id="medications"
              name="medications"
              value={formData.medications}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Current medications..."
            />
          </div>
          <div>
            <label
              htmlFor="gpDetails"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              GP details
            </label>
            <textarea
              id="gpDetails"
              name="gpDetails"
              value={formData.gpDetails}
              onChange={handleChange}
              className={textareaCls}
              placeholder="GP name, practice, phone number..."
            />
          </div>
        </div>
      </div>

      {/* Form actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
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
          className="rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          {isPending
            ? 'Saving...'
            : ep
              ? 'Update profile'
              : 'Create profile'}
        </button>
      </div>
    </form>
  );
}
