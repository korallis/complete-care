import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Sidebar } from '@/components/dashboard/sidebar';
import { getNotifications } from '@/features/notifications/actions';
import { getNavItems } from '@/lib/rbac/nav-items';
import type { Role } from '@/lib/rbac/permissions';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
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
    (membership) => membership.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find(
      (membership) => membership.orgSlug === orgSlug,
    );

    if (!targetMembership) {
      notFound();
    }

    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/dashboard`);
  }

  const role = (activeMembership.role ?? session.user.role ?? 'viewer') as Role;
  const navItems = getNavItems(role);
  const { notifications, unreadCount } = await getNotifications();

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.08),_transparent_22%),linear-gradient(180deg,oklch(0.2_0.01_220),oklch(0.15_0.012_232))] text-[oklch(0.2_0.016_232)]">
      <Sidebar
        navItems={navItems}
        orgSlug={orgSlug}
        orgName={activeMembership.orgName}
        role={role}
      />

      <div className="min-h-[100dvh] md:pl-72">
        <div className="px-3 pb-3 pt-3 sm:px-4 sm:pt-4 lg:px-6 lg:pb-6">
          <div className="min-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-[2rem] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,250,252,0.9))] shadow-[0_32px_120px_-52px_rgba(2,6,23,0.6)] backdrop-blur-xl lg:min-h-[calc(100dvh-3rem)]">
            <DashboardHeader
              orgSlug={orgSlug}
              orgName={activeMembership.orgName}
              role={role}
              navItems={navItems}
              memberships={memberships}
              activeOrgId={session.user.activeOrgId}
              notifications={notifications}
              unreadCount={unreadCount}
            />
            <div className="min-h-[calc(100dvh-5rem)] bg-[linear-gradient(180deg,rgba(255,255,255,0.6),rgba(255,255,255,0.35))]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
