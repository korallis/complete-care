'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateOrgSettings } from '@/features/organisations/actions';

const CARE_DOMAINS = [
  {
    id: 'domiciliary',
    label: 'Domiciliary Care',
    description: 'Home visits, scheduling, EVV',
  },
  {
    id: 'supported_living',
    label: 'Supported Living',
    description: 'PBS plans, outcomes tracking',
  },
  {
    id: 'childrens_residential',
    label: "Children's Residential",
    description: 'Ofsted compliance, safeguarding',
  },
] as const;

type DomainId = (typeof CARE_DOMAINS)[number]['id'];

interface OrgSettingsFormProps {
  orgId: string;
  initialName: string;
  initialSlug: string;
  initialDomains: string[];
  canManage: boolean;
}

export function OrgSettingsForm({
  orgId,
  initialName,
  initialSlug,
  initialDomains,
  canManage,
}: OrgSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<{
    name?: string;
    slug?: string;
    domains?: string;
  }>({});
  const [successMessage, setSuccessMessage] = useState('');

  function toggleDomain(id: DomainId) {
    if (!canManage) return;
    setDomains((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
    setFieldError((prev) => ({ ...prev, domains: undefined }));
    setSuccessMessage('');
  }

  async function handleSave() {
    if (!canManage) return;
    setError('');
    setFieldError({});
    setSuccessMessage('');

    startTransition(async () => {
      const result = await updateOrgSettings(orgId, { name, slug, domains });

      if (!result.success) {
        if (result.field) {
          setFieldError({ [result.field]: result.error });
        } else {
          setError(result.error);
        }
        return;
      }

      setSuccessMessage('Settings saved successfully.');

      // If the slug changed, navigate to the new URL
      if (slug !== initialSlug) {
        router.push(`/${slug}/settings`);
        router.refresh();
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Organisation Name */}
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
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFieldError((prev) => ({ ...prev, name: undefined }));
            setSuccessMessage('');
          }}
          maxLength={100}
          disabled={!canManage}
          aria-invalid={!!fieldError.name}
          aria-describedby={fieldError.name ? 'name-error' : undefined}
          className="h-11"
        />
        {fieldError.name && (
          <p id="name-error" className="text-xs text-red-600" role="alert">
            {fieldError.name}
          </p>
        )}
      </div>

      {/* URL Slug */}
      <div className="space-y-2">
        <Label
          htmlFor="org-slug"
          className="text-sm font-medium text-[oklch(0.25_0.03_160)]"
        >
          URL slug
        </Label>
        <div
          className={`flex items-center rounded-md border border-input overflow-hidden ${!canManage ? 'bg-[oklch(0.97_0.002_150)] opacity-70' : 'bg-white focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'}`}
        >
          <span className="px-3 py-2.5 text-sm text-[oklch(0.5_0_0)] border-r border-input bg-[oklch(0.97_0.002_150)] select-none">
            complete-care.app/
          </span>
          <input
            id="org-slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              );
              setFieldError((prev) => ({ ...prev, slug: undefined }));
              setSuccessMessage('');
            }}
            maxLength={63}
            disabled={!canManage}
            aria-invalid={!!fieldError.slug}
            aria-describedby={
              fieldError.slug ? 'slug-error' : 'slug-hint'
            }
            className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none disabled:cursor-not-allowed"
          />
        </div>
        {fieldError.slug ? (
          <p id="slug-error" className="text-xs text-red-600" role="alert">
            {fieldError.slug}
          </p>
        ) : (
          <p id="slug-hint" className="text-xs text-[oklch(0.55_0_0)]">
            Changing the slug will update your organisation&apos;s URL.
          </p>
        )}
      </div>

      {/* Care Domains */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-[oklch(0.25_0.03_160)]">
            Care domains
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">
            Configures features, terminology, and compliance tools.
          </p>
        </div>
        <div className="space-y-2" role="group" aria-label="Care domains">
          {CARE_DOMAINS.map((domain) => {
            const isSelected = domains.includes(domain.id);
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => toggleDomain(domain.id)}
                disabled={!canManage}
                role="checkbox"
                aria-checked={isSelected}
                className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 text-left transition-all disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-[oklch(0.35_0.06_160)] bg-[oklch(0.97_0.01_160)]'
                    : 'border-[oklch(0.9_0.005_150)] bg-white hover:border-[oklch(0.8_0.01_160)]'
                } ${!canManage ? 'opacity-70' : ''}`}
              >
                <div
                  className={`w-4.5 h-4.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
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
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-2.5 h-2.5"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-[oklch(0.22_0.02_160)]">
                    {domain.label}
                  </p>
                  <p className="text-xs text-[oklch(0.5_0_0)]">
                    {domain.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        {fieldError.domains && (
          <p className="text-xs text-red-600" role="alert">
            {fieldError.domains}
          </p>
        )}
      </div>

      {/* Restricted notice */}
      {!canManage && (
        <div className="p-3 rounded-lg bg-[oklch(0.96_0.005_150)] border border-[oklch(0.9_0.005_150)]">
          <p className="text-sm text-[oklch(0.48_0_0)]">
            Only owners and admins can modify organisation settings.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div
          className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700"
          role="status"
          aria-live="polite"
        >
          {successMessage}
        </div>
      )}

      {canManage && (
        <div className="pt-2">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="bg-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.18_0.04_160)] text-white font-semibold h-11 px-6"
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
