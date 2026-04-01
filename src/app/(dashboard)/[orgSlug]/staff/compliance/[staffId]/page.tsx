import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { getComplianceDetail } from '@/features/compliance/actions';
import { ComplianceDetail } from '@/components/compliance/compliance-detail';

export const metadata: Metadata = {
  title: 'Staff Compliance Detail - Complete Care',
};

interface StaffComplianceDetailPageProps {
  params: Promise<{ orgSlug: string; staffId: string }>;
}

export default async function StaffComplianceDetailPage({
  params,
}: StaffComplianceDetailPageProps) {
  const { orgSlug, staffId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/compliance/${staffId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'compliance');

  if (!canRead) {
    notFound();
  }

  const detail = await getComplianceDetail(staffId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ComplianceDetail data={detail} orgSlug={orgSlug} />
    </div>
  );
}
