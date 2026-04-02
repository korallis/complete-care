import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';

export async function requireReg44PageAccess(orgSlug: string) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find((membership) => membership.orgId === session.user.activeOrgId);

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((membership) => membership.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/reg44`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;

  return {
    role,
    canManageQuality: hasPermission(role, 'manage', 'ofsted'),
    canReadQuality: hasPermission(role, 'read', 'ofsted'),
    canCreatePlans: hasPermission(role, 'create', 'care_plans'),
    canUpdatePlans: hasPermission(role, 'update', 'care_plans'),
    canCreateAssessments: hasPermission(role, 'create', 'assessments'),
    canUpdateAssessments: hasPermission(role, 'update', 'assessments'),
  };
}
