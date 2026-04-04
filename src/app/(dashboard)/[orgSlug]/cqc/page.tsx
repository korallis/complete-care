import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { CqcDashboard } from '@/features/dashboards/components/cqc-dashboard';
import { buildDateRange, getCqcDashboard } from '@/features/dashboards/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';

export const metadata: Metadata = {
  title: 'CQC Quality Statements - Complete Care',
};

interface CqcPageProps {
  params: Promise<{ orgSlug: string }>;
}

const adultDomains = [
  {
    title: 'Domiciliary Care',
    body: 'Track evidence for visit delivery, continuity, missed calls, and safe staffing in the community.',
  },
  {
    title: 'Supported Living',
    body: 'Keep property, outcomes, PBS, and day-to-day support evidence visible within the same workspace.',
  },
  {
    title: 'Complex Care',
    body: 'Surface higher-acuity staffing, protocols, competencies, and continuity expectations without inventing a separate regulator.',
  },
] as const;

export default async function CqcPage({ params }: CqcPageProps) {
  const { orgSlug } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (membership) => membership.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find(
      (membership) => membership.orgSlug === orgSlug,
    );

    if (!targetMembership) {
      notFound();
    }

    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/cqc`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'compliance');

  if (!canRead) {
    notFound();
  }

  const dashboard = await getCqcDashboard(
    activeMembership.orgId,
    buildDateRange('30d'),
  );

  const evidenceGaps =
    dashboard.overallCoverage.none + dashboard.overallCoverage.partial;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
            CQC Quality Statements
          </h1>
          <p className="mt-0.5 max-w-3xl text-sm text-[oklch(0.55_0_0)]">
            A single evidence view for Domiciliary Care, Supported Living, and
            Complex Care under the CQC single assessment framework.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href={`/${orgSlug}/staff/compliance`}
            className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-4 py-2.5 text-sm font-medium text-[oklch(0.35_0_0)] transition-colors hover:bg-[oklch(0.97_0.003_160)]"
          >
            Staff Compliance
          </Link>
          <Link
            href={`/${orgSlug}/reports`}
            className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-4 py-2.5 text-sm font-medium text-[oklch(0.35_0_0)] transition-colors hover:bg-[oklch(0.97_0.003_160)]"
          >
            Reports
          </Link>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {adultDomains.map((domain) => (
          <article
            key={domain.title}
            className="rounded-2xl border border-[oklch(0.9_0.003_160)] bg-white p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.3)]"
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[oklch(0.45_0.03_200)]">
              CQC-aligned domain
            </p>
            <h2 className="mt-3 text-lg font-semibold text-[oklch(0.22_0.04_160)]">
              {domain.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[oklch(0.5_0_0)]">
              {domain.body}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-[oklch(0.9_0.003_160)] bg-[oklch(0.985_0.004_160)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[oklch(0.45_0.03_200)]">
              Evidence posture
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[oklch(0.22_0.04_160)]">
              Current mapping stays honest while deeper overlays mature.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[oklch(0.5_0_0)]">
              This workspace reflects today&apos;s evidence coverage and gaps. It
              should help teams prioritise remediation without implying that
              every adult-service workflow is already complete.
            </p>
          </div>
          <div className="rounded-2xl border border-[oklch(0.87_0.01_160)] bg-white px-4 py-3 text-sm text-[oklch(0.22_0.04_160)]">
            <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[oklch(0.5_0_0)]">
              Priority evidence gaps
            </span>
            <span className="mt-1 block text-2xl font-semibold">
              {evidenceGaps}
            </span>
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl bg-[oklch(0.93_0.003_160)]"
              />
            ))}
          </div>
        }
      >
        <CqcDashboard data={dashboard} />
      </Suspense>
    </div>
  );
}
