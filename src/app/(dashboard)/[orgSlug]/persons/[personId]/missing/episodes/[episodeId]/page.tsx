/**
 * Missing Episode Detail Page
 * Route: /[orgSlug]/persons/[personId]/missing/episodes/[episodeId]
 *
 * Shows the episode status, escalation timeline, and RHI if applicable.
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  getMissingEpisodeById,
  getEpisodeTimeline,
  getRhiForEpisode,
} from '@/features/missing-from-care/actions';
import { MissingEpisodeCard } from '@/features/missing-from-care/components/missing-episode-card';
import { MissingEpisodeTimeline } from '@/features/missing-from-care/components/missing-episode-timeline';
import { RhiCard } from '@/features/missing-from-care/components/rhi-card';

interface EpisodeDetailPageProps {
  params: Promise<{ orgSlug: string; personId: string; episodeId: string }>;
}

export async function generateMetadata({
  params,
}: EpisodeDetailPageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Missing Episode — ${person.fullName} — Complete Care`
      : 'Missing Episode — Complete Care',
  };
}

const RISK_LEVEL_LABEL: Record<string, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

const RISK_LEVEL_STYLE: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-red-100 text-red-800',
};

export default async function EpisodeDetailPage({
  params,
}: EpisodeDetailPageProps) {
  const { orgSlug, personId, episodeId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/missing/episodes/${episodeId}`,
    );
  }

  // Auth and org membership verified above; no further role restrictions for viewing

  const [person, episode, timelineEntries, rhi] = await Promise.all([
    getPerson(personId),
    getMissingEpisodeById(episodeId),
    getEpisodeTimeline(episodeId),
    getRhiForEpisode(episodeId),
  ]);

  if (!person) notFound();
  if (!episode) notFound();

  return (
    <div className="space-y-8">
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
            Episode detail
          </li>
        </ol>
      </nav>

      {/* Episode card */}
      <section>
        <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)] mb-3">
          Episode Overview
        </h2>
        <MissingEpisodeCard episode={episode} childName={person.fullName} />

        {/* Additional details */}
        <div className="mt-4 rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {episode.lastSeenLocation && (
              <div>
                <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Last seen location</dt>
                <dd className="mt-1 text-sm text-[oklch(0.22_0.04_160)]">{episode.lastSeenLocation}</dd>
              </div>
            )}
            {episode.lastSeenClothing && (
              <div>
                <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Last seen wearing</dt>
                <dd className="mt-1 text-sm text-[oklch(0.22_0.04_160)]">{episode.lastSeenClothing}</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Initial actions taken</dt>
              <dd className="mt-1 text-sm text-[oklch(0.22_0.04_160)]">{episode.initialActionsTaken}</dd>
            </div>
            {episode.riskAssessmentNotes && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Risk assessment notes</dt>
                <dd className="mt-1 text-sm text-[oklch(0.22_0.04_160)]">{episode.riskAssessmentNotes}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Risk level</dt>
              <dd className="mt-1">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${RISK_LEVEL_STYLE[episode.riskLevel] ?? ''}`}>
                  {RISK_LEVEL_LABEL[episode.riskLevel] ?? episode.riskLevel}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[oklch(0.55_0_0)]">Previous episodes</dt>
              <dd className="mt-1 text-sm text-[oklch(0.22_0.04_160)]">
                {episode.previousEpisodeCount} before this episode
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* RHI section */}
      {rhi && (
        <section>
          <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)] mb-3">
            Return Home Interview
          </h2>
          <Link href={`/${orgSlug}/persons/${personId}/missing/rhi/${rhi.id}`}>
            <RhiCard rhi={rhi} childName={person.fullName} />
          </Link>
        </section>
      )}

      {/* Timeline section */}
      <section>
        <h2 className="text-base font-semibold text-[oklch(0.22_0.04_160)] mb-3">
          Episode Timeline
        </h2>
        <MissingEpisodeTimeline entries={timelineEntries} />
      </section>
    </div>
  );
}
