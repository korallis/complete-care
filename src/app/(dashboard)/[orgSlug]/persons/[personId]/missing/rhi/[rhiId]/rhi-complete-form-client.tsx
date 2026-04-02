'use client';

/**
 * Return Home Interview Completion Form — Client Component
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ReturnHomeInterview } from '@/lib/db/schema';

type SubmitFn = (data: unknown) => Promise<{ success: boolean; error?: string }>;

interface RhiCompleteFormClientProps {
  rhi: ReturnHomeInterview;
  orgSlug: string;
  personId: string;
  onSubmit: SubmitFn;
}

const inputCls =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors';

const textareaCls = `${inputCls} resize-y min-h-[80px]`;

export function RhiCompleteFormClient({
  rhi,
  orgSlug,
  personId,
  onSubmit,
}: RhiCompleteFormClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    whereChildWas: '',
    whoChildWasWith: '',
    whatHappened: '',
    childAccount: '',
    risksIdentified: '',
    exploitationDetails: '',
    safeguardingReferralNeeded: false,
    actionsRecommended: '',
    childDeclined: false,
    declineReason: '',
  });

  const [exploitationConcerns, setExploitationConcerns] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function toggleExploitationConcern(concern: string) {
    setExploitationConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern],
    );
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!formData.childDeclined && !formData.whereChildWas) {
      newErrors.whereChildWas = 'Required if child did not decline';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const result = await onSubmit({
        id: rhi.id,
        whereChildWas: formData.whereChildWas || '',
        whoChildWasWith: formData.whoChildWasWith || null,
        whatHappened: formData.whatHappened || null,
        childAccount: formData.childAccount || null,
        risksIdentified: formData.risksIdentified || null,
        exploitationConcerns: exploitationConcerns.length ? exploitationConcerns : undefined,
        exploitationDetails: formData.exploitationDetails || null,
        safeguardingReferralNeeded: formData.safeguardingReferralNeeded,
        actionsRecommended: formData.actionsRecommended || null,
        childDeclined: formData.childDeclined,
        declineReason: formData.childDeclined ? formData.declineReason || null : null,
      });

      if (result.success) {
        toast.success('Return Home Interview completed');
        router.push(`/${orgSlug}/persons/${personId}/missing`);
      } else {
        toast.error(result.error ?? 'Failed to complete RHI');
      }
    });
  }

  const EXPLOITATION_CONCERNS = [
    { value: 'none', label: 'None identified' },
    { value: 'cse', label: 'CSE' },
    { value: 'cce', label: 'CCE' },
    { value: 'county_lines', label: 'County Lines' },
    { value: 'trafficking', label: 'Trafficking' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Child declined section */}
      <div>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            name="childDeclined"
            checked={formData.childDeclined}
            onChange={handleChange}
            className="h-4 w-4 rounded border-[oklch(0.75_0_0)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
          />
          <span className="text-sm font-medium text-[oklch(0.35_0.04_160)]">
            Child declined to participate in RHI
          </span>
        </label>
        {formData.childDeclined && (
          <div className="mt-3">
            <label htmlFor="declineReason" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Reason for declining
            </label>
            <textarea
              id="declineReason"
              name="declineReason"
              value={formData.declineReason}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Record the reason the child gave for declining..."
            />
          </div>
        )}
      </div>

      {!formData.childDeclined && (
        <>
          {/* Where child was */}
          <div>
            <label htmlFor="whereChildWas" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Where was the child? <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <textarea
              id="whereChildWas"
              name="whereChildWas"
              value={formData.whereChildWas}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Describe where the child was during the period of absence..."
            />
            {errors.whereChildWas && (
              <p className="mt-1 text-xs text-red-600" role="alert">{errors.whereChildWas}</p>
            )}
          </div>

          {/* Who child was with */}
          <div>
            <label htmlFor="whoChildWasWith" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Who was the child with?
            </label>
            <textarea
              id="whoChildWasWith"
              name="whoChildWasWith"
              value={formData.whoChildWasWith}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Names and descriptions of anyone the child was with..."
            />
          </div>

          {/* What happened */}
          <div>
            <label htmlFor="whatHappened" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              What happened during the absence?
            </label>
            <textarea
              id="whatHappened"
              name="whatHappened"
              value={formData.whatHappened}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Summary of events during the missing period..."
            />
          </div>

          {/* Child's account (verbatim) */}
          <div>
            <label htmlFor="childAccount" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Child&apos;s own account{' '}
              <span className="text-[oklch(0.55_0_0)] font-normal">(verbatim where possible)</span>
            </label>
            <textarea
              id="childAccount"
              name="childAccount"
              value={formData.childAccount}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Record the child's own words about what happened..."
            />
          </div>

          {/* Exploitation concerns */}
          <div>
            <p className="text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
              Exploitation concerns identified
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EXPLOITATION_CONCERNS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 cursor-pointer rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-2.5 hover:bg-[oklch(0.97_0.003_160)] transition-colors text-sm"
                >
                  <input
                    type="checkbox"
                    checked={exploitationConcerns.includes(value)}
                    onChange={() => toggleExploitationConcern(value)}
                    className="h-4 w-4 rounded border-[oklch(0.75_0_0)]"
                  />
                  {label}
                </label>
              ))}
            </div>
            {exploitationConcerns.some((c) => c !== 'none') && (
              <div className="mt-3">
                <label htmlFor="exploitationDetails" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
                  Exploitation details
                </label>
                <textarea
                  id="exploitationDetails"
                  name="exploitationDetails"
                  value={formData.exploitationDetails}
                  onChange={handleChange}
                  className={textareaCls}
                  placeholder="Provide details of the exploitation concerns identified..."
                />
              </div>
            )}
          </div>

          {/* Risks identified */}
          <div>
            <label htmlFor="risksIdentified" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Risks identified
            </label>
            <textarea
              id="risksIdentified"
              name="risksIdentified"
              value={formData.risksIdentified}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Any risks identified during the absence or interview..."
            />
          </div>

          {/* Safeguarding referral */}
          <div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="safeguardingReferralNeeded"
                checked={formData.safeguardingReferralNeeded}
                onChange={handleChange}
                className="h-4 w-4 rounded border-[oklch(0.75_0_0)] text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-[oklch(0.35_0.04_160)]">
                Safeguarding referral needed
              </span>
            </label>
          </div>

          {/* Actions recommended */}
          <div>
            <label htmlFor="actionsRecommended" className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5">
              Actions recommended
            </label>
            <textarea
              id="actionsRecommended"
              name="actionsRecommended"
              value={formData.actionsRecommended}
              onChange={handleChange}
              className={textareaCls}
              placeholder="Any actions to be taken following this interview..."
            />
          </div>
        </>
      )}

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
          {isPending ? 'Completing...' : 'Complete RHI'}
        </button>
      </div>
    </form>
  );
}
