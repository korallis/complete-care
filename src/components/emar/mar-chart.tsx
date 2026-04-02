'use client';

/**
 * MarChart — grid view showing medications as rows, time slots as columns,
 * with administration status cells. Core EMAR component.
 */

import { useState } from 'react';
import Link from 'next/link';
import type { MarChartData } from '@/features/emar/actions';
import type { RecordAdministrationInput } from '@/features/emar/schema';
import type { Medication, MedicationAdministration, FrequencyDetail } from '@/lib/db/schema/medications';
import {
  generateTimeSlots,
  formatTime,
  formatDate,
  getAdministrationStatusCode,
  getAdministrationStatusColor,
} from '@/features/emar/utils';
import {
  MEDICATION_ROUTE_LABELS,
} from '@/features/emar/constants';
import { MedicationStatusBadge } from './medication-status-badge';
import { AdministrationForm } from './administration-form';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MarChartProps = {
  data: MarChartData;
  orgSlug: string;
  personId: string;
  currentUserId: string;
  staffMembers: { id: string; name: string }[];
  canAdminister: boolean;
  onRecordAdministration: (personId: string, input: RecordAdministrationInput) => Promise<{
    success: boolean;
    error?: string;
  }>;
};

// ---------------------------------------------------------------------------
// Administration cell
// ---------------------------------------------------------------------------

type CellProps = {
  medication: Medication;
  scheduledTime: string;
  administration: MedicationAdministration | null;
  canAdminister: boolean;
  onClickCell: () => void;
};

