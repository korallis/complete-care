import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { organisations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createPerson } from '@/features/persons/actions';
import { getPersonTerminology, getDefaultPersonType } from '@/features/persons/utils';
import type { CreatePersonInput } from '@/features/persons/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { PersonForm } from '@/components/persons/person-form';

export const metadata: Metadata = {
  title: 'Add Person — Complete Care',
};

interface NewPersonPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewPersonPage({ params }: NewPersonPageProps) {
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
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/new`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;

  // Check create permission
  if (!hasPermission(role, 'create', 'persons')) {
    redirect(`/${orgSlug}/persons`);
  }

  // Get org domains for terminology
  const [org] = await db
    .select({ domains: organisations.domains })
    .from(organisations)
    .where(eq(organisations.id, session.user.activeOrgId))
    .limit(1);

  const domains = org?.domains ?? [];
  const terminology = getPersonTerminology(domains);
  const defaultType = getDefaultPersonType(domains);

  async function handleCreatePerson(data: CreatePersonInput) {
    'use server';
    const result = await createPerson(data);
    if (result.success) {
      return { success: true, personId: result.data.id };
    }
    return { success: false, error: result.error };
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            Add {terminology.singular}
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
          Add {terminology.singular}
        </h1>
        <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
          Create a new {terminology.singularLower} record for {activeMembership.orgName}.
        </p>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <PersonForm
          orgSlug={orgSlug}
          terminology={terminology}
          defaultType={defaultType}
          onSubmit={handleCreatePerson}
          mode="create"
        />
      </div>
    </div>
  );
}
