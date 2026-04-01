'use client';

/**
 * FluidChart — 24hr intake/output display with running totals and threshold indicators.
 */

import type { FluidEntryListItem } from '@/features/clinical-monitoring/actions';
import {
  INTAKE_FLUID_TYPE_LABELS,
  OUTPUT_FLUID_TYPE_LABELS,
  IDDSI_LEVEL_LABELS,
  type IntakeFluidType,
  type OutputFluidType,
  type IddsiLevel,
} from '@/features/clinical-monitoring/constants';
import {
  formatVolume,
  formatTime,
  getFluidAlertLevel,
} from '@/features/clinical-monitoring/utils';

type FluidChartProps = {
  entries: FluidEntryListItem[];
  totalIntake: number;
  totalOutput: number;
  balance: number;
};

export function FluidChart({
  entries,
  totalIntake,
  totalOutput,
  balance,
}: FluidChartProps) {
  const alertLevel = getFluidAlertLevel(totalIntake);

  const intakeEntries = entries.filter((e) => e.entryType === 'intake');
  const outputEntries = entries.filter((e) => e.entryType === 'output');

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className={`rounded-lg border p-3 ${
            alertLevel === 'red'
              ? 'border-red-200 bg-red-50'
              : alertLevel === 'amber'
                ? 'border-amber-200 bg-amber-50'
                : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <p className="text-xs font-medium text-[oklch(0.55_0_0)]">
            Total Intake
          </p>
          <p
            className={`text-xl font-bold ${
              alertLevel === 'red'
                ? 'text-red-700'
                : alertLevel === 'amber'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
            }`}
          >
            {formatVolume(totalIntake)}
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)]">
            Total Output
          </p>
          <p className="text-xl font-bold text-blue-700">
            {formatVolume(totalOutput)}
          </p>
        </div>

        <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-3">
          <p className="text-xs font-medium text-[oklch(0.55_0_0)]">Balance</p>
          <p
            className={`text-xl font-bold ${
              balance >= 0
                ? 'text-[oklch(0.35_0.06_160)]'
                : 'text-amber-700'
            }`}
          >
            {balance >= 0 ? '+' : ''}
            {formatVolume(balance)}
          </p>
        </div>
      </div>

      {/* Intake table */}
      <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
        <div className="bg-[oklch(0.97_0.003_160)] px-4 py-2 border-b border-[oklch(0.91_0.005_160)]">
          <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Intake ({intakeEntries.length} entries)
          </h4>
        </div>
        {intakeEntries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-center text-[oklch(0.55_0_0)]">
            No intake entries recorded for this date
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[oklch(0.91_0.005_160)]">
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Type
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[oklch(0.55_0_0)]">
                    Volume
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    IDDSI
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {intakeEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[oklch(0.95_0.003_160)] last:border-0"
                  >
                    <td className="px-4 py-2 text-[oklch(0.35_0.04_160)]">
                      {formatTime(entry.recordedAt)}
                    </td>
                    <td className="px-4 py-2 text-[oklch(0.22_0.04_160)]">
                      {INTAKE_FLUID_TYPE_LABELS[
                        entry.fluidType as IntakeFluidType
                      ] ?? entry.fluidType}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-[oklch(0.22_0.04_160)]">
                      {entry.volume}ml
                    </td>
                    <td className="px-4 py-2 text-[oklch(0.55_0_0)]">
                      {entry.iddsiLevel != null
                        ? IDDSI_LEVEL_LABELS[entry.iddsiLevel as IddsiLevel]
                        : '-'}
                    </td>
                    <td className="px-4 py-2 text-[oklch(0.55_0_0)]">
                      {entry.recordedByName ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Output table */}
      <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
        <div className="bg-[oklch(0.97_0.003_160)] px-4 py-2 border-b border-[oklch(0.91_0.005_160)]">
          <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Output ({outputEntries.length} entries)
          </h4>
        </div>
        {outputEntries.length === 0 ? (
          <p className="px-4 py-6 text-sm text-center text-[oklch(0.55_0_0)]">
            No output entries recorded for this date
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[oklch(0.91_0.005_160)]">
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Type
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-[oklch(0.55_0_0)]">
                    Volume
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Characteristics
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-[oklch(0.55_0_0)]">
                    Staff
                  </th>
                </tr>
              </thead>
              <tbody>
                {outputEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-[oklch(0.95_0.003_160)] last:border-0"
                  >
                    <td className="px-4 py-2 text-[oklch(0.35_0.04_160)]">
                      {formatTime(entry.recordedAt)}
                    </td>
                    <td className="px-4 py-2 text-[oklch(0.22_0.04_160)]">
                      {OUTPUT_FLUID_TYPE_LABELS[
                        entry.fluidType as OutputFluidType
                      ] ?? entry.fluidType}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-[oklch(0.22_0.04_160)]">
                      {entry.volume}ml
                    </td>
                    <td className="px-4 py-2 text-[oklch(0.55_0_0)]">
                      {entry.characteristics ?? '-'}
                    </td>
                    <td className="px-4 py-2 text-[oklch(0.55_0_0)]">
                      {entry.recordedByName ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
