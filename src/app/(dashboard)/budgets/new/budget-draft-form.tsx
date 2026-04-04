'use client';

import { useState } from 'react';

const COMMISSIONER_OPTIONS = [
  { value: 'local_authority', label: 'Local Authority' },
  { value: 'nhs', label: 'NHS' },
  { value: 'private', label: 'Private' },
  { value: 'mixed', label: 'Mixed funding' },
] as const;

export function BudgetDraftForm() {
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-6 rounded-3xl border border-white/10 bg-white/90 p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(true);
      }}
    >
      {saved && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Budget outline captured for browser UAT. Persistence can be wired in a
          later slice without breaking this route.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="budgetName"
            className="mb-1.5 block text-sm font-medium text-[oklch(0.22_0.03_232)]"
          >
            Budget name
          </label>
          <input
            id="budgetName"
            name="budgetName"
            type="text"
            required
            placeholder="2026 personal budget"
            className="w-full rounded-2xl border border-[oklch(0.88_0.01_232)] bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-[oklch(0.62_0.12_232)] focus:ring-2 focus:ring-[oklch(0.82_0.07_232)]"
          />
        </div>

        <div>
          <label
            htmlFor="personName"
            className="mb-1.5 block text-sm font-medium text-[oklch(0.22_0.03_232)]"
          >
            Person / package
          </label>
          <input
            id="personName"
            name="personName"
            type="text"
            required
            placeholder="Who is this budget for?"
            className="w-full rounded-2xl border border-[oklch(0.88_0.01_232)] bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-[oklch(0.62_0.12_232)] focus:ring-2 focus:ring-[oklch(0.82_0.07_232)]"
          />
        </div>

        <div>
          <label
            htmlFor="commissionerType"
            className="mb-1.5 block text-sm font-medium text-[oklch(0.22_0.03_232)]"
          >
            Commissioner
          </label>
          <select
            id="commissionerType"
            name="commissionerType"
            defaultValue="local_authority"
            className="w-full rounded-2xl border border-[oklch(0.88_0.01_232)] bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-[oklch(0.62_0.12_232)] focus:ring-2 focus:ring-[oklch(0.82_0.07_232)]"
          >
            {COMMISSIONER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="allocatedAmount"
            className="mb-1.5 block text-sm font-medium text-[oklch(0.22_0.03_232)]"
          >
            Allocated amount
          </label>
          <input
            id="allocatedAmount"
            name="allocatedAmount"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-2xl border border-[oklch(0.88_0.01_232)] bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-[oklch(0.62_0.12_232)] focus:ring-2 focus:ring-[oklch(0.82_0.07_232)]"
          />
        </div>

        <div>
          <label
            htmlFor="periodStart"
            className="mb-1.5 block text-sm font-medium text-[oklch(0.22_0.03_232)]"
          >
            Period start
          </label>
          <input
            id="periodStart"
            name="periodStart"
            type="date"
            required
            className="w-full rounded-2xl border border-[oklch(0.88_0.01_232)] bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-[oklch(0.62_0.12_232)] focus:ring-2 focus:ring-[oklch(0.82_0.07_232)]"
          />
        </div>

        <div>
          <label
            htmlFor="periodEnd"
            className="mb-1.5 block text-sm font-medium text-[oklch(0.22_0.03_232)]"
          >
            Period end
          </label>
          <input
            id="periodEnd"
            name="periodEnd"
            type="date"
            required
            className="w-full rounded-2xl border border-[oklch(0.88_0.01_232)] bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-[oklch(0.62_0.12_232)] focus:ring-2 focus:ring-[oklch(0.82_0.07_232)]"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="handoverNotes"
          className="mb-1.5 block text-sm font-medium text-[oklch(0.22_0.03_232)]"
        >
          Notes for finance / commissioning
        </label>
        <textarea
          id="handoverNotes"
          name="handoverNotes"
          rows={5}
          placeholder="Record package assumptions, support hours, or evidence needed before final approval."
          className="w-full rounded-3xl border border-[oklch(0.88_0.01_232)] bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-[oklch(0.62_0.12_232)] focus:ring-2 focus:ring-[oklch(0.82_0.07_232)]"
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="reset"
          className="rounded-full border border-[oklch(0.85_0.01_232)] px-4 py-2 text-sm font-medium text-[oklch(0.28_0.03_232)] transition hover:bg-[oklch(0.97_0.01_232)]"
          onClick={() => setSaved(false)}
        >
          Clear
        </button>
        <button
          type="submit"
          className="rounded-full bg-[oklch(0.28_0.09_232)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[oklch(0.24_0.08_232)]"
        >
          Save budget outline
        </button>
      </div>
    </form>
  );
}
