import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowRight,
  BellRing,
  BriefcaseBusiness,
  Clock3,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from 'lucide-react';
import { auth } from '@/auth';
import { LogoutButton } from '@/components/auth/logout-button';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';

export const metadata: Metadata = {
  title: 'Dashboard — Complete Care',
};

interface OrgDashboardPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}

export default async function OrgDashboardPage({
  params,
  searchParams,
}: OrgDashboardPageProps) {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const isNewUser = sp.welcome === 'true';

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) {
      notFound();
    }
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/dashboard`);
  }

  const orgName = activeMembership.orgName;
  const firstName = session.user.name?.split(' ')[0] ?? 'there';

  const metrics = [
    {
      label: 'People in care',
      value: '—',
      hint: 'Live caseload signal',
      icon: Users,
    },
    {
      label: 'Staff on duty',
      value: '—',
      hint: 'Coverage and capacity',
      icon: BriefcaseBusiness,
    },
    {
      label: 'Clinical / care tasks',
      value: '—',
      hint: 'What needs action next',
      icon: Stethoscope,
    },
    {
      label: 'Compliance review',
      value: '—',
      hint: 'Inspection-facing items',
      icon: ShieldCheck,
    },
  ];

  const quickActions = [
    {
      href: `/${orgSlug}/persons`,
      title: 'Open people directory',
      description: 'Review records, risk context, and care updates without leaving the day-to-day view.',
    },
    {
      href: `/${orgSlug}/staff`,
      title: 'Check staffing and supervision',
      description: 'Keep the workforce picture clear before rota pressure turns into reactive work.',
    },
    {
      href: `/${orgSlug}/settings`,
      title: 'Adjust organisation settings',
      description: 'Control team access, service setup, and operational defaults from one place.',
    },
    {
      href: `/${orgSlug}/travel-safety`,
      title: 'Review travel and lone-worker safety',
      description: 'Surface timing variance, SOS concerns, and welfare checks in one focused pass.',
    },
  ];

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-5 text-white sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {isNewUser && <WelcomeBanner userName={session.user.name ?? undefined} />}

        <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-6 shadow-[0_28px_80px_-42px_rgba(2,6,23,0.85)] sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/54">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              operational overview
            </span>
            <h1 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/68">
              {orgName} now runs on one calmer surface for the work that matters first — handover, safety, staffing, and the next compliance signal.
            </p>

            <div className="mt-8 grid gap-px overflow-hidden rounded-[1.5rem] border border-white/8 bg-white/8 md:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="bg-white/4 px-5 py-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/44">
                        {metric.label}
                      </p>
                      <Icon className="h-4 w-4 text-white/54" aria-hidden="true" />
                    </div>
                    <p className="font-display mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm text-white/48">{metric.hint}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-[oklch(0.12_0.012_232)/0.62] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-8">
            <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/44">
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
              today’s frame
            </div>
            <div className="mt-6 space-y-4">
              {[
                ['Start with the riskiest shift changes', 'Use the dashboard as the first scan after handover, not the last stop.'],
                ['Keep team attention on signal', 'When metrics populate, they should clarify pressure, not create another report to decode.'],
                ['Make empty states feel intentional', 'Surfaces that are still coming online should guide the next setup step cleanly.'],
              ].map(([title, body]) => (
                <article key={title} className="border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                  <h2 className="font-display text-xl font-semibold tracking-[-0.04em] text-white">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-white/60">{body}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/42">
                  quick routes
                </p>
                <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.05em] text-white">
                  Go straight to the operational surfaces.
                </h2>
              </div>
              <LayoutGrid className="hidden h-5 w-5 text-white/38 sm:block" aria-hidden="true" />
            </div>

            <div className="mt-6 divide-y divide-white/8">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group grid gap-3 py-5 transition-colors first:pt-0 hover:text-white sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <h3 className="font-display text-xl font-semibold tracking-[-0.04em] text-white/92 transition-colors group-hover:text-white">
                      {action.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-white/56">
                      {action.description}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[oklch(0.78_0.08_197)]">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 sm:p-8">
            <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/42">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              activation state
            </div>
            <h2 className="font-display mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
              This dashboard is ready for real signal as the next modules come online.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/58">
              The old placeholder box is replaced with a purposeful read on what this surface is for: a single command view for the next care, staffing, and compliance priority.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-[oklch(0.12_0.012_232)/0.5] p-5">
              <div className="space-y-4">
                {[
                  'Connected metrics will populate from people, staffing, and care-plan modules.',
                  'Upcoming widgets should privilege scanability over density.',
                  'The command surface should keep logout and welcome-state actions within easy reach.',
                ].map((item) => (
                  <div key={item} className="flex gap-3 border-t border-white/8 pt-4 first:border-t-0 first:pt-0">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[oklch(0.72_0.1_165)]" aria-hidden="true" />
                    <p className="text-sm leading-7 text-white/60">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/48">
                Use this space as the first operating brief of the day.
              </p>
              <LogoutButton />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
