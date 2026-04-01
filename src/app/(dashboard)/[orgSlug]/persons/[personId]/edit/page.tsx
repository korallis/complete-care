import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { organisations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getPerson, updatePerson } from '@/features/persons/actions';
import { getPersonTerminology } from '@/features/persons/utils';
import type { CreatePersonInput } from '@/features/persons/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { PersonForm } from '@/components/persons/person-form';
import type { EmergencyContact } from '@/lib/db/schema/persons';

interface EditPersonPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: EditPersonPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) return { title: 'Edit Person — Complete Care' };
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Edit ${person.fullName} — Complete Care`
      : 'Edit Person — Complete Care',
  };
}

export default async function EditPersonPage({ params }: EditPersonPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/edit`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;

  if (!hasPermission(role, 'update', 'persons')) {
    redirect(`/${orgSlug}/persons/${personId}`);
  }

  const person = await getPerson(personId);
  if (!person) {
    notFound();
  }

  const [org] = await db
    .select({ domains: organisations.domains })
    .from(organisations)
    .where(eq(organisations.id, session.user.activeOrgId))
    .limit(1);

  const domains = org?.domains ?? [];
  const terminology = getPersonTerminology(domains);

  async function handleUpdatePerson(data: CreatePersonInput) {
    'use server';
    const result = await updatePerson(personId, data);
    if (result.success) {
      return { success: true, personId };
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
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs block"
            >
              {person.fullName}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            Edit
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
          Edit {person.fullName}
        </h1>
        <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
          Update {terminology.singularLower} details for {activeMembership.orgName}.
        </p>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <PersonForm
          orgSlug={orgSlug}
          terminology={terminology}
          defaultType={person.type as 'resident' | 'client' | 'young_person'}
          defaultValues={{
            firstName: person.firstName ?? undefined,
            lastName: person.lastName ?? undefined,
            preferredName: person.preferredName,
            type: person.type as 'resident' | 'client' | 'young_person',
            dateOfBirth: person.dateOfBirth,
            gender: person.gender,
            ethnicity: person.ethnicity,
            religion: person.religion,
            firstLanguage: person.firstLanguage,
            nhsNumber: person.nhsNumber,
            gpName: person.gpName,
            gpPractice: person.gpPractice,
            allergies: person.allergies,
            medicalConditions: person.medicalConditions,
            contactPhone: person.contactPhone,
            contactEmail: person.contactEmail,
            address: person.address,
            emergencyContacts: (person.emergencyContacts ?? []) as EmergencyContact[],
            photoUrl: person.photoUrl,
          }}
          onSubmit={handleUpdatePerson}
          mode="edit"
        />
      </div>
    </div>
  );
}
