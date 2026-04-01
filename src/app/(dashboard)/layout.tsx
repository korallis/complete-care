/**
 * Dashboard layout — auth check and org context.
 * Sidebar shell will be added in m1-dashboard-shell feature.
 * This version adds: org context check + redirect to onboarding if no org.
 */
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { OrgSwitcher } from '@/components/organisations/org-switcher';
import type { SessionMembership } from '@/types/auth';

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

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_150)]">
      {/* Minimal header with org switcher — full sidebar added in m1-dashboard-shell */}
      <header className="sticky top-0 z-30 border-b border-[oklch(0.9_0.005_150)] bg-white/95 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.22_0.04_160)] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5 text-[oklch(0.6_0_0)]">
              <span className="text-sm font-medium text-[oklch(0.35_0_0)]">Complete Care</span>
            </div>
            <span className="text-[oklch(0.8_0_0)]">/</span>
            {/* Org switcher */}
            <OrgSwitcher
              memberships={memberships}
              activeOrgId={session.user.activeOrgId}
              activeOrgName={activeOrgName}
            />
          </div>

          {/* Quick nav links */}
          <nav
            className="flex items-center gap-1"
            aria-label="Organisation navigation"
          >
            {activeOrgSlug && (
              <>
                <a
                  href={`/${activeOrgSlug}/settings`}
                  className="text-sm text-[oklch(0.48_0_0)] hover:text-[oklch(0.22_0.04_160)] transition-colors px-3 py-1.5 rounded-md hover:bg-[oklch(0.95_0.005_150)]"
                >
                  Settings
                </a>
                <a
                  href={`/${activeOrgSlug}/settings/team`}
                  className="text-sm text-[oklch(0.48_0_0)] hover:text-[oklch(0.22_0.04_160)] transition-colors px-3 py-1.5 rounded-md hover:bg-[oklch(0.95_0.005_150)]"
                >
                  Team
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}
