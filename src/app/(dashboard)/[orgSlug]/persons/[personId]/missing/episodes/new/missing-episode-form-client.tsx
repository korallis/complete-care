'use client';

/**
 * Missing Episode Creation Form — Client Component
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type SubmitFn = (data: unknown) => Promise<{ success: boolean; error?: string; data?: { id: string } }>;

interface MissingEpisodeFormClientProps {
  personId: string;
  orgSlug: string;
  onSubmit: SubmitFn;
}

const inputCls =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors';

const textareaCls = `${inputCls} resize-y min-h-[80px]`;

export function MissingEpisodeFormClient({
  personId,
  orgSlug,
  onSubmit,
}: MissingEpisodeFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [formData, setFormData] = useState({
    absenceNoticedAt: localNow,
    lastSeenAt: '',
    lastSeenLocation: '',
    lastSeenClothing: '',
    initialActionsTaken: '',
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    riskAssessmentNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!formData.absenceNoticedAt)
      newErrors.absenceNoticedAt = 'Time absence noticed is required';
    if (!formData.initialActionsTaken)
      newErrors.initialActionsTaken = 'Initial actions taken is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const result = await onSubmit({
        personId,
        absenceNoticedAt: new Date(formData.absenceNoticedAt),
        lastSeenAt: formData.lastSeenAt ? new Date(formData.lastSeenAt) : null,
        lastSeenLocation: formData.lastSeenLocation || null,
        lastSeenClothing: formData.lastSeenClothing || null,
        initialActionsTaken: formData.initialActionsTaken,
        riskLevel: formData.riskLevel,
        riskAssessmentNotes: formData.riskAssessmentNotes || null,
      });

      if (result.success && result.data) {
        toast.success('Missing episode reported');
        router.push(
          `/${orgSlug}/persons/${personId}/missing/episodes/${result.data.id}`,
        );
      } else {
        toast.error(result.error ?? 'Failed to report missing episode');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Risk level — prominent at top */}
      <div>
        <label className="block text-xs font-semibold text-[oklch(0.45_0.03_160)] mb-2">
          Risk Level <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'low', label: 'Low', color: 'border-green-300 bg-green-50 text-green-800', activeColor: 'ring-2 ring-green-500 border-green-500 bg-green-100' },
            { value: 'medium', label: 'Medium', color: 'border-amber-300 bg-amber-50 text-amber-800', activeColor: 'ring-2 ring-amber-500 border-amber-500 bg-amber-100' },
            { value: 'high', label: 'High', color: 'border-red-300 bg-red-50 text-red-800', activeColor: 'ring-2 ring-red-500 border-red-500 bg-red-100' },
          ].map(({ value, label, color, activeColor }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, riskLevel: value as 'low' | 'medium' | 'high' }))}
              className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                formData.riskLevel === value ? activeColor : color
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-[oklch(0.55_0_0)]">
          High risk: escalate to police within 30 minutes. Medium: 60 minutes. Low: 2 hours.
        </p>
      </div>

      {/* Time fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="absenceNoticedAt" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
            Time absence noticed <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="absenceNoticedAt"
            name="absenceNoticedAt"
            type="datetime-local"
            value={formData.absenceNoticedAt}
            onChange={handleChange}
            className={inputCls}
            required
          />
          {errors.absenceNoticedAt && (
            <p className="mt-1 text-xs text-red-600" role="alert">{errors.absenceNoticedAt}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastSeenAt" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
            Last seen at (if known)
          </label>
          <input
            id="lastSeenAt"
            name="lastSeenAt"
            type="datetime-local"
            value={formData.lastSeenAt}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="lastSeenLocation" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
            Last seen location
          </label>
          <input
            id="lastSeenLocation"
            name="lastSeenLocation"
            type="text"
            value={formData.lastSeenLocation}
            onChange={handleChange}
            className={inputCls}
            placeholder="e.g. Bedroom, local park"
          />
        </div>
        <div>
          <label htmlFor="lastSeenClothing" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
            Last seen wearing
          </label>
          <input
            id="lastSeenClothing"
            name="lastSeenClothing"
            type="text"
            value={formData.lastSeenClothing}
            onChange={handleChange}
            className={inputCls}
            placeholder="Describe clothing..."
          />
        </div>
      </div>

      {/* Initial actions */}
      <div>
        <label htmlFor="initialActionsTaken" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
          Initial actions taken <span className="text-red-500" aria-hidden="true">*</span>
        </label>
        <textarea
          id="initialActionsTaken"
          name="initialActionsTaken"
          value={formData.initialActionsTaken}
          onChange={handleChange}
          className={textareaCls}
          placeholder="Searched home, garden, local area... Contacted known friends..."
          required
        />
        {errors.initialActionsTaken && (
          <p className="mt-1 text-xs text-red-600" role="alert">{errors.initialActionsTaken}</p>
        )}
      </div>

      {/* Risk assessment notes */}
      <div>
        <label htmlFor="riskAssessmentNotes" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
          Risk assessment notes
        </label>
        <textarea
          id="riskAssessmentNotes"
          name="riskAssessmentNotes"
          value={formData.riskAssessmentNotes}
          onChange={handleChange}
          className={textareaCls}
          placeholder="Additional context about the risk assessment..."
        />
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
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          {isPending ? 'Reporting...' : 'Report missing'}
        </button>
      </div>
    </form>
  );
}
