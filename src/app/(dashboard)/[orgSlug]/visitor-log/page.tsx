import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { listVisitorLog } from '@/features/keyworker/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { VisitorLogList } from '@/features/keyworker/components/visitor-log-list';
import type { Role } from '@/lib/rbac/permissions';

export const metadata: Metadata = {
  title: 'Visitor Log — Complete Care',
};

interface VisitorLogPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function VisitorLogPage({ params }: VisitorLogPageProps) {
  const { orgSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/visitor-log`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'compliance');

  const { entries, totalCount } = await listVisitorLog({ page: 1, pageSize: 50 });

  // Count current visitors (no departure time)
  const currentVisitors = entries.filter((e) => !e.departureTime).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.94_0.015_160)]">
            <svg
              className="h-5 w-5 text-[oklch(0.45_0.07_160)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Visitor Log</h1>
            <p className="text-sm text-muted-foreground">
              Schedule 4 compliant record of all visitors to the home
            </p>
          </div>
        </div>
        {canCreate && (
          <Link
            href={`/${orgSlug}/visitor-log/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Record visitor
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[oklch(0.22_0.04_160)]">{totalCount}</p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Total visits</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className={`text-2xl font-bold ${currentVisitors > 0 ? 'text-green-600' : 'text-[oklch(0.22_0.04_160)]'}`}>
            {currentVisitors}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Currently in</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[oklch(0.22_0.04_160)]">
            {entries.filter((e) => !e.idChecked).length}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">ID not checked</p>
        </div>
      </div>

      {/* Visitor log */}
      <VisitorLogList entries={entries} />

      {/* Regulatory info */}
      <div className="mt-6 rounded-lg border border-[oklch(0.91_0.005_160)] bg-[oklch(0.985_0.003_160)] p-4">
        <p className="text-xs text-[oklch(0.55_0_0)]">
          <span className="font-medium text-[oklch(0.35_0.04_160)]">Schedule 4 requirement:</span>
          {' '}Under the Children&apos;s Homes (England) Regulations 2015 (Schedule 4), children&apos;s
          homes must maintain a record of all visitors to the home, including the date and time of
          each visit and the name of the visitor.
        </p>
      </div>
    </div>
  );
}
