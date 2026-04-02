import type { Metadata } from 'next';
import { InvoiceList, InvoiceGenerator } from '@/features/invoicing';

export const metadata: Metadata = {
  title: 'Care Invoicing',
};

export default function InvoicingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Care Invoicing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate invoices from visit data. Supports Local Authority, NHS, and private formats.
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="mt-1 text-2xl font-bold">&pound;0.00</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-600">&pound;0.00</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Paid This Month</p>
          <p className="mt-1 text-2xl font-bold text-green-600">&pound;0.00</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
      </div>

      {/* Generator */}
      <div className="mb-6">
        <InvoiceGenerator />
      </div>

      {/* Invoice list */}
      <InvoiceList invoices={[]} />
    </div>
  );
}
