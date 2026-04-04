import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getStaffProfile } from '@/features/staff/actions';
import {
  listDbsChecks,
  createDbsCheck,
  updateDbsCheck,
  deleteDbsCheck,
  checkAndCreateDbsExpiryAlerts,
} from '@/features/dbs-tracking/actions';
import type { CreateDbsCheckInput, UpdateDbsCheckInput } from '@/features/dbs-tracking/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { DbsCheckList } from '@/components/dbs-tracking/dbs-check-list';
import { StaffDetailNav } from '@/components/staff/staff-detail-nav';

interface DbsPageProps {
  params: Promise<{ orgSlug: string; staffId: string }>;
}

export async function generateMetadata({
  params,
}: DbsPageProps): Promise<Metadata> {
  const { staffId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'DBS Checks — Complete Care' };
  }
  const profile = await getStaffProfile(staffId).catch(() => null);
  return {
    title: profile
      ? `DBS Checks — ${profile.fullName} — Complete Care`
      : 'DBS Checks — Complete Care',
  };
}

export default async function DbsPage({ params }: DbsPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/${staffId}/dbs`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'compliance');

  const staff = await getStaffProfile(staffId);
  if (!staff) {
    notFound();
  }

  // Fetch DBS checks for this staff member
  const dbsResult = await listDbsChecks({ staffProfileId: staffId });

  // Lazy-generate expiry alerts (MVP — production would use cron)
  checkAndCreateDbsExpiryAlerts(session.user.id, staffId).catch(() => {});

  // Server action wrappers
  async function handleCreate(
    data: CreateDbsCheckInput,
  ): Promise<{ success: boolean; error?: string; field?: string }> {
    'use server';
    const result = await createDbsCheck(data);
    if (result.success) return { success: true };
    return { success: false, error: result.error, field: ('field' in result ? result.field : undefined) };
  }

  async function handleUpdate(
    id: string,
    data: UpdateDbsCheckInput,
  ): Promise<{ success: boolean; error?: string; field?: string }> {
    'use server';
    const result = await updateDbsCheck(id, data);
    if (result.success) return { success: true };
    return { success: false, error: result.error, field: ('field' in result ? result.field : undefined) };
  }

  async function handleDelete(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await deleteDbsCheck(id);
    if (result.success) return { success: true };
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
          <li>
            <Link
              href={`/${orgSlug}/staff/${staffId}`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              {staff.fullName}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            DBS Checks
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
          DBS Checks
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Disclosure and Barring Service certificate history for{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {staff.fullName}
          </span>
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
        <StaffDetailNav
          orgSlug={orgSlug}
          staffId={staffId}
          activeSection="dbs"
        />
      </div>

      {/* DBS check list */}
      <DbsCheckList
        staffProfileId={staffId}
        staffName={staff.fullName}
        checks={dbsResult.checks}
        canEdit={canEdit}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
