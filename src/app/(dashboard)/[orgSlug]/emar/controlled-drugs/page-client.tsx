'use client';

/**
 * Client component for the CD Register page.
 * Renders the register table, transaction form, and patch tracker.
 */

import { useState } from 'react';
import {
  CdRegisterTable,
  CdTransactionForm,
  PatchTracker,
  type CdRegisterRow,
} from '@/features/emar/components/controlled-drugs';
import { calculateBalance } from '@/features/emar/lib/cd-register';
import type { CdTransactionType } from '@/features/emar/types';

interface CdRegisterPageClientProps {
  currentUserId: string;
  staffMembers: { id: string; name: string }[];
}

// Demonstration entries — in production, fetched from DB
const initialEntries: CdRegisterRow[] = [
  {
    id: '1',
    transactionDate: new Date('2026-03-25T09:00:00'),
    transactionType: 'receipt',
    quantityIn: 28,
    quantityOut: 0,
    balanceAfter: 28,
    performedByName: 'Sarah Johnson',
    witnessedByName: 'James Williams',
    sourceOrDestination: 'Boots Pharmacy',
    batchNumber: 'BN-2026-0412',
    notes: 'Monthly supply received',
  },
  {
    id: '2',
    transactionDate: new Date('2026-03-26T08:15:00'),
    transactionType: 'administration',
    quantityIn: 0,
    quantityOut: 1,
    balanceAfter: 27,
    performedByName: 'Sarah Johnson',
    witnessedByName: 'Emily Brown',
    sourceOrDestination: null,
    batchNumber: null,
    notes: null,
  },
  {
    id: '3',
    transactionDate: new Date('2026-03-27T08:10:00'),
    transactionType: 'administration',
    quantityIn: 0,
    quantityOut: 1,
    balanceAfter: 26,
    performedByName: 'James Williams',
    witnessedByName: 'Sarah Johnson',
    sourceOrDestination: null,
    batchNumber: null,
    notes: null,
  },
];

export function CdRegisterPageClient({
  currentUserId,
  staffMembers,
}: CdRegisterPageClientProps) {
  const [entries, setEntries] = useState<CdRegisterRow[]>(initialEntries);
  const [currentBalance, setCurrentBalance] = useState(26);
  const [activeTab, setActiveTab] = useState<'register' | 'patches'>('register');

  const staffName = staffMembers.find((s) => s.id === currentUserId)?.name ?? 'Unknown';

  async function handleTransaction(data: {
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
  }) {
    const newBalance = calculateBalance(
      currentBalance,
      data.transactionType,
      data.quantityIn,
      data.quantityOut,
    );

    const witnessName =
      staffMembers.find((s) => s.id === data.witnessedBy)?.name ?? 'Unknown';

    const newEntry: CdRegisterRow = {
      id: crypto.randomUUID(),
      transactionDate: data.transactionDate,
      transactionType: data.transactionType,
      quantityIn: data.quantityIn,
      quantityOut: data.quantityOut,
      balanceAfter: newBalance,
      performedByName: staffName,
      witnessedByName: witnessName,
      sourceOrDestination: data.sourceOrDestination ?? null,
      batchNumber: data.batchNumber ?? null,
      notes: data.notes ?? null,
    };

    setEntries((prev) => [...prev, newEntry]);
    setCurrentBalance(newBalance);
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          onClick={() => setActiveTab('register')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'register'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          CD Register
        </button>
        <button
          onClick={() => setActiveTab('patches')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'patches'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Transdermal Patches
        </button>
      </div>

      {activeTab === 'register' && (
        <>
          <CdTransactionForm
            registerId="reg-1"
            currentBalance={currentBalance}
            currentUserId={currentUserId}
            staffMembers={staffMembers}
            onSubmit={handleTransaction}
          />
          <CdRegisterTable
            name="Morphine Sulfate"
            strength="10mg"
            form="Tablet"
            schedule="2"
            personName="Margaret Thompson"
            currentBalance={currentBalance}
            entries={entries}
          />
        </>
      )}

      {activeTab === 'patches' && (
        <PatchTracker
          registerId="reg-2"
          medicationId="med-2"
          personId="person-1"
          personName="Margaret Thompson"
          name="Fentanyl 25mcg/hr Patch"
          patches={[]}
          rotationHistory={['left_upper_arm', 'right_upper_arm']}
          currentUserId={currentUserId}
          staffMembers={staffMembers}
          onApply={async () => {}}
          onRemove={async () => {}}
        />
      )}
    </div>
  );
}
