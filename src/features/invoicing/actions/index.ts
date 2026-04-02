'use server';

/**
 * Invoicing Server Actions
 *
 * CRUD for care invoices and payment tracking.
 * Supports LA, NHS, and private invoice formats.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, lt, sum, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { careInvoices, invoicePayments, organisations } from '@/lib/db/schema';
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

const lineItemSchema = z.object({
  description: z.string().min(1),
  date: z.string().min(1),
  hours: z.number(),
  rate: z.number(),
  amount: z.number(),
  visitId: z.string().optional(),
});

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  personId: z.string().uuid().optional(),
  invoiceType: z.enum(['local_authority', 'nhs', 'private']),
  payeeName: z.string().min(1),
  payeeAddress: z.string().optional(),
  payeeReference: z.string().optional(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  lineItems: z.array(lineItemSchema).optional(),
  subtotal: z.string().default('0'),
  vatAmount: z.string().default('0'),
  totalAmount: z.string().default('0'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.string().min(1),
  paymentMethod: z.string().min(1),
  paymentReference: z.string().optional(),
  paymentDate: z.string().min(1),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// List / Get
// ---------------------------------------------------------------------------

export async function listInvoices({
  page = 1,
  pageSize = 20,
  status,
  invoiceType,
  personId,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  invoiceType?: string;
  personId?: string;
} = {}) {
  const { orgId } = await requirePermission('read', 'billing');

  const conditions = [eq(careInvoices.organisationId, orgId)];
  if (status) conditions.push(eq(careInvoices.status, status));
  if (invoiceType) conditions.push(eq(careInvoices.invoiceType, invoiceType));
  if (personId) conditions.push(eq(careInvoices.personId, personId));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(careInvoices)
      .where(whereClause)
      .orderBy(desc(careInvoices.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(careInvoices).where(whereClause),
  ]);

  return {
    invoices: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getInvoice(id: string) {
  const { orgId } = await requirePermission('read', 'billing');

  const [row] = await db
    .select()
    .from(careInvoices)
    .where(eq(careInvoices.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function getOverdueInvoices() {
  const { orgId } = await requirePermission('read', 'billing');

  const today = new Date().toISOString().slice(0, 10);

  return db
    .select()
    .from(careInvoices)
    .where(
      and(
        eq(careInvoices.organisationId, orgId),
        eq(careInvoices.status, 'sent'),
        lt(careInvoices.dueDate, today),
      ),
    )
    .orderBy(careInvoices.dueDate);
}

export async function getInvoiceSummary() {
  const { orgId } = await requirePermission('read', 'billing');

  const conditions = eq(careInvoices.organisationId, orgId);

  const [result] = await db
    .select({
      invoiceCount: count(),
      totalOutstanding: sql<string>`COALESCE(SUM(CASE WHEN ${careInvoices.status} IN ('sent', 'overdue') THEN ${careInvoices.totalAmount}::numeric ELSE 0 END), 0)::text`,
      totalOverdue: sql<string>`COALESCE(SUM(CASE WHEN ${careInvoices.status} = 'overdue' THEN ${careInvoices.totalAmount}::numeric ELSE 0 END), 0)::text`,
      totalPaid: sql<string>`COALESCE(SUM(CASE WHEN ${careInvoices.status} = 'paid' THEN ${careInvoices.totalAmount}::numeric ELSE 0 END), 0)::text`,
    })
    .from(careInvoices)
    .where(conditions);

  return {
    invoiceCount: result?.invoiceCount ?? 0,
    totalOutstanding: result?.totalOutstanding ?? '0.00',
    totalOverdue: result?.totalOverdue ?? '0.00',
    totalPaid: result?.totalPaid ?? '0.00',
  };
}

// ---------------------------------------------------------------------------
// Create invoice
// ---------------------------------------------------------------------------

export async function generateInvoice(
  input: z.infer<typeof createInvoiceSchema>,
): Promise<ActionResult<typeof careInvoices.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'billing');

    const parsed = createInvoiceSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(careInvoices)
      .values({
        organisationId: orgId,
        invoiceNumber: data.invoiceNumber,
        personId: data.personId ?? null,
        invoiceType: data.invoiceType,
        payeeName: data.payeeName,
        payeeAddress: data.payeeAddress ?? null,
        payeeReference: data.payeeReference ?? null,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        lineItems: data.lineItems ?? null,
        subtotal: data.subtotal,
        vatAmount: data.vatAmount,
        totalAmount: data.totalAmount,
        status: 'draft',
        dueDate: data.dueDate ?? null,
        notes: data.notes ?? null,
        createdBy: userId,
      })
      .returning();

    await auditLog('create', 'care_invoice', row.id, {
      before: null,
      after: { invoiceNumber: data.invoiceNumber, type: data.invoiceType, total: data.totalAmount },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/invoicing`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[generateInvoice] Error:', error);
    return { success: false, error: 'Failed to generate invoice' };
  }
}

// ---------------------------------------------------------------------------
// Send invoice
// ---------------------------------------------------------------------------

export async function sendInvoice(
  invoiceId: string,
): Promise<ActionResult<typeof careInvoices.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'billing');

    const [existing] = await db
      .select()
      .from(careInvoices)
      .where(eq(careInvoices.id, invoiceId))
      .limit(1);

    if (!existing) return { success: false, error: 'Invoice not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'draft') {
      return { success: false, error: 'Only draft invoices can be sent' };
    }

    const [updated] = await db
      .update(careInvoices)
      .set({
        status: 'sent',
        sentDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(careInvoices.id, invoiceId))
      .returning();

    await auditLog('send', 'care_invoice', invoiceId, {
      before: { status: 'draft' },
      after: { status: 'sent' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/invoicing`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to send invoice' };
  }
}

// ---------------------------------------------------------------------------
// Record payment
// ---------------------------------------------------------------------------

export async function recordPayment(
  input: z.infer<typeof recordPaymentSchema>,
): Promise<ActionResult<typeof invoicePayments.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'billing');

    const parsed = recordPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    // Verify invoice exists and belongs to org
    const [invoice] = await db
      .select()
      .from(careInvoices)
      .where(eq(careInvoices.id, data.invoiceId))
      .limit(1);

    if (!invoice) return { success: false, error: 'Invoice not found' };
    assertBelongsToOrg(invoice.organisationId, orgId);

    const [payment] = await db
      .insert(invoicePayments)
      .values({
        organisationId: orgId,
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference ?? null,
        paymentDate: new Date(data.paymentDate),
        notes: data.notes ?? null,
        createdBy: userId,
      })
      .returning();

    // Calculate total paid and update invoice status
    const [totalPaidResult] = await db
      .select({ total: sum(invoicePayments.amount) })
      .from(invoicePayments)
      .where(eq(invoicePayments.invoiceId, data.invoiceId));

    const totalPaid = parseFloat(totalPaidResult?.total ?? '0');
    const invoiceTotal = parseFloat(invoice.totalAmount);

    const newStatus = totalPaid >= invoiceTotal ? 'paid' : invoice.status;

    await db
      .update(careInvoices)
      .set({
        paidAmount: totalPaid.toFixed(2),
        paidDate: totalPaid >= invoiceTotal ? new Date() : invoice.paidDate,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(careInvoices.id, data.invoiceId));

    await auditLog('record_payment', 'care_invoice', data.invoiceId, {
      before: { paidAmount: invoice.paidAmount, status: invoice.status },
      after: { paidAmount: totalPaid.toFixed(2), status: newStatus, paymentId: payment.id },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/invoicing`);

    return { success: true, data: payment };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[recordPayment] Error:', error);
    return { success: false, error: 'Failed to record payment' };
  }
}

// ---------------------------------------------------------------------------
// Cancel invoice
// ---------------------------------------------------------------------------

export async function cancelInvoice(
  invoiceId: string,
  reason: string,
): Promise<ActionResult<typeof careInvoices.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'billing');

    const [existing] = await db
      .select()
      .from(careInvoices)
      .where(eq(careInvoices.id, invoiceId))
      .limit(1);

    if (!existing) return { success: false, error: 'Invoice not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status === 'paid' || existing.status === 'cancelled') {
      return { success: false, error: `Cannot cancel a ${existing.status} invoice` };
    }

    const [updated] = await db
      .update(careInvoices)
      .set({
        status: 'cancelled',
        notes: existing.notes
          ? `${existing.notes}\n\nCancelled: ${reason}`
          : `Cancelled: ${reason}`,
        updatedAt: new Date(),
      })
      .where(eq(careInvoices.id, invoiceId))
      .returning();

    await auditLog('cancel', 'care_invoice', invoiceId, {
      before: { status: existing.status },
      after: { status: 'cancelled', reason },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/invoicing`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to cancel invoice' };
  }
}

// ---------------------------------------------------------------------------
// Get invoice payments
// ---------------------------------------------------------------------------

export async function getInvoicePayments(invoiceId: string) {
  const { orgId } = await requirePermission('read', 'billing');

  // Verify invoice belongs to org
  const [invoice] = await db
    .select({ organisationId: careInvoices.organisationId })
    .from(careInvoices)
    .where(eq(careInvoices.id, invoiceId))
    .limit(1);

  if (!invoice) return [];
  assertBelongsToOrg(invoice.organisationId, orgId);

  return db
    .select()
    .from(invoicePayments)
    .where(eq(invoicePayments.invoiceId, invoiceId))
    .orderBy(desc(invoicePayments.paymentDate));
}
