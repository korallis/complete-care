import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import {
  listSupervisions,
  getOverdueSupervisions,
  getUpcomingSupervisions,
  getSupervisionsForCalendar,
  getStaffOptions,
} from '@/features/supervisions/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { OverdueAlertBanner } from '@/components/supervisions/overdue-alert-banner';
import { SupervisionCalendar } from '@/components/supervisions/supervision-calendar';
import {
  SupervisionStatusBadge,
  SupervisionTypeBadge,
} from '@/components/supervisions/supervision-status-badge';

export const metadata: Metadata = {
  title: 'Supervisions Overview — Complete Care',
};

interface SupervisionsOverviewPageProps {
  params: Promise<{ orgSlug: string }>;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '--';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '--';
  }
}

export default async function SupervisionsOverviewPage({
  params,
}: SupervisionsOverviewPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/supervisions`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage = hasPermission(role, 'update', 'staff');

  // Calculate date range for calendar (current month +/- 1 month)
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const [overdueResult, upcomingResult, calendarResult, staffOptions, allResult] =
    await Promise.all([
      getOverdueSupervisions(),
      getUpcomingSupervisions({ withinDays: 7 }),
      getSupervisionsForCalendar({
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      }),
      getStaffOptions(),
      listSupervisions({ pageSize: 10 }),
    ]);

  // Build a map of staff IDs to names
  const staffMap = new Map(staffOptions.map((s) => [s.id, s.fullName]));

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
            Supervisions
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
          Supervision Overview
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Organisation-wide supervision and appraisal schedule
        </p>
      </div>

      {/* Alert banner */}
      <div className="mb-6">
        <OverdueAlertBanner
          overdueCount={overdueResult.length}
          upcomingCount={upcomingResult.length}
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Overdue
          </p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {overdueResult.length}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Upcoming (7 days)
          </p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {upcomingResult.length}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            This month
          </p>
          <p className="text-2xl font-bold text-[oklch(0.35_0.06_160)] mt-1">
            {calendarResult.filter((s) => {
              const d = new Date(s.scheduledDate);
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
            Total recorded
          </p>
          <p className="text-2xl font-bold text-[oklch(0.22_0.04_160)] mt-1">
            {allResult.totalCount}
          </p>
        </div>
      </div>

      {/* Two-column layout: Calendar + Overdue list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Calendar */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <SupervisionCalendar
            supervisions={calendarResult}
            orgSlug={orgSlug}
          />
        </div>

        {/* Overdue list */}
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Overdue supervisions
          </h3>
          {overdueResult.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-emerald-500" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">All up to date</p>
              <p className="text-sm text-[oklch(0.55_0_0)]">No overdue supervisions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueResult.map((s) => (
                <Link
                  key={s.id}
                  href={`/${orgSlug}/staff/${s.staffProfileId}/supervision`}
                  className="block rounded-lg border border-red-200 bg-red-50/50 p-3 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                        {staffMap.get(s.staffProfileId) ?? 'Unknown staff'}
                      </p>
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        Due: {formatDate(s.scheduledDate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <SupervisionTypeBadge type={s.type} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent supervisions table */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Recent supervisions
        </h3>
        {allResult.supervisions.length === 0 ? (
          <p className="text-sm text-[oklch(0.55_0_0)] text-center py-4">
            No supervision records yet.
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
                    Supervisor
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                    Date
                  </th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                    Type
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
                {allResult.supervisions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-[oklch(0.96_0.003_160)] hover:bg-[oklch(0.985_0.003_160)]"
                  >
                    <td className="py-2.5 pr-4 font-medium text-[oklch(0.22_0.04_160)]">
                      {staffMap.get(s.staffProfileId) ?? 'Unknown'}
                    </td>
                    <td className="py-2.5 pr-4 text-[oklch(0.45_0_0)]">
                      {staffMap.get(s.supervisorId) ?? 'Unknown'}
                    </td>
                    <td className="py-2.5 pr-4 text-[oklch(0.45_0_0)]">
                      {formatDate(s.scheduledDate)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <SupervisionTypeBadge type={s.type} />
                    </td>
                    <td className="py-2.5">
                      <SupervisionStatusBadge status={s.status} />
                    </td>
                    {canManage && (
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/${orgSlug}/staff/${s.staffProfileId}/supervision`}
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
