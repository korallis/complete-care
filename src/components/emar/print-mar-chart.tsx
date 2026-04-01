'use client';

/**
 * PrintMarChart — print-friendly MAR chart view.
 * Generates a print-optimised layout with all medication and administration data.
 */

import type { MarChartData } from '@/features/emar/actions';
import type { FrequencyDetail } from '@/lib/db/schema/medications';
import {
  generateTimeSlots,
  formatTime,
  formatDate,
  getAdministrationStatusCode,
} from '@/features/emar/utils';
import {
  MEDICATION_ROUTE_LABELS,
  MEDICATION_STATUS_LABELS,
} from '@/features/emar/constants';
import type { MedicationAdministration } from '@/lib/db/schema/medications';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PrintMarChartProps = {
  data: MarChartData;
  personName: string;
};

// ---------------------------------------------------------------------------
// Print button
// ---------------------------------------------------------------------------

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors print:hidden"
      aria-label="Print MAR chart"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print
    </button>
  );
}

// ---------------------------------------------------------------------------
// Print view
// ---------------------------------------------------------------------------

export function PrintMarChart({ data, personName }: PrintMarChartProps) {
  const allTimeSlots = new Set<string>();
  const activeMeds = data.medications.filter(
    (m) => m.status === 'active' || m.administrations.length > 0,
  );

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

  // Index administrations
  const adminIndex = new Map<string, MedicationAdministration>();
  for (const med of data.medications) {
    for (const admin of med.administrations) {
      const key = `${admin.medicationId}:${admin.scheduledTime.toISOString()}`;
      adminIndex.set(key, admin);
    }
  }

  return (
    <div className="hidden print:block print:text-black">
      {/* Print header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold">Medication Administration Record (MAR)</h1>
        <div className="flex justify-between mt-2 text-sm">
          <div>
            <strong>Person:</strong> {personName}
          </div>
          <div>
            <strong>Date:</strong> {formatDate(data.date)}
          </div>
          <div>
            <strong>Printed:</strong> {new Date().toLocaleString('en-GB')}
          </div>
        </div>
      </div>

      {/* Print table */}
      <table className="w-full border-collapse border border-black text-xs">
        <thead>
          <tr>
            <th className="border border-black px-2 py-1 text-left w-1/4">Medication</th>
            <th className="border border-black px-2 py-1 text-left w-1/6">Dose / Route</th>
            <th className="border border-black px-2 py-1 text-left w-1/12">Status</th>
            {sortedTimeSlots.map((slot) => (
              <th key={slot} className="border border-black px-1 py-1 text-center">
                {formatTime(slot)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {activeMeds.map((med) => {
            const medSlots = generateTimeSlots(
              med.frequency,
              med.frequencyDetail as FrequencyDetail,
              data.date,
            );
            const routeLabel = MEDICATION_ROUTE_LABELS[med.route as keyof typeof MEDICATION_ROUTE_LABELS] ?? med.route;
            const statusLabel = MEDICATION_STATUS_LABELS[med.status as keyof typeof MEDICATION_STATUS_LABELS] ?? med.status;

            return (
              <tr key={med.id}>
                <td className="border border-black px-2 py-1">
                  <div className="font-semibold">{med.drugName}</div>
                  {med.specialInstructions && (
                    <div className="text-[9px] italic">{med.specialInstructions}</div>
                  )}
                </td>
                <td className="border border-black px-2 py-1">
                  {med.dose} {med.doseUnit} &mdash; {routeLabel}
                </td>
                <td className="border border-black px-2 py-1">{statusLabel}</td>
                {sortedTimeSlots.map((slot) => {
                  const isScheduled = medSlots.includes(slot);
                  if (!isScheduled) {
                    return (
                      <td key={slot} className="border border-black px-1 py-1 text-center text-gray-300">
                        -
                      </td>
                    );
                  }
                  const adminKey = `${med.id}:${new Date(slot).toISOString()}`;
                  const admin = adminIndex.get(adminKey);
                  return (
                    <td key={slot} className="border border-black px-1 py-1 text-center">
                      {admin ? (
                        <div>
                          <div className="font-bold">{getAdministrationStatusCode(admin.status)}</div>
                          <div className="text-[8px]">{admin.administeredByName?.split(' ')[0] ?? ''}</div>
                        </div>
                      ) : (
                        ''
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 text-xs">
        <strong>Key:</strong> G = Given, SA = Self-Administered, R = Refused, W = Withheld, O = Omitted, NA = Not Available
      </div>

      {/* Signature lines */}
      <div className="mt-8 grid grid-cols-2 gap-8 text-xs">
        <div>
          <div className="border-b border-black mb-1" />
          <p>Staff Signature / Date</p>
        </div>
        <div>
          <div className="border-b border-black mb-1" />
          <p>Senior Carer Signature / Date</p>
        </div>
      </div>

      {/* NICE SC1 compliance note */}
      <div className="mt-6 text-[9px] text-gray-600 border-t pt-2">
        This MAR chart follows NICE SC1 Single Competency Framework for medication administration.
        All administrations are recorded with staff ID, time, and witness where required.
      </div>
    </div>
  );
}
