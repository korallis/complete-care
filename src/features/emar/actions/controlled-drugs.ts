'use server';

/**
 * Server actions and queries for Controlled Drugs register operations.
 * All CD operations require dual-witness authentication (VAL-EMAR-020).
 * All mutations are tenant-scoped, RBAC-protected, and audit-logged.
 */

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  cdRegisterEntries,
  cdRegisters,
  cdStockReconciliations,
  memberships,
  organisations,
  persons,
  transdermalPatches,
  users,
} from '@/lib/db/schema';
import { auditLog } from '@/lib/audit';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import {
  cdRegisterEntrySchema,
  cdReconciliationSchema,
  transdermalPatchSchema,
  patchRemovalSchema,
  dualWitnessSchema,
} from '../types';
import {
  calculateBalance,
  isPatchOverdue,
  validateCdTransaction,
  validateReconciliation,
} from '../lib/cd-register';

// ---------------------------------------------------------------------------
// Types for action responses + query payloads
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export type ControlledDrugStaffMember = {
  id: string;
  name: string;
};

export type ControlledDrugRegisterEntryView = {
  id: string;
  transactionDate: Date;
  transactionType: z.infer<typeof cdRegisterEntrySchema>['transactionType'];
  quantityIn: number;
  quantityOut: number;
  balanceAfter: number;
  performedByName: string;
  witnessedByName: string;
  sourceOrDestination: string | null;
  batchNumber: string | null;
  notes: string | null;
};

export type ControlledDrugPatchView = {
  id: string;
  applicationSite: string;
  appliedAt: Date;
  removedAt: Date | null;
  scheduledRemovalAt: Date | null;
  appliedByName: string;
  applicationWitnessName: string;
  removedByName: string | null;
  removalWitnessName: string | null;
  disposalMethod: string | null;
  status: 'active' | 'removed' | 'overdue';
};

export type ControlledDrugRegisterView = {
  id: string;
  medicationId: string;
  personId: string;
  name: string;
  strength: string;
  form: string;
  schedule: string;
  currentBalance: number;
  status: string;
  personName: string;
  lastReconciliation: Date | null;
  rotationHistory: string[];
  entries: ControlledDrugRegisterEntryView[];
  patches: ControlledDrugPatchView[];
};

const NOT_FOUND_ERROR = 'Controlled drug register not found';

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);

  return org?.slug ?? null;
}

async function revalidateControlledDrugPaths(orgId: string) {
  const slug = await getOrgSlug(orgId);
  if (!slug) return;

  revalidatePath(`/${slug}/emar/controlled-drugs`);
  revalidatePath(`/${slug}/emar/controlled-drugs/reconciliation`);
}

async function isMemberInOrg(userId: string, orgId: string): Promise<boolean> {
  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organisationId, orgId),
        eq(memberships.status, 'active'),
      ),
    )
    .limit(1);

  return Boolean(membership);
}

async function loadUserNameMap(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, string>();
  }

  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, [...new Set(userIds)]));

  return new Map(rows.map((row) => [row.id, row.name]));
}

