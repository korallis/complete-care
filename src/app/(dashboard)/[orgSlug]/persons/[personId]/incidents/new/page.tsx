import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { createIncident } from '@/features/incidents/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { IncidentForm } from '@/components/incidents/incident-form';
import type { Role } from '@/lib/rbac/permissions';

interface NewIncidentPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: NewIncidentPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Report Incident — Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Report Incident — ${person.fullName} — Complete Care`
      : 'Report Incident — Complete Care',
  };
}

export default async function NewIncidentPage({
  params,
}: NewIncidentPageProps) {
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
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/incidents/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'incidents');

  if (!canCreate) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  const person = await getPerson(personId);
  if (!person) notFound();

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
              Persons
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {person.fullName}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}/incidents`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Incidents
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Report
          </li>
        </ol>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Report Incident
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Record an incident or accident involving {person.fullName}
        </p>
      </div>

      <IncidentForm
        personId={personId}
        orgSlug={orgSlug}
        onCreate={createIncident}
      />
    </div>
  );
}
