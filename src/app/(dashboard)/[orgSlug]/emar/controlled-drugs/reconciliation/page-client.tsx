'use client';

/**
 * Client component for the Stock Reconciliation page.
 */

import { StockReconciliationForm } from '@/features/emar/components/controlled-drugs';

interface ReconciliationPageClientProps {
  currentUserId: string;
  staffMembers: { id: string; name: string }[];
}

// Mock registers that need reconciliation
const registersToReconcile = [
  {
    id: 'reg-1',
    name: 'Morphine Sulfate',
    strength: '10mg',
    expectedBalance: 26,
    personName: 'Margaret Thompson',
    lastReconciliation: new Date('2026-03-25'),
  },
  {
    id: 'reg-2',
    name: 'Oxycodone',
    strength: '5mg',
    expectedBalance: 14,
    personName: 'Robert Clarke',
    lastReconciliation: new Date('2026-03-24'),
  },
  {
    id: 'reg-3',
    name: 'Fentanyl Patches',
    strength: '25mcg/hr',
    expectedBalance: 3,
    personName: 'Margaret Thompson',
    lastReconciliation: null,
  },
];

export function ReconciliationPageClient({
  currentUserId,
  staffMembers,
}: ReconciliationPageClientProps) {
  return (
    <div className="space-y-6">
      {/* Registers Due for Reconciliation */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Registers Requiring Reconciliation
        </h2>
        <div className="divide-y divide-slate-100">
          {registersToReconcile.map((reg) => {
            const isOverdue =
              !reg.lastReconciliation ||
              new Date().getTime() - reg.lastReconciliation.getTime() >
                7 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={reg.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <span className="text-sm font-medium text-slate-900">
                    {reg.name} {reg.strength}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {reg.personName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-slate-500">
                    Balance: {reg.expectedBalance}
                  </span>
                  {isOverdue && (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      Overdue
                    </span>
                  )}
                  {!isOverdue && reg.lastReconciliation && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Last: {reg.lastReconciliation.toLocaleDateString('en-GB')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reconciliation Forms */}
      {registersToReconcile.map((reg) => (
        <StockReconciliationForm
          key={reg.id}
          registerId={reg.id}
          name={reg.name}
          strength={reg.strength}
          expectedBalance={reg.expectedBalance}
          currentUserId={currentUserId}
          staffMembers={staffMembers}
          onSubmit={async (data) => {
            // In production: call server action
            console.log('Reconciliation submitted:', data);
          }}
        />
      ))}
    </div>
  );
}
