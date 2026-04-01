import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { organisations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { listPersons } from '@/features/persons/actions';
import { getPersonTerminology } from '@/features/persons/utils';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { PersonsList } from '@/components/persons/persons-list';

export const metadata: Metadata = {
  title: 'People — Complete Care',
};

interface PersonsPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function PersonsPage({
  params,
  searchParams,
}: PersonsPageProps) {
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
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'persons');

  // Fetch org to get domains for terminology
  const [org] = await db
    .select({ domains: organisations.domains })
    .from(organisations)
    .where(eq(organisations.id, session.user.activeOrgId))
    .limit(1);

  const domains = org?.domains ?? [];
  const terminology = getPersonTerminology(domains);

  // Parse search params
  const search = sp.search ?? '';
  const status = (sp.status ?? 'active') as 'active' | 'archived' | 'all';
  const type = sp.type as 'resident' | 'client' | 'young_person' | undefined;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));

  // Fetch persons with pagination
  const result = await listPersons({
    search,
    status,
    type: type && ['resident', 'client', 'young_person'].includes(type) ? type : undefined,
    page,
    pageSize: 25,
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
            {terminology.plural}
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            {result.totalCount === 0
              ? `No ${terminology.pluralLower} in ${activeMembership.orgName} yet`
              : `${result.totalCount} ${result.totalCount === 1 ? terminology.singularLower : terminology.pluralLower} in ${activeMembership.orgName}`}
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/new`}
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
            Add {terminology.singular}
          </Link>
        )}
      </div>

      {/* Persons list with search/filter */}
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
        <PersonsList
          persons={result.persons}
          totalCount={result.totalCount}
          page={result.page}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
          orgSlug={orgSlug}
          terminology={terminology}
          canCreate={canCreate}
          searchQuery={search}
          statusFilter={status}
          typeFilter={type ?? ''}
        />
      </Suspense>
    </div>
  );
}
