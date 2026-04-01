'use client';

/**
 * FluidEntryForm — record a fluid intake or output entry.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  FLUID_ENTRY_TYPES,
  FLUID_ENTRY_TYPE_LABELS,
  INTAKE_FLUID_TYPES,
  INTAKE_FLUID_TYPE_LABELS,
  OUTPUT_FLUID_TYPES,
  OUTPUT_FLUID_TYPE_LABELS,
  IDDSI_LEVELS,
  IDDSI_LEVEL_LABELS,
  COMMON_VOLUMES,
  type FluidEntryType,
  type IntakeFluidType,
  type OutputFluidType,
} from '@/features/clinical-monitoring/constants';
import type { RecordFluidEntryInput } from '@/features/clinical-monitoring/schema';

type FluidEntryFormProps = {
  personId: string;
  onSubmit: (
    input: RecordFluidEntryInput,
  ) => Promise<{ success: boolean; error?: string }>;
};

export function FluidEntryForm({ personId, onSubmit }: FluidEntryFormProps) {
  const [isPending, startTransition] = useTransition();
  const [entryType, setEntryType] = useState<FluidEntryType>('intake');
  const [fluidType, setFluidType] = useState<string>('water');
  const [volume, setVolume] = useState<number>(200);
  const [iddsiLevel, setIddsiLevel] = useState<number | null>(null);
  const [characteristics, setCharacteristics] = useState('');
  const [showIddsi, setShowIddsi] = useState(false);

  const fluidTypes =
    entryType === 'intake' ? INTAKE_FLUID_TYPES : OUTPUT_FLUID_TYPES;
  const fluidTypeLabels =
    entryType === 'intake'
      ? INTAKE_FLUID_TYPE_LABELS
      : OUTPUT_FLUID_TYPE_LABELS;

  function handleEntryTypeChange(type: FluidEntryType) {
    setEntryType(type);
    setFluidType(type === 'intake' ? 'water' : 'urine');
    setIddsiLevel(null);
    setShowIddsi(false);
    setCharacteristics('');
  }

  function handleFluidTypeChange(type: string) {
    setFluidType(type);
    if (type === 'thickened') {
      setShowIddsi(true);
    } else {
      setShowIddsi(false);
      setIddsiLevel(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (volume <= 0) {
      toast.error('Volume must be greater than 0');
      return;
    }

    startTransition(async () => {
      const input: RecordFluidEntryInput = {
        personId,
        entryType,
        fluidType,
        volume,
        iddsiLevel: showIddsi ? iddsiLevel : null,
        characteristics: characteristics || null,
        recordedAt: new Date().toISOString(),
      };

      const result = await onSubmit(input);

      if (result.success) {
        toast.success(
          `${entryType === 'intake' ? 'Intake' : 'Output'} recorded: ${volume}ml`,
        );
        // Reset form
        setVolume(200);
        setCharacteristics('');
        setIddsiLevel(null);
      } else {
        toast.error(result.error ?? 'Failed to record entry');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4 space-y-4"
    >
      <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
        Record Fluid Entry
      </h3>

      {/* Entry type toggle */}
      <div className="flex rounded-lg border border-[oklch(0.88_0.005_160)] p-0.5">
        {FLUID_ENTRY_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleEntryTypeChange(type)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              entryType === type
                ? 'bg-[oklch(0.3_0.08_160)] text-white'
                : 'text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.04_160)]'
            }`}
          >
            {FLUID_ENTRY_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Fluid type */}
      <div>
        <label
          htmlFor="fluid-type"
          className="block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1"
        >
          Type
        </label>
        <select
          id="fluid-type"
          value={fluidType}
          onChange={(e) => handleFluidTypeChange(e.target.value)}
          className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
        >
          {fluidTypes.map((type) => (
            <option key={type} value={type}>
              {fluidTypeLabels[type as IntakeFluidType & OutputFluidType]}
            </option>
          ))}
        </select>
      </div>

      {/* IDDSI level (only for thickened fluids) */}
      {showIddsi && (
        <div>
          <label
            htmlFor="iddsi-level"
            className="block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1"
          >
            IDDSI Consistency Level
          </label>
          <select
            id="iddsi-level"
            value={iddsiLevel ?? ''}
            onChange={(e) =>
              setIddsiLevel(e.target.value ? Number(e.target.value) : null)
            }
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
          >
            <option value="">Select level</option>
            {IDDSI_LEVELS.map((level) => (
              <option key={level} value={level}>
                {IDDSI_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Volume */}
      <div>
        <label
          htmlFor="volume"
          className="block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1"
        >
          Volume (ml)
        </label>
        <input
          id="volume"
          type="number"
          min={1}
          max={5000}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
        />
        {/* Quick volume buttons */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {COMMON_VOLUMES.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setVolume(preset.value)}
              className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                volume === preset.value
                  ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.95_0.02_160)] text-[oklch(0.3_0.08_160)]'
                  : 'border-[oklch(0.88_0.005_160)] text-[oklch(0.55_0_0)] hover:border-[oklch(0.7_0.03_160)]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Characteristics (output only) */}
      {entryType === 'output' && (
        <div>
          <label
            htmlFor="characteristics"
            className="block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1"
          >
            Characteristics
          </label>
          <textarea
            id="characteristics"
            value={characteristics}
            onChange={(e) => setCharacteristics(e.target.value)}
            rows={2}
            placeholder="Colour, consistency, etc."
            className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
          />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Recording...' : `Record ${entryType === 'intake' ? 'Intake' : 'Output'}`}
      </button>
    </form>
  );
}
