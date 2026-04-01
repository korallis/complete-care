import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { listPrnProtocols, recordPrnAdministration } from '@/features/prn/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { PrnAdministrationForm } from '@/components/prn/prn-administration-form';

interface AdministerPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ protocolId?: string }>;
}

export const metadata: Metadata = {
  title: 'Administer PRN -- Complete Care',
};

export default async function AdministerPage({
  params,
  searchParams,
}: AdministerPageProps) {
  const { orgSlug, personId } = await params;
  const { protocolId } = await searchParams;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/emar/prn/administer`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canAdminister = hasPermission(role, 'create', 'medications');

  if (!canAdminister) {
    notFound();
  }

  const person = await getPerson(personId);
  if (!person) notFound();

  const protocols = await listPrnProtocols({ personId });

  // Filter to only active medication protocols
  const activeProtocols = protocols.filter(
    (p) => p.medication.status === 'active',
  );

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0_0)] mb-4">
        <Link
          href={`/${orgSlug}/persons/${personId}/emar`}
          className="hover:text-[oklch(0.35_0.04_160)] transition-colors"
        >
          MAR Chart
        </Link>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <Link
          href={`/${orgSlug}/persons/${personId}/emar/prn`}
          className="hover:text-[oklch(0.35_0.04_160)] transition-colors"
        >
          PRN Protocols
        </Link>
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[oklch(0.35_0.04_160)]">Administer</span>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
          Administer PRN Medication
        </h2>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Record pre-dose assessment and administer PRN medication for {person.fullName}
        </p>
      </div>

      <PrnAdministrationForm
        protocols={activeProtocols}
        selectedProtocolId={protocolId}
        personId={personId}
        orgSlug={orgSlug}
        onSubmit={recordPrnAdministration}
      />
    </div>
  );
}
