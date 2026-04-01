'use client';

/**
 * BristolStoolChart — visual Bristol Stool Scale type 1-7 selector.
 * Each type shows a description with visual indicator.
 */

import {
  BRISTOL_TYPES,
  BRISTOL_TYPE_SHORT_LABELS,
  type BristolType,
} from '@/features/bowel-sleep-pain/constants';

type BristolStoolChartProps = {
  value: BristolType | null;
  onChange: (type: BristolType) => void;
};

const typeColours: Record<BristolType, string> = {
  1: 'bg-red-100 border-red-300 text-red-800',
  2: 'bg-orange-100 border-orange-300 text-orange-800',
  3: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  4: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  5: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  6: 'bg-orange-100 border-orange-300 text-orange-800',
  7: 'bg-red-100 border-red-300 text-red-800',
};

const selectedColours: Record<BristolType, string> = {
  1: 'bg-red-200 border-red-500 ring-2 ring-red-300',
  2: 'bg-orange-200 border-orange-500 ring-2 ring-orange-300',
  3: 'bg-emerald-200 border-emerald-500 ring-2 ring-emerald-300',
  4: 'bg-emerald-200 border-emerald-500 ring-2 ring-emerald-300',
  5: 'bg-yellow-200 border-yellow-500 ring-2 ring-yellow-300',
  6: 'bg-orange-200 border-orange-500 ring-2 ring-orange-300',
  7: 'bg-red-200 border-red-500 ring-2 ring-red-300',
};

export function BristolStoolChart({ value, onChange }: BristolStoolChartProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[oklch(0.4_0.02_160)]">
        Bristol Stool Scale
      </label>
      <div className="grid grid-cols-1 gap-1.5">
        {BRISTOL_TYPES.map((type) => {
          const isSelected = value === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                isSelected
                  ? selectedColours[type]
                  : `${typeColours[type]} hover:opacity-80`
              }`}
              aria-pressed={isSelected}
              aria-label={`Bristol type ${type}: ${BRISTOL_TYPE_SHORT_LABELS[type]}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/60 text-xs font-bold">
                {type}
              </span>
              <span className="font-medium">
                {BRISTOL_TYPE_SHORT_LABELS[type]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
