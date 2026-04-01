/**
 * Bowel, Sleep & Pain Monitoring Constants — option lists, labels, thresholds.
 * Pure constants module — no side effects, no DB calls.
 */

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

export function bowelPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/clinical/bowel`;
}

export function sleepPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/clinical/sleep`;
}

export function painPath(orgSlug: string, personId: string): string {
  return `/${orgSlug}/persons/${personId}/clinical/pain`;
}

// ---------------------------------------------------------------------------
// Bristol Stool Scale types (1-7)
// ---------------------------------------------------------------------------

export const BRISTOL_TYPES = [1, 2, 3, 4, 5, 6, 7] as const;
export type BristolType = (typeof BRISTOL_TYPES)[number];

export const BRISTOL_TYPE_LABELS: Record<BristolType, string> = {
  1: 'Type 1 — Separate hard lumps (severe constipation)',
  2: 'Type 2 — Lumpy sausage shape (mild constipation)',
  3: 'Type 3 — Sausage with cracks (normal)',
  4: 'Type 4 — Smooth soft sausage (ideal)',
  5: 'Type 5 — Soft blobs with clear edges (lacking fibre)',
  6: 'Type 6 — Fluffy, mushy pieces (mild diarrhoea)',
  7: 'Type 7 — Entirely liquid (severe diarrhoea)',
};

export const BRISTOL_TYPE_SHORT_LABELS: Record<BristolType, string> = {
  1: 'Hard lumps',
  2: 'Lumpy sausage',
  3: 'Cracked sausage',
  4: 'Smooth sausage',
  5: 'Soft blobs',
  6: 'Mushy/fluffy',
  7: 'Liquid',
};

// ---------------------------------------------------------------------------
// Stool colours
// ---------------------------------------------------------------------------

export const STOOL_COLOURS = [
  'brown',
  'dark_brown',
  'light_brown',
  'yellow',
  'green',
  'black',
  'red_tinged',
  'clay',
  'other',
] as const;
export type StoolColour = (typeof STOOL_COLOURS)[number];

export const STOOL_COLOUR_LABELS: Record<StoolColour, string> = {
  brown: 'Brown (normal)',
  dark_brown: 'Dark Brown',
  light_brown: 'Light Brown',
  yellow: 'Yellow',
  green: 'Green',
  black: 'Black',
  red_tinged: 'Red-Tinged',
  clay: 'Clay / Pale',
  other: 'Other',
};

/** Colours that trigger immediate clinical alerts */
export const ALERT_COLOURS: StoolColour[] = ['black', 'red_tinged', 'clay'];

export const ALERT_COLOUR_MESSAGES: Record<string, string> = {
  black: 'Black stool may indicate upper GI bleeding — escalate immediately',
  red_tinged:
    'Red-tinged stool may indicate lower GI bleeding — escalate immediately',
  clay: 'Clay/pale stool may indicate biliary obstruction — escalate immediately',
};

// ---------------------------------------------------------------------------
// Constipation / Diarrhoea thresholds
// ---------------------------------------------------------------------------

/** No BM for 3 days = amber alert */
export const CONSTIPATION_AMBER_DAYS = 3;
/** No BM for 5 days = red alert */
export const CONSTIPATION_RED_DAYS = 5;
/** 3+ type 6-7 stools in 24hrs = diarrhoea alert */
export const DIARRHOEA_THRESHOLD_COUNT = 3;
/** Bristol types that count as diarrhoea */
export const DIARRHOEA_BRISTOL_TYPES: BristolType[] = [6, 7];

// ---------------------------------------------------------------------------
// Sleep check statuses
// ---------------------------------------------------------------------------

export const SLEEP_STATUSES = [
  'asleep',
  'awake',
  'restless',
  'out_of_bed',
] as const;
export type SleepStatus = (typeof SLEEP_STATUSES)[number];

export const SLEEP_STATUS_LABELS: Record<SleepStatus, string> = {
  asleep: 'Asleep',
  awake: 'Awake',
  restless: 'Restless',
  out_of_bed: 'Out of Bed',
};

// ---------------------------------------------------------------------------
// Sleep positions
// ---------------------------------------------------------------------------

export const SLEEP_POSITIONS = ['left', 'right', 'back', 'sitting'] as const;
export type SleepPosition = (typeof SLEEP_POSITIONS)[number];

export const SLEEP_POSITION_LABELS: Record<SleepPosition, string> = {
  left: 'Left Side',
  right: 'Right Side',
  back: 'On Back',
  sitting: 'Sitting',
};

// ---------------------------------------------------------------------------
// Bed rails status
// ---------------------------------------------------------------------------

export const BED_RAILS_OPTIONS = ['up', 'down', 'not_applicable'] as const;
export type BedRailsStatus = (typeof BED_RAILS_OPTIONS)[number];

export const BED_RAILS_LABELS: Record<BedRailsStatus, string> = {
  up: 'Up',
  down: 'Down',
  not_applicable: 'N/A',
};

// ---------------------------------------------------------------------------
// Pain assessment tools
// ---------------------------------------------------------------------------

