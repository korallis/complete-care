import type { Metadata } from 'next';
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
import { PersonDetail } from '@/components/persons/person-detail';

interface PersonDetailPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: PersonDetailPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Person — Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person ? `${person.fullName} — Complete Care` : 'Person — Complete Care',
  };
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
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

      <PersonDetail
        person={person}
        orgSlug={orgSlug}
        terminology={terminology}
        canEdit={canEdit}
        onArchive={canEdit ? handleArchive : undefined}
        onRestore={canEdit ? handleRestore : undefined}
      />
    </div>
  );
}
