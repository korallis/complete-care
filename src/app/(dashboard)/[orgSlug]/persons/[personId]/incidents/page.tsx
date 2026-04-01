import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { listIncidents, getIncidentTrends } from '@/features/incidents/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { IncidentList } from '@/components/incidents/incident-list';
import { IncidentTrends } from '@/components/incidents/incident-trends';
import type { Role } from '@/lib/rbac/permissions';

interface IncidentsPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: IncidentsPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Incidents — Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Incidents — ${person.fullName} — Complete Care`
      : 'Incidents — Complete Care',
  };
}

export default async function IncidentsPage({ params }: IncidentsPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/incidents`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'incidents');

  const person = await getPerson(personId);
  if (!person) notFound();

  const [incidentData, trends] = await Promise.all([
    listIncidents({ personId, page: 1, pageSize: 20 }),
    getIncidentTrends({ personId, days: 30 }),
  ]);

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
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Incidents
          </li>
        </ol>
      </nav>

      {/* Trends dashboard (only show if there are incidents) */}
      {trends.totalIncidents > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
            Incident trends
          </h2>
          <IncidentTrends trends={trends} periodLabel="Last 30 days" />
        </div>
      )}

      {/* Incident list */}
      <IncidentList
        incidents={incidentData.incidents}
        orgSlug={orgSlug}
        personId={personId}
        canCreate={canCreate}
        totalCount={incidentData.totalCount}
      />
    </div>
  );
}
