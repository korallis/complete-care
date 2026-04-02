import type { CareInvoice, NewCareInvoice, InvoicePayment, NewInvoicePayment } from '@/lib/db/schema';

export type { CareInvoice, NewCareInvoice, InvoicePayment, NewInvoicePayment };

export type InvoiceType = 'local_authority' | 'nhs' | 'private';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'credited';

export type PaymentMethod = 'bank_transfer' | 'cheque' | 'card' | 'direct_debit' | 'other';

export interface InvoiceLineItem {
  description: string;
  date: string;
  hours: number;
  rate: number;
  amount: number;
  visitId?: string;
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  payeeName: string;
  invoiceType: InvoiceType;
  totalAmount: string;
  status: InvoiceStatus;
  dueDate: string | null;
  periodStart: string;
  periodEnd: string;
}
