/**
 * New LAC Record Page — creates a LAC documentation record for a child.
 * Route: /[orgSlug]/persons/[personId]/lac/new
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { createLacRecord } from '@/features/lac/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { LacRecordForm } from '@/components/lac/lac-record-form';
import type { Role } from '@/lib/rbac/permissions';

interface NewLacPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: NewLacPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) return { title: 'New LAC Record — Complete Care' };
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `New LAC Record — ${person.fullName} — Complete Care`
      : 'New LAC Record — Complete Care',
  };
}

export default async function NewLacPage({ params }: NewLacPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/lac/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage = hasPermission(role, 'manage', 'ofsted');
  if (!canManage) redirect(`/${orgSlug}/permission-denied`);

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
              href={`/${orgSlug}/persons/${personId}/lac`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {person.fullName} — LAC
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            New LAC record
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Create LAC Record
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Create a Looked After Children documentation record for {person.fullName}
        </p>
      </div>

      {/* Regulatory notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <svg
          className="mt-0.5 h-5 w-5 text-blue-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-blue-800">LAC Documentation Required</p>
          <p className="text-xs text-blue-700 mt-0.5">
            This record captures the child&apos;s legal status, placing authority, and key contacts.
            A placement plan must be completed within 5 working days of admission.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <LacRecordForm
          mode="create"
          personId={personId}
          orgSlug={orgSlug}
          onSubmit={createLacRecord}
        />
      </div>
    </div>
  );
}
