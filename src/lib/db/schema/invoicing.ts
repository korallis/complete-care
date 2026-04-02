import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
  index,
  date,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Care invoices — generated from EVV/visit data.
 * Supports LA, NHS, and private invoice formats.
 */
export const careInvoices = pgTable(
  'care_invoices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Invoice reference number (e.g. INV-2026-0001) */
    invoiceNumber: text('invoice_number').notNull(),
    /** The person the invoice relates to (if person-level) */
    personId: uuid('person_id'),
    /** Invoice type: local_authority | nhs | private */
    invoiceType: text('invoice_type').notNull(),
    /** Payee / commissioner name */
    payeeName: text('payee_name').notNull(),
    payeeAddress: text('payee_address'),
    payeeReference: text('payee_reference'),

    /** Billing period */
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),

    /** Line items (JSON array of visit/service entries) */
    lineItems: jsonb('line_items').$type<
      Array<{
        description: string;
        date: string;
        hours: number;
        rate: number;
        amount: number;
        visitId?: string;
      }>
    >(),

    /** Financial totals */
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),
    vatAmount: numeric('vat_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),

    /** Status: draft | sent | paid | overdue | cancelled | credited */
    status: text('status').notNull().default('draft'),
    sentDate: timestamp('sent_date'),
    dueDate: date('due_date'),
    paidDate: timestamp('paid_date'),
    paidAmount: numeric('paid_amount', { precision: 12, scale: 2 }),

    /** Number of reminders sent */
    reminderCount: integer('reminder_count').notNull().default(0),
    lastReminderDate: timestamp('last_reminder_date'),

    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('care_invoices_organisation_id_idx').on(t.organisationId),
    index('care_invoices_person_id_idx').on(t.personId),
    index('care_invoices_status_idx').on(t.status),
    index('care_invoices_invoice_type_idx').on(t.invoiceType),
    index('care_invoices_due_date_idx').on(t.dueDate),
  ],
);

export type CareInvoice = typeof careInvoices.$inferSelect;
export type NewCareInvoice = typeof careInvoices.$inferInsert;

/**
 * Invoice payments — tracks individual payment events against invoices.
 */
export const invoicePayments = pgTable(
  'invoice_payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => careInvoices.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    /** Payment method: bank_transfer | cheque | card | direct_debit | other */
    paymentMethod: text('payment_method').notNull(),
    paymentReference: text('payment_reference'),
    paymentDate: timestamp('payment_date').notNull(),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('invoice_payments_invoice_id_idx').on(t.invoiceId),
    index('invoice_payments_organisation_id_idx').on(t.organisationId),
  ],
);

export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type NewInvoicePayment = typeof invoicePayments.$inferInsert;
