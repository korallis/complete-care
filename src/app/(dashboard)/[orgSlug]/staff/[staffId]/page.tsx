import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getStaffProfile, updateStaffStatus } from '@/features/staff/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { StaffDetail } from '@/components/staff/staff-detail';

interface StaffDetailPageProps {
  params: Promise<{ orgSlug: string; staffId: string }>;
}

export async function generateMetadata({
  params,
}: StaffDetailPageProps): Promise<Metadata> {
  const { staffId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Staff — Complete Care' };
  }
  const profile = await getStaffProfile(staffId).catch(() => null);
  return {
    title: profile
      ? `${profile.fullName} — Staff — Complete Care`
      : 'Staff — Complete Care',
  };
}

export default async function StaffDetailPage({
  params,
}: StaffDetailPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/${staffId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'staff');

  const staff = await getStaffProfile(staffId);
  if (!staff) {
    notFound();
  }

  async function handleUpdateStatus(
    status: string,
    reason?: string,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await updateStaffStatus(staffId, { status: status as 'active' | 'suspended' | 'on_leave' | 'terminated', reason });
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error };
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link
              href={`/${orgSlug}/staff`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Staff
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium truncate max-w-[200px]"
            aria-current="page"
          >
            {staff.fullName}
          </li>
        </ol>
      </nav>

      <StaffDetail
        staff={staff}
        orgSlug={orgSlug}
        canEdit={canEdit}
        canUpdateStatus={canEdit}
        onUpdateStatus={canEdit ? handleUpdateStatus : undefined}
      />
    </div>
  );
}
