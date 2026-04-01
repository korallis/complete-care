import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { getCarePlan, getCarePlanVersions } from '@/features/care-plans/actions';
import { CarePlanVersionHistory } from '@/components/care-plans/care-plan-version-history';
import type { Role } from '@/lib/rbac/permissions';
import { hasPermission } from '@/lib/rbac/permissions';

interface VersionHistoryPageProps {
  params: Promise<{ orgSlug: string; personId: string; carePlanId: string }>;
}

export async function generateMetadata({
  params,
}: VersionHistoryPageProps): Promise<Metadata> {
  const { carePlanId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Version History — Complete Care' };
  }
  const plan = await getCarePlan(carePlanId).catch(() => null);
  return {
    title: plan ? `Version History — ${plan.title} — Complete Care` : 'Version History — Complete Care',
  };
}

export default async function VersionHistoryPage({ params }: VersionHistoryPageProps) {
  const { orgSlug, personId, carePlanId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/care-plans/${carePlanId}/history`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  if (!hasPermission(role, 'read', 'care_plans')) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  const [person, carePlan, versions] = await Promise.all([
    getPerson(personId),
    getCarePlan(carePlanId),
    getCarePlanVersions(carePlanId),
  ]);

  if (!person || !carePlan) notFound();

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
              href={`/${orgSlug}/persons/${personId}/care-plans/${carePlanId}`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {carePlan.title}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            Version History
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[oklch(0.22_0.04_160)] mb-1">
          Version History
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          {versions.length} saved version{versions.length !== 1 ? 's' : ''} of{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">{carePlan.title}</span>
        </p>
      </div>

      <CarePlanVersionHistory
        versions={versions}
        currentVersion={carePlan.version}
        orgSlug={orgSlug}
        personId={personId}
        carePlanId={carePlanId}
      />
    </div>
  );
}
