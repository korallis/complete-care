import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listPrnProtocols,
  getPrnUsageReport,
  getPendingFollowUps,
  recordFollowUp,
} from '@/features/prn/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { PrnUsageReport } from '@/components/prn/prn-usage-report';
import { PrnFollowUpForm } from '@/components/prn/prn-follow-up-form';

interface PrnPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ from?: string; to?: string; followUp?: string }>;
}

export async function generateMetadata({
  params,
}: PrnPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'PRN Protocols -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `PRN Protocols -- ${person.fullName} -- Complete Care`
      : 'PRN Protocols -- Complete Care',
  };
}

export default async function PrnPage({ params, searchParams }: PrnPageProps) {
  const { orgSlug, personId } = await params;
  const { from, to, followUp } = await searchParams;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/emar/prn`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canAdminister = hasPermission(role, 'create', 'medications');
  const canManage = hasPermission(role, 'update', 'medications');

  const person = await getPerson(personId);
  if (!person) notFound();

  const protocols = await listPrnProtocols({ personId });
  const pendingFollowUps = await getPendingFollowUps({ personId });

  // Report date range defaults to last 30 days
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const dateFrom = from ?? thirtyDaysAgo;
  const dateTo = to ?? today;

  const report = await getPrnUsageReport({ personId, dateFrom, dateTo });

  // If following up on a specific administration
  const followUpAdmin = followUp
    ? pendingFollowUps.find((a) => a.id === followUp)
    : null;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            PRN Protocols
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            As-needed medication protocols for {person.fullName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${orgSlug}/persons/${personId}/emar`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            MAR Chart
          </Link>
          {canAdminister && protocols.length > 0 && (
            <Link
              href={`/${orgSlug}/persons/${personId}/emar/prn/administer`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Administer PRN
            </Link>
          )}
        </div>
      </div>

      {/* Follow-up form (if selected) */}
      {followUpAdmin && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] mb-3">
            Record Follow-Up Assessment
          </h3>
          <PrnFollowUpForm
            administration={followUpAdmin}
            orgSlug={orgSlug}
            personId={personId}
            onSubmit={recordFollowUp}
          />
        </div>
      )}

      {/* Pending follow-ups alert */}
      {!followUpAdmin && pendingFollowUps.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">
            {pendingFollowUps.length} Pending Follow-Up{pendingFollowUps.length !== 1 ? 's' : ''}
          </h3>
          <div className="space-y-2">
            {pendingFollowUps.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between rounded-lg bg-white border border-amber-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-[oklch(0.22_0.04_160)]">
                    {admin.medication.drugName} {admin.medication.dose}{admin.medication.doseUnit}
                  </p>
                  <p className="text-xs text-[oklch(0.55_0_0)]">
                    Administered: {new Date(admin.administeredAt).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </p>
                </div>
                <Link
                  href={`/${orgSlug}/persons/${personId}/emar/prn?followUp=${admin.id}`}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
                >
                  Record Follow-Up
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protocol list */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)]">
            Active Protocols
          </h3>
          {canManage && (
            <Link
              href={`/${orgSlug}/persons/${personId}/emar/prn/new`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Protocol
            </Link>
          )}
        </div>

        {protocols.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
              <svg className="h-6 w-6 text-[oklch(0.45_0.07_160)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
              No PRN protocols
            </h3>
            <p className="text-sm text-[oklch(0.55_0_0)] mb-5">
              Create protocols for PRN medications to enable structured assessment and tracking.
            </p>
            {canManage && (
              <Link
                href={`/${orgSlug}/persons/${personId}/emar/prn/new`}
                className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors"
              >
                Create Protocol
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3" role="list" aria-label="PRN protocols">
            {protocols.map((protocol) => (
              <li key={protocol.id}>
                <Link
                  href={`/${orgSlug}/persons/${personId}/emar/prn/${protocol.id}`}
                  className="group block rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.6_0.06_160)] hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
                  aria-label={`View protocol: ${protocol.medication.drugName}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] group-hover:text-[oklch(0.3_0.08_160)] transition-colors">
                          {protocol.medication.drugName}
                        </h4>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                            protocol.medication.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {protocol.medication.status}
                        </span>
                      </div>

                      <p className="text-sm text-[oklch(0.45_0.03_160)] mb-2">
                        {protocol.indication}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap text-xs text-[oklch(0.55_0_0)]">
                        <span>Dose: {protocol.doseRange}</span>
                        <span className="text-[oklch(0.8_0_0)]">|</span>
                        <span>Max 24hr: {protocol.maxDose24hr}</span>
                        <span className="text-[oklch(0.8_0_0)]">|</span>
                        <span>Follow-up: {protocol.followUpMinutes}min</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 self-center">
                      <svg
                        className="h-4 w-4 text-[oklch(0.75_0_0)] group-hover:text-[oklch(0.35_0.06_160)] transition-colors"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Usage report */}
      {protocols.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)]">
              Usage Report
            </h3>
            <form className="flex items-center gap-2 text-xs">
              <input
                type="date"
                name="from"
                defaultValue={dateFrom}
                className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-2 py-1 text-xs text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none"
                aria-label="Report start date"
              />
              <span className="text-[oklch(0.55_0_0)]">to</span>
              <input
                type="date"
                name="to"
                defaultValue={dateTo}
                className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-2 py-1 text-xs text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none"
                aria-label="Report end date"
              />
              <button
                type="submit"
                className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-2 py-1 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
              >
                Update
              </button>
            </form>
          </div>
          <PrnUsageReport report={report} />
        </div>
      )}
    </div>
  );
}
