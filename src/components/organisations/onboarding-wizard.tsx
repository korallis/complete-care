'use client';

/**
 * OnboardingWizard — multi-step organisation creation wizard.
 *
 * Steps:
 * 1. Create organisation (name + auto-generated URL slug)
 * 2. Select care domains (domiciliary, supported_living, childrens_residential)
 * 3. Invite team members (bulk email + role — optional, skippable)
 *
 * On completion (step 3 submit or skip), calls createOrganisationWithInvites,
 * refreshes the session, then redirects to /dashboard?welcome=true.
 */

import { useState, useEffect, useTransition, useId } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createOrganisationWithInvites,
  generateOrgSlug,
} from '@/features/organisations/actions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3;
const TOTAL_STEPS = 3;

const ORG_TYPES = [
  { value: '', label: 'Select organisation type' },
  { value: 'independent_provider', label: 'Independent care provider' },
  { value: 'care_group', label: 'Care group / multiple locations' },
  { value: 'nhs_statutory', label: 'NHS / statutory provider' },
  { value: 'local_authority', label: 'Local authority' },
  { value: 'charity_nfp', label: 'Charity / not-for-profit' },
  { value: 'other', label: 'Other' },
] as const;

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
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
] as const;

type DomainId = (typeof CARE_DOMAINS)[number]['id'];

const INVITE_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior_carer', label: 'Senior Carer' },
  { value: 'carer', label: 'Carer' },
  { value: 'viewer', label: 'Viewer' },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InviteRow = {
  id: string;
  email: string;
  role: string;
};

