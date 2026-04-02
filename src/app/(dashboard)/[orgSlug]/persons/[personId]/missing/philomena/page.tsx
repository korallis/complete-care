/**
 * Philomena Protocol Profile Page
 * Route: /[orgSlug]/persons/[personId]/missing/philomena
 *
 * Create or edit the Philomena Protocol profile for a child.
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  getPhilomenaProfile,
  createPhilomenaProfile,
  updatePhilomenaProfile,
} from '@/features/missing-from-care/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { PhilomenaFormClient } from './philomena-form-client';
import type { Role } from '@/lib/rbac/permissions';

interface PhilomenaPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: PhilomenaPageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Philomena Profile — ${person.fullName} — Complete Care`
      : 'Philomena Profile — Complete Care',
  };
}

export default async function PhilomenaPage({ params }: PhilomenaPageProps) {
  const { orgSlug, personId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/missing/philomena`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'persons');
  if (!canCreate) redirect(`/${orgSlug}/permission-denied`);

  const [person, existingProfile] = await Promise.all([
    getPerson(personId),
    getPhilomenaProfile(personId),
  ]);

  if (!person) notFound();

  const isEdit = !!existingProfile;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link
              href={`/${orgSlug}/persons`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Persons
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}/missing`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {person.fullName} — Missing
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            Philomena profile
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          {isEdit ? 'Update' : 'Create'} Philomena Protocol Profile
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          {isEdit
            ? `Updating the Philomena Profile for ${person.fullName}`
            : `Creating a Philomena Protocol profile for ${person.fullName}. This profile is shared with police when a child goes missing.`}
        </p>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <PhilomenaFormClient
          personId={personId}
          orgSlug={orgSlug}
          existingProfile={existingProfile}
          onSubmit={isEdit ? updatePhilomenaProfile : createPhilomenaProfile}
        />
      </div>
    </div>
  );
}