function ensureDifferentWitness(performedBy: string, witnessedBy: string) {
  const witnessCheck = dualWitnessSchema.safeParse({ performedBy, witnessedBy });
  if (!witnessCheck.success) {
    return witnessCheck.error.errors[0].message;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export async function listControlledDrugRegisters(): Promise<ControlledDrugRegisterView[]> {
  const { orgId } = await requirePermission('read', 'medications');

  const registerRows = await db
    .select({
      id: cdRegisters.id,
      medicationId: cdRegisters.medicationId,
      personId: cdRegisters.personId,
      name: cdRegisters.name,
      strength: cdRegisters.strength,
      form: cdRegisters.form,
      schedule: cdRegisters.schedule,
      currentBalance: cdRegisters.currentBalance,
      status: cdRegisters.status,
      personName: persons.fullName,
    })
    .from(cdRegisters)
    .innerJoin(persons, eq(cdRegisters.personId, persons.id))
    .where(eq(cdRegisters.organisationId, orgId))
    .orderBy(asc(persons.fullName), asc(cdRegisters.name), asc(cdRegisters.strength));

  if (registerRows.length === 0) {
    return [];
  }

  const registerIds = registerRows.map((row) => row.id);

  const [entryRows, patchRows, reconciliationRows] = await Promise.all([
    db
      .select({
        id: cdRegisterEntries.id,
        registerId: cdRegisterEntries.registerId,
        transactionDate: cdRegisterEntries.transactionDate,
        transactionType: cdRegisterEntries.transactionType,
        quantityIn: cdRegisterEntries.quantityIn,
        quantityOut: cdRegisterEntries.quantityOut,
        balanceAfter: cdRegisterEntries.balanceAfter,
        performedBy: cdRegisterEntries.performedBy,
        witnessedBy: cdRegisterEntries.witnessedBy,
        sourceOrDestination: cdRegisterEntries.sourceOrDestination,
        batchNumber: cdRegisterEntries.batchNumber,
        notes: cdRegisterEntries.notes,
      })
      .from(cdRegisterEntries)
      .where(inArray(cdRegisterEntries.registerId, registerIds))
      .orderBy(desc(cdRegisterEntries.transactionDate)),
    db
      .select({
        id: transdermalPatches.id,
        registerId: transdermalPatches.registerId,
        applicationSite: transdermalPatches.applicationSite,
        appliedAt: transdermalPatches.appliedAt,
        removedAt: transdermalPatches.removedAt,
        scheduledRemovalAt: transdermalPatches.scheduledRemovalAt,
        appliedBy: transdermalPatches.appliedBy,
        applicationWitnessedBy: transdermalPatches.applicationWitnessedBy,
        removedBy: transdermalPatches.removedBy,
        removalWitnessedBy: transdermalPatches.removalWitnessedBy,
        disposalMethod: transdermalPatches.disposalMethod,
        status: transdermalPatches.status,
      })
      .from(transdermalPatches)
      .where(inArray(transdermalPatches.registerId, registerIds))
      .orderBy(desc(transdermalPatches.appliedAt)),
    db
      .select({
        registerId: cdStockReconciliations.registerId,
        reconciliationDate: cdStockReconciliations.reconciliationDate,
      })
      .from(cdStockReconciliations)
      .where(inArray(cdStockReconciliations.registerId, registerIds))
      .orderBy(desc(cdStockReconciliations.reconciliationDate)),
  ]);

  const nameMap = await loadUserNameMap(
    [
      ...entryRows.flatMap((row) => [row.performedBy, row.witnessedBy]),
      ...patchRows.flatMap((row) => [
        row.appliedBy,
        row.applicationWitnessedBy,
        row.removedBy,
        row.removalWitnessedBy,
      ]),
    ].filter((value): value is string => Boolean(value)),
  );

  const entriesByRegister = new Map<string, ControlledDrugRegisterEntryView[]>();
  for (const row of entryRows) {
    const list = entriesByRegister.get(row.registerId) ?? [];
    list.push({
      id: row.id,
      transactionDate: row.transactionDate,
      transactionType: row.transactionType as ControlledDrugRegisterEntryView['transactionType'],
      quantityIn: row.quantityIn,
      quantityOut: row.quantityOut,
      balanceAfter: row.balanceAfter,
      performedByName: nameMap.get(row.performedBy) ?? 'Unknown',
      witnessedByName: nameMap.get(row.witnessedBy) ?? 'Unknown',
      sourceOrDestination: row.sourceOrDestination,
      batchNumber: row.batchNumber,
      notes: row.notes,
    });
    entriesByRegister.set(row.registerId, list);
  }

  const patchesByRegister = new Map<string, ControlledDrugPatchView[]>();
  const rotationHistoryByRegister = new Map<string, string[]>();
  for (const row of [...patchRows].sort((a, b) => a.appliedAt.getTime() - b.appliedAt.getTime())) {
    const computedStatus: ControlledDrugPatchView['status'] = row.removedAt
      ? 'removed'
      : isPatchOverdue(row.scheduledRemovalAt, row.removedAt)
        ? 'overdue'
        : 'active';

    const history = rotationHistoryByRegister.get(row.registerId) ?? [];
    history.push(row.applicationSite);
    rotationHistoryByRegister.set(row.registerId, history);

    const list = patchesByRegister.get(row.registerId) ?? [];
    list.unshift({
      id: row.id,
      applicationSite: row.applicationSite,
      appliedAt: row.appliedAt,
      removedAt: row.removedAt,
      scheduledRemovalAt: row.scheduledRemovalAt,
      appliedByName: nameMap.get(row.appliedBy) ?? 'Unknown',
      applicationWitnessName:
        nameMap.get(row.applicationWitnessedBy) ?? 'Unknown',
      removedByName: row.removedBy ? nameMap.get(row.removedBy) ?? 'Unknown' : null,
      removalWitnessName: row.removalWitnessedBy
        ? nameMap.get(row.removalWitnessedBy) ?? 'Unknown'
        : null,
      disposalMethod: row.disposalMethod,
      status: computedStatus,
    });
    patchesByRegister.set(row.registerId, list);
  }

  const lastReconciliationByRegister = new Map<string, Date>();
  for (const row of reconciliationRows) {
    if (!lastReconciliationByRegister.has(row.registerId)) {
      lastReconciliationByRegister.set(row.registerId, row.reconciliationDate);
    }
  }

  return registerRows.map((row) => ({
    id: row.id,
    medicationId: row.medicationId,
    personId: row.personId,
    name: row.name,
    strength: row.strength,
    form: row.form,
    schedule: row.schedule,
    currentBalance: row.currentBalance,
    status: row.status,
    personName: row.personName,
    lastReconciliation: lastReconciliationByRegister.get(row.id) ?? null,
    rotationHistory: rotationHistoryByRegister.get(row.id) ?? [],
    entries: entriesByRegister.get(row.id) ?? [],
    patches: patchesByRegister.get(row.id) ?? [],
  }));
}

export async function listControlledDrugStaffMembers(): Promise<ControlledDrugStaffMember[]> {
  const { orgId } = await requirePermission('read', 'medications');

  return db
    .select({ id: users.id, name: users.name })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(
      and(
        eq(memberships.organisationId, orgId),
        eq(memberships.status, 'active'),
      ),
    )
    .orderBy(asc(users.name));
}

// ---------------------------------------------------------------------------
// CD Register Entry — Receipt, Administration, Disposal, Destruction
// ---------------------------------------------------------------------------

export async function recordCdTransaction(
  formData: z.infer<typeof cdRegisterEntrySchema>,
): Promise<ActionResult<{ entryId: string; newBalance: number }>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'medications');

    const parsed = cdRegisterEntrySchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const witnessError = ensureDifferentWitness(userId, parsed.data.witnessedBy);
    if (witnessError) {
      return { success: false, error: witnessError };
    }

    if (!(await isMemberInOrg(parsed.data.witnessedBy, orgId))) {
      return { success: false, error: 'Witness must be an active staff member in this organisation' };
    }

    const [register] = await db
      .select({
        id: cdRegisters.id,
        personId: cdRegisters.personId,
        currentBalance: cdRegisters.currentBalance,
      })
      .from(cdRegisters)
      .where(
        and(
          eq(cdRegisters.id, parsed.data.registerId),
          eq(cdRegisters.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!register) {
      return { success: false, error: NOT_FOUND_ERROR };
    }

    if (
      parsed.data.administeredToPersonId &&
      parsed.data.administeredToPersonId !== register.personId
    ) {
      return { success: false, error: 'Administration target does not match the register person' };
    }

    const validationError = validateCdTransaction({
      currentBalance: register.currentBalance,
      transactionType: parsed.data.transactionType,
      quantityIn: parsed.data.quantityIn,
      quantityOut: parsed.data.quantityOut,
      performedBy: userId,
      witnessedBy: parsed.data.witnessedBy,
    });

    if (validationError) {
      return { success: false, error: validationError };
    }

    const newBalance = calculateBalance(
      register.currentBalance,
      parsed.data.transactionType,
      parsed.data.quantityIn,
      parsed.data.quantityOut,
    );

    const [entry] = await db
      .insert(cdRegisterEntries)
      .values({
        organisationId: orgId,
        registerId: register.id,
        transactionType: parsed.data.transactionType,
        quantityIn: parsed.data.quantityIn,
        quantityOut: parsed.data.quantityOut,
        balanceAfter: newBalance,
        transactionDate: parsed.data.transactionDate,
        performedBy: userId,
        witnessedBy: parsed.data.witnessedBy,
        sourceOrDestination: parsed.data.sourceOrDestination ?? null,
        batchNumber: parsed.data.batchNumber ?? null,
        administeredToPersonId: parsed.data.administeredToPersonId ?? null,
        disposalMethod: parsed.data.disposalMethod ?? null,
        notes: parsed.data.notes ?? null,
      })
      .returning({ id: cdRegisterEntries.id });

    await db
      .update(cdRegisters)
      .set({ currentBalance: newBalance, updatedAt: new Date() })
      .where(eq(cdRegisters.id, register.id));

    await auditLog(
      'record_cd_transaction',
      'cd_register_entry',
      entry.id,
      {
        before: { currentBalance: register.currentBalance },
        after: {
          registerId: register.id,
          transactionType: parsed.data.transactionType,
          quantityIn: parsed.data.quantityIn,
          quantityOut: parsed.data.quantityOut,
          newBalance,
        },
      },
      { userId, organisationId: orgId },
    );

    await revalidateControlledDrugPaths(orgId);

    return {
      success: true,
      data: {
        entryId: entry.id,
        newBalance,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }

    console.error('[recordCdTransaction] Error:', error);
    return { success: false, error: 'Failed to record controlled drug transaction' };
  }
}

// ---------------------------------------------------------------------------
// Stock Reconciliation
// ---------------------------------------------------------------------------

export async function recordStockReconciliation(
  formData: z.infer<typeof cdReconciliationSchema>,
): Promise<
  ActionResult<{
    reconciliationId: string;
    hasDiscrepancy: boolean;
    cdaoNotificationRequired: boolean;
  }>
> {
  try {
    const { orgId, userId } = await requirePermission('update', 'medications');

    const parsed = cdReconciliationSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const witnessError = ensureDifferentWitness(userId, parsed.data.witnessedBy);
    if (witnessError) {
      return { success: false, error: witnessError };
    }

    if (!(await isMemberInOrg(parsed.data.witnessedBy, orgId))) {
      return { success: false, error: 'Witness must be an active staff member in this organisation' };
    }

    const [register] = await db
      .select({ id: cdRegisters.id })
      .from(cdRegisters)
      .where(
        and(
          eq(cdRegisters.id, parsed.data.registerId),
          eq(cdRegisters.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!register) {
      return { success: false, error: NOT_FOUND_ERROR };
    }

    const validation = validateReconciliation({
      expectedBalance: parsed.data.expectedBalance,
      actualCount: parsed.data.actualCount,
      investigationNotes: parsed.data.investigationNotes,
      performedBy: userId,
      witnessedBy: parsed.data.witnessedBy,
    });

    if (!validation.isValid) {
      return { success: false, error: validation.error ?? 'Invalid reconciliation' };
    }

    const [reconciliation] = await db
      .insert(cdStockReconciliations)
      .values({
        organisationId: orgId,
        registerId: register.id,
        expectedBalance: parsed.data.expectedBalance,
        actualCount: parsed.data.actualCount,
        hasDiscrepancy: validation.hasDiscrepancy,
        discrepancyAmount: validation.discrepancyAmount,
        reconciliationDate: parsed.data.reconciliationDate,
        performedBy: userId,
        witnessedBy: parsed.data.witnessedBy,
        investigationNotes: parsed.data.investigationNotes ?? null,
        cdaoNotified: validation.hasDiscrepancy ? parsed.data.cdaoNotified : false,
        cdaoNotifiedDate:
          validation.hasDiscrepancy && parsed.data.cdaoNotified ? new Date() : null,
        cdaoUserId:
          validation.hasDiscrepancy && parsed.data.cdaoNotified ? userId : null,
        outcome: validation.hasDiscrepancy ? 'under_investigation' : 'resolved',
        resolutionNotes: validation.hasDiscrepancy ? null : 'No discrepancy identified during reconciliation',
        status: validation.hasDiscrepancy ? 'pending_investigation' : 'completed',
      })
      .returning({ id: cdStockReconciliations.id });

    await auditLog(
      'record_cd_reconciliation',
      'cd_stock_reconciliation',
      reconciliation.id,
      {
        before: null,
        after: {
          registerId: register.id,
          expectedBalance: parsed.data.expectedBalance,
          actualCount: parsed.data.actualCount,
          hasDiscrepancy: validation.hasDiscrepancy,
          discrepancyAmount: validation.discrepancyAmount,
        },
      },
      { userId, organisationId: orgId },
    );

    await revalidateControlledDrugPaths(orgId);

    return {
      success: true,
      data: {
        reconciliationId: reconciliation.id,
        hasDiscrepancy: validation.hasDiscrepancy,
        cdaoNotificationRequired: validation.hasDiscrepancy,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }

    console.error('[recordStockReconciliation] Error:', error);
    return { success: false, error: 'Failed to record stock reconciliation' };
  }
}

// ---------------------------------------------------------------------------
// Transdermal Patch Operations
// ---------------------------------------------------------------------------

export async function recordPatchApplication(
  formData: z.infer<typeof transdermalPatchSchema>,
): Promise<ActionResult<{ patchId: string }>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'medications');

    const parsed = transdermalPatchSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const witnessError = ensureDifferentWitness(userId, parsed.data.applicationWitnessedBy);
    if (witnessError) {
      return { success: false, error: witnessError };
    }

    if (!(await isMemberInOrg(parsed.data.applicationWitnessedBy, orgId))) {
      return { success: false, error: 'Witness must be an active staff member in this organisation' };
    }

    const [[register], existingActivePatch, priorPatches] = await Promise.all([
      db
        .select({
          id: cdRegisters.id,
          medicationId: cdRegisters.medicationId,
          personId: cdRegisters.personId,
        })
        .from(cdRegisters)
        .where(
          and(
            eq(cdRegisters.id, parsed.data.registerId),
            eq(cdRegisters.organisationId, orgId),
          ),
        )
        .limit(1),
      db
        .select({ id: transdermalPatches.id })
        .from(transdermalPatches)
        .where(
          and(
            eq(transdermalPatches.registerId, parsed.data.registerId),
            eq(transdermalPatches.organisationId, orgId),
            isNull(transdermalPatches.removedAt),
          ),
        )
        .limit(1),
      db
        .select({ applicationSite: transdermalPatches.applicationSite })
        .from(transdermalPatches)
        .where(
          and(
            eq(transdermalPatches.registerId, parsed.data.registerId),
            eq(transdermalPatches.organisationId, orgId),
          ),
        )
        .orderBy(desc(transdermalPatches.appliedAt)),
    ]);

    if (!register) {
      return { success: false, error: NOT_FOUND_ERROR };
    }

    if (
      register.medicationId !== parsed.data.medicationId ||
      register.personId !== parsed.data.personId
    ) {
      return { success: false, error: 'Patch details do not match the selected controlled drug register' };
    }

    if (existingActivePatch) {
      return { success: false, error: 'An active transdermal patch is already recorded for this register' };
    }

    const [patch] = await db
      .insert(transdermalPatches)
      .values({
        organisationId: orgId,
        registerId: register.id,
        medicationId: parsed.data.medicationId,
        personId: parsed.data.personId,
        applicationSite: parsed.data.applicationSite,
        applicationSiteDetail: parsed.data.applicationSiteDetail ?? null,
        appliedAt: parsed.data.appliedAt,
        scheduledRemovalAt: parsed.data.scheduledRemovalAt ?? null,
        appliedBy: userId,
        applicationWitnessedBy: parsed.data.applicationWitnessedBy,
        rotationHistory: priorPatches.map((row) => row.applicationSite),
        status: 'active',
        notes: parsed.data.notes ?? null,
      })
      .returning({ id: transdermalPatches.id });

    await auditLog(
      'record_patch_application',
      'transdermal_patch',
      patch.id,
      {
        before: null,
        after: {
          registerId: register.id,
          medicationId: parsed.data.medicationId,
          personId: parsed.data.personId,
          applicationSite: parsed.data.applicationSite,
        },
      },
      { userId, organisationId: orgId },
    );

    await revalidateControlledDrugPaths(orgId);

    return {
      success: true,
      data: { patchId: patch.id },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }

    console.error('[recordPatchApplication] Error:', error);
    return { success: false, error: 'Failed to record patch application' };
  }
}

export async function recordPatchRemoval(
  formData: z.infer<typeof patchRemovalSchema>,
): Promise<ActionResult<{ patchId: string }>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'medications');

    const parsed = patchRemovalSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const witnessError = ensureDifferentWitness(userId, parsed.data.removalWitnessedBy);
    if (witnessError) {
      return { success: false, error: witnessError };
    }

    if (!(await isMemberInOrg(parsed.data.removalWitnessedBy, orgId))) {
      return { success: false, error: 'Witness must be an active staff member in this organisation' };
    }

    const [existingPatch] = await db
      .select({
        id: transdermalPatches.id,
        removedAt: transdermalPatches.removedAt,
        notes: transdermalPatches.notes,
      })
      .from(transdermalPatches)
      .where(
        and(
          eq(transdermalPatches.id, parsed.data.patchId),
          eq(transdermalPatches.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!existingPatch) {
      return { success: false, error: 'Transdermal patch record not found' };
    }

    if (existingPatch.removedAt) {
      return { success: false, error: 'This patch has already been removed' };
    }

    await db
      .update(transdermalPatches)
      .set({
        removedAt: parsed.data.removedAt,
        removedBy: userId,
        removalWitnessedBy: parsed.data.removalWitnessedBy,
        disposalMethod: parsed.data.disposalMethod,
        disposalWitnessed: true,
        status: 'removed',
        notes: parsed.data.notes ?? existingPatch.notes ?? null,
      })
      .where(eq(transdermalPatches.id, parsed.data.patchId));

    await auditLog(
      'record_patch_removal',
      'transdermal_patch',
      parsed.data.patchId,
      {
        before: { removedAt: null },
        after: {
          removedAt: parsed.data.removedAt,
          removedBy: userId,
          removalWitnessedBy: parsed.data.removalWitnessedBy,
          disposalMethod: parsed.data.disposalMethod,
        },
      },
      { userId, organisationId: orgId },
    );

    await revalidateControlledDrugPaths(orgId);

    return {
      success: true,
      data: { patchId: parsed.data.patchId },
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }

    console.error('[recordPatchRemoval] Error:', error);
    return { success: false, error: 'Failed to record patch removal' };
  }
}
