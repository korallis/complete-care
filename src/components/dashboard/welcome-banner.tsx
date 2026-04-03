'use client';
import Link from 'next/link';
import { ArrowRight, Building2, Settings2, Users } from 'lucide-react';
import { useState } from 'react';

interface WelcomeBannerProps {
  userName?: string;
  orgSlug: string;
}

const QUICK_LINKS = [
  {
    href: (orgSlug: string) => `/${orgSlug}/persons`,
    label: 'Open people directory',
    description:
      'Start with the records, context, and care updates your team will use most.',
    icon: Users,
  },
  {
    href: (orgSlug: string) => `/${orgSlug}/staff`,
    label: 'Review your team setup',
    description:
      'Check staffing, invites, and daily coverage before the day gets reactive.',
    icon: Building2,
  },
  {
    href: (orgSlug: string) => `/${orgSlug}/settings`,
    label: 'Finish organisation settings',
    description:
      'Keep defaults, permissions, and operational preferences aligned from day one.',
    icon: Settings2,
  },
] as const;

export function WelcomeBanner({ userName, orgSlug }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const firstName = userName?.split(' ')[0];

  return (
    <section
      role="status"
      aria-label="Welcome message"
      className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.92))] p-6 text-white shadow-[0_32px_80px_-40px_rgba(2,6,23,0.82)] sm:p-8"
    >
      <div
        className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.16),_transparent_58%)]"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/58">
            onboarding brief
          </span>
          <h2 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-[2.15rem]">
            {firstName
              ? `Welcome to Complete Care, ${firstName}.`
              : 'Welcome to Complete Care.'}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/68 sm:text-base">
            Your workspace is live. Use this first dashboard pass to orient the
            team, connect your operational surfaces, and make the next action obvious.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss welcome message"
          className="inline-flex h-10 w-10 items-center justify-center self-start rounded-full border border-white/12 bg-white/6 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </button>
      </div>

      <div className="relative mt-8 grid gap-3 lg:grid-cols-3">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.label}
              href={link.href(orgSlug)}
              className="group rounded-[1.4rem] border border-white/10 bg-white/6 p-4 transition-colors hover:bg-white/10"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <ArrowRight
                  className="h-4 w-4 text-white/48 transition-transform group-hover:translate-x-0.5 group-hover:text-white/78"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-display mt-5 text-xl font-semibold tracking-[-0.04em] text-white/94">
                {link.label}
              </h3>
              <p className="mt-2 text-sm leading-7 text-white/60">
                {link.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
