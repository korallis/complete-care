import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LogoutButton } from '@/components/auth/logout-button';
import { WelcomeBanner } from '@/components/dashboard/welcome-banner';

export const metadata: Metadata = {
  title: 'Dashboard — Complete Care',
};

interface OrgDashboardPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}

export default async function OrgDashboardPage({
  params,
  searchParams,
}: OrgDashboardPageProps) {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const isNewUser = sp.welcome === 'true';

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  // Verify the orgSlug in the URL matches the user's active org
  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  // If the org slug doesn't match the active org, check if the user
  // belongs to an org with that slug and switch context, otherwise 404
  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    // Check if user belongs to an org with this slug
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) {
      notFound();
    }
    // Org slug belongs to user but isn't their active org — redirect to switch
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/dashboard`);
  }

  const orgName = activeMembership.orgName;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner for newly onboarded users */}
      {isNewUser && (
        <WelcomeBanner userName={session.user.name ?? undefined} />
      )}

      {/* Welcome header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
          {session?.user?.name
            ? `Welcome back, ${session.user.name.split(' ')[0]}`
            : 'Welcome'}
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Here&apos;s an overview of{' '}
          <span className="font-medium text-[oklch(0.35_0.06_160)]">
            {orgName}
          </span>{' '}
          today.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'People in care', value: '—', icon: '👤' },
          { label: 'Staff on duty', value: '—', icon: '👥' },
          { label: 'Active care plans', value: '—', icon: '📋' },
          { label: 'Compliance items', value: '—', icon: '✅' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wide">
                {stat.label}
              </span>
              <span className="text-lg" aria-hidden="true">
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-[oklch(0.22_0.04_160)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <a
          href={`/${orgSlug}/persons`}
          className="group rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.35_0.06_160)] hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-[oklch(0.22_0.04_160)/0.08] flex items-center justify-center group-hover:bg-[oklch(0.22_0.04_160)/0.12] transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="oklch(0.22 0.04 160)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
              People
            </p>
          </div>
          <p className="text-xs text-[oklch(0.55_0_0)]">
            View and manage people in care
          </p>
        </a>

        <a
          href={`/${orgSlug}/staff`}
          className="group rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.35_0.06_160)] hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-[oklch(0.22_0.04_160)/0.08] flex items-center justify-center group-hover:bg-[oklch(0.22_0.04_160)/0.12] transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="oklch(0.22 0.04 160)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
              Staff
            </p>
          </div>
          <p className="text-xs text-[oklch(0.55_0_0)]">
            Manage your care team
          </p>
        </a>

        <a
          href={`/${orgSlug}/settings`}
          className="group rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.35_0.06_160)] hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-[oklch(0.22_0.04_160)/0.08] flex items-center justify-center group-hover:bg-[oklch(0.22_0.04_160)/0.12] transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="oklch(0.22 0.04 160)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
              Settings
            </p>
          </div>
          <p className="text-xs text-[oklch(0.55_0_0)]">
            Organisation settings
          </p>
        </a>

        <a
          href={`/${orgSlug}/travel-safety`}
          className="group rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.35_0.06_160)] hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-[oklch(0.22_0.04_160)/0.08] flex items-center justify-center group-hover:bg-[oklch(0.22_0.04_160)/0.12] transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="oklch(0.22 0.04 160)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M10 2h4" />
                <path d="M12 14v8" />
                <path d="M4.93 10.93l1.41 1.41" />
                <path d="M2 18h2" />
                <path d="M20 18h2" />
                <path d="M19.07 10.93l-1.41 1.41" />
                <path d="M22 22H2" />
                <path d="m16 6-4 4-4-4" />
                <path d="M16 18a4 4 0 0 0-8 0" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
              Travel &amp; Safety
            </p>
          </div>
          <p className="text-xs text-[oklch(0.55_0_0)]">
            Review travel-time variance, SOS alerts, and lone-worker checks
          </p>
        </a>
      </div>

      {/* Placeholder notice */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Dashboard widgets will be populated as features are added in upcoming
          milestones.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
