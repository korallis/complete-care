'use client';

/**
 * Client component for the CD Register page.
 * Renders register switching, the transaction form, and patch tracking.
 */

import { useMemo, useState } from 'react';
import {
  CdRegisterTable,
  CdTransactionForm,
  PatchTracker,
  type CdRegisterRow,
} from '@/features/emar/components/controlled-drugs';
import type {
  ControlledDrugPatchView,
  ControlledDrugRegisterView,
  ControlledDrugStaffMember,
} from '@/features/emar/actions/controlled-drugs';
import { calculateBalance } from '@/features/emar/lib/cd-register';
import type {
  CdTransactionType,
  PatchDisposalMethod,
  PatchSite,
} from '@/features/emar/types';

interface CdRegisterPageClientProps {
  currentUserId: string;
  staffMembers: ControlledDrugStaffMember[];
  registers: ControlledDrugRegisterView[];
  onRecordCdTransaction: (data: {
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
  }) => Promise<{ success: boolean; error?: string; data?: { entryId: string; newBalance: number } }>;
  onRecordPatchApplication: (data: {
    registerId: string;
    medicationId: string;
    personId: string;
    applicationSite: PatchSite;
    applicationSiteDetail?: string;
    appliedAt: Date;
    scheduledRemovalAt?: Date;
    appliedBy: string;
    applicationWitnessedBy: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string; data?: { patchId: string } }>;
  onRecordPatchRemoval: (data: {
    patchId: string;
    removedAt: Date;
    removedBy: string;
    removalWitnessedBy: string;
    disposalMethod: PatchDisposalMethod;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string; data?: { patchId: string } }>;
}

type RegisterState = ControlledDrugRegisterView;

export function CdRegisterPageClient({
  currentUserId,
  staffMembers,
  registers,
  onRecordCdTransaction,
  onRecordPatchApplication,
  onRecordPatchRemoval,
}: CdRegisterPageClientProps) {
  const [registerState, setRegisterState] = useState<RegisterState[]>(registers);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(
    registers[0]?.id ?? null,
  );
  const [activeTab, setActiveTab] = useState<'register' | 'patches'>('register');

  const selectedRegister = useMemo(
    () => registerState.find((register) => register.id === selectedRegisterId) ?? null,
    [registerState, selectedRegisterId],
  );

  const staffName =
    staffMembers.find((staff) => staff.id === currentUserId)?.name ?? 'Unknown';

  function updateRegister(
    registerId: string,
    updater: (register: RegisterState) => RegisterState,
  ) {
    setRegisterState((current) =>
      current.map((register) =>
        register.id === registerId ? updater(register) : register,
      ),
    );
  }

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
    const result = await onRecordCdTransaction(data);
    if (!result.success) {
      throw new Error(result.error ?? 'Failed to record controlled drug transaction');
    }

    const witnessName =
      staffMembers.find((staff) => staff.id === data.witnessedBy)?.name ?? 'Unknown';
    const newBalance =
      result.data?.newBalance ??
      calculateBalance(0, data.transactionType, data.quantityIn, data.quantityOut);

    updateRegister(data.registerId, (register) => {
      const entry: CdRegisterRow = {
        id: result.data?.entryId ?? crypto.randomUUID(),
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

      return {
        ...register,
        currentBalance: newBalance,
        entries: [entry, ...register.entries],
      };
    });
  }

  async function handlePatchApplication(data: {
    registerId: string;
    medicationId: string;
    personId: string;
    applicationSite: PatchSite;
    applicationSiteDetail?: string;
    appliedAt: Date;
    scheduledRemovalAt?: Date;
    appliedBy: string;
    applicationWitnessedBy: string;
    notes?: string;
  }) {
    const result = await onRecordPatchApplication(data);
    if (!result.success) {
      throw new Error(result.error ?? 'Failed to record patch application');
    }

    const witnessName =
      staffMembers.find((staff) => staff.id === data.applicationWitnessedBy)?.name ??
      'Unknown';

    updateRegister(data.registerId, (register) => {
      const patch: ControlledDrugPatchView = {
        id: result.data?.patchId ?? crypto.randomUUID(),
        applicationSite: data.applicationSite,
        appliedAt: data.appliedAt,
        removedAt: null,
        scheduledRemovalAt: data.scheduledRemovalAt ?? null,
        appliedByName: staffName,
        applicationWitnessName: witnessName,
        removedByName: null,
        removalWitnessName: null,
        disposalMethod: null,
        status: 'active',
      };

      return {
        ...register,
        patches: [patch, ...register.patches],
        rotationHistory: [...register.rotationHistory, data.applicationSite],
      };
    });
  }

  async function handlePatchRemoval(data: {
    patchId: string;
    removedAt: Date;
    removedBy: string;
    removalWitnessedBy: string;
    disposalMethod: PatchDisposalMethod;
    notes?: string;
  }) {
    const result = await onRecordPatchRemoval(data);
    if (!result.success) {
      throw new Error(result.error ?? 'Failed to record patch removal');
    }

    const witnessName =
      staffMembers.find((staff) => staff.id === data.removalWitnessedBy)?.name ?? 'Unknown';

    setRegisterState((current) =>
      current.map((register) => ({
        ...register,
        patches: register.patches.map((patch) =>
          patch.id === data.patchId
            ? {
                ...patch,
                removedAt: data.removedAt,
                removedByName: staffName,
                removalWitnessName: witnessName,
                disposalMethod: data.disposalMethod,
                status: 'removed',
              }
            : patch,
        ),
      })),
    );
  }

  if (registerState.length === 0 || !selectedRegister) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">
          No controlled drug registers yet
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Once controlled-drug medications are prescribed and registered, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {registerState.length > 1 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label
            htmlFor="cd-register-select"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500"
          >
            Select register
          </label>
          <select
            id="cd-register-select"
            value={selectedRegister.id}
            onChange={(event) => setSelectedRegisterId(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {registerState.map((register) => (
              <option key={register.id} value={register.id}>
                {register.personName} — {register.name} {register.strength}
              </option>
            ))}
          </select>
        </div>
      )}

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
            registerId={selectedRegister.id}
            currentBalance={selectedRegister.currentBalance}
            currentUserId={currentUserId}
            staffMembers={staffMembers}
            onSubmit={handleTransaction}
          />
          <CdRegisterTable
            name={selectedRegister.name}
            strength={selectedRegister.strength}
            form={selectedRegister.form}
            schedule={selectedRegister.schedule}
            personName={selectedRegister.personName}
            currentBalance={selectedRegister.currentBalance}
            entries={selectedRegister.entries}
          />
        </>
      )}

      {activeTab === 'patches' && (
        <PatchTracker
          registerId={selectedRegister.id}
          medicationId={selectedRegister.medicationId}
          personId={selectedRegister.personId}
          personName={selectedRegister.personName}
          name={`${selectedRegister.name} ${selectedRegister.strength}`}
          patches={selectedRegister.patches}
          rotationHistory={selectedRegister.rotationHistory}
          currentUserId={currentUserId}
          staffMembers={staffMembers}
          onApply={handlePatchApplication}
          onRemove={handlePatchRemoval}
        />
      )}
    </div>
  );
}
