import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { getDashboardMetrics, getRecentActivity } from '@/features/person-dashboard/actions';
import { PersonSummaryCard } from '@/components/person-dashboard/person-summary-card';
import { MetricsGrid } from '@/components/person-dashboard/metrics-grid';
import { QuickActions } from '@/components/person-dashboard/quick-actions';
import { UnifiedTimeline } from '@/components/person-dashboard/unified-timeline';

interface PersonDetailPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: PersonDetailPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Person — Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person ? `${person.fullName} — Complete Care` : 'Person — Complete Care',
  };
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const { orgSlug, personId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'persons');

  const person = await getPerson(personId);
  if (!person) {
    notFound();
  }

  // Fetch dashboard data in parallel
  const [metrics, recentActivity] = await Promise.all([
    getDashboardMetrics(personId),
    getRecentActivity(personId),
  ]);

  return (
    <div className="space-y-6">
      {/* Person summary card */}
      <PersonSummaryCard person={person} />

      {/* Metrics grid */}
      <MetricsGrid metrics={metrics} />

      {/* Quick actions */}
      <QuickActions orgSlug={orgSlug} personId={personId} canEdit={canEdit} />

      {/* Recent activity */}
      <div>
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
          Recent activity
        </h3>
        <UnifiedTimeline
          entries={recentActivity}
          emptyMessage="No recent activity for this person."
        />
      </div>
    </div>
  );
}
