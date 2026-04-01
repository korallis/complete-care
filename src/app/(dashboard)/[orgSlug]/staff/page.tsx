import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { listStaff } from '@/features/staff/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { StaffList } from '@/components/staff/staff-list';
import type { StaffStatus } from '@/features/staff/schema';

export const metadata: Metadata = {
  title: 'Staff — Complete Care',
};

interface StaffPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    contractType?: string;
    page?: string;
  }>;
}

export default async function StaffPage({
  params,
  searchParams,
}: StaffPageProps) {
  const { orgSlug } = await params;
  const sp = await searchParams;

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
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'staff');

  // Parse search params
  const search = sp.search ?? '';
  const status = (sp.status ?? 'active') as StaffStatus | 'all';
  const contractType = sp.contractType;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));

  // Fetch staff with pagination
  const result = await listStaff({
    search,
    status,
    contractType,
    page,
    pageSize: 25,
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
            Staff
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            {result.totalCount === 0
              ? `No staff members in ${activeMembership.orgName} yet`
              : `${result.totalCount} staff ${result.totalCount === 1 ? 'member' : 'members'} in ${activeMembership.orgName}`}
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/${orgSlug}/staff/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.22_0.04_160)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[oklch(0.28_0.06_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)] focus:ring-offset-2 self-start sm:self-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            Add staff member
          </Link>
        )}
      </div>

      {/* Staff list with search/filter */}
      <Suspense
        fallback={
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[oklch(0.93_0.003_160)] animate-pulse"
              />
            ))}
          </div>
        }
      >
        <StaffList
          staff={result.staff}
          totalCount={result.totalCount}
          page={result.page}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
          orgSlug={orgSlug}
          canCreate={canCreate}
          searchQuery={search}
          statusFilter={typeof status === 'string' ? status : 'active'}
          contractTypeFilter={contractType ?? ''}
        />
      </Suspense>
    </div>
  );
}
