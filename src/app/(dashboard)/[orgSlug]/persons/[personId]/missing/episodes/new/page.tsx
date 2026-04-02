/**
 * Create Missing Episode Page
 * Route: /[orgSlug]/persons/[personId]/missing/episodes/new
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { createMissingEpisode } from '@/features/missing-from-care/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { MissingEpisodeFormClient } from './missing-episode-form-client';
import type { Role } from '@/lib/rbac/permissions';

interface NewMissingEpisodePageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: NewMissingEpisodePageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Report Missing — ${person.fullName} — Complete Care`
      : 'Report Missing — Complete Care',
  };
}

export default async function NewMissingEpisodePage({
  params,
}: NewMissingEpisodePageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/missing/episodes/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'persons');
  if (!canCreate) redirect(`/${orgSlug}/permission-denied`);

  const person = await getPerson(personId);
  if (!person) notFound();

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
            Report missing
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Report Missing Episode
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Reporting {person.fullName} as missing from care
        </p>
      </div>

      {/* Urgent notice */}
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
        <div>
          <p className="text-sm font-medium text-red-800">Philomena Protocol Active</p>
          <p className="text-xs text-red-700 mt-0.5">
            Escalation steps will be timed from now. For high-risk children, notify police within
            30 minutes. A Return Home Interview will be automatically created when the child returns.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <MissingEpisodeFormClient
          personId={personId}
          orgSlug={orgSlug}
          onSubmit={createMissingEpisode}
        />
      </div>
    </div>
  );
}
