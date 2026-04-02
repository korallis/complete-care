'use client';

/**
 * CD Register Table — displays the controlled drugs register with running balance.
 * Per-person per-drug per-strength register page (VAL-EMAR-020).
 */

import { formatTransactionType } from '../../lib/cd-register';
import type { CdTransactionType } from '../../types';

export interface CdRegisterRow {
  id: string;
  transactionDate: Date;
  transactionType: CdTransactionType;
  quantityIn: number;
  quantityOut: number;
  balanceAfter: number;
  performedByName: string;
  witnessedByName: string;
  sourceOrDestination: string | null;
  batchNumber: string | null;
  notes: string | null;
}

interface CdRegisterTableProps {
  name: string;
  strength: string;
  form: string;
  schedule: string;
  personName: string;
  currentBalance: number;
  entries: CdRegisterRow[];
}

const transactionTypeColours: Record<CdTransactionType, string> = {
  receipt: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  administration: 'bg-sky-50 text-sky-800 border-sky-200',
  disposal: 'bg-amber-50 text-amber-800 border-amber-200',
  destruction: 'bg-red-50 text-red-800 border-red-200',
  adjustment: 'bg-violet-50 text-violet-800 border-violet-200',
  return_to_pharmacy: 'bg-slate-50 text-slate-800 border-slate-200',
};

export function CdRegisterTable({
  name: drugName,
  strength,
  form,
  schedule,
  personName,
  currentBalance,
  entries,
}: CdRegisterTableProps) {
  return (
    <div className="space-y-6">
      {/* Register Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <span className="text-lg font-bold text-red-700">CD</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  {drugName} {strength}
                </h2>
                <p className="text-sm text-slate-500">
                  {form} &middot; Schedule {schedule} &middot; {personName}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Running Balance
            </div>
            <div className="text-3xl font-bold tabular-nums text-slate-900">
              {currentBalance}
            </div>
          </div>
        </div>
      </div>

      {/* Register Entries Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Date/Time
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Type
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">
                  In
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">
                  Out
                </th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">
                  Balance
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Performed By
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Witnessed By
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Source/Dest
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    No entries recorded yet. Use the form above to record a
                    transaction.
                  </td>
                </tr>
              )}
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                    {entry.transactionDate.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    <span className="text-slate-400">
                      {entry.transactionDate.toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${transactionTypeColours[entry.transactionType]}`}
                    >
                      {formatTransactionType(entry.transactionType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-emerald-700">
                    {entry.quantityIn > 0 ? `+${entry.quantityIn}` : ''}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium text-red-700">
                    {entry.quantityOut > 0 ? `-${entry.quantityOut}` : ''}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                    {entry.balanceAfter}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {entry.performedByName}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {entry.witnessedByName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {entry.sourceOrDestination ?? '\u2014'}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-500">
                    {entry.notes ?? '\u2014'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
