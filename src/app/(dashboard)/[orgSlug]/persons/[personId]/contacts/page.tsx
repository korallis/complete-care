import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  getApprovedContacts,
  getComplianceSummary,
  getContactRecords,
  getContactSchedules,
} from '@/features/contacts/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { ContactsPageClient } from './contacts-page-client';

interface ContactsPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: ContactsPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Contact Management — Complete Care' };
  }

  const person = await getPerson(personId).catch(() => null);

  return {
    title: person
      ? `Contact Management — ${person.fullName} — Complete Care`
      : 'Contact Management — Complete Care',
    description:
      'Approved contacts register, contact scheduling, recording, and compliance tracking.',
  };
}

export default async function ContactsPage({ params }: ContactsPageProps) {
  const { orgSlug, personId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (membership) => membership.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find(
      (membership) => membership.orgSlug === orgSlug,
    );
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/contacts`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage = hasPermission(role, 'create', 'persons');

  const person = await getPerson(personId);
  if (!person) notFound();

  const [contactsResult, schedulesResult, recordsResult, complianceResult] =
    await Promise.all([
      getApprovedContacts(personId),
      getContactSchedules(personId),
      getContactRecords(personId),
      getComplianceSummary(personId),
    ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Contact Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approved contacts register, scheduling, recording, and compliance
          tracking for {person.fullName}.
        </p>
      </div>

      <ContactsPageClient
        orgSlug={orgSlug}
        personId={personId}
        canManage={canManage}
        initialContacts={contactsResult.success ? contactsResult.data : []}
        initialSchedules={schedulesResult.success ? schedulesResult.data : []}
        initialRecords={recordsResult.success ? recordsResult.data : []}
        initialComplianceSummaries={
          complianceResult.success ? complianceResult.data : []
        }
      />
    </div>
  );
}
