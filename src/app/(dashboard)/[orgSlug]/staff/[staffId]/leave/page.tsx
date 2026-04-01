import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getStaffProfile } from '@/features/staff/actions';
import {
  listLeaveRequests,
  getLeaveBalance,
  requestLeave,
  cancelLeave,
} from '@/features/leave/actions';
import type { RequestLeaveInput } from '@/features/leave/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { LeaveRequestForm } from '@/components/leave/leave-request-form';
import { LeaveRequestList } from '@/components/leave/leave-request-list';
import { LeaveBalanceCard } from '@/components/leave/leave-balance-card';

interface StaffLeavePageProps {
  params: Promise<{ orgSlug: string; staffId: string }>;
}

export async function generateMetadata({
  params,
}: StaffLeavePageProps): Promise<Metadata> {
  const { staffId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Leave -- Complete Care' };
  }
  const profile = await getStaffProfile(staffId).catch(() => null);
  return {
    title: profile
      ? `Leave -- ${profile.fullName} -- Complete Care`
      : 'Leave -- Complete Care',
  };
}

export default async function StaffLeavePage({ params }: StaffLeavePageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/${staffId}/leave`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'staff');

  const staff = await getStaffProfile(staffId);
  if (!staff) {
    notFound();
  }

  // Fetch leave data
  const [leaveResult, balance] = await Promise.all([
    listLeaveRequests({ staffProfileId: staffId }),
    getLeaveBalance(staffId),
  ]);

  // Server action wrappers
  async function handleRequestLeave(
    data: RequestLeaveInput,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await requestLeave(data);
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  }

  async function handleCancelLeave(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await cancelLeave(id);
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
            Leave
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
          Leave Management
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Leave requests and balance for{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {staff.fullName}
          </span>
        </p>
      </div>

      {/* Two-column layout: Balance + Request form | Leave list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Balance card + Request form */}
        <div className="space-y-6">
          <LeaveBalanceCard balance={balance} />
          <LeaveRequestForm
            staffProfileId={staffId}
            onSubmit={handleRequestLeave}
          />
        </div>

        {/* Right column: Leave history */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
            <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
              Leave History
            </h3>
            <LeaveRequestList
              requests={leaveResult.requests}
              canCancel={canEdit}
              onCancel={handleCancelLeave}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