function AdministrationCell({
  medication,
  scheduledTime,
  administration,
  canAdminister,
  onClickCell,
}: CellProps) {
  if (administration) {
    const colors = getAdministrationStatusColor(administration.status);
    const code = getAdministrationStatusCode(administration.status);

    return (
      <button
        type="button"
        onClick={canAdminister ? onClickCell : undefined}
        disabled={!canAdminister}
        className={`w-full h-full min-h-[40px] rounded-md border ${colors.border} ${colors.bg} ${colors.text} text-xs font-bold flex items-center justify-center transition-colors ${canAdminister ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
        title={`${administration.status} by ${administration.administeredByName ?? 'Unknown'} at ${administration.administeredAt ? formatTime(administration.administeredAt.toISOString()) : '-'}`}
        aria-label={`${medication.drugName} at ${formatTime(scheduledTime)}: ${administration.status}`}
      >
        {code}
      </button>
    );
  }

  // Empty cell — not yet administered
  if (!canAdminister) {
    return (
      <div
        className="w-full h-full min-h-[40px] rounded-md border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] flex items-center justify-center text-xs text-[oklch(0.7_0_0)]"
        aria-label={`${medication.drugName} at ${formatTime(scheduledTime)}: pending`}
      >
        -
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClickCell}
      className="w-full h-full min-h-[40px] rounded-md border border-dashed border-[oklch(0.8_0.02_160)] bg-[oklch(0.985_0.005_160)] hover:border-[oklch(0.5_0.1_160)] hover:bg-[oklch(0.97_0.01_160)] flex items-center justify-center text-xs text-[oklch(0.6_0.04_160)] transition-colors cursor-pointer"
      aria-label={`Record ${medication.drugName} at ${formatTime(scheduledTime)}`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main MarChart component
// ---------------------------------------------------------------------------

export function MarChart({
  data,
  orgSlug,
  personId,
  currentUserId,
  staffMembers,
  canAdminister,
  onRecordAdministration,
}: MarChartProps) {
  const [selectedCell, setSelectedCell] = useState<{
    medication: Medication;
    scheduledTime: string;
    administration: MedicationAdministration | null;
  } | null>(null);

  // Collect all unique time slots across active medications
  const allTimeSlots = new Set<string>();
  const activeMeds = data.medications.filter((m) => m.status === 'active');

  for (const med of activeMeds) {
    const slots = generateTimeSlots(
      med.frequency,
      med.frequencyDetail as FrequencyDetail,
      data.date,
    );
    for (const slot of slots) {
      allTimeSlots.add(slot);
    }
  }

  const sortedTimeSlots = Array.from(allTimeSlots).sort();

  // Include non-active meds that have administrations on this date
  const medsWithAdmins = data.medications.filter(
    (m) => m.status !== 'active' && m.administrations.length > 0,
  );
  const displayMeds = [...activeMeds, ...medsWithAdmins];

  // Index administrations by medicationId + scheduledTime
  const adminIndex = new Map<string, MedicationAdministration>();
  for (const med of data.medications) {
    for (const admin of med.administrations) {
      const key = `${admin.medicationId}:${admin.scheduledTime.toISOString()}`;
      adminIndex.set(key, admin);
    }
  }

  if (displayMeds.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
          <svg className="h-6 w-6 text-[oklch(0.45_0.07_160)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          No medications to display
        </h3>
        <p className="text-sm text-[oklch(0.55_0_0)] mb-5">
          Prescribe medications to see them in the MAR chart.
        </p>
        <Link
          href={`/${orgSlug}/persons/${personId}/emar/medications/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors"
        >
          Add medication
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Chart header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          MAR Chart &mdash; {formatDate(data.date)}
        </h2>
        <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0_0)]">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-emerald-100 border border-emerald-300" /> G = Given
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-red-100 border border-red-300" /> R = Refused
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-amber-100 border border-amber-300" /> W = Withheld
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-orange-100 border border-orange-300" /> O = Omitted
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm" role="grid" aria-label="MAR chart">
          <thead>
            <tr className="border-b border-[oklch(0.91_0.005_160)] bg-[oklch(0.985_0.003_160)]">
              <th className="sticky left-0 z-10 bg-[oklch(0.985_0.003_160)] border-r border-[oklch(0.91_0.005_160)] px-4 py-3 text-left text-xs font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide w-[260px] min-w-[260px]">
                Medication
              </th>
              {sortedTimeSlots.map((slot) => (
                <th
                  key={slot}
                  className="px-2 py-3 text-center text-xs font-semibold text-[oklch(0.35_0.04_160)] min-w-[60px]"
                >
                  {formatTime(slot)}
                </th>
              ))}
              {/* PRN column */}
              <th className="px-2 py-3 text-center text-xs font-semibold text-[oklch(0.35_0.04_160)] min-w-[60px]">
                PRN
              </th>
            </tr>
          </thead>
          <tbody>
            {displayMeds.map((med) => {
              const medSlots = generateTimeSlots(
                med.frequency,
                med.frequencyDetail as FrequencyDetail,
                data.date,
              );
              const isPRN = med.frequency === 'prn';
              const prnAdmins = isPRN ? med.administrations : [];
              const routeLabel = MEDICATION_ROUTE_LABELS[med.route as keyof typeof MEDICATION_ROUTE_LABELS] ?? med.route;

              return (
                <tr
                  key={med.id}
                  className="border-b border-[oklch(0.95_0.003_160)] hover:bg-[oklch(0.99_0.002_160)] transition-colors"
                >
                  {/* Medication info cell */}
                  <td className="sticky left-0 z-10 bg-white border-r border-[oklch(0.91_0.005_160)] px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/${orgSlug}/persons/${personId}/emar/medications/${med.id}`}
                          className="text-sm font-semibold text-[oklch(0.22_0.04_160)] hover:text-[oklch(0.3_0.08_160)] transition-colors"
                        >
                          {med.drugName}
                        </Link>
                        <p className="text-xs text-[oklch(0.55_0_0)]">
                          {med.dose} {med.doseUnit} &mdash; {routeLabel}
                        </p>
                        {med.specialInstructions && (
                          <p className="text-[10px] text-amber-600 mt-0.5 truncate max-w-[220px]" title={med.specialInstructions}>
                            {med.specialInstructions}
                          </p>
                        )}
                      </div>
                      <MedicationStatusBadge status={med.status} />
                    </div>
                  </td>

                  {/* Time slot cells */}
                  {sortedTimeSlots.map((slot) => {
                    const isScheduled = medSlots.includes(slot);
                    if (!isScheduled) {
                      return (
                        <td key={slot} className="px-1 py-1.5 text-center">
                          <div className="w-full h-full min-h-[40px] flex items-center justify-center text-[oklch(0.88_0_0)]">
                            &mdash;
                          </div>
                        </td>
                      );
                    }

                    const adminKey = `${med.id}:${new Date(slot).toISOString()}`;
                    const admin = adminIndex.get(adminKey) ?? null;

                    return (
                      <td key={slot} className="px-1 py-1.5">
                        <AdministrationCell
                          medication={med}
                          scheduledTime={slot}
                          administration={admin}
                          canAdminister={canAdminister && med.status === 'active'}
                          onClickCell={() =>
                            setSelectedCell({ medication: med, scheduledTime: slot, administration: admin })
                          }
                        />
                      </td>
                    );
                  })}

                  {/* PRN cell */}
                  <td className="px-1 py-1.5 text-center">
                    {isPRN ? (
                      <div className="space-y-1">
                        {prnAdmins.length > 0 ? (
                          prnAdmins.map((admin) => {
                            const colors = getAdministrationStatusColor(admin.status);
                            return (
                              <button
                                key={admin.id}
                                type="button"
                                onClick={() =>
                                  canAdminister &&
                                  setSelectedCell({
                                    medication: med,
                                    scheduledTime: admin.scheduledTime.toISOString(),
                                    administration: admin,
                                  })
                                }
                                className={`w-full rounded-md border ${colors.border} ${colors.bg} ${colors.text} text-[10px] px-1 py-0.5`}
                              >
                                {formatTime(admin.scheduledTime.toISOString())}
                              </button>
                            );
                          })
                        ) : null}
                        {canAdminister && med.status === 'active' && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCell({
                                medication: med,
                                scheduledTime: new Date().toISOString(),
                                administration: null,
                              })
                            }
                            className="w-full rounded-md border border-dashed border-[oklch(0.8_0.02_160)] bg-[oklch(0.985_0.005_160)] hover:border-[oklch(0.5_0.1_160)] text-xs text-[oklch(0.6_0.04_160)] px-1 py-1 transition-colors"
                          >
                            + PRN
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[oklch(0.88_0_0)]">&mdash;</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Administration recording modal */}
      {selectedCell && (
        <AdministrationForm
          medication={selectedCell.medication}
          scheduledTime={selectedCell.scheduledTime}
          existingAdministration={selectedCell.administration}
          personId={personId}
          currentUserId={currentUserId}
          staffMembers={staffMembers}
          onSubmit={onRecordAdministration}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </>
  );
}
