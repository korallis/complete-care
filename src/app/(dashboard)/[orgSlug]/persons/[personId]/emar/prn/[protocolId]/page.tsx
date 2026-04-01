import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { getPrnProtocol, listPrnAdministrations } from '@/features/prn/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { PrnProtocolDetail } from '@/components/prn/prn-protocol-detail';

interface ProtocolDetailPageProps {
  params: Promise<{ orgSlug: string; personId: string; protocolId: string }>;
}

export async function generateMetadata({
  params,
}: ProtocolDetailPageProps): Promise<Metadata> {
  const { protocolId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'PRN Protocol -- Complete Care' };
  }
  const protocol = await getPrnProtocol(protocolId).catch(() => null);
  return {
    title: protocol
      ? `${protocol.medication.drugName} PRN Protocol -- Complete Care`
      : 'PRN Protocol -- Complete Care',
  };
}

export default async function ProtocolDetailPage({
  params,
}: ProtocolDetailPageProps) {
  const { orgSlug, personId, protocolId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/emar/prn/${protocolId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canAdminister = hasPermission(role, 'create', 'medications');
  const canEdit = hasPermission(role, 'update', 'medications');

  const person = await getPerson(personId);
  if (!person) notFound();

  const protocol = await getPrnProtocol(protocolId);
  if (!protocol) notFound();

  const { administrations } = await listPrnAdministrations({
    protocolId,
    personId,
    pageSize: 50,
  });

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
        <span className="text-[oklch(0.35_0.04_160)]">{protocol.medication.drugName}</span>
      </div>

      <PrnProtocolDetail
        protocol={protocol}
        administrations={administrations}
        orgSlug={orgSlug}
        personId={personId}
        canAdminister={canAdminister}
        canEdit={canEdit}
      />
    </div>
  );
}
