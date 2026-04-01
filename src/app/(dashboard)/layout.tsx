/**
 * Dashboard layout — authenticated shell with sidebar and notification centre.
 *
 * Provides:
 * - Auth gate (redirects unauthenticated users to login)
 * - Onboarding gate (redirects users with no org to onboarding)
 * - Fixed left sidebar with role-based navigation (desktop)
 * - Collapsible mobile sidebar (hamburger menu)
 * - Top header with breadcrumbs, org switcher, and notification bell
 * - Notification data fetched server-side and passed to client components
 */
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getNavItems } from '@/lib/rbac';
import { getNotifications } from '@/features/notifications/actions';
import { Sidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import type { SessionMembership } from '@/types/auth';
import type { Role } from '@/lib/rbac/permissions';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // New users without an active org must complete onboarding
  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const memberships = (session.user.memberships ?? []) as SessionMembership[];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );
  const activeOrgName = activeMembership?.orgName ?? 'My Organisation';
  const activeOrgSlug = activeMembership?.orgSlug ?? '';
  const role = (session.user.role ?? activeMembership?.role ?? 'viewer') as Role;

  // Fetch role-based nav items
  const navItems = getNavItems(role);

  // Fetch notifications (parallel with nav items)
  const { notifications, unreadCount } = await getNotifications();

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.003_160)]">
      {/* Desktop sidebar — fixed, left */}
      <Sidebar
        navItems={navItems}
        orgSlug={activeOrgSlug}
        orgName={activeOrgName}
        role={role}
      />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Header — sticky, full width within the offset */}
        <DashboardHeader
          orgSlug={activeOrgSlug}
          orgName={activeOrgName}
          role={role}
          navItems={navItems}
          memberships={memberships}
          activeOrgId={session.user.activeOrgId}
          notifications={notifications}
          unreadCount={unreadCount}
        />

        {/* Page content */}
        <main id="main-content" className="flex-1">
          <Suspense>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
