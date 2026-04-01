import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { getCarePlan, getCarePlanVersion } from '@/features/care-plans/actions';
import { CarePlanVersionCompare } from '@/components/care-plans/care-plan-version-compare';
import type { Role } from '@/lib/rbac/permissions';
import { hasPermission } from '@/lib/rbac/permissions';

interface ComparePageProps {
  params: Promise<{ orgSlug: string; personId: string; carePlanId: string }>;
  searchParams: Promise<{ v1?: string; v2?: string }>;
}

export const metadata: Metadata = {
  title: 'Compare Versions — Complete Care',
};

export default async function CompareVersionsPage({ params, searchParams }: ComparePageProps) {
  const { orgSlug, personId, carePlanId } = await params;
  const { v1: v1Param, v2: v2Param } = await searchParams;

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
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/care-plans/${carePlanId}/compare`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  if (!hasPermission(role, 'read', 'care_plans')) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  const v1 = v1Param ? parseInt(v1Param, 10) : null;
  const v2 = v2Param ? parseInt(v2Param, 10) : null;

  const [person, carePlan] = await Promise.all([
    getPerson(personId),
    getCarePlan(carePlanId),
  ]);

  if (!person || !carePlan) notFound();

  const [oldVersion, newVersion] = await Promise.all([
    v1 ? getCarePlanVersion(carePlanId, v1) : Promise.resolve(null),
    v2 ? getCarePlanVersion(carePlanId, v2) : Promise.resolve(null),
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link href={`/${orgSlug}/persons`} className="hover:text-[oklch(0.35_0.06_160)] transition-colors">
              Persons
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li>
            <Link href={`/${orgSlug}/persons/${personId}/care-plans`} className="hover:text-[oklch(0.35_0.06_160)] transition-colors">
              Care Plans
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}/care-plans/${carePlanId}/history`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {carePlan.title}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            Compare
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[oklch(0.22_0.04_160)] mb-1">
          Compare Versions
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Comparing{' '}
          <span className="font-medium font-mono text-[oklch(0.35_0.04_160)]">v{v1}</span>
          {' '}and{' '}
          <span className="font-medium font-mono text-[oklch(0.35_0.04_160)]">v{v2}</span>
          {' '}of <span className="font-medium text-[oklch(0.35_0.04_160)]">{carePlan.title}</span>
        </p>
      </div>

      <CarePlanVersionCompare
        oldVersion={oldVersion}
        newVersion={newVersion}
        currentPlan={carePlan}
        v1Number={v1 ?? 1}
        v2Number={v2 ?? carePlan.version}
      />
    </div>
  );
}
