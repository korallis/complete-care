import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import {
  getOrgSettings,
  getOrgMembers,
  getOrgInvitations,
} from '@/features/organisations/actions';
import { TeamMemberList } from '@/components/organisations/team-member-list';
import { InviteMemberForm } from '@/components/organisations/invite-member-form';

export const metadata: Metadata = {
  title: 'Team Management — Complete Care',
};

interface TeamPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { orgSlug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const [settings, members, invitations] = await Promise.all([
    getOrgSettings(),
    getOrgMembers(),
    getOrgInvitations(),
  ]);

  if (!settings || settings.slug !== orgSlug) {
    notFound();
  }

  const canManageUsers =
    session.user.role === 'owner' ||
    session.user.role === 'admin';

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_150)]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
              Team members
            </h1>
            <p className="mt-1 text-sm text-[oklch(0.48_0_0)]">
              Manage members of{' '}
              <span className="font-medium text-[oklch(0.25_0.02_160)]">
                {settings.name}
              </span>
              .
            </p>
          </div>
          <Link
            href={`/${orgSlug}/settings`}
            className="text-sm text-[oklch(0.48_0_0)] hover:text-[oklch(0.25_0.02_160)] transition-colors"
          >
            ← Settings
          </Link>
        </div>

        {/* Invite section */}
        {canManageUsers && (
          <div className="mb-6 rounded-xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm">
            <div className="p-6">
              <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)] mb-4">
                Invite a team member
              </h2>
              <InviteMemberForm orgId={settings.id} orgSlug={orgSlug} />
            </div>
          </div>
        )}

        {/* Members list */}
        <div className="rounded-xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[oklch(0.93_0.005_150)]">
            <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">
              Members{' '}
              <span className="text-sm font-normal text-[oklch(0.55_0_0)] ml-1">
                ({members.length})
              </span>
            </h2>
          </div>
          <TeamMemberList
            members={members}
            invitations={invitations}
            currentUserId={session.user.id}
            currentUserRole={session.user.role ?? 'viewer'}
            canManage={canManageUsers}
            orgId={settings.id}
            orgSlug={orgSlug}
          />
        </div>
      </div>
    </div>
  );
}
