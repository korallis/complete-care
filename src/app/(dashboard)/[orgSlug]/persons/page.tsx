import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'People — Complete Care',
};

interface PersonsPageProps {
  params: Promise<{ orgSlug: string }>;
}

/**
 * Persons (People in Care) list page.
 * Stub page — full implementation coming in Milestone 2 (Person Management).
 */
export default async function PersonsPage({ params }: PersonsPageProps) {
  const { orgSlug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  // Verify org slug matches active org
  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) {
      notFound();
    }
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons`);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
            People
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            Manage people in care for{' '}
            <span className="font-medium text-[oklch(0.35_0.06_160)]">
              {activeMembership.orgName}
            </span>
          </p>
        </div>
      </div>

      {/* Coming soon notice */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-12 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[oklch(0.22_0.04_160)/0.08] flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="oklch(0.22 0.04 160)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h2 className="text-base font-semibold text-[oklch(0.18_0.02_160)]">
          Person Management — Coming in Milestone 2
        </h2>
        <p className="mt-1 text-sm text-[oklch(0.55_0_0)] max-w-md mx-auto">
          Full person management with care plans, risk assessments, daily notes,
          body maps, and timeline will be available in Milestone 2.
        </p>
      </div>
    </div>
  );
}
