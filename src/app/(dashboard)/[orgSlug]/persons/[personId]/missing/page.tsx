/**
 * Missing from Care Overview Page
 * Route: /[orgSlug]/persons/[personId]/missing
 *
 * Shows the Philomena profile, all missing episodes, and pending RHIs.
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  getPhilomenaProfile,
  getMissingEpisodesForPerson,
  getPendingRhis,
} from '@/features/missing-from-care/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { PhilomenaProfileCard } from '@/features/missing-from-care/components/philomena-profile-card';
import { MissingEpisodeCard } from '@/features/missing-from-care/components/missing-episode-card';
import { RhiCard } from '@/features/missing-from-care/components/rhi-card';
import { isPhotoStale } from '@/features/missing-from-care/schema';
import type { Role } from '@/lib/rbac/permissions';

interface MissingOverviewPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: MissingOverviewPageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Missing from Care — ${person.fullName} — Complete Care`
      : 'Missing from Care — Complete Care',
  };
}

export default async function MissingOverviewPage({
  params,
}: MissingOverviewPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/missing`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'persons');

  const person = await getPerson(personId);
  if (!person) notFound();

  const [philomenaProfile, episodes, pendingRhis] = await Promise.all([
    getPhilomenaProfile(personId),
    getMissingEpisodesForPerson(personId),
    getPendingRhis(),
  ]);

  // Filter RHIs for this person
  const personRhis = pendingRhis.filter((rhi) => rhi.personId === personId);

  const openEpisodes = episodes.filter((e) => e.status === 'open');
  const closedEpisodes = episodes.filter((e) => e.status !== 'open');

  const photoStale = philomenaProfile
    ? isPhotoStale(philomenaProfile.photoUpdatedAt)
    : false;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[oklch(0.22_0.04_160)]">
            Missing from Care
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            Philomena Protocol, missing episodes, and Return Home Interviews for{' '}
            {person.fullName}
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/${orgSlug}/persons/${personId}/missing/episodes/new`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Report missing
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className={`text-2xl font-bold ${openEpisodes.length > 0 ? 'text-red-600' : 'text-[oklch(0.22_0.04_160)]'}`}>
            {openEpisodes.length}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Open episodes</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[oklch(0.22_0.04_160)]">
            {episodes.length}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Total episodes</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className={`text-2xl font-bold ${personRhis.length > 0 ? 'text-amber-600' : 'text-[oklch(0.22_0.04_160)]'}`}>
            {personRhis.length}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Pending RHIs</p>
        </div>
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4 text-center">
          <p className={`text-2xl font-bold ${photoStale ? 'text-amber-600' : 'text-[oklch(0.22_0.04_160)]'}`}>
            {philomenaProfile ? '✓' : '✗'}
          </p>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-1">Philomena profile</p>
        </div>
      </div>

      {/* Philomena Profile section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">
            Philomena Protocol Profile
          </h2>
          {canCreate && (
            <Link
              href={`/${orgSlug}/persons/${personId}/missing/philomena`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
            >
              {philomenaProfile ? 'Edit profile' : 'Create profile'}
            </Link>
          )}
        </div>

        {philomenaProfile ? (
          <div>
            {photoStale && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <svg className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm text-amber-800">
                  <strong>Photo update required.</strong> The Philomena profile photo is over 3 months old
                  and should be updated.{' '}
                  <Link href={`/${orgSlug}/persons/${personId}/missing/philomena`} className="underline">
                    Update now
                  </Link>
                </p>
              </div>
            )}
            <PhilomenaProfileCard
              profile={philomenaProfile}
              childName={person.fullName}
              dateOfBirth={person.dateOfBirth ?? undefined}
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
              <svg className="h-6 w-6 text-[oklch(0.45_0.07_160)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
              No Philomena Profile
            </h3>
            <p className="text-sm text-[oklch(0.55_0_0)] mb-4">
              A Philomena Protocol profile should be created on admission to enable quick
              information sharing with police if this child goes missing.
            </p>
            {canCreate && (
              <Link
                href={`/${orgSlug}/persons/${personId}/missing/philomena`}
                className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors"
              >
                Create Philomena Profile
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Pending RHIs section */}
      {personRhis.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)] mb-4">
            Pending Return Home Interviews
          </h2>
          <div className="space-y-3">
            {personRhis.map((rhi) => (
              <Link
                key={rhi.id}
                href={`/${orgSlug}/persons/${personId}/missing/rhi/${rhi.id}`}
              >
                <RhiCard rhi={rhi} childName={person.fullName} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Open episodes section */}
      {openEpisodes.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-red-700 mb-4">
            ⚠ Active Missing Episodes
          </h2>
          <div className="space-y-3">
            {openEpisodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/${orgSlug}/persons/${personId}/missing/episodes/${episode.id}`}
              >
                <MissingEpisodeCard episode={episode} childName={person.fullName} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Previous episodes section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)]">
            Missing Episode History
          </h2>
          {canCreate && (
            <Link
              href={`/${orgSlug}/persons/${personId}/missing/episodes/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Report missing
            </Link>
          )}
        </div>

        {closedEpisodes.length === 0 && openEpisodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
            <p className="text-sm text-[oklch(0.55_0_0)]">
              No missing episodes recorded for {person.fullName}.
            </p>
          </div>
        ) : closedEpisodes.length === 0 ? null : (
          <div className="space-y-3">
            {closedEpisodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/${orgSlug}/persons/${personId}/missing/episodes/${episode.id}`}
              >
                <MissingEpisodeCard episode={episode} childName={person.fullName} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
