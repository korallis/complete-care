import type { Metadata } from 'next';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  handoverReports,
  homelyRemedyProtocols,
  medicationErrors,
  medicationStock,
  persons,
  topicalMar,
} from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { listControlledDrugStaffMembers } from '@/features/emar/actions/controlled-drugs';
import { ErrorHandoverPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Medication Errors & Handover | EMAR',
  description:
    'Medication error reporting, shift handover generation, topical MAR, and homely remedies.',
};

interface ErrorsPageProps {
  params: Promise<{ orgSlug: string }>;
}

type HandoverSummaryView = {
  administrations?: { total?: number; onTime?: number; late?: number; missed?: number };
  refusals?: unknown[];
  prnUsage?: unknown[];
  errors?: unknown[];
  notes?: string;
};

export default async function EmarErrorsPage({ params }: ErrorsPageProps) {
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
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/emar/errors`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'medications');
  const canCreate = hasPermission(role, 'create', 'medications');
  const canManage = hasPermission(role, 'update', 'medications');

  if (!canRead) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  const organisationId = session.user.activeOrgId;
  const [people, stockOptions, staffMembers, errorRows, handoverRows, topicalRows, homelyRows] =
    await Promise.all([
      db
        .select({ id: persons.id, fullName: persons.fullName })
        .from(persons)
        .where(eq(persons.organisationId, organisationId))
        .orderBy(asc(persons.fullName)),
      db
        .select({
          id: medicationStock.id,
          medicationName: medicationStock.medicationName,
          strength: medicationStock.strength,
        })
        .from(medicationStock)
        .where(eq(medicationStock.organisationId, organisationId))
        .orderBy(asc(medicationStock.medicationName)),
      listControlledDrugStaffMembers(),
      db
        .select()
        .from(medicationErrors)
        .where(eq(medicationErrors.organisationId, organisationId))
        .orderBy(desc(medicationErrors.occurredAt))
        .limit(12),
      db
        .select()
        .from(handoverReports)
        .where(eq(handoverReports.organisationId, organisationId))
        .orderBy(desc(handoverReports.shiftStartAt))
        .limit(12),
      db
        .select()
        .from(topicalMar)
        .where(eq(topicalMar.organisationId, organisationId))
        .orderBy(desc(topicalMar.createdAt))
        .limit(12),
      db
        .select()
        .from(homelyRemedyProtocols)
        .where(eq(homelyRemedyProtocols.organisationId, organisationId))
        .orderBy(desc(homelyRemedyProtocols.createdAt))
        .limit(12),
    ]);

  const personNameMap = new Map(people.map((person) => [person.id, person.fullName]));
  const stockNameMap = new Map(
    stockOptions.map((stock) => [stock.id, `${stock.medicationName} · ${stock.strength}`]),
  );

  const relevantPersonIds = Array.from(
    new Set(topicalRows.map((row) => row.personId).filter(Boolean)),
  );
  const topicalPersonNames =
    relevantPersonIds.length > 0
      ? new Map(
          (
            await db
              .select({ id: persons.id, fullName: persons.fullName })
              .from(persons)
              .where(
                and(
                  eq(persons.organisationId, organisationId),
                  inArray(persons.id, relevantPersonIds),
                ),
              )
          ).map((row) => [row.id, row.fullName]),
        )
      : new Map<string, string>();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Medication Errors & Handover
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Report incidents, complete investigations, generate shift handovers, and manage topical / homely remedy workflows.
        </p>
      </div>
      <ErrorHandoverPageClient
        organisationId={organisationId}
        currentUserId={session.user.id}
        canCreate={canCreate}
        canManage={canManage}
        people={people}
        stockOptions={stockOptions}
        staffMembers={staffMembers}
        errors={errorRows.map((row) => ({
          ...row,
          personName: row.personId ? personNameMap.get(row.personId) ?? 'Unknown person' : null,
          medicationName: row.medicationStockId
            ? stockNameMap.get(row.medicationStockId) ?? 'Unknown medication'
            : null,
        }))}
        handovers={handoverRows.map((row) => ({
          ...row,
          summary:
            typeof row.summary === 'object' && row.summary !== null
              ? (row.summary as HandoverSummaryView)
              : {},
        }))}
        topicalRecords={topicalRows.map((row) => ({
          ...row,
          personName: topicalPersonNames.get(row.personId) ?? 'Unknown person',
        }))}
        homelyProtocols={homelyRows}
      />
    </div>
  );
}
