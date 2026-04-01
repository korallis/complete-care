import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listVitalSigns,
  getLatestVitals,
  getVitalTrends,
  recordVitalSigns,
} from '@/features/vital-signs/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { VitalSignsForm } from '@/components/vital-signs/vital-signs-form';
import { VitalSignsChart } from '@/components/vital-signs/vital-signs-chart';
import { VitalSignsCard } from '@/components/vital-signs/vital-signs-card';
import { News2EscalationAlert } from '@/components/vital-signs/news2-escalation-alert';

interface VitalsPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ page?: string; days?: string }>;
}

export async function generateMetadata({
  params,
}: VitalsPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Vital Signs -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Vital Signs -- ${person.fullName} -- Complete Care`
      : 'Vital Signs -- Complete Care',
  };
}

export default async function VitalsPage({
  params,
  searchParams,
}: VitalsPageProps) {
  const { orgSlug, personId } = await params;
  const { page: pageParam, days: daysParam } = await searchParams;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/clinical/vitals`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRecord = hasPermission(role, 'create', 'clinical');

  const person = await getPerson(personId);
  if (!person) notFound();

  const page = pageParam ? parseInt(pageParam, 10) : 1;
  const days = daysParam ? parseInt(daysParam, 10) : 7;

  const [vitals, latestVitals, trendData] = await Promise.all([
    listVitalSigns({ personId, page, pageSize: 10 }),
    getLatestVitals({ personId }),
    getVitalTrends({ personId, days }),
  ]);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            Vital Signs
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            Observations and NEWS2 monitoring for {person.fullName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/fluids`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Fluids
          </Link>
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/nutrition`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Nutrition
          </Link>
        </div>
      </div>

      {/* NEWS2 escalation alert for latest reading */}
      {latestVitals?.news2Score != null &&
        latestVitals.news2Escalation &&
        latestVitals.news2Escalation !== 'routine' && (
          <div className="mb-4">
            <News2EscalationAlert
              score={latestVitals.news2Score}
              escalation={latestVitals.news2Escalation}
              scaleUsed={latestVitals.news2ScaleUsed}
            />
          </div>
        )}

      {/* Trend chart */}
      <div className="mb-6">
        <VitalSignsChart data={trendData} />
      </div>

      {/* Main content: history + form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Recent Observations
          </h3>
          {vitals.entries.length === 0 ? (
            <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-6 text-center">
              <p className="text-sm text-[oklch(0.55_0_0)]">
                No vital signs recorded yet.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {vitals.entries.map((entry) => (
                  <VitalSignsCard key={entry.id} entry={entry} />
                ))}
              </div>

              {/* Pagination */}
              {vitals.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  {page > 1 && (
                    <Link
                      href={`/${orgSlug}/persons/${personId}/clinical/vitals?page=${page - 1}`}
                      className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="text-xs text-[oklch(0.55_0_0)]">
                    Page {vitals.page} of {vitals.totalPages}
                  </span>
                  {page < vitals.totalPages && (
                    <Link
                      href={`/${orgSlug}/persons/${personId}/clinical/vitals?page=${page + 1}`}
                      className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Form */}
        {canRecord && (
          <div>
            <VitalSignsForm
              personId={personId}
              onSubmit={recordVitalSigns}
            />
          </div>
        )}
      </div>
    </div>
  );
}
