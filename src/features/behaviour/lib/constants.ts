/** Development domains used for Outcomes Star / BERRI assessments */
export const DEVELOPMENT_DOMAINS = [
  'physical',
  'emotional',
  'identity',
  'relationships',
  'social',
  'self_care',
  'education',
] as const;

export type DevelopmentDomain = (typeof DEVELOPMENT_DOMAINS)[number];

export const DOMAIN_LABELS: Record<DevelopmentDomain, string> = {
  physical: 'Physical',
  emotional: 'Emotional',
  identity: 'Identity',
  relationships: 'Relationships',
  social: 'Social',
  self_care: 'Self-Care',
  education: 'Education',
};

/** Assessment tools supported */
export const ASSESSMENT_TOOLS = [
  'outcomes_star',
  'berri',
  'custom',
] as const;

export type AssessmentTool = (typeof ASSESSMENT_TOOLS)[number];

export const ASSESSMENT_TOOL_LABELS: Record<AssessmentTool, string> = {
  outcomes_star: 'Outcomes Star',
  berri: 'BERRI',
  custom: 'Custom',
};

/** Positive behaviour categories */
export const POSITIVE_BEHAVIOUR_CATEGORIES = [
  'kindness',
  'achievement',
  'cooperation',
  'responsibility',
  'resilience',
  'other',
] as const;

export type PositiveBehaviourCategory =
  (typeof POSITIVE_BEHAVIOUR_CATEGORIES)[number];

/** ABC model — behaviour incident types */
export const BEHAVIOUR_TYPES = [
  'verbal_aggression',
  'physical_aggression',
  'self_harm',
  'absconding',
  'property_damage',
  'other',
] as const;

export type BehaviourType = (typeof BEHAVIOUR_TYPES)[number];

export const BEHAVIOUR_TYPE_LABELS: Record<BehaviourType, string> = {
  verbal_aggression: 'Verbal Aggression',
  physical_aggression: 'Physical Aggression',
  self_harm: 'Self-Harm',
  absconding: 'Absconding',
  property_damage: 'Property Damage',
  other: 'Other',
};

/** Incident severity levels */
export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const SEVERITY_COLOURS: Record<SeverityLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

/** Statement of Purpose statuses */
export const SOP_STATUSES = ['draft', 'published', 'archived'] as const;

export type SopStatus = (typeof SOP_STATUSES)[number];

/** Max score for assessment tools (1-10 scale) */
export const MAX_DOMAIN_SCORE = 10;
