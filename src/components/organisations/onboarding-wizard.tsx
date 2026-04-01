'use client';

/**
 * OnboardingWizard — multi-step organisation creation wizard.
 *
 * Steps:
 * 1. Create organisation (name + auto-generated slug)
 * 2. Select care domains (domiciliary, supported_living, childrens_residential)
 * 3. Done — redirect to dashboard
 */

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createOrganisation,
  generateOrgSlug,
} from '@/features/organisations/actions';

type Step = 1 | 2 | 3;

const CARE_DOMAINS = [
  {
    id: 'domiciliary',
    label: 'Domiciliary Care',
    description: 'Home visits, scheduling, electronic visit verification',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'supported_living',
    label: 'Supported Living',
    description: 'Tenancy-based support, PBS plans, outcomes tracking',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'childrens_residential',
    label: "Children's Residential Homes",
    description: 'Ofsted compliance, safeguarding, LAC documentation',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-5 h-5"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
] as const;

type DomainId = (typeof CARE_DOMAINS)[number]['id'];

interface OnboardingWizardProps {
  userName: string;
}

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>(1);
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<DomainId[]>([]);
  const [error, setError] = useState<string>('');
  const [fieldError, setFieldError] = useState<{ name?: string; slug?: string; domains?: string }>({});

  // Auto-generate slug from name
  useEffect(() => {
    if (slugEdited || !orgName) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const generated = await generateOrgSlug(orgName);
        setSlug(generated);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [orgName, slugEdited]);

  function toggleDomain(id: DomainId) {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
    setFieldError((prev) => ({ ...prev, domains: undefined }));
  }

  async function handleSubmit() {
    setError('');
    setFieldError({});

    // Validate step 2 (domains)
    if (selectedDomains.length === 0) {
      setFieldError({ domains: 'Please select at least one care domain' });
      return;
    }

    startTransition(async () => {
      const result = await createOrganisation({
        name: orgName,
        slug,
        domains: selectedDomains,
      });

      if (!result.success) {
        if (result.field === 'slug') {
          setFieldError({ slug: result.error });
          setStep(1);
        } else if (result.field === 'name') {
          setFieldError({ name: result.error });
          setStep(1);
        } else {
          setError(result.error);
        }
        return;
      }

      // Refresh session to pick up the new org
      await updateSession({});

      router.push('/dashboard');
      router.refresh();
    });
  }

  function handleNextStep() {
    setFieldError({});
    if (step === 1) {
      if (!orgName.trim()) {
        setFieldError({ name: 'Organisation name is required' });
        return;
      }
      if (!slug.trim()) {
        setFieldError({ slug: 'Slug is required' });
        return;
      }
      if (!/^[a-z0-9-]+$/.test(slug)) {
        setFieldError({
          slug: 'Slug may only contain lowercase letters, numbers, and hyphens',
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedDomains.length === 0) {
        setFieldError({ domains: 'Please select at least one care domain' });
        return;
      }
      handleSubmit();
    }
  }

  const firstName = userName.split(' ')[0];

  return (
    <div
      className="w-full rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white shadow-[0_4px_24px_-4px_oklch(0.3_0.04_160/0.12),0_1px_4px_-1px_oklch(0.3_0.04_160/0.08)]"
      role="main"
    >
      {/* Progress indicator */}
      <div className="px-8 pt-8 pb-0">
        <div className="flex items-center gap-2 mb-6">
          {([1, 2] as const).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step > s
                    ? 'bg-[oklch(0.45_0.12_160)] text-white'
                    : step === s
                      ? 'bg-[oklch(0.22_0.04_160)] text-white'
                      : 'bg-[oklch(0.93_0.005_150)] text-[oklch(0.55_0_0)]'
                }`}
                aria-label={`Step ${s}`}
              >
                {step > s ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 2 && (
                <div
                  className={`h-px flex-1 w-12 transition-colors ${
                    step > s ? 'bg-[oklch(0.45_0.12_160)]' : 'bg-[oklch(0.9_0.005_150)]'
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-[oklch(0.5_0_0)]">
            Step {step} of 2
          </span>
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* Step 1: Organisation details */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h1 className="text-[1.45rem] font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
                {firstName ? `Welcome, ${firstName}!` : 'Create your organisation'}
              </h1>
              <p className="mt-1.5 text-sm text-[oklch(0.48_0_0)]">
                Let&apos;s start by setting up your care organisation.
              </p>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="org-name"
                className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
              >
                Organisation name
              </Label>
              <Input
                id="org-name"
                type="text"
                placeholder="e.g. Sunrise Care Group"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  setFieldError((prev) => ({ ...prev, name: undefined }));
                }}
                maxLength={100}
                autoFocus
                aria-invalid={!!fieldError.name}
                aria-describedby={fieldError.name ? 'org-name-error' : undefined}
                className="h-11 text-base"
              />
              {fieldError.name && (
                <p
                  id="org-name-error"
                  className="text-xs text-red-600 mt-1"
                  role="alert"
                >
                  {fieldError.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="org-slug"
                className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
              >
                URL slug
              </Label>
              <div className="flex items-center rounded-md border border-input bg-[oklch(0.97_0.002_150)] overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="px-3 py-2.5 text-sm text-[oklch(0.5_0_0)] border-r border-input bg-transparent select-none">
                  complete-care.app/
                </span>
                <input
                  id="org-slug"
                  type="text"
                  placeholder="sunrise-care"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setSlugEdited(true);
                    setFieldError((prev) => ({ ...prev, slug: undefined }));
                  }}
                  maxLength={63}
                  aria-invalid={!!fieldError.slug}
                  aria-describedby={fieldError.slug ? 'slug-error' : 'slug-hint'}
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none"
                />
              </div>
              {fieldError.slug ? (
                <p
                  id="slug-error"
                  className="text-xs text-red-600"
                  role="alert"
                >
                  {fieldError.slug}
                </p>
              ) : (
                <p id="slug-hint" className="text-xs text-[oklch(0.55_0_0)]">
                  Auto-generated from your name. Used in your organisation&apos;s URL.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Care domains */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h1 className="text-[1.45rem] font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
                Which care services do you provide?
              </h1>
              <p className="mt-1.5 text-sm text-[oklch(0.48_0_0)]">
                Select all that apply. This configures the features and compliance tools shown.
              </p>
            </div>

            <fieldset>
              <legend className="sr-only">Care domains</legend>
              <div className="space-y-2.5" role="group" aria-label="Care domains">
                {CARE_DOMAINS.map((domain) => {
                  const isSelected = selectedDomains.includes(domain.id);
                  return (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => toggleDomain(domain.id)}
                      role="checkbox"
                      aria-checked={isSelected}
                      className={`w-full flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-[oklch(0.35_0.06_160)] bg-[oklch(0.96_0.01_160)]'
                          : 'border-[oklch(0.9_0.005_150)] bg-white hover:border-[oklch(0.8_0.01_160)] hover:bg-[oklch(0.98_0.003_150)]'
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'border-[oklch(0.35_0.06_160)] bg-[oklch(0.35_0.06_160)]'
                            : 'border-[oklch(0.7_0_0)] bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-3 h-3"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      <div
                        className={`flex-shrink-0 mt-0.5 ${isSelected ? 'text-[oklch(0.35_0.06_160)]' : 'text-[oklch(0.5_0_0)]'}`}
                        aria-hidden="true"
                      >
                        {domain.icon}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${isSelected ? 'text-[oklch(0.2_0.03_160)]' : 'text-[oklch(0.25_0_0)]'}`}
                        >
                          {domain.label}
                        </p>
                        <p className="text-xs text-[oklch(0.5_0_0)] mt-0.5">
                          {domain.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {fieldError.domains && (
                <p className="text-xs text-red-600 mt-2" role="alert">
                  {fieldError.domains}
                </p>
              )}
            </fieldset>
          </div>
        )}

        {/* Global error */}
        {error && (
          <div
            className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
              disabled={isPending}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNextStep}
            disabled={isPending}
            className="flex-1 h-11 bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white font-semibold"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  xmlns="http://www.w3.org/2000/svg"
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
                Creating…
              </span>
            ) : step === 2 ? (
              'Create Organisation'
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
