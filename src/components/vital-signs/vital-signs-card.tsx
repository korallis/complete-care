/**
 * VitalSignsCard — displays a single vital signs reading with all parameters.
 */

import {
  AVPU_LABELS,
  BP_POSITION_LABELS,
  PULSE_RHYTHM_LABELS,
  VITAL_RANGES,
  type AvpuLevel,
  type BpPosition,
  type PulseRhythm,
} from '@/features/vital-signs/constants';
import { News2ScoreBadge } from './news2-score-badge';

type VitalSignsCardProps = {
  entry: {
    id: string;
    temperature: number | null;
    systolicBp: number | null;
    diastolicBp: number | null;
    bpPosition: string | null;
    pulseRate: number | null;
    pulseRhythm: string | null;
    respiratoryRate: number | null;
    spo2: number | null;
    supplementalOxygen: boolean | null;
    oxygenFlowRate: number | null;
    avpu: string | null;
    bloodGlucose: number | null;
    painScore: number | null;
    news2Score: number | null;
    news2ScaleUsed: number | null;
    news2Escalation: string | null;
    isCopd: boolean;
    recordedByName: string | null;
    recordedAt: Date;
    notes: string | null;
  };
};

function isOutOfRange(
  value: number | null,
  param: keyof typeof VITAL_RANGES,
): boolean {
  if (value == null) return false;
  const range = VITAL_RANGES[param];
  return value < range.normalMin || value > range.normalMax;
}

function VitalParam({
  label,
  value,
  unit,
  outOfRange = false,
}: {
  label: string;
  value: string | null;
  unit?: string;
  outOfRange?: boolean;
}) {
  if (value == null) return null;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-[oklch(0.55_0_0)]">{label}</span>
      <span
        className={`text-sm font-medium ${
          outOfRange
            ? 'text-red-700'
            : 'text-[oklch(0.22_0.04_160)]'
        }`}
      >
        {value}
        {unit && <span className="text-xs text-[oklch(0.55_0_0)] ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}

export function VitalSignsCard({ entry }: VitalSignsCardProps) {
  const recordedAt =
    entry.recordedAt instanceof Date
      ? entry.recordedAt
      : new Date(entry.recordedAt);

  const formattedDate = recordedAt.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = recordedAt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
            {formattedDate} at {formattedTime}
          </p>
          {entry.recordedByName && (
            <p className="text-xs text-[oklch(0.55_0_0)]">
              by {entry.recordedByName}
            </p>
          )}
        </div>
        {entry.news2Score != null && entry.news2Escalation && (
          <News2ScoreBadge
            score={entry.news2Score}
            escalation={entry.news2Escalation}
            scaleUsed={entry.news2ScaleUsed}
          />
        )}
      </div>

      {/* Parameters */}
      <div className="divide-y divide-[oklch(0.95_0.005_160)]">
        <VitalParam
          label="Temperature"
          value={entry.temperature?.toFixed(1) ?? null}
          unit={VITAL_RANGES.temperature.unit}
          outOfRange={isOutOfRange(entry.temperature, 'temperature')}
        />
        {(entry.systolicBp != null || entry.diastolicBp != null) && (
          <VitalParam
            label={`Blood Pressure${entry.bpPosition ? ` (${BP_POSITION_LABELS[entry.bpPosition as BpPosition] ?? entry.bpPosition})` : ''}`}
            value={
              entry.systolicBp != null && entry.diastolicBp != null
                ? `${entry.systolicBp}/${entry.diastolicBp}`
                : entry.systolicBp != null
                  ? `${entry.systolicBp}/?`
                  : null
            }
            unit="mmHg"
            outOfRange={isOutOfRange(entry.systolicBp, 'systolicBp')}
          />
        )}
        <VitalParam
          label={`Pulse Rate${entry.pulseRhythm ? ` (${PULSE_RHYTHM_LABELS[entry.pulseRhythm as PulseRhythm] ?? entry.pulseRhythm})` : ''}`}
          value={entry.pulseRate?.toString() ?? null}
          unit={VITAL_RANGES.pulseRate.unit}
          outOfRange={isOutOfRange(entry.pulseRate, 'pulseRate')}
        />
        <VitalParam
          label="Respiratory Rate"
          value={entry.respiratoryRate?.toString() ?? null}
          unit={VITAL_RANGES.respiratoryRate.unit}
          outOfRange={isOutOfRange(entry.respiratoryRate, 'respiratoryRate')}
        />
        <VitalParam
          label={`SpO2${entry.supplementalOxygen ? ` (on O2${entry.oxygenFlowRate ? ` ${entry.oxygenFlowRate}L/min` : ''})` : ''}`}
          value={entry.spo2?.toString() ?? null}
          unit={VITAL_RANGES.spo2.unit}
          outOfRange={isOutOfRange(entry.spo2, 'spo2')}
        />
        <VitalParam
          label="Consciousness (AVPU)"
          value={
            entry.avpu
              ? (AVPU_LABELS[entry.avpu as AvpuLevel] ?? entry.avpu)
              : null
          }
          outOfRange={entry.avpu != null && entry.avpu !== 'alert'}
        />
        <VitalParam
          label="Blood Glucose"
          value={entry.bloodGlucose?.toFixed(1) ?? null}
          unit={VITAL_RANGES.bloodGlucose.unit}
          outOfRange={isOutOfRange(entry.bloodGlucose, 'bloodGlucose')}
        />
        <VitalParam
          label="Pain Score"
          value={entry.painScore?.toString() ?? null}
          unit="/10"
          outOfRange={entry.painScore != null && entry.painScore > 0}
        />
      </div>

      {/* COPD indicator */}
      {entry.isCopd && (
        <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1">
          COPD patient — NEWS2 Scale 2 applied
        </p>
      )}

      {/* Notes */}
      {entry.notes && (
        <div className="pt-2 border-t border-[oklch(0.95_0.005_160)]">
          <p className="text-xs text-[oklch(0.55_0_0)]">Notes</p>
          <p className="text-sm text-[oklch(0.35_0.04_160)] mt-0.5">
            {entry.notes}
          </p>
        </div>
      )}
    </div>
  );
}
