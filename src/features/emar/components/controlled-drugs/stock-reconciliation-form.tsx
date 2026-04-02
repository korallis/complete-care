'use client';

/**
 * Stock Reconciliation Form — weekly CD stock check workflow.
 * VAL-EMAR-008: Dual-auth, discrepancy investigation, CDAO flag.
 */

import { useState, type FormEvent } from 'react';

interface StockReconciliationFormProps {
  registerId: string;
  name: string;
  strength: string;
  expectedBalance: number;
  currentUserId: string;
  staffMembers: { id: string; name: string }[];
  onSubmit: (data: {
    registerId: string;
    expectedBalance: number;
    actualCount: number;
    reconciliationDate: Date;
    performedBy: string;
    witnessedBy: string;
    investigationNotes?: string;
    cdaoNotified: boolean;
  }) => Promise<void>;
}

export function StockReconciliationForm({
  registerId,
  name: drugName,
  strength,
  expectedBalance,
  currentUserId,
  staffMembers,
  onSubmit,
}: StockReconciliationFormProps) {
  const [actualCount, setActualCount] = useState<number>(expectedBalance);
  const [witnessedBy, setWitnessedBy] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [cdaoNotified, setCdaoNotified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    hasDiscrepancy: boolean;
    discrepancyAmount: number;
  } | null>(null);

  const hasDiscrepancy = actualCount !== expectedBalance;
  const discrepancyAmount = actualCount - expectedBalance;
  const availableWitnesses = staffMembers.filter(
    (s) => s.id !== currentUserId,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!witnessedBy) {
      setError('A second witness is required for stock reconciliation');
      return;
    }

    if (hasDiscrepancy && !investigationNotes.trim()) {
      setError(
        'Investigation notes are mandatory when a discrepancy is detected',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        registerId,
        expectedBalance,
        actualCount,
        reconciliationDate: new Date(),
        performedBy: currentUserId,
        witnessedBy,
        investigationNotes: investigationNotes || undefined,
        cdaoNotified: hasDiscrepancy ? cdaoNotified : false,
      });
      setResult({ hasDiscrepancy, discrepancyAmount });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50">
          <svg
            className="h-4 w-4 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Stock Reconciliation
          </h3>
          <p className="text-xs text-slate-500">
            {drugName} {strength} &middot; Weekly Check
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            result.hasDiscrepancy
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {result.hasDiscrepancy
            ? `Discrepancy of ${result.discrepancyAmount > 0 ? '+' : ''}${result.discrepancyAmount} recorded. CDAO has been notified.`
            : 'Stock reconciliation completed successfully. No discrepancy.'}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Expected Balance (read-only) */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Expected Balance (from register)
          </label>
          <div className="flex h-[38px] items-center rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm tabular-nums font-medium text-slate-900">
            {expectedBalance}
          </div>
        </div>

        {/* Actual Count */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Actual Physical Count *
          </label>
          <input
            type="number"
            min={0}
            value={actualCount}
            onChange={(e) =>
              setActualCount(parseInt(e.target.value, 10) || 0)
            }
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        {/* Witness */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Second Witness *
          </label>
          <select
            value={witnessedBy}
            onChange={(e) => setWitnessedBy(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="">Select witness...</option>
            {availableWitnesses.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name}
              </option>
            ))}
          </select>
        </div>

        {/* Discrepancy Indicator */}
        {hasDiscrepancy && (
          <div className="flex items-center">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
              <span className="text-sm font-medium text-amber-800">
                Discrepancy:{' '}
                <span className="tabular-nums">
                  {discrepancyAmount > 0 ? '+' : ''}
                  {discrepancyAmount}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Investigation Notes — mandatory when discrepancy */}
        {hasDiscrepancy && (
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-red-600">
              Investigation Notes (Mandatory) *
            </label>
            <textarea
              value={investigationNotes}
              onChange={(e) => setInvestigationNotes(e.target.value)}
              required
              rows={3}
              placeholder="Document the investigation into the discrepancy..."
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            />
          </div>
        )}

        {/* CDAO Notification */}
        {hasDiscrepancy && (
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
              <input
                type="checkbox"
                checked={cdaoNotified}
                onChange={(e) => setCdaoNotified(e.target.checked)}
                className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-sm font-medium text-amber-900">
                  Notify CDAO (Controlled Drugs Accountable Officer)
                </span>
                <p className="text-xs text-amber-700">
                  Discrepancies must be reported to the CDAO for investigation
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
        <div className="text-xs text-slate-400">
          Both staff members must physically count and verify the stock.
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Recording...' : 'Complete Reconciliation'}
        </button>
      </div>
    </form>
  );
}
