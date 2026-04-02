'use server';

import type { NewCareInvoice, NewInvoicePayment } from '@/lib/db/schema';

export async function generateInvoice(_data: NewCareInvoice) {
  // TODO: Generate invoice from EVV/visit data
  return { success: true, id: crypto.randomUUID() };
}

export async function generateInvoiceFromVisits(
  _organisationId: string,
  _personId: string,
  _periodStart: string,
  _periodEnd: string,
  _invoiceType: string,
) {
  // TODO: Query visits for period, calculate line items, create invoice
  return { success: true, id: crypto.randomUUID() };
}

export async function sendInvoice(_invoiceId: string) {
  // TODO: Mark as sent, record date
  return { success: true };
}

export async function recordPayment(_data: NewInvoicePayment) {
  // TODO: Record payment, update invoice status
  return { success: true, id: crypto.randomUUID() };
}

export async function cancelInvoice(_invoiceId: string, _reason: string) {
  // TODO: Cancel invoice, create credit note
  return { success: true };
}

export async function getOverdueInvoices(_organisationId: string) {
  // TODO: Query invoices past due date
  return [];
}

export async function getInvoiceSummary(_organisationId: string) {
  // TODO: Aggregate invoice totals by status
  return {
    totalOutstanding: '0.00',
    totalOverdue: '0.00',
    totalPaid: '0.00',
    invoiceCount: 0,
  };
}
