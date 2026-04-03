import type { Metadata } from 'next';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  medicationStock,
  reorderRequests,
  stockBatches,
  stockTransactions,
} from '@/lib/db/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { getExpiryAlerts } from '@/features/emar/stock/actions';
import { listControlledDrugStaffMembers } from '@/features/emar/actions/controlled-drugs';
import { StockDashboardPageClient } from './page-client';

export const metadata: Metadata = {
  title: 'Stock Management | EMAR',
  description:
    'Medication stock, expiry tracking, and reorder workflows for EMAR.',
};

interface StockPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function StockManagementPage({ params }: StockPageProps) {
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
    redirect(`/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/emar/stock`);
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'medications');
  const canManage = hasPermission(role, 'update', 'medications');
  const canCreate = hasPermission(role, 'create', 'medications');

  if (!canRead) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  const organisationId = session.user.activeOrgId;
  const [stockRows, reorderRows, expiryAlerts, staffMembers] = await Promise.all([
    db
      .select()
      .from(medicationStock)
      .where(eq(medicationStock.organisationId, organisationId))
      .orderBy(asc(medicationStock.medicationName)),
    db
      .select({
        id: reorderRequests.id,
        medicationStockId: reorderRequests.medicationStockId,
        medicationName: medicationStock.medicationName,
        quantityRequested: reorderRequests.quantityRequested,
        quantityReceived: reorderRequests.quantityReceived,
        status: reorderRequests.status,
        pharmacyNotified: reorderRequests.pharmacyNotified,
        pharmacyReference: reorderRequests.pharmacyReference,
        expectedDeliveryDate: reorderRequests.expectedDeliveryDate,
        createdAt: reorderRequests.createdAt,
      })
      .from(reorderRequests)
      .innerJoin(medicationStock, eq(reorderRequests.medicationStockId, medicationStock.id))
      .where(eq(reorderRequests.organisationId, organisationId))
      .orderBy(desc(reorderRequests.createdAt)),
    getExpiryAlerts(organisationId),
    listControlledDrugStaffMembers(),
  ]);

  const stockIds = stockRows.map((row) => row.id);
  const [batchRows, recentTransactions] = stockIds.length
    ? await Promise.all([
        db
          .select({
            id: stockBatches.id,
            medicationStockId: stockBatches.medicationStockId,
            batchNumber: stockBatches.batchNumber,
            expiryDate: stockBatches.expiryDate,
            quantity: stockBatches.quantity,
            isExhausted: stockBatches.isExhausted,
            expiryAlertAcknowledged: stockBatches.expiryAlertAcknowledged,
          })
          .from(stockBatches)
          .where(
            and(
              eq(stockBatches.organisationId, organisationId),
              inArray(stockBatches.medicationStockId, stockIds),
            ),
          )
          .orderBy(asc(stockBatches.expiryDate)),
        db
          .select({
            id: stockTransactions.id,
            medicationStockId: stockTransactions.medicationStockId,
            medicationName: medicationStock.medicationName,
            transactionType: stockTransactions.transactionType,
            quantity: stockTransactions.quantity,
            balanceAfter: stockTransactions.balanceAfter,
            reason: stockTransactions.reason,
            sourceDestination: stockTransactions.sourceDestination,
            createdAt: stockTransactions.createdAt,
          })
          .from(stockTransactions)
          .innerJoin(medicationStock, eq(stockTransactions.medicationStockId, medicationStock.id))
          .where(eq(stockTransactions.organisationId, organisationId))
          .orderBy(desc(stockTransactions.createdAt))
          .limit(12),
      ])
    : [[], []];

  const batchesByStock = new Map<string, typeof batchRows>();
  for (const batch of batchRows) {
    const current = batchesByStock.get(batch.medicationStockId) ?? [];
    current.push(batch);
    batchesByStock.set(batch.medicationStockId, current);
  }

  const openReorderCounts = new Map<string, number>();
  for (const reorder of reorderRows) {
    if (['pending', 'approved', 'ordered', 'partially_received'].includes(reorder.status)) {
      openReorderCounts.set(
        reorder.medicationStockId,
        (openReorderCounts.get(reorder.medicationStockId) ?? 0) + 1,
      );
    }
  }

  const stockItems = stockRows.map((row) => ({
    ...row,
    lowStock:
      row.reorderPoint > 0
        ? row.currentQuantity <= row.reorderPoint
        : row.currentQuantity <= row.minimumThreshold,
    openReorders: openReorderCounts.get(row.id) ?? 0,
    batches: batchesByStock.get(row.id) ?? [],
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          EMAR Stock Management
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track stock levels, batch expiry, and reorder activity across the organisation.
        </p>
      </div>
      <StockDashboardPageClient
        organisationId={organisationId}
        currentUserId={session.user.id}
        canCreate={canCreate}
        canManage={canManage}
        stockItems={stockItems}
        expiryAlerts={expiryAlerts}
        reorders={reorderRows}
        recentTransactions={recentTransactions}
        staffMembers={staffMembers}
      />
    </div>
  );
}
