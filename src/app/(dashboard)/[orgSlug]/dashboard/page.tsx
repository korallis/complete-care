import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { and, count, eq, isNull } from 'drizzle-orm';
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
import { db } from '@/lib/db';
import { carePlans, clinicalAlerts, persons, staffProfiles } from '@/lib/db/schema';
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

  const organisationId = activeMembership.orgId;
  const [peopleCountRow, staffCountRow, carePlanCountRow, activeAlertsCountRow] = await Promise.all([
    db
      .select({ count: count() })
      .from(persons)
      .where(and(eq(persons.organisationId, organisationId), isNull(persons.deletedAt))),
    db
      .select({ count: count() })
      .from(staffProfiles)
      .where(and(eq(staffProfiles.organisationId, organisationId), isNull(staffProfiles.deletedAt))),
    db
      .select({ count: count() })
      .from(carePlans)
      .where(and(eq(carePlans.organisationId, organisationId), isNull(carePlans.deletedAt))),
    db
      .select({ count: count() })
      .from(clinicalAlerts)
      .where(and(eq(clinicalAlerts.organisationId, organisationId), eq(clinicalAlerts.status, 'active'))),
  ]);

  const metrics = [
    {
      label: 'People in care',
      value: String(peopleCountRow[0]?.count ?? 0),
      hint: 'Live caseload signal',
      icon: Users,
    },
    {
      label: 'Staff on duty',
      value: String(staffCountRow[0]?.count ?? 0),
      hint: 'Coverage and capacity',
      icon: BriefcaseBusiness,
    },
    {
      label: 'Clinical / care tasks',
      value: String(carePlanCountRow[0]?.count ?? 0),
      hint: 'What needs action next',
      icon: Stethoscope,
    },
    {
      label: 'Compliance review',
      value: String(activeAlertsCountRow[0]?.count ?? 0),
      hint: 'Inspection-facing items',
      icon: ShieldCheck,
    },
  ] as const;

  const quickActions = [
    {
      href: `/${orgSlug}/persons`,
      title: 'Open people directory',
      description:
        'Review records, risk context, and care updates without leaving the day-to-day view.',
    },
    {
      href: `/${orgSlug}/staff`,
      title: 'Check staffing and supervision',
      description:
        'Keep the workforce picture clear before rota pressure turns into reactive work.',
    },
    {
      href: `/${orgSlug}/settings`,
      title: 'Adjust organisation settings',
      description:
        'Control team access, service setup, and operational defaults from one place.',
    },
    {
      href: `/${orgSlug}/travel-safety`,
      title: 'Review travel and lone-worker safety',
      description:
        'Surface timing variance, SOS concerns, and welfare checks in one focused pass.',
    },
  ] as const;

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.32),rgba(255,255,255,0.12))] px-4 py-5 text-[oklch(0.2_0.016_232)] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {isNewUser && (
          <WelcomeBanner
            userName={session.user.name ?? undefined}
            orgSlug={orgSlug}
          />
        )}

        <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-[2rem] border border-[oklch(0.88_0.012_220)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,249,251,0.92))] p-6 shadow-[0_28px_80px_-42px_rgba(15,23,42,0.22)] sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-[oklch(0.86_0.02_205)] bg-[oklch(0.95_0.02_200)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[oklch(0.37_0.05_200)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              operational overview
            </span>
            <h1 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] text-[oklch(0.16_0.016_232)] sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[oklch(0.45_0.018_225)]">
              {orgName} now runs on one calmer surface for the work that matters first — handover,
              safety, staffing, and the next compliance signal.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="rounded-[1.4rem] border border-[oklch(0.89_0.012_220)] bg-white px-5 py-5 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.24)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[oklch(0.5_0.016_225)]">
                        {metric.label}
                      </p>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[oklch(0.95_0.018_200)] text-[oklch(0.36_0.05_200)]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="font-display mt-4 text-3xl font-semibold tracking-[-0.05em] text-[oklch(0.16_0.016_232)]">
                      {metric.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[oklch(0.48_0.016_225)]">{metric.hint}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-[oklch(0.88_0.012_220)] bg-[linear-gradient(180deg,rgba(244,248,250,0.98),rgba(237,243,247,0.92))] p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.18)] sm:p-8">
            <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[oklch(0.5_0.016_225)]">
              <BellRing className="h-3.5 w-3.5 text-[oklch(0.37_0.05_200)]" aria-hidden="true" />
              today’s frame
            </div>
            <div className="mt-6 space-y-4">
              {[
                [
                  'Start with the riskiest shift changes',
                  'Use the dashboard as the first scan after handover, not the last stop.',
                ],
                [
                  'Keep team attention on signal',
                  'When metrics populate, they should clarify pressure, not create another report to decode.',
                ],
                [
                  'Make empty states feel intentional',
                  'Surfaces that are still coming online should guide the next setup step cleanly.',
                ],
              ].map(([title, body]) => (
                <article
                  key={title}
                  className="rounded-[1.25rem] border border-[oklch(0.89_0.012_220)] bg-white/85 p-4"
                >
                  <h2 className="font-display text-xl font-semibold tracking-[-0.04em] text-[oklch(0.17_0.016_232)]">
                    {title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[oklch(0.46_0.016_225)]">{body}</p>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[2rem] border border-[oklch(0.88_0.012_220)] bg-white p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.16)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[oklch(0.5_0.016_225)]">
                  quick routes
                </p>
                <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.05em] text-[oklch(0.16_0.016_232)]">
                  Go straight to the operational surfaces.
                </h2>
              </div>
              <span className="hidden h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.95_0.018_200)] text-[oklch(0.36_0.05_200)] sm:flex">
                <LayoutGrid className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>

            <div className="mt-6 divide-y divide-[oklch(0.9_0.012_220)]">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group grid gap-3 py-5 transition-colors first:pt-0 hover:text-[oklch(0.16_0.016_232)] sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <h3 className="font-display text-xl font-semibold tracking-[-0.04em] text-[oklch(0.18_0.016_232)] transition-colors group-hover:text-[oklch(0.12_0.02_232)]">
                      {action.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-[oklch(0.45_0.016_225)]">
                      {action.description}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-[oklch(0.37_0.05_200)]">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[oklch(0.88_0.012_220)] bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(243,247,249,0.94))] p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.16)] sm:p-8">
            <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[oklch(0.5_0.016_225)]">
              <Clock3 className="h-3.5 w-3.5 text-[oklch(0.37_0.05_200)]" aria-hidden="true" />
              activation state
            </div>
            <h2 className="font-display mt-3 text-2xl font-semibold tracking-[-0.05em] text-[oklch(0.17_0.016_232)]">
              This dashboard is ready for real signal as the next modules come online.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[oklch(0.46_0.016_225)]">
              The old placeholder box is replaced with a purposeful read on what this surface is for:
              a single command view for the next care, staffing, and compliance priority.
            </p>

            <div className="mt-6 rounded-[1.5rem] border border-[oklch(0.89_0.012_220)] bg-white p-5">
              <div className="space-y-4">
                {[
                  'Connected metrics will populate from people, staffing, and care-plan modules.',
                  'Upcoming widgets should privilege scanability over density.',
                  'The command surface should keep logout and welcome-state actions within easy reach.',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 border-t border-[oklch(0.9_0.012_220)] pt-4 first:border-t-0 first:pt-0"
                  >
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[oklch(0.62_0.11_165)]" aria-hidden="true" />
                    <p className="text-sm leading-7 text-[oklch(0.46_0.016_225)]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[oklch(0.48_0.016_225)]">
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
