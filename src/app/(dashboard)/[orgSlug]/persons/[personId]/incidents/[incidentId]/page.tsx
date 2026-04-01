import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  getIncident,
  updateInvestigation,
  closeIncident,
} from '@/features/incidents/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { IncidentDetail } from '@/components/incidents/incident-detail';
import type { Role } from '@/lib/rbac/permissions';

interface IncidentDetailPageProps {
  params: Promise<{
    orgSlug: string;
    personId: string;
    incidentId: string;
  }>;
}

export function generateMetadata(): Metadata {
  return { title: 'Incident Report — Complete Care' };
}

export default async function IncidentDetailPage({
  params,
}: IncidentDetailPageProps) {
  const { orgSlug, personId, incidentId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/incidents/${incidentId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canUpdate = hasPermission(role, 'update', 'incidents');

  const [person, incident] = await Promise.all([
    getPerson(personId),
    getIncident(incidentId),
  ]);

  if (!person || !incident) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
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

      <IncidentDetail
        incident={incident}
        orgSlug={orgSlug}
        personId={personId}
        personName={person.fullName}
        canUpdate={canUpdate}
        onUpdateInvestigation={updateInvestigation}
        onCloseIncident={closeIncident}
      />
    </div>
  );
}
