'use server';

/**
 * Personal Budgets Server Actions
 *
 * CRUD for personal budgets, spend items, and support hour logs.
 * Supports variance reporting and commissioner reporting.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, sum } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  personalBudgets,
  budgetSpendItems,
  supportHourLogs,
  organisations,
} from '@/lib/db/schema';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createBudgetSchema = z.object({
  personId: z.string().uuid(),
  budgetName: z.string().min(1),
  allocatedAmount: z.string().min(1),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  commissionerType: z.enum(['local_authority', 'nhs', 'private', 'mixed']).default('local_authority'),
  commissionerName: z.string().optional(),
});

const addSpendItemSchema = z.object({
  budgetId: z.string().uuid(),
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.string().min(1),
  spendDate: z.string().min(1),
  reference: z.string().optional(),
});

const logSupportHoursSchema = z.object({
  personId: z.string().uuid(),
  budgetId: z.string().uuid().optional(),
  weekNumber: z.number().int().min(1).max(53),
  year: z.number().int().min(2020),
  plannedHours: z.string().min(1),
  actualHours: z.string().default('0'),
  varianceReason: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Personal Budgets CRUD
// ---------------------------------------------------------------------------

export async function listBudgets({
  personId,
  page = 1,
  pageSize = 20,
  status,
}: {
  personId?: string;
  page?: number;
  pageSize?: number;
  status?: string;
} = {}) {
  const { orgId } = await requirePermission('read', 'billing');

  const conditions = [eq(personalBudgets.organisationId, orgId)];
  if (personId) conditions.push(eq(personalBudgets.personId, personId));
  if (status) conditions.push(eq(personalBudgets.status, status));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(personalBudgets)
      .where(whereClause)
      .orderBy(desc(personalBudgets.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(personalBudgets).where(whereClause),
  ]);

  return {
    budgets: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getBudget(id: string) {
  const { orgId } = await requirePermission('read', 'billing');

  const [row] = await db
    .select()
    .from(personalBudgets)
    .where(eq(personalBudgets.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function createBudget(
  input: z.infer<typeof createBudgetSchema>,
): Promise<ActionResult<typeof personalBudgets.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'billing');

    const parsed = createBudgetSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(personalBudgets)
      .values({
        organisationId: orgId,
        personId: data.personId,
        budgetName: data.budgetName,
        allocatedAmount: data.allocatedAmount,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        commissionerType: data.commissionerType,
        commissionerName: data.commissionerName ?? null,
        status: 'active',
        createdBy: userId,
      })
      .returning();

    await auditLog('create', 'personal_budget', row.id, {
      before: null,
      after: { personId: data.personId, budgetName: data.budgetName, amount: data.allocatedAmount },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/budgets`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createBudget] Error:', error);
    return { success: false, error: 'Failed to create personal budget' };
  }
}

export async function updateBudget(
  id: string,
  input: Partial<z.infer<typeof createBudgetSchema>>,
): Promise<ActionResult<typeof personalBudgets.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'billing');

    const [existing] = await db
      .select()
      .from(personalBudgets)
      .where(eq(personalBudgets.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Budget not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof personalBudgets.$inferInsert> = { updatedAt: new Date() };
    if (input.budgetName !== undefined) updates.budgetName = input.budgetName;
    if (input.allocatedAmount !== undefined) updates.allocatedAmount = input.allocatedAmount;
    if (input.periodStart !== undefined) updates.periodStart = new Date(input.periodStart);
    if (input.periodEnd !== undefined) updates.periodEnd = new Date(input.periodEnd);
    if (input.commissionerType !== undefined) updates.commissionerType = input.commissionerType;
    if (input.commissionerName !== undefined) updates.commissionerName = input.commissionerName ?? null;

    const [updated] = await db
      .update(personalBudgets)
      .set(updates)
      .where(eq(personalBudgets.id, id))
      .returning();

    await auditLog('update', 'personal_budget', id, {
      before: { budgetName: existing.budgetName, amount: existing.allocatedAmount },
      after: { budgetName: updated.budgetName, amount: updated.allocatedAmount },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/budgets`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateBudget] Error:', error);
    return { success: false, error: 'Failed to update personal budget' };
  }
}

export async function closeBudget(
  id: string,
): Promise<ActionResult<typeof personalBudgets.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'billing');

    const [existing] = await db
      .select()
      .from(personalBudgets)
      .where(eq(personalBudgets.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Budget not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const [updated] = await db
      .update(personalBudgets)
      .set({ status: 'closed', updatedAt: new Date() })
      .where(eq(personalBudgets.id, id))
      .returning();

    await auditLog('close', 'personal_budget', id, {
      before: { status: existing.status },
      after: { status: 'closed' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/budgets`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to close budget' };
  }
}

// ---------------------------------------------------------------------------
// Budget Summary
// ---------------------------------------------------------------------------

export async function getBudgetSummary(budgetId: string) {
  const { orgId } = await requirePermission('read', 'billing');

  const [budget] = await db
    .select()
    .from(personalBudgets)
    .where(eq(personalBudgets.id, budgetId))
    .limit(1);

  if (!budget) return null;
  assertBelongsToOrg(budget.organisationId, orgId);

  const [spendResult] = await db
    .select({ totalSpent: sum(budgetSpendItems.amount) })
    .from(budgetSpendItems)
    .where(eq(budgetSpendItems.budgetId, budgetId));

  const totalSpent = parseFloat(spendResult?.totalSpent ?? '0');
  const allocated = parseFloat(budget.allocatedAmount);
  const remaining = allocated - totalSpent;

  return {
    budget,
    totalSpent: totalSpent.toFixed(2),
    remaining: remaining.toFixed(2),
    percentUsed: allocated > 0 ? Math.round((totalSpent / allocated) * 100) : 0,
  };
}

// ---------------------------------------------------------------------------
// Spend Items
// ---------------------------------------------------------------------------

export async function listSpendItems({
  budgetId,
  page = 1,
  pageSize = 20,
  category,
}: {
  budgetId: string;
  page?: number;
  pageSize?: number;
  category?: string;
}) {
  const { orgId } = await requirePermission('read', 'billing');

  // Verify budget belongs to org
  const [budget] = await db
    .select({ organisationId: personalBudgets.organisationId })
    .from(personalBudgets)
    .where(eq(personalBudgets.id, budgetId))
    .limit(1);

  if (!budget) return { items: [], totalCount: 0, page, pageSize };
  assertBelongsToOrg(budget.organisationId, orgId);

  const conditions = [eq(budgetSpendItems.budgetId, budgetId)];
  if (category) conditions.push(eq(budgetSpendItems.category, category));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(budgetSpendItems)
      .where(whereClause)
      .orderBy(desc(budgetSpendItems.spendDate))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(budgetSpendItems).where(whereClause),
  ]);

  return {
    items: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function addSpendItem(
  input: z.infer<typeof addSpendItemSchema>,
): Promise<ActionResult<typeof budgetSpendItems.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'billing');

    const parsed = addSpendItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    // Verify budget belongs to org
    const [budget] = await db
      .select()
      .from(personalBudgets)
      .where(eq(personalBudgets.id, data.budgetId))
      .limit(1);

    if (!budget) return { success: false, error: 'Budget not found' };
    assertBelongsToOrg(budget.organisationId, orgId);

    const [row] = await db
      .insert(budgetSpendItems)
      .values({
        organisationId: orgId,
        budgetId: data.budgetId,
        category: data.category,
        description: data.description,
        amount: data.amount,
        spendDate: new Date(data.spendDate),
        reference: data.reference ?? null,
        createdBy: userId,
      })
      .returning();

    await auditLog('create', 'budget_spend_item', row.id, {
      before: null,
      after: { budgetId: data.budgetId, category: data.category, amount: data.amount },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${budget.personId}/budgets/${data.budgetId}`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[addSpendItem] Error:', error);
    return { success: false, error: 'Failed to add spend item' };
  }
}

// ---------------------------------------------------------------------------
// Support Hour Logs
// ---------------------------------------------------------------------------

export async function logSupportHours(
  input: z.infer<typeof logSupportHoursSchema>,
): Promise<ActionResult<typeof supportHourLogs.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'billing');

    const parsed = logSupportHoursSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;
    const planned = parseFloat(data.plannedHours);
    const actual = parseFloat(data.actualHours);
    const variance = actual - planned;

    const [row] = await db
      .insert(supportHourLogs)
      .values({
        organisationId: orgId,
        personId: data.personId,
        budgetId: data.budgetId ?? null,
        weekNumber: data.weekNumber,
        year: data.year,
        plannedHours: data.plannedHours,
        actualHours: data.actualHours,
        varianceHours: variance.toFixed(2),
        varianceReason: data.varianceReason ?? null,
        createdBy: userId,
      })
      .returning();

    await auditLog('create', 'support_hour_log', row.id, {
      before: null,
      after: { personId: data.personId, week: data.weekNumber, year: data.year, variance: variance.toFixed(2) },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/budgets`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[logSupportHours] Error:', error);
    return { success: false, error: 'Failed to log support hours' };
  }
}

export async function getVarianceReport({
  year,
  weekNumber,
  personId,
}: {
  year: number;
  weekNumber?: number;
  personId?: string;
}) {
  const { orgId } = await requirePermission('read', 'billing');

  const conditions = [
    eq(supportHourLogs.organisationId, orgId),
    eq(supportHourLogs.year, year),
  ];
  if (weekNumber) conditions.push(eq(supportHourLogs.weekNumber, weekNumber));
  if (personId) conditions.push(eq(supportHourLogs.personId, personId));

  return db
    .select()
    .from(supportHourLogs)
    .where(and(...conditions))
    .orderBy(supportHourLogs.weekNumber);
}

export async function getCommissionerReport({
  commissionerType,
}: {
  commissionerType: string;
}) {
  const { orgId } = await requirePermission('read', 'billing');

  return db
    .select()
    .from(personalBudgets)
    .where(
      and(
        eq(personalBudgets.organisationId, orgId),
        eq(personalBudgets.commissionerType, commissionerType),
      ),
    )
    .orderBy(desc(personalBudgets.createdAt));
}
