/**
 * Bowel, Sleep & Pain scoring algorithms — pure functions.
 * No side effects, no DB calls, no imports from server-only modules.
 * Safe for use in both client and server environments.
 */

import {
  CONSTIPATION_AMBER_DAYS,
  CONSTIPATION_RED_DAYS,
  DIARRHOEA_THRESHOLD_COUNT,
  DIARRHOEA_BRISTOL_TYPES,
  ALERT_COLOURS,
  ALERT_COLOUR_MESSAGES,
  ABBEY_CATEGORIES,
  PAINAD_CATEGORIES,
  NRS_SEVERITY,
  ABBEY_SEVERITY,
  PAINAD_SEVERITY,
  type AbbeyCategory,
  type PainadCategory,
  type BristolType,
  type StoolColour,
} from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AlertLevel = 'none' | 'amber' | 'red';

export type BowelAlert = {
  level: AlertLevel;
  type: 'constipation' | 'diarrhoea' | 'colour' | 'none';
  message: string;
};

export type AbbeyScores = Record<AbbeyCategory, number>;

export type PainadScores = Record<PainadCategory, number>;

export type PainSeverity = 'none' | 'mild' | 'moderate' | 'severe';

export type AbbeyScoringResult = {
  totalScore: number;
  severity: PainSeverity;
  severityLabel: string;
};

export type PainadScoringResult = {
  totalScore: number;
  severity: PainSeverity;
  severityLabel: string;
};

export type NightSummary = {
  totalChecks: number;
  asleepCount: number;
  awakeCount: number;
  restlessCount: number;
  outOfBedCount: number;
  nightWanderingCount: number;
  repositionedCount: number;
  summary: string;
};

// ---------------------------------------------------------------------------
// Abbey Pain Scale scoring
// ---------------------------------------------------------------------------

/**
 * Calculates Abbey Pain Scale total from individual domain scores.
 * Each domain (6 total) scored 0-3.
 * Total range: 0-18.
 *
 * Severity:
 * - 0 = No pain
 * - 1-7 = Mild
 * - 8-13 = Moderate
 * - 14-18 = Severe
 */
export function scoreAbbey(scores: AbbeyScores): AbbeyScoringResult {
  let totalScore = 0;
  for (const category of ABBEY_CATEGORIES) {
    totalScore += scores[category] ?? 0;
  }

  const severity = getAbbeySeverity(totalScore);
  const severityLabel = ABBEY_SEVERITY[severity].label;

  return { totalScore, severity, severityLabel };
}

/**
 * Returns the Abbey severity classification for a given total score.
 */
export function getAbbeySeverity(totalScore: number): PainSeverity {
  if (totalScore === 0) return 'none';
  if (totalScore <= ABBEY_SEVERITY.mild.max) return 'mild';
  if (totalScore <= ABBEY_SEVERITY.moderate.max) return 'moderate';
  return 'severe';
}

// ---------------------------------------------------------------------------
// PAINAD scoring
// ---------------------------------------------------------------------------

/**
 * Calculates PAINAD total from individual domain scores.
 * Each domain (5 total) scored 0-2.
 * Total range: 0-10.
 *
 * Severity:
 * - 0 = No pain
 * - 1-3 = Mild
 * - 4-6 = Moderate
 * - 7-10 = Severe
 */
export function scorePainad(scores: PainadScores): PainadScoringResult {
  let totalScore = 0;
  for (const category of PAINAD_CATEGORIES) {
    totalScore += scores[category] ?? 0;
  }

  const severity = getPainadSeverity(totalScore);
  const severityLabel = PAINAD_SEVERITY[severity].label;

  return { totalScore, severity, severityLabel };
}

/**
 * Returns the PAINAD severity classification for a given total score.
 */
export function getPainadSeverity(totalScore: number): PainSeverity {
  if (totalScore === 0) return 'none';
  if (totalScore <= PAINAD_SEVERITY.mild.max) return 'mild';
  if (totalScore <= PAINAD_SEVERITY.moderate.max) return 'moderate';
  return 'severe';
}

// ---------------------------------------------------------------------------
// NRS severity
// ---------------------------------------------------------------------------

/**
 * Returns the NRS severity classification for a given score (0-10).
 */
export function getNrsSeverity(score: number): PainSeverity {
  if (score === 0) return 'none';
  if (score <= NRS_SEVERITY.mild.max) return 'mild';
  if (score <= NRS_SEVERITY.moderate.max) return 'moderate';
  return 'severe';
}

/**
 * Returns the NRS severity label for a given score.
 */
export function getNrsSeverityLabel(score: number): string {
  const severity = getNrsSeverity(score);
  return NRS_SEVERITY[severity].label;
}

// ---------------------------------------------------------------------------
// Constipation detection
// ---------------------------------------------------------------------------

/**
 * Detects constipation alert based on the date of the last bowel movement.
 *
 * - No BM for 3+ days: amber alert
 * - No BM for 5+ days: red alert
 * - Otherwise: no alert
 *
 * @param lastBowelMovementAt - Date of the most recent bowel movement, or null if none recorded
 * @param currentTime - Current time for comparison (defaults to now)
 */
