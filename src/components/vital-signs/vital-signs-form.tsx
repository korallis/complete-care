'use client';

/**
 * VitalSignsForm — input all vital sign parameters with range validation indicators.
 * Auto-calculates NEWS2 preview when all required parameters are entered.
 */

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import {
  BP_POSITIONS,
  BP_POSITION_LABELS,
  PULSE_RHYTHMS,
  PULSE_RHYTHM_LABELS,
  AVPU_LEVELS,
  AVPU_LABELS,
  VITAL_RANGES,
  type BpPosition,
  type PulseRhythm,
  type AvpuLevel,
} from '@/features/vital-signs/constants';
import { calculateNews2 } from '@/features/vital-signs/news2';
import type { RecordVitalSignsInput } from '@/features/vital-signs/schema';
import { News2ScoreBadge } from './news2-score-badge';

type VitalSignsFormProps = {
  personId: string;
  defaultIsCopd?: boolean;
  onSubmit: (
    input: RecordVitalSignsInput,
  ) => Promise<{ success: boolean; error?: string }>;
};

function parseFloat_(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseInt_(val: string): number | null {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function RangeIndicator({
  value,
  param,
}: {
  value: number | null;
  param: keyof typeof VITAL_RANGES;
}) {
  if (value == null) return null;
  const range = VITAL_RANGES[param];
  if (value < range.normalMin || value > range.normalMax) {
    return (
      <span className="text-xs text-red-600 ml-1">
        (normal: {range.normalMin}-{range.normalMax}{range.unit})
      </span>
    );
  }
  return null;
}

const inputClass =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]';
const labelClass = 'block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1';
const selectClass =
  'w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]';

export function VitalSignsForm({
  personId,
  defaultIsCopd = false,
  onSubmit,
}: VitalSignsFormProps) {
  const [isPending, startTransition] = useTransition();

  // Form state
  const [temperature, setTemperature] = useState('');
  const [systolicBp, setSystolicBp] = useState('');
  const [diastolicBp, setDiastolicBp] = useState('');
  const [bpPosition, setBpPosition] = useState<BpPosition | ''>('sitting');
  const [pulseRate, setPulseRate] = useState('');
  const [pulseRhythm, setPulseRhythm] = useState<PulseRhythm | ''>('regular');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const [supplementalOxygen, setSupplementalOxygen] = useState(false);
  const [oxygenFlowRate, setOxygenFlowRate] = useState('');
  const [avpu, setAvpu] = useState<AvpuLevel | ''>('alert');
  const [bloodGlucose, setBloodGlucose] = useState('');
  const [painScore, setPainScore] = useState('');
  const [isCopd, setIsCopd] = useState(defaultIsCopd);
  const [notes, setNotes] = useState('');

  // Parse numeric values
  const tempNum = parseFloat_(temperature);
  const systolicNum = parseInt_(systolicBp);
  const pulseNum = parseInt_(pulseRate);
  const respNum = parseInt_(respiratoryRate);
  const spo2Num = parseInt_(spo2);
  const glucoseNum = parseFloat_(bloodGlucose);
  const painNum = parseInt_(painScore);

  // NEWS2 preview calculation
  const news2Preview = useMemo(() => {
    if (
      respNum == null ||
      spo2Num == null ||
      systolicNum == null ||
      pulseNum == null ||
      !avpu ||
      tempNum == null
    ) {
      return null;
    }

    return calculateNews2({
      respiratoryRate: respNum,
      spo2: spo2Num,
      supplementalOxygen,
      systolicBp: systolicNum,
      pulseRate: pulseNum,
      consciousness: avpu as AvpuLevel,
      temperature: tempNum,
      isCopd,
    });
  }, [respNum, spo2Num, systolicNum, pulseNum, avpu, tempNum, supplementalOxygen, isCopd]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const input: RecordVitalSignsInput = {
        personId,
        temperature: tempNum,
        systolicBp: systolicNum,
        diastolicBp: parseInt_(diastolicBp),
        bpPosition: bpPosition || null,
        pulseRate: pulseNum,
        pulseRhythm: pulseRhythm || null,
        respiratoryRate: respNum,
        spo2: spo2Num,
        supplementalOxygen,
        oxygenFlowRate: parseFloat_(oxygenFlowRate),
        avpu: avpu || null,
        bloodGlucose: glucoseNum,
        painScore: painNum,
        isCopd,
        recordedAt: new Date().toISOString(),
        notes: notes || null,
      };

      const result = await onSubmit(input);

      if (result.success) {
        toast.success(
          news2Preview
            ? `Vitals recorded — NEWS2: ${news2Preview.totalScore}`
            : 'Vitals recorded',
        );
        // Reset form
        setTemperature('');
        setSystolicBp('');
        setDiastolicBp('');
        setPulseRate('');
        setRespiratoryRate('');
        setSpo2('');
        setSupplementalOxygen(false);
        setOxygenFlowRate('');
        setBloodGlucose('');
        setPainScore('');
        setNotes('');
      } else {
        toast.error(result.error ?? 'Failed to record vital signs');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          Record Vital Signs
        </h3>
        {news2Preview && (
          <News2ScoreBadge
            score={news2Preview.totalScore}
            escalation={news2Preview.escalation}
            scaleUsed={news2Preview.scaleUsed}
          />
        )}
      </div>

      {/* COPD toggle */}
      <div className="flex items-center gap-2">
        <input
          id="is-copd"
          type="checkbox"
          checked={isCopd}
          onChange={(e) => setIsCopd(e.target.checked)}
          className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
        />
        <label htmlFor="is-copd" className="text-xs text-[oklch(0.4_0.02_160)]">
          COPD patient (use NEWS2 Scale 2 for SpO2 scoring)
        </label>
      </div>

      {/* Temperature */}
      <div>
        <label htmlFor="temperature" className={labelClass}>
          Temperature ({VITAL_RANGES.temperature.unit})
          <RangeIndicator value={tempNum} param="temperature" />
        </label>
        <input
          id="temperature"
          type="number"
          step="0.1"
          min={VITAL_RANGES.temperature.min}
          max={VITAL_RANGES.temperature.max}
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          placeholder="36.5"
          className={inputClass}
        />
      </div>

      {/* Blood Pressure */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="systolic-bp" className={labelClass}>
            Systolic BP
            <RangeIndicator value={systolicNum} param="systolicBp" />
          </label>
          <input
            id="systolic-bp"
            type="number"
            min={VITAL_RANGES.systolicBp.min}
            max={VITAL_RANGES.systolicBp.max}
            value={systolicBp}
            onChange={(e) => setSystolicBp(e.target.value)}
            placeholder="120"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="diastolic-bp" className={labelClass}>
            Diastolic BP
          </label>
          <input
            id="diastolic-bp"
            type="number"
            min={VITAL_RANGES.diastolicBp.min}
            max={VITAL_RANGES.diastolicBp.max}
            value={diastolicBp}
            onChange={(e) => setDiastolicBp(e.target.value)}
            placeholder="80"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="bp-position" className={labelClass}>
            Position
          </label>
          <select
            id="bp-position"
            value={bpPosition}
            onChange={(e) => setBpPosition(e.target.value as BpPosition | '')}
            className={selectClass}
          >
            <option value="">--</option>
            {BP_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {BP_POSITION_LABELS[pos]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pulse */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="pulse-rate" className={labelClass}>
            Pulse Rate ({VITAL_RANGES.pulseRate.unit})
            <RangeIndicator value={pulseNum} param="pulseRate" />
          </label>
          <input
            id="pulse-rate"
            type="number"
            min={VITAL_RANGES.pulseRate.min}
            max={VITAL_RANGES.pulseRate.max}
            value={pulseRate}
            onChange={(e) => setPulseRate(e.target.value)}
            placeholder="72"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="pulse-rhythm" className={labelClass}>
            Pulse Rhythm
          </label>
          <select
            id="pulse-rhythm"
            value={pulseRhythm}
            onChange={(e) => setPulseRhythm(e.target.value as PulseRhythm | '')}
            className={selectClass}
          >
            <option value="">--</option>
            {PULSE_RHYTHMS.map((rhythm) => (
              <option key={rhythm} value={rhythm}>
                {PULSE_RHYTHM_LABELS[rhythm]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Respiratory Rate */}
      <div>
        <label htmlFor="respiratory-rate" className={labelClass}>
          Respiratory Rate ({VITAL_RANGES.respiratoryRate.unit})
          <RangeIndicator value={respNum} param="respiratoryRate" />
        </label>
        <input
          id="respiratory-rate"
          type="number"
          min={VITAL_RANGES.respiratoryRate.min}
          max={VITAL_RANGES.respiratoryRate.max}
          value={respiratoryRate}
          onChange={(e) => setRespiratoryRate(e.target.value)}
          placeholder="16"
          className={inputClass}
        />
      </div>

      {/* SpO2 and Oxygen */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="spo2" className={labelClass}>
              SpO2 ({VITAL_RANGES.spo2.unit})
              <RangeIndicator value={spo2Num} param="spo2" />
            </label>
            <input
              id="spo2"
              type="number"
              min={VITAL_RANGES.spo2.min}
              max={VITAL_RANGES.spo2.max}
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              placeholder="98"
              className={inputClass}
            />
          </div>
          {supplementalOxygen && (
            <div>
              <label htmlFor="oxygen-flow-rate" className={labelClass}>
                O2 Flow Rate (L/min)
              </label>
              <input
                id="oxygen-flow-rate"
                type="number"
                step="0.5"
                min={VITAL_RANGES.oxygenFlowRate.min}
                max={VITAL_RANGES.oxygenFlowRate.max}
                value={oxygenFlowRate}
                onChange={(e) => setOxygenFlowRate(e.target.value)}
                placeholder="2"
                className={inputClass}
              />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            id="supplemental-oxygen"
            type="checkbox"
            checked={supplementalOxygen}
            onChange={(e) => setSupplementalOxygen(e.target.checked)}
            className="h-4 w-4 rounded border-[oklch(0.88_0.005_160)] text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
          />
          <label
            htmlFor="supplemental-oxygen"
            className="text-xs text-[oklch(0.4_0.02_160)]"
          >
            On supplemental oxygen
          </label>
        </div>
      </div>

      {/* AVPU */}
      <div>
        <label htmlFor="avpu" className={labelClass}>
          Consciousness Level (AVPU)
        </label>
        <select
          id="avpu"
          value={avpu}
          onChange={(e) => setAvpu(e.target.value as AvpuLevel | '')}
          className={selectClass}
        >
          <option value="">--</option>
          {AVPU_LEVELS.map((level) => (
            <option key={level} value={level}>
              {AVPU_LABELS[level]}
            </option>
          ))}
        </select>
      </div>

      {/* Blood Glucose */}
      <div>
        <label htmlFor="blood-glucose" className={labelClass}>
          Blood Glucose ({VITAL_RANGES.bloodGlucose.unit})
          <RangeIndicator value={glucoseNum} param="bloodGlucose" />
        </label>
        <input
          id="blood-glucose"
          type="number"
          step="0.1"
          min={VITAL_RANGES.bloodGlucose.min}
          max={VITAL_RANGES.bloodGlucose.max}
          value={bloodGlucose}
          onChange={(e) => setBloodGlucose(e.target.value)}
          placeholder="5.5"
          className={inputClass}
        />
      </div>

      {/* Pain Score */}
      <div>
        <label htmlFor="pain-score" className={labelClass}>
          Pain Score (0-10)
        </label>
        <input
          id="pain-score"
          type="number"
          min={VITAL_RANGES.painScore.min}
          max={VITAL_RANGES.painScore.max}
          value={painScore}
          onChange={(e) => setPainScore(e.target.value)}
          placeholder="0"
          className={inputClass}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="vital-notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="vital-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Additional observations..."
          className={inputClass}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Recording...' : 'Record Vital Signs'}
      </button>
    </form>
  );
}
