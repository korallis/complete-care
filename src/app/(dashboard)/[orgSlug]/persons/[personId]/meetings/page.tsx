import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { MeetingsPanel } from '@/features/meetings/components/meetings-panel';
import { createMeeting, listMeetings, updateMeeting } from '@/features/meetings/actions';
import { getPerson } from '@/features/persons/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';

interface MeetingsPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({ params }: MeetingsPageProps): Promise<Metadata> {
  const { personId } = await params;
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person ? `Meetings — ${person.fullName} — Complete Care` : 'Meetings — Complete Care',
  };
}

export default async function MeetingsPage({ params }: MeetingsPageProps) {
  const { orgSlug, personId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find((m) => m.orgId === session.user.activeOrgId);
  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/meetings`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'care_plans');
  const canUpdate = hasPermission(role, 'update', 'care_plans');
  const person = await getPerson(personId);
  if (!person) notFound();

  const initialMeetings = await listMeetings(personId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">Children&apos;s meetings</h1>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          House-meeting records, attendees, decisions, and tracked actions for {person.fullName}.
        </p>
      </div>
      <MeetingsPanel
        initialMeetings={initialMeetings}
        personId={personId}
        canCreate={canCreate}
        canUpdate={canUpdate}
        onCreate={createMeeting}
        onUpdate={updateMeeting}
      />
    </div>
  );
}
