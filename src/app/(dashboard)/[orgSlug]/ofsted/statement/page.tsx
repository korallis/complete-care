import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import {
  getCurrentStatement,
  createStatement,
} from '@/features/ofsted/actions';
import { StatementOfPurpose } from '@/components/ofsted/statement-of-purpose';
import { DEFAULT_SOP_SECTIONS } from '@/features/ofsted/constants';

export const metadata: Metadata = {
  title: 'Statement of Purpose - Complete Care',
};

interface StatementPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function StatementPage({ params }: StatementPageProps) {
  const { orgSlug } = await params;

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
    if (!targetMembership) {
      notFound();
    }
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/ofsted/statement`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'ofsted');
  const canManage = hasPermission(role, 'manage', 'ofsted');

  if (!canRead) {
    notFound();
  }

  let statement = await getCurrentStatement();

  // Auto-create a draft Statement of Purpose with default sections on first visit
  if (!statement && canManage) {
    const sections = DEFAULT_SOP_SECTIONS.map((s) => ({
      id: s.id,
      title: s.title,
      content: s.content,
      order: s.order,
    }));
    await createStatement({ content: sections, status: 'draft' });
    statement = await getCurrentStatement();
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
        <Link
          href={`/${orgSlug}/ofsted`}
          className="hover:text-[oklch(0.35_0.15_160)]"
        >
          Ofsted Compliance
        </Link>
        <span>/</span>
        <span className="text-[oklch(0.35_0_0)]">Statement of Purpose</span>
      </nav>

      {/* Statement editor */}
      <StatementOfPurpose statement={statement} canManage={canManage} />
    </div>
  );
}