export const PAIN_TOOLS = ['nrs', 'abbey', 'painad'] as const;
export type PainTool = (typeof PAIN_TOOLS)[number];

export const PAIN_TOOL_LABELS: Record<PainTool, string> = {
  nrs: 'NRS (Numerical Rating Scale)',
  abbey: 'Abbey Pain Scale (non-verbal)',
  painad: 'PAINAD (dementia)',
};

// ---------------------------------------------------------------------------
// Pain types
// ---------------------------------------------------------------------------

export const PAIN_TYPES = [
  'sharp',
  'dull',
  'aching',
  'burning',
  'throbbing',
] as const;
export type PainType = (typeof PAIN_TYPES)[number];

export const PAIN_TYPE_LABELS: Record<PainType, string> = {
  sharp: 'Sharp',
  dull: 'Dull',
  aching: 'Aching',
  burning: 'Burning',
  throbbing: 'Throbbing',
};

// ---------------------------------------------------------------------------
// Abbey Pain Scale categories (6 domains, each scored 0-3)
// ---------------------------------------------------------------------------

export const ABBEY_CATEGORIES = [
  'vocalisation',
  'facial_expression',
  'body_language',
  'behaviour_change',
  'physiological_change',
  'physical_change',
] as const;
export type AbbeyCategory = (typeof ABBEY_CATEGORIES)[number];

export const ABBEY_CATEGORY_LABELS: Record<AbbeyCategory, string> = {
  vocalisation: 'Vocalisation',
  facial_expression: 'Facial Expression',
  body_language: 'Body Language',
  behaviour_change: 'Behaviour Change',
  physiological_change: 'Physiological Change',
  physical_change: 'Physical Change',
};

export const ABBEY_SCORE_LABELS: Record<number, string> = {
  0: 'Absent',
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
};

/** Abbey Pain Scale max score per domain */
export const ABBEY_MAX_PER_DOMAIN = 3;
/** Abbey Pain Scale total max (6 domains x 3) */
export const ABBEY_MAX_TOTAL = 18;

// ---------------------------------------------------------------------------
// PAINAD categories (5 domains, each scored 0-2)
// ---------------------------------------------------------------------------

export const PAINAD_CATEGORIES = [
  'breathing',
  'vocalisation',
  'facial_expression',
  'body_language',
  'consolability',
] as const;
export type PainadCategory = (typeof PAINAD_CATEGORIES)[number];

export const PAINAD_CATEGORY_LABELS: Record<PainadCategory, string> = {
  breathing: 'Breathing',
  vocalisation: 'Negative Vocalisation',
  facial_expression: 'Facial Expression',
  body_language: 'Body Language',
  consolability: 'Consolability',
};

export const PAINAD_SCORE_DESCRIPTIONS: Record<
  PainadCategory,
  Record<number, string>
> = {
  breathing: {
    0: 'Normal',
    1: 'Occasional laboured breathing; short hyperventilation',
    2: 'Noisy laboured breathing; long hyperventilation; Cheyne-Stokes',
  },
  vocalisation: {
    0: 'None',
    1: 'Occasional moan/groan; low-level speech with negative quality',
    2: 'Repeated troubled calling out; loud moaning/groaning; crying',
  },
  facial_expression: {
    0: 'Smiling or inexpressive',
    1: 'Sad; frightened; frown',
    2: 'Facial grimacing',
  },
  body_language: {
    0: 'Relaxed',
    1: 'Tense; distressed pacing; fidgeting',
    2: 'Rigid; fists clenched; knees pulled up; pulling/pushing away; striking out',
  },
  consolability: {
    0: 'No need to console',
    1: 'Distracted or reassured by voice or touch',
    2: 'Unable to console, distract, or reassure',
  },
};

/** PAINAD max score per domain */
export const PAINAD_MAX_PER_DOMAIN = 2;
/** PAINAD total max (5 domains x 2) */
export const PAINAD_MAX_TOTAL = 10;

// ---------------------------------------------------------------------------
// Pain severity classifications
// ---------------------------------------------------------------------------

/** NRS severity thresholds */
export const NRS_SEVERITY = {
  none: { min: 0, max: 0, label: 'No Pain' },
  mild: { min: 1, max: 3, label: 'Mild Pain' },
  moderate: { min: 4, max: 6, label: 'Moderate Pain' },
  severe: { min: 7, max: 10, label: 'Severe Pain' },
} as const;

/** Abbey severity thresholds */
export const ABBEY_SEVERITY = {
  none: { min: 0, max: 0, label: 'No Pain' },
  mild: { min: 1, max: 7, label: 'Mild Pain' },
  moderate: { min: 8, max: 13, label: 'Moderate Pain' },
  severe: { min: 14, max: 18, label: 'Severe Pain' },
} as const;

/** PAINAD severity thresholds */
export const PAINAD_SEVERITY = {
  none: { min: 0, max: 0, label: 'No Pain' },
  mild: { min: 1, max: 3, label: 'Mild Pain' },
  moderate: { min: 4, max: 6, label: 'Moderate Pain' },
  severe: { min: 7, max: 10, label: 'Severe Pain' },
} as const;
