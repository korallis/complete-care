import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getStaffProfile } from '@/features/staff/actions';
import {
  listSupervisions,
  getOverdueSupervisions,
  getUpcomingSupervisions,
  getStaffOptions,
  scheduleSupervision,
  cancelSupervision,
} from '@/features/supervisions/actions';
import type { ScheduleSupervisionInput } from '@/features/supervisions/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { SupervisionList } from '@/components/supervisions/supervision-list';

interface SupervisionPageProps {
  params: Promise<{ orgSlug: string; staffId: string }>;
}

export async function generateMetadata({
  params,
}: SupervisionPageProps): Promise<Metadata> {
  const { staffId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Supervisions — Complete Care' };
  }
  const profile = await getStaffProfile(staffId).catch(() => null);
  return {
    title: profile
      ? `Supervisions — ${profile.fullName} — Complete Care`
      : 'Supervisions — Complete Care',
  };
}

export default async function SupervisionPage({
  params,
}: SupervisionPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/${staffId}/supervision`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'staff');

  const staff = await getStaffProfile(staffId);
  if (!staff) {
    notFound();
  }

  // Fetch supervision data
  const [supervisionResult, overdueResult, upcomingResult, staffOptions] =
    await Promise.all([
      listSupervisions({ staffProfileId: staffId }),
      getOverdueSupervisions(),
      getUpcomingSupervisions({ withinDays: 7, staffProfileId: staffId }),
      getStaffOptions(),
    ]);

  // Count overdue for this specific staff member
  const staffOverdue = overdueResult.filter(
    (s) => s.staffProfileId === staffId,
  );

  // Server action wrappers
  async function handleSchedule(
    data: ScheduleSupervisionInput,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await scheduleSupervision(data);
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  }

  async function handleCancel(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await cancelSupervision(id);
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
            Supervisions
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
          Supervisions
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Supervision and appraisal history for{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {staff.fullName}
          </span>
        </p>
      </div>

      {/* Supervision list */}
      <SupervisionList
        staffProfileId={staffId}
        staffName={staff.fullName}
        supervisions={supervisionResult.supervisions}
        staffOptions={staffOptions}
        overdueCount={staffOverdue.length}
        upcomingCount={upcomingResult.length}
        canEdit={canEdit}
        onSchedule={handleSchedule}
        onCancel={handleCancel}
        orgSlug={orgSlug}
      />
    </div>
  );
}
