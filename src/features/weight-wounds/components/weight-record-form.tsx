'use client';

/**
 * Weight recording form — date, weight, optional height, notes.
 * Auto-calculates BMI when height is available. VAL-CLIN-010.
 */
import { useState, useMemo } from 'react';
import {
  calculateBmi,
  getBmiCategory,
  BMI_CATEGORIES,
} from '../schema';

interface WeightRecordFormProps {
  defaultHeightCm?: number | null;
  onSubmit: (data: {
    recordedDate: string;
    weightKg: number;
    heightCm: number | null;
    notes: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function WeightRecordForm({
  defaultHeightCm,
  onSubmit,
  isSubmitting = false,
}: WeightRecordFormProps) {
  const [recordedDate, setRecordedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState(
    defaultHeightCm?.toString() ?? '',
  );
  const [notes, setNotes] = useState('');

  const bmiPreview = useMemo(() => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!w || !h || w <= 0 || h <= 0) return null;
    const bmi = calculateBmi(w, h);
    const category = getBmiCategory(bmi);
    return { value: bmi, category };
  }, [weightKg, heightCm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      recordedDate,
      weightKg: parseFloat(weightKg),
      heightCm: heightCm ? parseFloat(heightCm) : null,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Date */}
        <div>
          <label htmlFor="recordedDate" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="recordedDate"
            type="date"
            value={recordedDate}
            onChange={(e) => setRecordedDate(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Weight */}
        <div>
          <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700">
            Weight (kg)
          </label>
          <input
            id="weightKg"
            type="number"
            step="0.1"
            min="0.5"
            max="500"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
            placeholder="e.g. 72.5"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Height */}
        <div>
          <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700">
            Height (cm) <span className="text-gray-400">— optional, for BMI</span>
          </label>
          <input
            id="heightCm"
            type="number"
            step="0.1"
            min="30"
            max="300"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="e.g. 170"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* BMI Preview */}
        <div className="flex items-end">
          {bmiPreview && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">BMI</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">{bmiPreview.value}</span>
                <span
                  className={`text-sm font-medium ${BMI_CATEGORIES[bmiPreview.category].colour}`}
                >
                  {BMI_CATEGORIES[bmiPreview.category].label}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any relevant observations..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !weightKg}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Record Weight'}
      </button>
    </form>
  );
}
