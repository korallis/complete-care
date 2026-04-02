'use client';

import type { InvoiceSummary, InvoiceStatus } from '../types';

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500 line-through',
  credited: 'bg-purple-100 text-purple-800',
};

export function InvoiceList({ invoices }: { invoices: InvoiceSummary[] }) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">No invoices generated yet.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Generate invoices from completed care visits.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-4 py-3 font-medium">Invoice #</th>
            <th className="px-4 py-3 font-medium">Payee</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 font-medium text-right">Amount</th>
            <th className="px-4 py-3 font-medium">Due Date</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b hover:bg-muted/50">
              <td className="px-4 py-3 font-mono text-xs font-medium">
                {inv.invoiceNumber}
              </td>
              <td className="px-4 py-3">{inv.payeeName}</td>
              <td className="px-4 py-3 capitalize">
                {inv.invoiceType.replace('_', ' ')}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {inv.periodStart} &mdash; {inv.periodEnd}
              </td>
              <td className="px-4 py-3 text-right font-medium">
                &pound;{inv.totalAmount}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {inv.dueDate ?? '--'}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[inv.status]}`}
                >
                  {inv.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
