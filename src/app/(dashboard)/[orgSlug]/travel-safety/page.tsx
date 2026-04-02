import type { Metadata } from 'next';
import { asc, eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { persons } from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import { requirePermission } from '@/lib/rbac/server';
import {
  acknowledgeSosAlert,
  checkInWelfare,
  createSosAlert,
  getActiveSosAlerts,
  getActiveWelfareChecks,
  getClientEnvironments,
  getLoneWorkerConfig,
  getTravelRecords,
  resolveSosAlert,
  resolveWelfareCheck,
  upsertClientEnvironment,
  upsertLoneWorkerConfig,
} from '@/features/travel-safety/actions';
import { TravelSafetyPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Travel & Safety',
  description:
    'Travel-time monitoring, lone-worker safety, SOS alerts, and client environment records.',
};

interface TravelSafetyPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function TravelSafetyPage({
  params,
}: TravelSafetyPageProps) {
  const { orgSlug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const membershipsForUser = session.user.memberships ?? [];
  const activeMembership = membershipsForUser.find(
    (membership) => membership.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = membershipsForUser.find(
      (membership) => membership.orgSlug === orgSlug,
    );
    if (!targetMembership) {
      notFound();
    }

    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/travel-safety`);
  }

  const { orgId, role } = await requirePermission('read', 'rota');

  const clientOptions = await (
    hasPermission(role, 'read', 'persons')
      ? db
          .select({ id: persons.id, fullName: persons.fullName })
          .from(persons)
          .where(eq(persons.organisationId, orgId))
          .orderBy(asc(persons.fullName))
      : Promise.resolve([])
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    travelRecordsResult,
    welfareChecksResult,
    sosAlertsResult,
    clientEnvironmentsResult,
    loneWorkerConfigResult,
  ] = await Promise.all([
    getTravelRecords({
      organisationId: orgId,
      dateFrom: thirtyDaysAgo,
      dateTo: new Date(),
    }),
    getActiveWelfareChecks(orgId),
    getActiveSosAlerts(orgId),
    hasPermission(role, 'read', 'persons')
      ? getClientEnvironments(orgId)
      : Promise.resolve({ success: true as const, data: [] }),
    getLoneWorkerConfig(orgId),
  ]);

  if (
    !travelRecordsResult.success ||
    !welfareChecksResult.success ||
    !sosAlertsResult.success ||
    !clientEnvironmentsResult.success ||
    !loneWorkerConfigResult.success
  ) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <TravelSafetyPageClient
        orgId={orgId}
        orgSlug={orgSlug}
        currentUserId={session.user.id}
        role={role}
        clientOptions={clientOptions}
        travelRecords={travelRecordsResult.data}
        welfareChecks={welfareChecksResult.data}
        sosAlerts={sosAlertsResult.data}
        clientEnvironments={clientEnvironmentsResult.data}
        loneWorkerConfig={loneWorkerConfigResult.data}
        onCreateSosAlert={createSosAlert}
        onAcknowledgeSosAlert={acknowledgeSosAlert}
        onResolveSosAlert={resolveSosAlert}
        onCheckInWelfare={checkInWelfare}
        onResolveWelfareCheck={resolveWelfareCheck}
        onUpsertClientEnvironment={upsertClientEnvironment}
        onUpsertLoneWorkerConfig={upsertLoneWorkerConfig}
      />
    </div>
  );
}
