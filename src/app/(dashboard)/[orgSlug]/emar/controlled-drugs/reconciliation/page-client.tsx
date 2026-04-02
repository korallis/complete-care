'use client';

/**
 * Client component for the Stock Reconciliation page.
 */

import { useMemo, useState } from 'react';
import type {
  ControlledDrugRegisterView,
  ControlledDrugStaffMember,
} from '@/features/emar/actions/controlled-drugs';
import { StockReconciliationForm } from '@/features/emar/components/controlled-drugs';

interface ReconciliationPageClientProps {
  currentUserId: string;
  staffMembers: ControlledDrugStaffMember[];
  registers: ControlledDrugRegisterView[];
  onRecordStockReconciliation: (data: {
    registerId: string;
    expectedBalance: number;
    actualCount: number;
    reconciliationDate: Date;
    performedBy: string;
    witnessedBy: string;
    investigationNotes?: string;
    cdaoNotified: boolean;
  }) => Promise<{
    success: boolean;
    error?: string;
    data?: {
      reconciliationId: string;
      hasDiscrepancy: boolean;
      cdaoNotificationRequired: boolean;
    };
  }>;
}

export function ReconciliationPageClient({
  currentUserId,
  staffMembers,
  registers,
  onRecordStockReconciliation,
}: ReconciliationPageClientProps) {
  const [registerState, setRegisterState] = useState(registers);

  const sortedRegisters = useMemo(
    () =>
      [...registerState].sort((a, b) => {
        const aTime = a.lastReconciliation?.getTime() ?? 0;
        const bTime = b.lastReconciliation?.getTime() ?? 0;
        return aTime - bTime;
      }),
    [registerState],
  );

  async function handleSubmit(data: {
    registerId: string;
    expectedBalance: number;
    actualCount: number;
    reconciliationDate: Date;
    performedBy: string;
    witnessedBy: string;
    investigationNotes?: string;
    cdaoNotified: boolean;
  }) {
    const result = await onRecordStockReconciliation(data);
    if (!result.success) {
      throw new Error(result.error ?? 'Failed to record stock reconciliation');
    }

    setRegisterState((current) =>
      current.map((register) =>
        register.id === data.registerId
          ? {
              ...register,
              lastReconciliation: data.reconciliationDate,
            }
          : register,
      ),
    );
  }

  if (sortedRegisters.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          No controlled drug registers available
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Stock reconciliation appears here once controlled drug registers have been created.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Registers Requiring Reconciliation
        </h2>
        <div className="divide-y divide-slate-100">
          {sortedRegisters.map((register) => {
            const isOverdue =
              !register.lastReconciliation ||
              new Date().getTime() - register.lastReconciliation.getTime() >
                7 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={register.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <span className="text-sm font-medium text-slate-900">
                    {register.name} {register.strength}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    {register.personName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-slate-500">
                    Balance: {register.currentBalance}
                  </span>
                  {isOverdue && (
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      Overdue
                    </span>
                  )}
                  {!isOverdue && register.lastReconciliation && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Last: {register.lastReconciliation.toLocaleDateString('en-GB')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {sortedRegisters.map((register) => (
        <StockReconciliationForm
          key={register.id}
          registerId={register.id}
          name={register.name}
          strength={register.strength}
          expectedBalance={register.currentBalance}
          currentUserId={currentUserId}
          staffMembers={staffMembers}
          onSubmit={handleSubmit}
        />
      ))}
    </div>
  );
}
