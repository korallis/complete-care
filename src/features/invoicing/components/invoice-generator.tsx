'use client';

import { useState } from 'react';
import type { InvoiceType } from '../types';

const INVOICE_TYPES: { value: InvoiceType; label: string }[] = [
  { value: 'local_authority', label: 'Local Authority' },
  { value: 'nhs', label: 'NHS' },
  { value: 'private', label: 'Private' },
];

export function InvoiceGenerator({
  onGenerate,
}: {
  onGenerate?: (config: {
    personId: string;
    invoiceType: InvoiceType;
    periodStart: string;
    periodEnd: string;
    payeeName: string;
  }) => void;
}) {
  const [generating, setGenerating] = useState(false);

  return (
    <form
      className="space-y-4 rounded-lg border p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setGenerating(true);
        const formData = new FormData(e.currentTarget);
        onGenerate?.({
          personId: formData.get('personId') as string,
          invoiceType: formData.get('invoiceType') as InvoiceType,
          periodStart: formData.get('periodStart') as string,
          periodEnd: formData.get('periodEnd') as string,
          payeeName: formData.get('payeeName') as string,
        });
        setGenerating(false);
      }}
    >
      <h3 className="text-sm font-semibold">Generate Invoice from Visits</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="personId" className="mb-1 block text-sm font-medium">
            Service User
          </label>
          <input
            id="personId"
            name="personId"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Select person..."
          />
        </div>
        <div>
          <label htmlFor="invoiceType" className="mb-1 block text-sm font-medium">
            Invoice Type
          </label>
          <select
            id="invoiceType"
            name="invoiceType"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {INVOICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="periodStart" className="mb-1 block text-sm font-medium">
            Period Start
          </label>
          <input
            id="periodStart"
            name="periodStart"
            type="date"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="periodEnd" className="mb-1 block text-sm font-medium">
            Period End
          </label>
          <input
            id="periodEnd"
            name="periodEnd"
            type="date"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="payeeName" className="mb-1 block text-sm font-medium">
            Payee Name
          </label>
          <input
            id="payeeName"
            name="payeeName"
            type="text"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="e.g. Westminster City Council"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={generating}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Invoice'}
        </button>
      </div>
    </form>
  );
}
