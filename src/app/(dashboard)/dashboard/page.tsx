import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Dashboard',
};

/**
 * Generic /dashboard route — redirects to the user's active org-scoped dashboard.
 * This is the DEFAULT_LOGIN_REDIRECT landing page that resolves org context
 * and forwards to /[orgSlug]/dashboard (or /onboarding if no org yet).
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // Redirect to org-scoped dashboard if user has an active org
  const memberships = session?.user?.memberships ?? [];
  const activeOrgId = session?.user?.activeOrgId;
  const activeMembership = memberships.find((m) => m.orgId === activeOrgId);

  if (activeMembership?.orgSlug) {
    const suffix = params.welcome === 'true' ? '?welcome=true' : '';
    redirect(`/${activeMembership.orgSlug}/dashboard${suffix}`);
  }

  // Fallback: no org — send user to onboarding
  // (Dashboard layout also handles this, but being explicit here)
  redirect('/onboarding');
}
