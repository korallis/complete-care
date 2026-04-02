import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ComplaintsPanel } from '@/features/complaints/components/complaints-panel';
import {
  createComplaint,
  listComplaints,
  updateComplaint,
} from '@/features/complaints/actions';
import { getPerson } from '@/features/persons/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';

interface ComplaintsPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({ params }: ComplaintsPageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person ? `Complaints — ${person.fullName} — Complete Care` : 'Complaints — Complete Care',
  };
}

export default async function ComplaintsPage({ params }: ComplaintsPageProps) {
  const { orgSlug, personId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find((m) => m.orgId === session.user.activeOrgId);
  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/complaints`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'incidents');
  const canUpdate = hasPermission(role, 'update', 'incidents');
  const person = await getPerson(personId);
  if (!person) notFound();

  const initialComplaints = await listComplaints(personId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">Children&apos;s complaints</h1>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Complaint intake, advocacy prompt, staged resolution, and satisfaction outcome for {person.fullName}.
        </p>
      </div>
      <ComplaintsPanel
        initialComplaints={initialComplaints}
        personId={personId}
        canCreate={canCreate}
        canUpdate={canUpdate}
        onCreate={createComplaint}
        onUpdate={updateComplaint}
      />
    </div>
  );
}
