'use client';

/**
 * Waterlow pressure ulcer risk assessment form.
 * Auto-calculates total score and risk category. VAL-CLIN-011.
 */
import { useState, useMemo } from 'react';
import {
  WATERLOW_OPTIONS,
  WATERLOW_RISK_CATEGORIES,
  calculateWaterlowTotal,
  getWaterlowRiskCategory,
  type WaterlowScores,
} from '../schema';

interface WaterlowAssessmentFormProps {
  onSubmit: (data: {
    assessmentDate: string;
    scores: WaterlowScores;
    notes: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const SCORE_FIELDS = [
  { key: 'age' as const, label: 'Age' },
  { key: 'bmi' as const, label: 'Build/Weight (BMI)' },
  { key: 'skinType' as const, label: 'Skin Type' },
  { key: 'mobility' as const, label: 'Mobility' },
  { key: 'nutrition' as const, label: 'Appetite/Nutrition' },
  { key: 'tissueMalnutrition' as const, label: 'Tissue Malnutrition' },
  { key: 'neurologicalDeficit' as const, label: 'Neurological Deficit' },
  { key: 'surgery' as const, label: 'Surgery/Trauma' },
  { key: 'medication' as const, label: 'Medication' },
] as const;

export function WaterlowAssessmentForm({
  onSubmit,
  isSubmitting = false,
}: WaterlowAssessmentFormProps) {
  const [assessmentDate, setAssessmentDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [scores, setScores] = useState<WaterlowScores>({
    age: 0,
    bmi: 0,
    skinType: 0,
    mobility: 0,
    nutrition: 0,
    tissueMalnutrition: 0,
    neurologicalDeficit: 0,
    surgery: 0,
    medication: 0,
  });
  const [notes, setNotes] = useState('');

  const totalScore = useMemo(() => calculateWaterlowTotal(scores), [scores]);
  const riskCategory = useMemo(() => getWaterlowRiskCategory(totalScore), [totalScore]);
  const riskInfo = WATERLOW_RISK_CATEGORIES[riskCategory];

  const updateScore = (key: keyof WaterlowScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ assessmentDate, scores, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date */}
      <div>
        <label htmlFor="assessmentDate" className="block text-sm font-medium text-gray-700">
          Assessment Date
        </label>
        <input
          id="assessmentDate"
          type="date"
          value={assessmentDate}
          onChange={(e) => setAssessmentDate(e.target.value)}
          required
          className="mt-1 block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Score Fields */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Risk Factors
        </h3>
        {SCORE_FIELDS.map(({ key, label }) => (
          <div key={key} className="rounded-lg border border-gray-200 p-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <div className="space-y-1">
              {WATERLOW_OPTIONS[key].map((option) => (
                <label
                  key={`${key}-${option.value}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    scores[key] === option.value
                      ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={key}
                    value={option.value}
                    checked={scores[key] === option.value}
                    onChange={() => updateScore(key, option.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1">{option.label}</span>
                  <span className="text-xs font-mono text-gray-400">
                    +{option.value}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Running total / risk category */}
      <div
        className={`sticky bottom-0 rounded-lg border-2 p-4 ${riskInfo.bg} ${
          riskCategory === 'very_high_risk'
            ? 'border-red-300'
            : riskCategory === 'high_risk'
              ? 'border-orange-300'
              : riskCategory === 'at_risk'
                ? 'border-amber-300'
                : 'border-green-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total Waterlow Score
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums">{totalScore}</span>
              <span className={`text-base font-semibold ${riskInfo.colour}`}>
                {riskInfo.label}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>10+ At Risk</div>
            <div>15+ High Risk</div>
            <div>20+ Very High Risk</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="waterlowNotes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="waterlowNotes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional observations..."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save Assessment'}
      </button>
    </form>
  );
}
