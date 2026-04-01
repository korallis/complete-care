import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { listCarePackages, getCarePackage, getVisitsForDateRange } from '@/features/care-packages/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { CarePackageDetail } from '@/components/care-packages/care-package-detail';
import { VisitSchedule } from '@/components/care-packages/visit-schedule';

interface CarePackagePageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: CarePackagePageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Care Package -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Care Package -- ${person.fullName} -- Complete Care`
      : 'Care Package -- Complete Care',
  };
}

export default async function CarePackagePage({ params }: CarePackagePageProps) {
  const { orgSlug, personId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/care-package`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'care_plans');
  const canCreate = hasPermission(role, 'create', 'care_plans');

  const person = await getPerson(personId);
  if (!person) notFound();

  const result = await listCarePackages(personId);

  // Get the active care package (most recent active one)
  const activePkg = result.packages.find((p) => p.status === 'active');

  // If there is an active package, load full details + upcoming visits
  let pkgDetail = null;
  let visits: Awaited<ReturnType<typeof getVisitsForDateRange>> = [];
  let visitTypeNames: Record<string, string> = {};

  if (activePkg) {
    pkgDetail = await getCarePackage(activePkg.id);

    if (pkgDetail) {
      visitTypeNames = Object.fromEntries(
        pkgDetail.visitTypesList.map((vt) => [vt.id, vt.name]),
      );

      // Get visits for the next 7 days
      const today = new Date().toISOString().slice(0, 10);
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      const endDate = weekLater.toISOString().slice(0, 10);

      visits = await getVisitsForDateRange({
        startDate: today,
        endDate,
        carePackageId: activePkg.id,
      });
    }
  }

  // Determine if current user can view keySafeCode (assigned carers only)
  // For now: managers and above can always see it; carers see it if assigned
  const canViewKeySafe =
    role === 'owner' || role === 'admin' || role === 'manager' || role === 'senior_carer';

  return (
    <div className="space-y-6">
      {pkgDetail ? (
        <>
          <CarePackageDetail
            carePackage={pkgDetail}
            visitTypes={pkgDetail.visitTypesList}
            orgSlug={orgSlug}
            personId={personId}
            canEdit={canEdit}
            canViewKeySafe={canViewKeySafe}
          />

          {/* Upcoming schedule */}
          <div>
            <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
              Upcoming visits (7 days)
            </h3>
            <VisitSchedule visits={visits} visitTypeNames={visitTypeNames} />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
          <div className="mx-auto mb-4">
            <svg className="mx-auto h-12 w-12 text-[oklch(0.7_0.02_160)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] mb-1">
            No active care package
          </h3>
          <p className="text-sm text-[oklch(0.55_0_0)] mb-4">
            Set up a domiciliary care package with visit types and scheduling.
          </p>
          {canCreate && (
            <Link
              href={`/${orgSlug}/persons/${personId}/care-package/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors"
            >
              Create care package
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
