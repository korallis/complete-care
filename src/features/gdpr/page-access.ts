import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';

export async function requireGdprPageAccess(
  orgSlug: string,
  returnTo = `/${orgSlug}/settings/gdpr`,
) {
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
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=${returnTo}`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;

  return {
    role,
    canReadCompliance: hasPermission(role, 'read', 'compliance'),
    canManageCompliance: hasPermission(role, 'manage', 'compliance'),
    canExportCompliance: hasPermission(role, 'export', 'compliance'),
    canCreateCompliance: hasPermission(role, 'create', 'compliance'),
    canUpdateCompliance: hasPermission(role, 'update', 'compliance'),
  };
}
