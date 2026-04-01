import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { listAgencies } from '@/features/compliance/actions';
import { AgencyRegister } from '@/components/compliance/agency-register';

export const metadata: Metadata = {
  title: 'Agency Register - Complete Care',
};

interface AgenciesPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function AgenciesPage({ params }: AgenciesPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/agencies`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'compliance');
  const canManage = hasPermission(role, 'manage', 'compliance');

  if (!canRead) {
    notFound();
  }

  const agencies = await listAgencies();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
            Agency Register
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            Approved staffing agencies and their workers
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href={`/${orgSlug}/staff/compliance`}
            className="text-sm text-[oklch(0.35_0.06_160)] hover:underline"
          >
            Back to compliance
          </Link>
        </div>
      </div>

      {/* Agency list */}
      <AgencyRegister agencies={agencies} canManage={canManage} />
    </div>
  );
}
