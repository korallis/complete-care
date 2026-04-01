/**
 * Incident Reporting Constants
 *
 * Severity levels, statuses, locations, regulatory bodies, and display labels.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

// ---------------------------------------------------------------------------
// Severity levels
// ---------------------------------------------------------------------------

export const SEVERITY_LEVELS = ['minor', 'moderate', 'serious', 'death'] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  minor: 'Minor',
  moderate: 'Moderate',
  serious: 'Serious',
  death: 'Death',
};

export const SEVERITY_DESCRIPTIONS: Record<SeverityLevel, string> = {
  minor: 'No injury or very minor injury requiring basic first aid only',
  moderate: 'Injury requiring medical attention but not hospitalisation',
  serious: 'Serious injury requiring hospitalisation or emergency treatment',
  death: 'Death of a person',
};

// ---------------------------------------------------------------------------
// Workflow statuses
// ---------------------------------------------------------------------------

export const INCIDENT_STATUSES = [
  'reported',
  'under_review',
  'investigating',
  'resolved',
  'closed',
] as const;
export type IncidentStatusValue = (typeof INCIDENT_STATUSES)[number];

export const STATUS_LABELS: Record<IncidentStatusValue, string> = {
  reported: 'Reported',
  under_review: 'Under Review',
  investigating: 'Investigating',
  resolved: 'Resolved',
  closed: 'Closed',
};

/**
 * Valid status transitions for the investigation workflow.
 * Each key maps to the statuses it can transition to.
 */
export const STATUS_TRANSITIONS: Record<IncidentStatusValue, IncidentStatusValue[]> = {
  reported: ['under_review'],
  under_review: ['investigating', 'resolved'],
  investigating: ['resolved'],
  resolved: ['closed'],
  closed: [],
};

// ---------------------------------------------------------------------------
// Common incident locations
// ---------------------------------------------------------------------------

export const INCIDENT_LOCATIONS = [
  'bedroom',
  'bathroom',
  'kitchen',
  'living_room',
  'dining_room',
  'hallway',
  'garden',
  'stairs',
  'entrance',
  'office',
  'communal_area',
  'other',
] as const;

export const LOCATION_LABELS: Record<string, string> = {
  bedroom: 'Bedroom',
  bathroom: 'Bathroom',
  kitchen: 'Kitchen',
  living_room: 'Living Room',
  dining_room: 'Dining Room',
  hallway: 'Hallway',
  garden: 'Garden',
  stairs: 'Stairs',
  entrance: 'Entrance',
  office: 'Office',
  communal_area: 'Communal Area',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Regulatory bodies
// ---------------------------------------------------------------------------

export const REGULATORY_BODIES = ['CQC', 'Ofsted', 'both', 'none'] as const;
export type RegulatoryBody = (typeof REGULATORY_BODIES)[number];

export const REGULATORY_BODY_LABELS: Record<RegulatoryBody, string> = {
  CQC: 'CQC (Care Quality Commission)',
  Ofsted: 'Ofsted',
  both: 'CQC and Ofsted',
  none: 'None',
};

// ---------------------------------------------------------------------------
// Involved person roles
// ---------------------------------------------------------------------------

export const INVOLVED_PERSON_ROLES = [
  'resident',
  'staff',
  'visitor',
  'contractor',
  'other',
] as const;

export const INVOLVED_PERSON_ROLE_LABELS: Record<string, string> = {
  resident: 'Resident',
  staff: 'Staff Member',
  visitor: 'Visitor',
  contractor: 'Contractor',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Duty of Candour
// ---------------------------------------------------------------------------

/**
 * Severity levels that trigger Duty of Candour requirements.
 * Serious incidents and deaths require transparent communication with
 * the affected person and/or their family.
 */
export const DUTY_OF_CANDOUR_SEVERITIES: SeverityLevel[] = ['serious', 'death'];

/**
 * Returns true if the given severity triggers Duty of Candour.
 */
export function triggersDutyOfCandour(severity: SeverityLevel): boolean {
  return DUTY_OF_CANDOUR_SEVERITIES.includes(severity);
}

/**
 * Severity levels that trigger automatic notification to managers/directors.
 */
export const AUTO_NOTIFY_SEVERITIES: SeverityLevel[] = ['serious', 'death'];

/**
 * Returns true if the given severity should auto-notify managers.
 */
export function requiresAutoNotification(severity: SeverityLevel): boolean {
  return AUTO_NOTIFY_SEVERITIES.includes(severity);
}

/**
 * Returns true if the given severity should flag as potentially notifiable.
 */
export function isPotentiallyNotifiable(severity: SeverityLevel): boolean {
  return severity === 'serious' || severity === 'death';
}

// ---------------------------------------------------------------------------
// Trend period options
// ---------------------------------------------------------------------------

export const TREND_PERIODS = ['7d', '30d', '90d', '365d'] as const;
export type TrendPeriod = (typeof TREND_PERIODS)[number];

export const TREND_PERIOD_LABELS: Record<TrendPeriod, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '365d': 'Last year',
};

/**
 * Converts a trend period to the number of days to look back.
 */
export function trendPeriodToDays(period: TrendPeriod): number {
  const map: Record<TrendPeriod, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '365d': 365,
  };
  return map[period];
}
