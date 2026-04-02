'use client';

/**
 * CD Transaction Form — dual-witness recording for all CD operations.
 * VAL-EMAR-020: Dual-witness mandatory for ALL CD operations.
 */

import { useState, type FormEvent } from 'react';
import {
  CD_TRANSACTION_TYPES,
  type CdTransactionType,
} from '../../types';
import { formatTransactionType } from '../../lib/cd-register';

interface CdTransactionFormProps {
  registerId: string;
  currentBalance: number;
  currentUserId: string;
  staffMembers: { id: string; name: string }[];
  onSubmit: (data: {
    registerId: string;
    transactionType: CdTransactionType;
    quantityIn: number;
    quantityOut: number;
    transactionDate: Date;
    performedBy: string;
    witnessedBy: string;
    sourceOrDestination?: string;
    batchNumber?: string;
    disposalMethod?: string;
    notes?: string;
  }) => Promise<void>;
}

export function CdTransactionForm({
  registerId,
  currentBalance,
  currentUserId,
  staffMembers,
  onSubmit,
}: CdTransactionFormProps) {
  const [transactionType, setTransactionType] =
    useState<CdTransactionType>('receipt');
  const [quantity, setQuantity] = useState<number>(0);
  const [witnessedBy, setWitnessedBy] = useState('');
  const [sourceOrDestination, setSourceOrDestination] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [disposalMethod, setDisposalMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isIncoming = transactionType === 'receipt' || transactionType === 'adjustment';

  const availableWitnesses = staffMembers.filter(
    (s) => s.id !== currentUserId,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!witnessedBy) {
      setError('A second witness is required for all CD operations');
      return;
    }

    if (witnessedBy === currentUserId) {
      setError('Witness must be a different staff member');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }

    if (!isIncoming && quantity > currentBalance) {
      setError(
        `Insufficient stock: current balance is ${currentBalance}, cannot remove ${quantity}`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        registerId,
        transactionType,
        quantityIn: isIncoming ? quantity : 0,
        quantityOut: isIncoming ? 0 : quantity,
        transactionDate: new Date(),
        performedBy: currentUserId,
        witnessedBy,
        sourceOrDestination: sourceOrDestination || undefined,
        batchNumber: batchNumber || undefined,
        disposalMethod: disposalMethod || undefined,
        notes: notes || undefined,
      });
      // Reset form
      setQuantity(0);
      setWitnessedBy('');
      setSourceOrDestination('');
      setBatchNumber('');
      setDisposalMethod('');
      setNotes('');
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
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50">
          <svg
            className="h-4 w-4 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          Record CD Transaction
        </h3>
        <span className="ml-auto rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
          Dual Witness Required
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Transaction Type */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Transaction Type
          </label>
          <select
            value={transactionType}
            onChange={(e) =>
              setTransactionType(e.target.value as CdTransactionType)
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {CD_TRANSACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatTransactionType(type)}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Quantity
          </label>
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
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

        {/* Source/Destination */}
        {(transactionType === 'receipt' ||
          transactionType === 'return_to_pharmacy') && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
              {transactionType === 'receipt' ? 'Source (Pharmacy)' : 'Destination'}
            </label>
            <input
              type="text"
              value={sourceOrDestination}
              onChange={(e) => setSourceOrDestination(e.target.value)}
              placeholder={
                transactionType === 'receipt'
                  ? 'e.g. Boots Pharmacy'
                  : 'e.g. Returned to Boots'
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        )}

        {/* Batch Number */}
        {transactionType === 'receipt' && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Batch Number
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        )}

        {/* Disposal Method */}
        {(transactionType === 'disposal' ||
          transactionType === 'destruction') && (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
              Disposal Method
            </label>
            <select
              value={disposalMethod}
              onChange={(e) => setDisposalMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="">Select method...</option>
              <option value="denaturing_kit">Denaturing Kit</option>
              <option value="returned_to_pharmacy">Returned to Pharmacy</option>
              <option value="witnessed_destruction">Witnessed Destruction</option>
              <option value="clinical_waste">Clinical Waste Bin</option>
            </select>
          </div>
        )}

        {/* Notes */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
        <div className="text-xs text-slate-400">
          Both staff members must be present and verify this record is accurate.
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? 'Recording...' : 'Record Transaction'}
        </button>
      </div>
    </form>
  );
}
