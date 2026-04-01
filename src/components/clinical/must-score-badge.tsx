/**
 * MustScoreBadge — displays the MUST risk category as a coloured badge.
 */

import {
  MUST_RISK_LABELS,
  MUST_CARE_PATHWAY_LABELS,
  type MustRiskCategory,
  type MustCarePathway,
} from '@/features/clinical-monitoring/constants';

type MustScoreBadgeProps = {
  riskCategory: string;
  totalScore: number;
  carePathway?: string;
  showPathway?: boolean;
};

function getRiskColor(riskCategory: string): string {
  switch (riskCategory) {
    case 'low':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'medium':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function MustScoreBadge({
  riskCategory,
  totalScore,
  carePathway,
  showPathway = false,
}: MustScoreBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRiskColor(
          riskCategory,
        )}`}
      >
        {MUST_RISK_LABELS[riskCategory as MustRiskCategory] ?? riskCategory} (
        {totalScore})
      </span>
      {showPathway && carePathway && (
        <span className="text-xs text-[oklch(0.55_0_0)]">
          {MUST_CARE_PATHWAY_LABELS[carePathway as MustCarePathway] ??
            carePathway}
        </span>
      )}
    </div>
  );
}
