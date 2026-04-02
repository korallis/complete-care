import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listKeyworkerSessions,
  listRestraints,
  listSanctions,
  listChildrensVoice,
} from '@/features/keyworker/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { SessionList } from '@/features/keyworker/components/session-list';
import { RestraintList } from '@/features/keyworker/components/restraint-list';
import { SanctionList } from '@/features/keyworker/components/sanction-list';
import { ChildrenVoiceList } from '@/features/keyworker/components/children-voice-list';
import type { Role } from '@/lib/rbac/permissions';

interface KeyworkerPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: KeyworkerPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) return { title: 'Keyworker — Complete Care' };
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Keyworker — ${person.fullName} — Complete Care`
      : 'Keyworker — Complete Care',
  };
}

export default async function KeyworkerPage({ params }: KeyworkerPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/keyworker`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'care_plans');
  const canCreateIncident = hasPermission(role, 'create', 'incidents');

  const person = await getPerson(personId);
  if (!person) notFound();

  const [sessionsData, restraintsData, sanctionsData, voiceData] = await Promise.all([
    listKeyworkerSessions({ personId, page: 1, pageSize: 5 }),
    listRestraints({ personId, page: 1, pageSize: 5 }),
    listSanctions({ personId, page: 1, pageSize: 5 }),
    listChildrensVoice({ personId, page: 1, pageSize: 5 }),
  ]);

  // Count prohibited sanctions for the warning banner
  const prohibitedCount = sanctionsData.sanctions.filter((s) => s.isProhibited).length;

  // Count restraints needing debrief
  const restraintsNeedingDebrief = restraintsData.restraints.filter(
    (r) => !r.childDebrief && !r.staffDebrief,
  ).length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[oklch(0.22_0.04_160)]">
            Key Worker Engagement
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            Sessions, restraints, sanctions, and children&apos;s voice for{' '}
            {person.fullName}
          </p>
        </div>
      </div>

      {/* Warning banners */}
      {prohibitedCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <svg
            className="mt-0.5 h-5 w-5 text-red-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-red-800">
            <span className="font-semibold">{prohibitedCount} prohibited measure{prohibitedCount !== 1 ? 's' : ''}</span>
            {' '}recorded — these require immediate management review and may indicate a regulatory breach.
          </p>
        </div>
      )}

      {restraintsNeedingDebrief > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg
            className="mt-0.5 h-5 w-5 text-amber-600 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{restraintsNeedingDebrief} restraint record{restraintsNeedingDebrief !== 1 ? 's' : ''}</span>
            {' '}missing debrief — debriefs are required after all physical interventions.
          </p>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[oklch(0.22_0.04_160)]">
            {sessionsData.totalCount}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Sessions</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className={`text-2xl font-bold ${restraintsData.totalCount > 0 ? 'text-orange-600' : 'text-[oklch(0.22_0.04_160)]'}`}>
            {restraintsData.totalCount}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Restraints</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className={`text-2xl font-bold ${prohibitedCount > 0 ? 'text-red-600' : 'text-[oklch(0.22_0.04_160)]'}`}>
            {sanctionsData.totalCount}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Sanctions</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {voiceData.totalCount}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Voice entries</p>
        </div>
      </div>

      {/* Key Worker Sessions section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">
            Key Worker Sessions
          </h2>
          {canCreate && (
            <Link
              href={`/${orgSlug}/persons/${personId}/keyworker/sessions/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New session
            </Link>
          )}
        </div>
        <SessionList
          sessions={sessionsData.sessions}
          orgSlug={orgSlug}
          personId={personId}
          canCreate={canCreate}
        />
      </section>

      {/* Restraints section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">
            Physical Interventions (Restraints)
          </h2>
          {canCreateIncident && (
            <Link
              href={`/${orgSlug}/persons/${personId}/keyworker/restraints/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Record restraint
            </Link>
          )}
        </div>
        <RestraintList
          restraints={restraintsData.restraints}
          orgSlug={orgSlug}
          personId={personId}
          canCreate={canCreateIncident}
        />
      </section>

      {/* Sanctions section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">
            Sanctions Log
          </h2>
          {canCreateIncident && (
            <Link
              href={`/${orgSlug}/persons/${personId}/keyworker/sanctions/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Log sanction
            </Link>
          )}
        </div>
        <SanctionList
          sanctions={sanctionsData.sanctions}
          orgSlug={orgSlug}
          personId={personId}
          canCreate={canCreateIncident}
        />
      </section>

      {/* Children's voice section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">
            Children&apos;s Wishes &amp; Voice
          </h2>
          {canCreate && (
            <Link
              href={`/${orgSlug}/persons/${personId}/keyworker/voice/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Record wishes
            </Link>
          )}
        </div>
        <ChildrenVoiceList
          entries={voiceData.entries}
          orgSlug={orgSlug}
          personId={personId}
          canCreate={canCreate}
        />
      </section>

      {/* Visitor log link */}
      <section>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
                <svg
                  className="h-5 w-5 text-[oklch(0.45_0.07_160)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                  Visitor Log
                </p>
                <p className="text-xs text-[oklch(0.55_0_0)]">
                  Schedule 4 compliant visitor tracking for the whole home
                </p>
              </div>
            </div>
            <Link
              href={`/${orgSlug}/visitor-log`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              View log
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
