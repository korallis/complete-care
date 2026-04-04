import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listAlerts,
  getActiveAlerts,
  getPersonThresholds,
} from '@/features/clinical-alerts/actions';
import { ClinicalAlertBanner } from '@/components/clinical-alerts/clinical-alert-banner';
import { AlertList } from '@/components/clinical-alerts/alert-list';
import { AlertThresholdSettings } from '@/components/clinical-alerts/alert-threshold-settings';

interface AlertsPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{
    page?: string;
    status?: string;
    type?: string;
    severity?: string;
  }>;
}

export async function generateMetadata({
  params,
}: AlertsPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Clinical Alerts -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Clinical Alerts -- ${person.fullName} -- Complete Care`
      : 'Clinical Alerts -- Complete Care',
  };
}

export default async function AlertsPage({
  params,
  searchParams,
}: AlertsPageProps) {
  const { orgSlug, personId } = await params;
  const {
    page: pageParam,
    status: statusParam,
    type: typeParam,
    severity: severityParam,
  } = await searchParams;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/clinical/alerts`,
    );
  }

  const person = await getPerson(personId);
  if (!person) notFound();

  const page = pageParam ? parseInt(pageParam, 10) : 1;

  const [activeAlerts, alertHistory, thresholds] = await Promise.all([
    getActiveAlerts({ personId }),
    listAlerts({
      personId,
      status: statusParam,
      alertType: typeParam,
      severity: severityParam,
      page,
      pageSize: 20,
    }),
    getPersonThresholds({ personId }),
  ]);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            Clinical Alerts
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            Alert monitoring and escalation for {person.fullName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/vitals`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Vitals
          </Link>
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/fluids`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Fluids
          </Link>
        </div>
      </div>

      {/* Active alerts banner */}
      {activeAlerts.length > 0 && (
        <div className="mb-6">
          <ClinicalAlertBanner alerts={activeAlerts} />
        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert history */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Alert History
          </h3>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <FilterLink
              href={`/${orgSlug}/persons/${personId}/clinical/alerts`}
              active={!statusParam && !typeParam && !severityParam}
            >
              All
            </FilterLink>
            <FilterLink
              href={`/${orgSlug}/persons/${personId}/clinical/alerts?status=active`}
              active={statusParam === 'active'}
            >
              Active
            </FilterLink>
            <FilterLink
              href={`/${orgSlug}/persons/${personId}/clinical/alerts?status=acknowledged`}
              active={statusParam === 'acknowledged'}
            >
              Acknowledged
            </FilterLink>
            <FilterLink
              href={`/${orgSlug}/persons/${personId}/clinical/alerts?status=escalated`}
              active={statusParam === 'escalated'}
            >
              Escalated
            </FilterLink>
            <FilterLink
              href={`/${orgSlug}/persons/${personId}/clinical/alerts?status=resolved`}
              active={statusParam === 'resolved'}
            >
              Resolved
            </FilterLink>
          </div>

          <AlertList
            alerts={alertHistory.alerts}
            totalCount={alertHistory.totalCount}
            page={alertHistory.page}
            totalPages={alertHistory.totalPages}
          />

          {/* Pagination */}
          {alertHistory.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {page > 1 && (
                <Link
                  href={`/${orgSlug}/persons/${personId}/clinical/alerts?page=${page - 1}${statusParam ? `&status=${statusParam}` : ''}`}
                  className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="text-xs text-[oklch(0.55_0_0)]">
                Page {alertHistory.page} of {alertHistory.totalPages}
              </span>
              {page < alertHistory.totalPages && (
                <Link
                  href={`/${orgSlug}/persons/${personId}/clinical/alerts?page=${page + 1}${statusParam ? `&status=${statusParam}` : ''}`}
                  className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Threshold settings sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Custom Thresholds
          </h3>
          <AlertThresholdSettings thresholds={thresholds} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter link helper
// ---------------------------------------------------------------------------

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'border-[oklch(0.45_0.1_160)] bg-[oklch(0.45_0.1_160)] text-white'
          : 'border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)]'
      }`}
    >
      {children}
    </Link>
  );
}