interface OnboardingWizardProps {
  userName: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OnboardingWizard({ userName }: OnboardingWizardProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [isPending, startTransition] = useTransition();
  const baseId = useId();

  // ── Step state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);

  // ── Step 1: Organisation details ────────────────────────────────────────
  const [orgName, setOrgName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [orgType, setOrgType] = useState('');

  // ── Step 2: Care domains ────────────────────────────────────────────────
  const [selectedDomains, setSelectedDomains] = useState<DomainId[]>([]);

  // ── Step 3: Team invites ────────────────────────────────────────────────
  const [inviteRows, setInviteRows] = useState<InviteRow[]>([
    { id: `${baseId}-0`, email: '', role: 'carer' },
  ]);

  // ── Errors ───────────────────────────────────────────────────────────────
  const [globalError, setGlobalError] = useState<string>('');
  const [fieldError, setFieldError] = useState<{
    name?: string;
    slug?: string;
    orgType?: string;
    domains?: string;
    invites?: string;
  }>({});

  // ── Auto-generate slug from name ────────────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────────────────────

  function toggleDomain(id: DomainId) {
    setSelectedDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
    setFieldError((prev) => ({ ...prev, domains: undefined }));
  }

  function addInviteRow() {
    setInviteRows((prev) => [
      ...prev,
      { id: `${baseId}-${prev.length}`, email: '', role: 'carer' },
    ]);
  }

  function removeInviteRow(id: string) {
    setInviteRows((prev) => prev.filter((row) => row.id !== id));
  }

  function updateInviteRow(id: string, field: 'email' | 'role', value: string) {
    setInviteRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
    setFieldError((prev) => ({ ...prev, invites: undefined }));
  }

  // ── Step validation ──────────────────────────────────────────────────────

  function validateStep1(): boolean {
    const errors: typeof fieldError = {};
    if (!orgName.trim()) errors.name = 'Organisation name is required';
    if (!slug.trim()) errors.slug = 'Slug is required';
    else if (!/^[a-z0-9-]+$/.test(slug))
      errors.slug =
        'Slug may only contain lowercase letters, numbers, and hyphens';
    if (Object.keys(errors).length > 0) {
      setFieldError(errors);
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    if (selectedDomains.length === 0) {
      setFieldError({ domains: 'Please select at least one care domain' });
      return false;
    }
    return true;
  }

  /**
   * Validate invite rows. Returns the filtered list of non-empty rows.
   * Returns null if any non-empty email is invalid.
   */
  function validateStep3(): Array<{ email: string; role: string }> | null {
    const nonEmpty = inviteRows.filter((row) => row.email.trim() !== '');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const row of nonEmpty) {
      if (!emailRegex.test(row.email.trim())) {
        setFieldError({
          invites: `"${row.email}" is not a valid email address`,
        });
        return null;
      }
    }
    return nonEmpty.map((row) => ({
      email: row.email.trim().toLowerCase(),
      role: row.role,
    }));
  }

  // ── Final submit ─────────────────────────────────────────────────────────

  function submitWizard(invites: Array<{ email: string; role: string }>) {
    setGlobalError('');
    setFieldError({});

    startTransition(async () => {
      const result = await createOrganisationWithInvites({
        name: orgName,
        slug,
        orgType: orgType || undefined,
        domains: selectedDomains,
        invites,
      });

      if (!result.success) {
        if (result.field === 'slug') {
          setFieldError({ slug: result.error });
          setStep(1);
        } else if (result.field === 'name') {
          setFieldError({ name: result.error });
          setStep(1);
        } else if (result.field === 'domains') {
          setFieldError({ domains: result.error });
          setStep(2);
        } else {
          setGlobalError(result.error);
        }
        return;
      }

      // Switch the session's active org to the newly created one.
      // Passing activeOrgId triggers the JWT callback to set this as the
      // active organisation, ensuring the new org's data loads immediately.
      const newOrgId = result.data?.orgId ?? '';
      const orgSlug = result.data?.orgSlug ?? '';
      await updateSession({ activeOrgId: newOrgId });
      // Redirect to the org-scoped dashboard with welcome message
      router.push(orgSlug ? `/${orgSlug}/dashboard?welcome=true` : '/dashboard?welcome=true');
      router.refresh();
    });
  }

  // ── Navigation handlers ──────────────────────────────────────────────────

  function handleNext() {
    setFieldError({});
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    }
  }

  function handleCompleteWithInvites() {
    const validatedInvites = validateStep3();
    if (validatedInvites !== null) {
      submitWizard(validatedInvites);
    }
  }

  function handleSkip() {
    setFieldError({});
    submitWizard([]);
  }

  function goBack() {
    setFieldError({});
    setGlobalError('');
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const firstName = userName.split(' ')[0];
  const hasAnyInvite = inviteRows.some((r) => r.email.trim() !== '');

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="w-full rounded-2xl border border-[oklch(0.9_0.005_150)] bg-white shadow-[0_4px_24px_-4px_oklch(0.3_0.04_160/0.12),0_1px_4px_-1px_oklch(0.3_0.04_160/0.08)]"
      role="main"
    >
      {/* ── Progress indicator ── */}
      <div className="px-8 pt-8 pb-0">
        <div className="flex items-center gap-2 mb-6">
          {([1, 2, 3] as const).map((s, idx) => (
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
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {idx < TOTAL_STEPS - 1 && (
                <div
                  className={`h-px flex-1 w-12 transition-colors ${
                    step > s
                      ? 'bg-[oklch(0.45_0.12_160)]'
                      : 'bg-[oklch(0.9_0.005_150)]'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-xs text-[oklch(0.5_0_0)]">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* ── Step 1: Organisation details ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h1 className="text-[1.45rem] font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
                {firstName
                  ? `Welcome, ${firstName}!`
                  : 'Create your organisation'}
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
                aria-describedby={
                  fieldError.name ? 'org-name-error' : undefined
                }
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
                htmlFor="org-type"
                className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
              >
                Organisation type{' '}
                <span className="text-[oklch(0.55_0_0)] font-normal">(optional)</span>
              </Label>
              <select
                id="org-type"
                value={orgType}
                onChange={(e) => {
                  setOrgType(e.target.value);
                  setFieldError((prev) => ({ ...prev, orgType: undefined }));
                }}
                aria-describedby={fieldError.orgType ? 'org-type-error' : 'org-type-hint'}
                className="w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-[oklch(0.25_0.03_160)]"
              >
                {ORG_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {fieldError.orgType ? (
                <p id="org-type-error" className="text-xs text-red-600" role="alert">
                  {fieldError.orgType}
                </p>
              ) : (
                <p id="org-type-hint" className="text-xs text-[oklch(0.55_0_0)]">
                  Helps us tailor your experience and compliance tooling.
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
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ''),
                    );
                    setSlugEdited(true);
                    setFieldError((prev) => ({ ...prev, slug: undefined }));
                  }}
                  maxLength={63}
                  aria-invalid={!!fieldError.slug}
                  aria-describedby={
                    fieldError.slug ? 'slug-error' : 'slug-hint'
                  }
                  aria-label="URL slug"
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none"
                />
              </div>
              {fieldError.slug ? (
                <p id="slug-error" className="text-xs text-red-600" role="alert">
                  {fieldError.slug}
                </p>
              ) : (
                <p id="slug-hint" className="text-xs text-[oklch(0.55_0_0)]">
                  Auto-generated from your name. Used in your organisation&apos;s
                  URL.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Care domains ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h1 className="text-[1.45rem] font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
                Which care services do you provide?
              </h1>
              <p className="mt-1.5 text-sm text-[oklch(0.48_0_0)]">
                Select all that apply. This configures features and compliance
                tools.
              </p>
            </div>

            <fieldset>
              <legend className="sr-only">Care domains</legend>
              <div
                className="space-y-2.5"
                role="group"
                aria-label="Care domains"
              >
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
                            aria-hidden="true"
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

        {/* ── Step 3: Team invites ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="mb-6">
              <h1 className="text-[1.45rem] font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
                Invite your team
              </h1>
              <p className="mt-1.5 text-sm text-[oklch(0.48_0_0)]">
                Add team members to get started. You can always invite more
                people later.
              </p>
            </div>

            {/* Invite rows */}
            <div className="space-y-3" role="group" aria-label="Team invitations">
              {inviteRows.map((row, idx) => (
                <div key={row.id} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={row.email}
                      onChange={(e) =>
                        updateInviteRow(row.id, 'email', e.target.value)
                      }
                      aria-label={`Email address for invitee ${idx + 1}`}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <select
                      value={row.role}
                      onChange={(e) =>
                        updateInviteRow(row.id, 'role', e.target.value)
                      }
                      aria-label={`Role for invitee ${idx + 1}`}
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {INVITE_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {inviteRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInviteRow(row.id)}
                      aria-label={`Remove invitee ${idx + 1}`}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-[oklch(0.55_0_0)] hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4"
                        aria-hidden="true"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add another row */}
            <button
              type="button"
              onClick={addInviteRow}
              disabled={isPending}
              className="flex items-center gap-1.5 text-sm text-[oklch(0.35_0.06_160)] hover:text-[oklch(0.25_0.05_160)] font-medium transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add another person
            </button>

            {fieldError.invites && (
              <p className="text-xs text-red-600" role="alert">
                {fieldError.invites}
              </p>
            )}
          </div>
        )}

        {/* ── Global error ── */}
        {globalError && (
          <div
            className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
            role="alert"
          >
            {globalError}
          </div>
        )}

        {/* ── Navigation buttons ── */}
        <div className="mt-6 flex items-center gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={isPending}
              className="flex-1"
            >
              Back
            </Button>
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={isPending}
              className="flex-1 h-11 bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white font-semibold"
            >
              Continue
            </Button>
          ) : (
            <div className="flex-1 flex items-center gap-3">
              {/* Skip button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isPending}
                className="flex-1"
                aria-label="Skip inviting team members for now"
              >
                {isPending ? (
                  <Spinner />
                ) : (
                  'Skip for now'
                )}
              </Button>

              {/* Complete setup button */}
              {hasAnyInvite && (
                <Button
                  type="button"
                  onClick={handleCompleteWithInvites}
                  disabled={isPending}
                  className="flex-1 h-11 bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white font-semibold"
                >
                  {isPending ? (
                    <Spinner />
                  ) : (
                    'Send Invites & Finish'
                  )}
                </Button>
              )}

              {!hasAnyInvite && (
                <Button
                  type="button"
                  onClick={handleSkip}
                  disabled={isPending}
                  className="flex-1 h-11 bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white font-semibold"
                >
                  {isPending ? (
                    <Spinner />
                  ) : (
                    'Complete Setup →'
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spinner helper
// ---------------------------------------------------------------------------

function Spinner() {
  return (
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
      Setting up…
    </span>
  );
}
