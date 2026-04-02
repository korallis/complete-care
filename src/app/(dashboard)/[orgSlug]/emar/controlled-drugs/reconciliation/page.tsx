import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  listControlledDrugRegisters,
  listControlledDrugStaffMembers,
  recordStockReconciliation,
} from '@/features/emar/actions/controlled-drugs';
import { ReconciliationPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Stock Reconciliation | Controlled Drugs | EMAR',
  description:
    'Weekly CD stock reconciliation with discrepancy investigation and CDAO notification.',
};

interface ReconciliationPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ReconciliationPage({ params }: ReconciliationPageProps) {
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
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/emar/controlled-drugs/reconciliation`);
  }

  const [registers, staffMembers] = await Promise.all([
    listControlledDrugRegisters(),
    listControlledDrugStaffMembers(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Stock Reconciliation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Weekly stock check: compare running balance to physical count.
          Discrepancies require investigation notes and CDAO notification.
        </p>
      </div>
      <ReconciliationPageClient
        currentUserId={session.user.id}
        staffMembers={staffMembers}
        registers={registers}
        onRecordStockReconciliation={recordStockReconciliation}
      />
    </div>
  );
}
