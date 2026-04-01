'use client';

/**
 * NightSummary — displays sleep checks for a night with auto-generated summary.
 */

import {
  SLEEP_STATUS_LABELS,
  SLEEP_POSITION_LABELS,
  BED_RAILS_LABELS,
  type SleepStatus,
  type SleepPosition,
  type BedRailsStatus,
} from '@/features/bowel-sleep-pain/constants';
import { generateNightSummary } from '@/features/bowel-sleep-pain/scoring';

type SleepCheckItem = {
  id: string;
  checkTime: Date;
  status: string;
  position: string;
  repositioned: boolean;
  nightWandering: boolean;
  bedRails: string;
  callBellChecked: boolean;
  notes: string | null;
  recordedByName: string | null;
};

type NightSummaryProps = {
  checks: SleepCheckItem[];
};

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    asleep: 'bg-blue-100 text-blue-800',
    awake: 'bg-yellow-100 text-yellow-800',
    restless: 'bg-orange-100 text-orange-800',
    out_of_bed: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colours[status] ?? 'bg-gray-100 text-gray-800'}`}
    >
      {SLEEP_STATUS_LABELS[status as SleepStatus] ?? status}
    </span>
  );
}

export function NightSummary({ checks }: NightSummaryProps) {
  const summary = generateNightSummary(checks);

  return (
    <div className="space-y-4">
      {/* Auto-generated summary */}
      <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-[oklch(0.97_0.003_160)] p-4">
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-2">
          Night Summary
        </h3>
        <p className="text-sm text-[oklch(0.35_0.04_160)]">
          {summary.summary}
        </p>
        {summary.totalChecks > 0 && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[oklch(0.55_0_0)]">
            <span>Asleep: {summary.asleepCount}</span>
            <span>Awake: {summary.awakeCount}</span>
            <span>Restless: {summary.restlessCount}</span>
            <span>Out of bed: {summary.outOfBedCount}</span>
          </div>
        )}
      </div>

      {/* Check list */}
      <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white">
        <div className="px-4 py-3 border-b border-[oklch(0.91_0.005_160)]">
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            Night Checks
          </h3>
        </div>

        {checks.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[oklch(0.55_0_0)]">
              No night checks recorded.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.91_0.005_160)]">
            {checks.map((check) => (
              <div key={check.id} className="px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={check.status} />
                      <span className="text-xs text-[oklch(0.55_0_0)]">
                        {SLEEP_POSITION_LABELS[check.position as SleepPosition] ?? check.position}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {check.repositioned && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                          Repositioned
                        </span>
                      )}
                      {check.nightWandering && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Night Wandering
                        </span>
                      )}
                      <span className="text-xs text-[oklch(0.55_0_0)]">
                        Rails: {BED_RAILS_LABELS[check.bedRails as BedRailsStatus] ?? check.bedRails}
                      </span>
                      {check.callBellChecked && (
                        <span className="text-xs text-emerald-700">
                          Bell checked
                        </span>
                      )}
                    </div>
                    {check.notes && (
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        {check.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs font-medium text-[oklch(0.35_0.04_160)]">
                      {formatTime(check.checkTime)}
                    </p>
                    {check.recordedByName && (
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        {check.recordedByName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
