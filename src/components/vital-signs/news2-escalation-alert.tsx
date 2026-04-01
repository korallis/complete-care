'use client';

/**
 * News2EscalationAlert — alert banner displayed when NEWS2 score is elevated.
 * Shows the score, escalation level, and recommended action.
 */

import {
  NEWS2_ESCALATION_LABELS,
  NEWS2_ESCALATION_DESCRIPTIONS,
  type News2Escalation,
} from '@/features/vital-signs/constants';

type News2EscalationAlertProps = {
  score: number;
  escalation: string;
  scaleUsed?: number | null;
};

function getAlertStyles(escalation: string): {
  border: string;
  bg: string;
  text: string;
  icon: string;
} {
  switch (escalation) {
    case 'ward_assessment':
      return {
        border: 'border-amber-200',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        icon: 'text-amber-600',
      };
    case 'urgent':
      return {
        border: 'border-red-200',
        bg: 'bg-red-50',
        text: 'text-red-800',
        icon: 'text-red-600',
      };
    case 'emergency':
      return {
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        text: 'text-purple-800',
        icon: 'text-purple-600',
      };
    default:
      return {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        icon: 'text-gray-600',
      };
  }
}

export function News2EscalationAlert({
  score,
  escalation,
  scaleUsed,
}: News2EscalationAlertProps) {
  // Only show for non-routine escalation levels
  if (escalation === 'routine') {
    return null;
  }

  const styles = getAlertStyles(escalation);
  const label =
    NEWS2_ESCALATION_LABELS[escalation as News2Escalation] ?? escalation;
  const description =
    NEWS2_ESCALATION_DESCRIPTIONS[escalation as News2Escalation] ?? '';

  return (
    <div
      role="alert"
      className={`rounded-lg border ${styles.border} ${styles.bg} px-4 py-3 ${styles.text}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.icon}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold">
            NEWS2 Score: {score}
            {scaleUsed === 2 && ' (Scale 2)'}
            {' — '}
            {label}
          </p>
          {description && (
            <p className="mt-1 text-sm opacity-90">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
