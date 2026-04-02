/**
 * Return Home Interview (RHI) Completion Page
 * Route: /[orgSlug]/persons/[personId]/missing/rhi/[rhiId]
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  getRhiById,
  completeRhi,
} from '@/features/missing-from-care/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { RhiCard } from '@/features/missing-from-care/components/rhi-card';
import { RhiCompleteFormClient } from './rhi-complete-form-client';
import { isRhiOverdue } from '@/features/missing-from-care/schema';
import type { Role } from '@/lib/rbac/permissions';

interface RhiPageProps {
  params: Promise<{ orgSlug: string; personId: string; rhiId: string }>;
}

export async function generateMetadata({
  params,
}: RhiPageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Return Home Interview — ${person.fullName} — Complete Care`
      : 'Return Home Interview — Complete Care',
  };
}

export default async function RhiPage({ params }: RhiPageProps) {
  const { orgSlug, personId, rhiId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/missing/rhi/${rhiId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canUpdate = hasPermission(role, 'update', 'persons');

  const [person, rhi] = await Promise.all([
    getPerson(personId),
    getRhiById(rhiId),
  ]);

  if (!person) notFound();
  if (!rhi) notFound();

  const overdue = isRhiOverdue(rhi.deadlineAt);
  const isCompleted = rhi.status === 'completed';

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
            Return Home Interview
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Return Home Interview
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          {isCompleted
            ? `Completed RHI for ${person.fullName}`
            : `Complete the Return Home Interview for ${person.fullName}`}
        </p>
      </div>

      {/* RHI status card */}
      <RhiCard rhi={rhi} childName={person.fullName} />

      {/* Overdue warning */}
      {overdue && !isCompleted && (
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
            <p className="text-sm font-medium text-red-800">RHI Overdue</p>
            <p className="text-xs text-red-700 mt-0.5">
              This Return Home Interview has exceeded the 72-hour deadline. It has been escalated
              to the Responsible Individual. Complete it as soon as possible.
            </p>
          </div>
        </div>
      )}

      {isCompleted ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-green-800">
              Return Home Interview Completed
            </h3>
          </div>
          <p className="text-sm text-green-700">
            This RHI was completed on{' '}
            {rhi.completedAt
              ? new Date(rhi.completedAt).toLocaleDateString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'unknown date'}
            . The record is now read-only.
          </p>
        </div>
      ) : (
        canUpdate && (
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
            <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-5">
              Complete Return Home Interview
            </h3>
            <RhiCompleteFormClient
              rhi={rhi}
              orgSlug={orgSlug}
              personId={personId}
              onSubmit={completeRhi}
            />
          </div>
        )
      )}
    </div>
  );
}
