import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import {
  listLeaveRequests,
  getTeamLeaveCalendar,
  getPendingLeaveCount,
  reviewLeave,
} from '@/features/leave/actions';
import type { ReviewLeaveInput } from '@/features/leave/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { LeaveCalendar } from '@/components/leave/leave-calendar';
import { LeaveApprovalCard } from '@/components/leave/leave-approval-card';
import {
  LeaveStatusBadge,
  LeaveTypeBadge,
} from '@/components/leave/leave-status-badge';

export const metadata: Metadata = {
  title: 'Team Leave -- Complete Care',
};

interface TeamLeavePageProps {
  params: Promise<{ orgSlug: string }>;
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '--';
  try {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

export default async function TeamLeavePage({ params }: TeamLeavePageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/leave`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage = hasPermission(role, 'update', 'staff');

  // Calculate date range for calendar (current month +/- 1 month)
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const [pendingCount, calendarResult, pendingResult, allResult] =
    await Promise.all([
      getPendingLeaveCount(),
      getTeamLeaveCalendar({
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      }),
      listLeaveRequests({ status: 'pending', pageSize: 50 }),
      listLeaveRequests({ pageSize: 10 }),
    ]);

  // Server action wrapper
  async function handleReview(
    id: string,
    input: ReviewLeaveInput,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await reviewLeave(id, input);
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
          Team Leave Overview
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Organisation-wide leave calendar and approvals
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Pending Approvals
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            On Leave Today
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {
              calendarResult.filter((e) => {
                const todayStr = now.toISOString().slice(0, 10);
                return (
                  e.status === 'approved' &&
                  e.startDate <= todayStr &&
                  e.endDate >= todayStr
                );
              }).length
            }
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            This Month
          </p>
          <p className="text-2xl font-bold text-[oklch(0.35_0.06_160)] mt-1">
            {
              calendarResult.filter((e) => {
                const monthStart = new Date(
                  now.getFullYear(),
                  now.getMonth(),
                  1,
                )
                  .toISOString()
                  .slice(0, 10);
                const monthEnd = new Date(
                  now.getFullYear(),
                  now.getMonth() + 1,
                  0,
                )
                  .toISOString()
                  .slice(0, 10);
                return (
                  e.status === 'approved' &&
                  e.startDate <= monthEnd &&
                  e.endDate >= monthStart
                );
              }).length
            }
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Total Requests
          </p>
          <p className="text-2xl font-bold text-[oklch(0.22_0.04_160)] mt-1">
            {allResult.totalCount}
          </p>
        </div>
      </div>

      {/* Two-column layout: Calendar + Pending approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Calendar */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <LeaveCalendar leaveEntries={calendarResult} orgSlug={orgSlug} />
        </div>

        {/* Pending approvals */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Pending Approvals
          </h3>
          {pendingResult.requests.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 text-emerald-500"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                All caught up
              </p>
              <p className="text-sm text-[oklch(0.55_0_0)]">
                No pending leave requests.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[32rem] overflow-y-auto">
              {pendingResult.requests.map((r) =>
                canManage ? (
                  <LeaveApprovalCard
                    key={r.id}
                    request={r}
                    onReview={handleReview}
                  />
                ) : (
                  <div
                    key={r.id}
                    className="rounded-lg border border-amber-200 bg-amber-50/50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                          {r.staffName}
                        </p>
                        <p className="text-xs text-[oklch(0.55_0_0)]">
                          {formatDate(r.startDate)} &ndash;{' '}
                          {formatDate(r.endDate)} ({r.totalDays} days)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <LeaveTypeBadge type={r.type} />
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent leave requests table */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Recent Leave Requests
        </h3>
        {allResult.requests.length === 0 ? (
          <p className="text-sm text-[oklch(0.55_0_0)] text-center py-4">
            No leave requests yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[oklch(0.92_0.005_160)]">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                    Staff
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                    Dates
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                    Days
                  </th>
                  <th className="text-left py-2 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                    Status
                  </th>
                  {canManage && (
                    <th className="text-right py-2 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {allResult.requests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[oklch(0.96_0.003_160)] hover:bg-[oklch(0.985_0.003_160)]"
                  >
                    <td className="py-2.5 pr-4 font-medium text-[oklch(0.22_0.04_160)]">
                      {r.staffName}
                    </td>
                    <td className="py-2.5 pr-4">
                      <LeaveTypeBadge type={r.type} />
                    </td>
                    <td className="py-2.5 pr-4 text-[oklch(0.45_0_0)]">
                      {formatDate(r.startDate)} &ndash; {formatDate(r.endDate)}
                    </td>
                    <td className="py-2.5 pr-4 text-[oklch(0.22_0.04_160)]">
                      {r.totalDays}
                    </td>
                    <td className="py-2.5">
                      <LeaveStatusBadge status={r.status} />
                    </td>
                    {canManage && (
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/${orgSlug}/staff/${r.staffProfileId}/leave`}
                          className="text-xs font-medium text-[oklch(0.35_0.06_160)] hover:text-[oklch(0.25_0.06_160)]"
                        >
                          View
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
