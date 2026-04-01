import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { organisations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getPerson, archivePerson, restorePerson } from '@/features/persons/actions';
import { getPersonTerminology } from '@/features/persons/utils';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { PersonAvatar } from '@/components/persons/person-avatar';
import { PersonTypeBadge, PersonStatusBadge } from '@/components/persons/person-type-badge';
import { calculateAge, formatNhsNumber } from '@/features/persons/utils';
import { DashboardTabs } from '@/components/person-dashboard/dashboard-tabs';

interface PersonLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; personId: string }>;
}

export default async function PersonDetailLayout({
  children,
  params,
}: PersonLayoutProps) {
  const { orgSlug, personId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'persons');

  const person = await getPerson(personId);
  if (!person) {
    notFound();
  }

  // Get org domains for terminology
  const [org] = await db
    .select({ domains: organisations.domains })
    .from(organisations)
    .where(eq(organisations.id, session.user.activeOrgId))
    .limit(1);

  const domains = org?.domains ?? [];
  const terminology = getPersonTerminology(domains);

  const hasAllergies = person.allergies.length > 0;

  async function handleArchive() {
    'use server';
    await archivePerson(personId);
  }

  async function handleRestore() {
    'use server';
    await restorePerson(personId);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link
              href={`/${orgSlug}/persons`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              {terminology.plural}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium truncate max-w-xs"
            aria-current="page"
          >
            {person.fullName}
          </li>
        </ol>
      </nav>

      {/* Person header card with tabs */}
      <div className="rounded-2xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden mb-6">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <PersonAvatar
              fullName={person.fullName}
              photoUrl={person.photoUrl}
              size="xl"
              hasAllergies={hasAllergies}
            />

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)] truncate">
                    {person.fullName}
                    {person.preferredName && person.preferredName !== person.fullName && (
                      <span className="ml-2 text-lg font-normal text-[oklch(0.55_0_0)]">
                        ({person.preferredName})
                      </span>
                    )}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <PersonTypeBadge type={person.type} />
                    <PersonStatusBadge status={person.status} />
                    {person.dateOfBirth && (
                      <span className="text-sm text-[oklch(0.6_0_0)]">
                        Age {calculateAge(person.dateOfBirth) ?? '--'}
                      </span>
                    )}
                    {person.nhsNumber && (
                      <span className="text-sm font-mono text-[oklch(0.6_0_0)]">
                        NHS: {formatNhsNumber(person.nhsNumber)}
                      </span>
                    )}
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/${orgSlug}/persons/${person.id}/edit`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </Link>

                    {person.status === 'active' && (
                      <form action={handleArchive}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-2 text-sm font-medium text-[oklch(0.55_0_0)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                        >
                          Archive
                        </button>
                      </form>
                    )}
                    {person.status === 'archived' && (
                      <form action={handleRestore}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-2 text-sm font-medium text-[oklch(0.35_0.06_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus:outline-none focus:ring-2 focus:ring-[oklch(0.35_0.06_160)]"
                        >
                          Restore
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <DashboardTabs orgSlug={orgSlug} personId={person.id} />
      </div>

      {/* Tab content rendered by child route */}
      <div id="tabpanel-content" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
