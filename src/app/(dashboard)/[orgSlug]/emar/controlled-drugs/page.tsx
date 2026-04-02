import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  listControlledDrugRegisters,
  listControlledDrugStaffMembers,
  recordCdTransaction,
  recordPatchApplication,
  recordPatchRemoval,
} from '@/features/emar/actions/controlled-drugs';
import { CdRegisterPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Controlled Drugs Register | EMAR',
  description:
    'Controlled drugs register with dual-witness recording, running balance, and transdermal patch tracking.',
};

interface ControlledDrugsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ControlledDrugsPage({ params }: ControlledDrugsPageProps) {
  const { orgSlug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (membership) => membership.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((membership) => membership.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/emar/controlled-drugs`);
  }

  const [registers, staffMembers] = await Promise.all([
    listControlledDrugRegisters(),
    listControlledDrugStaffMembers(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Controlled Drugs Register
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Per-person per-drug per-strength register with dual-witness recording
          and running balance. All CD operations require two staff members.
        </p>
      </div>
      <CdRegisterPageClient
        currentUserId={session.user.id}
        staffMembers={staffMembers}
        registers={registers}
        onRecordCdTransaction={recordCdTransaction}
        onRecordPatchApplication={recordPatchApplication}
        onRecordPatchRemoval={recordPatchRemoval}
      />
    </div>
  );
}
