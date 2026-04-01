'use client';

/**
 * MustAssessmentForm — MUST (Malnutrition Universal Screening Tool) with auto-scoring.
 */

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  BMI_SCORES,
  BMI_SCORE_LABELS,
  WEIGHT_LOSS_SCORES,
  WEIGHT_LOSS_SCORE_LABELS,
  ACUTE_DISEASE_SCORES,
  ACUTE_DISEASE_SCORE_LABELS,
  MUST_RISK_LABELS,
  MUST_CARE_PATHWAY_LABELS,
  type BmiScore,
  type WeightLossScore,
  type AcuteDiseaseScore,
} from '@/features/clinical-monitoring/constants';
import { scoreMust } from '@/features/clinical-monitoring/utils';
import type { CreateMustAssessmentInput } from '@/features/clinical-monitoring/schema';
import { MustScoreBadge } from './must-score-badge';

type MustAssessmentFormProps = {
  personId: string;
  onSubmit: (
    input: CreateMustAssessmentInput,
  ) => Promise<{ success: boolean; error?: string }>;
};

export function MustAssessmentForm({
  personId,
  onSubmit,
}: MustAssessmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [bmiScore, setBmiScore] = useState<BmiScore>(0);
  const [weightLossScore, setWeightLossScore] = useState<WeightLossScore>(0);
  const [acuteDiseaseScore, setAcuteDiseaseScore] =
    useState<AcuteDiseaseScore>(0);
  const [notes, setNotes] = useState('');

  // Auto-calculate score
  const { totalScore, riskCategory, carePathway } = scoreMust(
    bmiScore,
    weightLossScore,
    acuteDiseaseScore,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const input: CreateMustAssessmentInput = {
        personId,
        bmiScore,
        weightLossScore,
        acuteDiseaseScore,
        notes: notes || null,
      };

      const result = await onSubmit(input);

      if (result.success) {
        toast.success(
          `MUST assessment recorded: ${MUST_RISK_LABELS[riskCategory]} (score ${totalScore})`,
        );
        // Reset form
        setBmiScore(0);
        setWeightLossScore(0);
        setAcuteDiseaseScore(0);
        setNotes('');
      } else {
        toast.error(result.error ?? 'Failed to create MUST assessment');
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-[oklch(0.91_0.005_160)] bg-white p-4 space-y-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
          MUST Screening Tool
        </h3>
        <MustScoreBadge
          riskCategory={riskCategory}
          totalScore={totalScore}
          carePathway={carePathway}
          showPathway
        />
      </div>

      {/* Step 1: BMI Score */}
      <div>
        <label className="block text-xs font-semibold text-[oklch(0.3_0.06_160)] mb-2">
          Step 1: BMI Score
        </label>
        <div className="space-y-1.5">
          {BMI_SCORES.map((score) => (
            <label
              key={score}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                bmiScore === score
                  ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.97_0.01_160)]'
                  : 'border-[oklch(0.91_0.005_160)] hover:border-[oklch(0.8_0.02_160)]'
              }`}
            >
              <input
                type="radio"
                name="bmiScore"
                value={score}
                checked={bmiScore === score}
                onChange={() => setBmiScore(score)}
                className="h-4 w-4 text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
              />
              <span className="text-sm text-[oklch(0.22_0.04_160)]">
                {BMI_SCORE_LABELS[score]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Step 2: Unplanned Weight Loss */}
      <div>
        <label className="block text-xs font-semibold text-[oklch(0.3_0.06_160)] mb-2">
          Step 2: Unplanned Weight Loss (past 3-6 months)
        </label>
        <div className="space-y-1.5">
          {WEIGHT_LOSS_SCORES.map((score) => (
            <label
              key={score}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                weightLossScore === score
                  ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.97_0.01_160)]'
                  : 'border-[oklch(0.91_0.005_160)] hover:border-[oklch(0.8_0.02_160)]'
              }`}
            >
              <input
                type="radio"
                name="weightLossScore"
                value={score}
                checked={weightLossScore === score}
                onChange={() => setWeightLossScore(score as WeightLossScore)}
                className="h-4 w-4 text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
              />
              <span className="text-sm text-[oklch(0.22_0.04_160)]">
                {WEIGHT_LOSS_SCORE_LABELS[score]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Step 3: Acute Disease Effect */}
      <div>
        <label className="block text-xs font-semibold text-[oklch(0.3_0.06_160)] mb-2">
          Step 3: Acute Disease Effect
        </label>
        <div className="space-y-1.5">
          {ACUTE_DISEASE_SCORES.map((score) => (
            <label
              key={score}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                acuteDiseaseScore === score
                  ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.97_0.01_160)]'
                  : 'border-[oklch(0.91_0.005_160)] hover:border-[oklch(0.8_0.02_160)]'
              }`}
            >
              <input
                type="radio"
                name="acuteDiseaseScore"
                value={score}
                checked={acuteDiseaseScore === score}
                onChange={() =>
                  setAcuteDiseaseScore(score as AcuteDiseaseScore)
                }
                className="h-4 w-4 text-[oklch(0.3_0.08_160)] focus:ring-[oklch(0.5_0.1_160)]"
              />
              <span className="text-sm text-[oklch(0.22_0.04_160)]">
                {ACUTE_DISEASE_SCORE_LABELS[score]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Score summary */}
      <div
        className={`rounded-lg border p-4 ${
          riskCategory === 'high'
            ? 'border-red-200 bg-red-50'
            : riskCategory === 'medium'
              ? 'border-amber-200 bg-amber-50'
              : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Overall MUST Score
            </p>
            <p className="text-2xl font-bold">{totalScore}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-[oklch(0.55_0_0)]">
              Care Pathway
            </p>
            <p className="text-sm font-semibold">
              {MUST_CARE_PATHWAY_LABELS[carePathway]}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="must-notes"
          className="block text-xs font-medium text-[oklch(0.4_0.02_160)] mb-1"
        >
          Clinical Notes (optional)
        </label>
        <textarea
          id="must-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Additional observations..."
          className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-2 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Saving...' : 'Complete MUST Assessment'}
      </button>
    </form>
  );
}
