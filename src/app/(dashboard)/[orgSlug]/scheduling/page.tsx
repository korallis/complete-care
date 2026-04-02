import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getVisitsForDateRange, getUnassignedVisits } from '@/features/care-packages/actions';
import { listStaff } from '@/features/staff/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { VisitSchedule } from '@/components/care-packages/visit-schedule';
import { UnassignedQueue } from '@/components/care-packages/unassigned-queue';

interface SchedulingPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ date?: string }>;
}

export const metadata: Metadata = {
  title: 'Scheduling -- Complete Care',
};

export default async function SchedulingPage({
  params,
  searchParams,
}: SchedulingPageProps) {
  const { orgSlug } = await params;
  const { date: dateParam } = await searchParams;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/scheduling`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage = hasPermission(role, 'manage', 'rota') || hasPermission(role, 'update', 'rota');

  // Date range: default to current week (Mon-Sun)
  const today = dateParam ? new Date(dateParam) : new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = monday.toISOString().slice(0, 10);
  const endDate = sunday.toISOString().slice(0, 10);

  // Fetch all visits for the week org-wide, and unassigned visits
  const [allVisits, unassigned, staffResult] = await Promise.all([
    getVisitsForDateRange({ startDate, endDate }),
    canManage ? getUnassignedVisits({ startDate, endDate }) : Promise.resolve([]),
    canManage ? listStaff({ status: 'active', pageSize: 100 }) : Promise.resolve({ staff: [] }),
  ]);

  const staffOptions = staffResult.staff.map((s) => ({
    id: s.id,
    name: s.fullName,
  }));

  // Build visit type name map (from the visits themselves for now)
  const visitTypeNames: Record<string, string> = {};

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
            Scheduling
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
            Week of {formatWeekLabel(startDate, endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/${orgSlug}/rostering?date=${startDate}`}
            className="rounded-lg border border-[oklch(0.18_0.03_160)] bg-[oklch(0.18_0.03_160)] px-3 py-1.5 text-sm text-white hover:bg-[oklch(0.24_0.03_160)] transition-colors"
          >
            Timesheets & payroll
          </a>
          <a
            href={`/${orgSlug}/scheduling?date=${getPrevWeek(startDate)}`}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Previous
          </a>
          <a
            href={`/${orgSlug}/scheduling`}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            This week
          </a>
          <a
            href={`/${orgSlug}/scheduling?date=${getNextWeek(startDate)}`}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Next
          </a>
        </div>
      </div>

      {/* Unassigned queue */}
      {canManage && unassigned.length > 0 && (
        <UnassignedQueue visits={unassigned} staffOptions={staffOptions} />
      )}

      {/* Schedule */}
      <div>
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
          All visits ({allVisits.length})
        </h2>
        <VisitSchedule visits={allVisits} visitTypeNames={visitTypeNames} />
      </div>
    </div>
  );
}

function formatWeekLabel(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${s.getDate()} ${months[s.getMonth()]} - ${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
}

function getPrevWeek(startDate: string): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

function getNextWeek(startDate: string): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}