export function detectConstipation(
  lastBowelMovementAt: Date | null,
  currentTime: Date = new Date(),
): BowelAlert {
  if (!lastBowelMovementAt) {
    return {
      level: 'red',
      type: 'constipation',
      message: `No bowel movement on record — review required`,
    };
  }

  const daysSinceLastBm = Math.floor(
    (currentTime.getTime() - lastBowelMovementAt.getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (daysSinceLastBm >= CONSTIPATION_RED_DAYS) {
    return {
      level: 'red',
      type: 'constipation',
      message: `No bowel movement for ${daysSinceLastBm} days — urgent review required`,
    };
  }

  if (daysSinceLastBm >= CONSTIPATION_AMBER_DAYS) {
    return {
      level: 'amber',
      type: 'constipation',
      message: `No bowel movement for ${daysSinceLastBm} days — monitor closely`,
    };
  }

  return { level: 'none', type: 'none', message: '' };
}

// ---------------------------------------------------------------------------
// Diarrhoea detection
// ---------------------------------------------------------------------------

/**
 * Detects diarrhoea alert based on Bristol types within a 24hr window.
 *
 * 3+ type 6-7 stools in 24hrs = diarrhoea alert (red).
 *
 * @param bristolTypes - Array of Bristol types from the last 24hrs
 */
export function detectDiarrhoea(bristolTypes: BristolType[]): BowelAlert {
  const looseStools = bristolTypes.filter((t) =>
    (DIARRHOEA_BRISTOL_TYPES as readonly number[]).includes(t),
  );

  if (looseStools.length >= DIARRHOEA_THRESHOLD_COUNT) {
    return {
      level: 'red',
      type: 'diarrhoea',
      message: `${looseStools.length} loose/liquid stools (type 6-7) in 24hrs — diarrhoea protocol required`,
    };
  }

  return { level: 'none', type: 'none', message: '' };
}

// ---------------------------------------------------------------------------
// Stool colour alerts
// ---------------------------------------------------------------------------

/**
 * Returns a clinical alert if the stool colour is concerning.
 *
 * Black, red-tinged, or clay/pale stools trigger immediate alerts.
 */
export function detectColourAlert(colour: StoolColour): BowelAlert {
  if ((ALERT_COLOURS as readonly string[]).includes(colour)) {
    return {
      level: 'red',
      type: 'colour',
      message:
        ALERT_COLOUR_MESSAGES[colour] ??
        'Abnormal stool colour — escalate immediately',
    };
  }

  return { level: 'none', type: 'none', message: '' };
}

// ---------------------------------------------------------------------------
// Night summary generation
// ---------------------------------------------------------------------------

/**
 * Generates an auto-summary from a night's worth of sleep checks.
 *
 * @param checks - Array of sleep checks from the night period
 */
export function generateNightSummary(
  checks: Array<{
    status: string;
    nightWandering: boolean;
    repositioned: boolean;
  }>,
): NightSummary {
  const totalChecks = checks.length;
  let asleepCount = 0;
  let awakeCount = 0;
  let restlessCount = 0;
  let outOfBedCount = 0;
  let nightWanderingCount = 0;
  let repositionedCount = 0;

  for (const check of checks) {
    switch (check.status) {
      case 'asleep':
        asleepCount++;
        break;
      case 'awake':
        awakeCount++;
        break;
      case 'restless':
        restlessCount++;
        break;
      case 'out_of_bed':
        outOfBedCount++;
        break;
    }
    if (check.nightWandering) nightWanderingCount++;
    if (check.repositioned) repositionedCount++;
  }

  // Build summary text
  const parts: string[] = [];

  if (totalChecks === 0) {
    return {
      totalChecks: 0,
      asleepCount: 0,
      awakeCount: 0,
      restlessCount: 0,
      outOfBedCount: 0,
      nightWanderingCount: 0,
      repositionedCount: 0,
      summary: 'No night checks recorded.',
    };
  }

  parts.push(`${totalChecks} check${totalChecks === 1 ? '' : 's'} performed.`);

  if (asleepCount === totalChecks) {
    parts.push('Slept well throughout the night.');
  } else {
    const statusParts: string[] = [];
    if (asleepCount > 0)
      statusParts.push(
        `asleep ${asleepCount}/${totalChecks}`,
      );
    if (awakeCount > 0) statusParts.push(`awake ${awakeCount}`);
    if (restlessCount > 0) statusParts.push(`restless ${restlessCount}`);
    if (outOfBedCount > 0) statusParts.push(`out of bed ${outOfBedCount}`);
    parts.push(`Found: ${statusParts.join(', ')}.`);
  }

  if (nightWanderingCount > 0) {
    parts.push(
      `Night wandering observed ${nightWanderingCount} time${nightWanderingCount === 1 ? '' : 's'}.`,
    );
  }

  if (repositionedCount > 0) {
    parts.push(
      `Repositioned ${repositionedCount} time${repositionedCount === 1 ? '' : 's'}.`,
    );
  }

  return {
    totalChecks,
    asleepCount,
    awakeCount,
    restlessCount,
    outOfBedCount,
    nightWanderingCount,
    repositionedCount,
    summary: parts.join(' '),
  };
}
