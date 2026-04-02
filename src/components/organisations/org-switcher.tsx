'use client';

/**
 * OrgSwitcher — dropdown to switch between organisations for multi-org users.
 * Calls session.update({ activeOrgId }) to trigger the JWT callback with the new org.
 */

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { SessionMembership } from '@/types/auth';

interface OrgSwitcherProps {
  memberships: SessionMembership[];
  activeOrgId: string | undefined;
  activeOrgName: string;
}

export function OrgSwitcher({
  memberships,
  activeOrgId,
  activeOrgName,
}: OrgSwitcherProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  // Single-org users: show org name with a "Create new" link accessible via a minimal dropdown
  if (memberships.length <= 1) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label={`Current organisation: ${activeOrgName}. Click for options.`}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[oklch(0.94_0.005_150)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.35_0.06_160)]"
        >
          <div className="w-6 h-6 rounded-md bg-[oklch(0.22_0.04_160)] flex items-center justify-center text-white text-xs font-bold select-none">
            {activeOrgName.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium text-[oklch(0.18_0.02_160)] truncate max-w-[140px]">
            {activeOrgName}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-3.5 h-3.5 text-[oklch(0.55_0_0)] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute left-0 top-full mt-1.5 z-20 min-w-[200px] rounded-xl border border-[oklch(0.9_0.005_150)] bg-white shadow-[0_8px_30px_-4px_oklch(0.3_0.04_160/0.15)]">
              <div className="py-1.5">
                <Link
                  href="/new-organisation"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[oklch(0.38_0.05_160)] hover:bg-[oklch(0.97_0.005_150)] transition-colors"
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
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Create new organisation
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  async function handleSwitchOrg(orgId: string, orgSlug: string) {
    if (orgId === activeOrgId) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    startTransition(async () => {
      await update({ activeOrgId: orgId });
      router.push(`/${orgSlug}/dashboard`);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={isPending}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current organisation: ${activeOrgName}. Click to switch.`}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[oklch(0.94_0.005_150)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.35_0.06_160)]"
      >
        <div className="w-6 h-6 rounded-md bg-[oklch(0.22_0.04_160)] flex items-center justify-center text-white text-xs font-bold select-none flex-shrink-0">
          {activeOrgName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-[oklch(0.18_0.02_160)] truncate max-w-[120px]">
          {activeOrgName}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-3.5 h-3.5 text-[oklch(0.55_0_0)] transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div
            className="absolute left-0 top-full mt-1.5 z-20 min-w-[200px] rounded-xl border border-[oklch(0.9_0.005_150)] bg-white shadow-[0_8px_30px_-4px_oklch(0.3_0.04_160/0.15)]"
            role="listbox"
            aria-label="Switch organisation"
          >
            <div className="py-1.5">
              <p className="px-3 py-1.5 text-xs font-semibold text-[oklch(0.55_0_0)] uppercase tracking-wider">
                Your organisations
              </p>
              {memberships.map((m) => (
                <button
                  key={m.orgId}
                  type="button"
                  role="option"
                  aria-selected={m.orgId === activeOrgId}
                  onClick={() => handleSwitchOrg(m.orgId, m.orgSlug)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[oklch(0.97_0.005_150)] transition-colors ${
                    m.orgId === activeOrgId
                      ? 'bg-[oklch(0.96_0.01_160)]'
                      : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[oklch(0.22_0.04_160)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {m.orgName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[oklch(0.18_0.02_160)] truncate">
                      {m.orgName}
                    </p>
                    <p className="text-xs text-[oklch(0.55_0_0)] capitalize">
                      {m.role}
                    </p>
                  </div>
                  {m.orgId === activeOrgId && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="oklch(0.35 0.06 160)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Create new org link */}
            <div className="border-t border-[oklch(0.93_0.005_150)] py-1.5">
              <Link
                href="/new-organisation"
                className="flex items-center gap-2 px-3 py-2 text-sm text-[oklch(0.38_0.05_160)] hover:bg-[oklch(0.97_0.005_150)] transition-colors"
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
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create new organisation
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
