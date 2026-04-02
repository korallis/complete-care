import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { StandardDetailClient } from '@/components/ofsted/standard-detail-client';
import {
  getStandardById,
  listEvidenceForStandard,
} from '@/features/ofsted/actions';
import { QUALITY_STANDARDS } from '@/features/ofsted/standards';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';

type StandardDetailPageProps = {
  params: Promise<{ orgSlug: string; standardId: string }>;
};

export default async function StandardDetailPage({
  params,
}: StandardDetailPageProps) {
  const { orgSlug, standardId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (membership) => membership.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find(
      (membership) => membership.orgSlug === orgSlug,
    );
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/ofsted/standards/${standardId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'ofsted');
  const canManage = hasPermission(role, 'manage', 'ofsted');

  if (!canRead) notFound();

  const standard = await getStandardById(standardId);
  if (!standard) notFound();

  const template = QUALITY_STANDARDS.find(
    (row) => row.regulationNumber === standard.regulationNumber,
  );
  if (!template) notFound();

  const evidence = await listEvidenceForStandard(standardId);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
        <Link
          href={`/${orgSlug}/ofsted`}
          className="hover:text-[oklch(0.35_0.15_160)]"
        >
          Ofsted Compliance
        </Link>
        <span>/</span>
        <span className="text-[oklch(0.35_0_0)]">Standard Detail</span>
      </nav>

      <StandardDetailClient
        standard={standard}
        template={template}
        initialEvidence={evidence}
        canManage={canManage}
      />
    </div>
  );
}
