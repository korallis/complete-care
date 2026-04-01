/**
 * PRN Management Constants — labels, options, and route helpers.
 * Pure constants module — no side effects, no DB calls.
 */

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

export function prnBasePath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/emar/prn`;
}

export function prnProtocolPath(
  orgSlug: string,
  personId: string,
  protocolId: string,
): string {
  return `/${orgSlug}/persons/${personId}/emar/prn/${protocolId}`;
}

export function prnAdministerPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/emar/prn/administer`;
}

// ---------------------------------------------------------------------------
// Pain score scale (0-10 NRS)
// ---------------------------------------------------------------------------

export const PAIN_SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type PainScore = (typeof PAIN_SCORES)[number];

export const PAIN_SCORE_LABELS: Record<PainScore, string> = {
  0: '0 - No pain',
  1: '1 - Minimal',
  2: '2 - Mild',
  3: '3 - Uncomfortable',
  4: '4 - Moderate',
  5: '5 - Distracting',
  6: '6 - Distressing',
  7: '7 - Unmanageable',
  8: '8 - Intense',
  9: '9 - Severe',
  10: '10 - Worst possible',
};

export function getPainSeverity(
  score: number,
): 'none' | 'mild' | 'moderate' | 'severe' {
  if (score === 0) return 'none';
  if (score <= 3) return 'mild';
  if (score <= 6) return 'moderate';
  return 'severe';
}

export function getPainSeverityColor(severity: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (severity) {
    case 'none':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'mild':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
      };
    case 'moderate':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
      };
    case 'severe':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-500',
        border: 'border-gray-200',
      };
  }
}

// ---------------------------------------------------------------------------
// Effectiveness outcomes
// ---------------------------------------------------------------------------

export const EFFECT_OUTCOMES = ['yes', 'partial', 'no'] as const;

export type EffectOutcome = (typeof EFFECT_OUTCOMES)[number];

export const EFFECT_OUTCOME_LABELS: Record<EffectOutcome, string> = {
  yes: 'Yes - Fully Effective',
  partial: 'Partial - Some Relief',
  no: 'No - Not Effective',
};

export function getEffectColor(outcome: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (outcome) {
    case 'yes':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'partial':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'no':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-500',
        border: 'border-gray-200',
      };
  }
}

// ---------------------------------------------------------------------------
// Follow-up interval options (minutes)
// ---------------------------------------------------------------------------

export const FOLLOW_UP_INTERVALS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '60 minutes (default)', value: 60 },
  { label: '90 minutes', value: 90 },
  { label: '120 minutes', value: 120 },
] as const;

// ---------------------------------------------------------------------------
// Min interval options (minutes)
// ---------------------------------------------------------------------------

export const MIN_INTERVAL_OPTIONS = [
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: '6 hours', value: 360 },
  { label: '8 hours', value: 480 },
  { label: '12 hours', value: 720 },
  { label: '24 hours', value: 1440 },
] as const;
