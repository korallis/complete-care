'use client';

/**
 * DashboardHeader — top bar with mobile hamburger, breadcrumbs,
 * org switcher, and notification bell.
 *
 * Client Component: manages mobile sidebar open state and delegates
 * to child components.
 */

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Breadcrumbs } from './breadcrumbs';
import { MobileSidebar } from './mobile-sidebar';
import { NotificationBell } from './notification-bell';
import { OrgSwitcher } from '@/components/organisations/org-switcher';
import type { NavItem } from '@/lib/rbac/nav-items';
import type { Role } from '@/lib/rbac/permissions';
import type { SessionMembership } from '@/types/auth';
import type { Notification } from '@/lib/db/schema/notifications';

interface DashboardHeaderProps {
  orgSlug: string;
  orgName: string;
  role: Role;
  navItems: NavItem[];
  memberships: SessionMembership[];
  activeOrgId: string;
  notifications: Notification[];
  unreadCount: number;
}

export function DashboardHeader({
  orgSlug,
  orgName,
  role,
  navItems,
  memberships,
  activeOrgId,
  notifications,
  unreadCount,
}: DashboardHeaderProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile sidebar drawer */}
      <MobileSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        navItems={navItems}
        orgSlug={orgSlug}
        orgName={orgName}
        role={role}
      />

      {/* Top header bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[oklch(0.91_0.005_160)] bg-white/95 backdrop-blur-sm px-4">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileSidebarOpen}
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-[oklch(0.5_0_0)] hover:bg-[oklch(0.96_0.005_160)] hover:text-[oklch(0.22_0.04_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.35_0.06_160)]"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Breadcrumbs */}
        <div className="flex-1 min-w-0">
          <Breadcrumbs orgSlug={orgSlug} orgName={orgName} />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Org switcher */}
          <OrgSwitcher
            memberships={memberships}
            activeOrgId={activeOrgId}
            activeOrgName={orgName}
          />

          {/* Notification bell */}
          <NotificationBell
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
          />
        </div>
      </header>
    </>
  );
}
