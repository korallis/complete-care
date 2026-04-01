import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import {
  getComplianceDashboard,
  seedStandards,
  getComplianceGaps,
} from '@/features/ofsted/actions';
import { OfstedDashboard } from '@/components/ofsted/ofsted-dashboard';

export const metadata: Metadata = {
  title: 'Ofsted Compliance - Complete Care',
};

interface OfstedPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OfstedPage({ params }: OfstedPageProps) {
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
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) {
      notFound();
    }
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/ofsted`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'ofsted');
  const canManage = hasPermission(role, 'manage', 'ofsted');

  if (!canRead) {
    notFound();
  }

  // Auto-seed standards on first visit
  if (canManage) {
    await seedStandards();
  }

  const [dashboard, gaps] = await Promise.all([
    getComplianceDashboard(),
    getComplianceGaps(),
  ]);

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
            Ofsted Compliance
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            9 Quality Standards (Regulations 6-14) for children&apos;s
            residential homes
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href={`/${orgSlug}/ofsted/register`}
            className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-4 py-2.5 text-sm font-medium text-[oklch(0.35_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Children&apos;s Register
          </Link>
          <Link
            href={`/${orgSlug}/ofsted/statement`}
            className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.85_0.003_160)] bg-white px-4 py-2.5 text-sm font-medium text-[oklch(0.35_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Statement of Purpose
          </Link>
        </div>
      </div>

      {/* Dashboard */}
      <Suspense
        fallback={
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-[oklch(0.93_0.003_160)] animate-pulse"
              />
            ))}
          </div>
        }
      >
        <OfstedDashboard data={dashboard} orgSlug={orgSlug} />
      </Suspense>

      {/* Compliance Gaps */}
      {gaps.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-[oklch(0.22_0.04_160)] mb-3">
            Compliance Gaps
            <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-100 text-xs font-medium text-red-700 px-1.5">
              {gaps.length}
            </span>
          </h2>
          <div className="space-y-2">
            {gaps.slice(0, 20).map((gap) => (
              <Link
                key={`${gap.standardId}-${gap.subRequirementId}`}
                href={`/${orgSlug}/ofsted/standards/${gap.standardId}`}
                className="block rounded-lg border border-[oklch(0.90_0.003_160)] bg-white p-3 hover:border-[oklch(0.70_0.05_160)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[oklch(0.55_0_0)]">
                      Regulation {gap.regulationNumber} &mdash;{' '}
                      {gap.standardName}
                    </p>
                    <p className="text-sm font-medium text-[oklch(0.22_0.04_160)] mt-0.5">
                      {gap.subRequirementText}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      gap.status === 'missing'
                        ? 'text-red-700 bg-red-50 border-red-200'
                        : 'text-amber-700 bg-amber-50 border-amber-200'
                    }`}
                  >
                    {gap.status === 'missing'
                      ? 'No Evidence'
                      : 'Partially Evidenced'}
                  </span>
                </div>
              </Link>
            ))}
            {gaps.length > 20 && (
              <p className="text-xs text-[oklch(0.55_0_0)] text-center">
                And {gaps.length - 20} more gaps...
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
