/**
 * News2ScoreBadge — displays the NEWS2 score as a colour-coded badge.
 *
 * Colours:
 * - Green: 0 (routine)
 * - Amber: 1-4 (ward assessment)
 * - Red: 5-6 (urgent)
 * - Purple: 7+ (emergency)
 */

import {
  NEWS2_ESCALATION_LABELS,
  type News2Escalation,
} from '@/features/vital-signs/constants';

type News2ScoreBadgeProps = {
  score: number;
  escalation: string;
  scaleUsed?: number | null;
  showEscalation?: boolean;
};

function getEscalationColor(escalation: string): string {
  switch (escalation) {
    case 'routine':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'ward_assessment':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'emergency':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function News2ScoreBadge({
  score,
  escalation,
  scaleUsed,
  showEscalation = false,
}: News2ScoreBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getEscalationColor(
          escalation,
        )}`}
      >
        NEWS2: {score}
        {scaleUsed === 2 && ' (Scale 2)'}
      </span>
      {showEscalation && (
        <span className="text-xs text-[oklch(0.55_0_0)]">
          {NEWS2_ESCALATION_LABELS[escalation as News2Escalation] ?? escalation}
        </span>
      )}
    </div>
  );
}
