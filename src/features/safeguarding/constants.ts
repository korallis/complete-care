/**
 * Safeguarding feature constants.
 * UI labels, dropdown options, and configuration values.
 */

// Re-export DB-level constants for convenience
export {
  CONCERN_SEVERITIES,
  CONCERN_STATUSES,
  DSL_DECISIONS,
  LADO_STATUSES,
  LADO_OUTCOMES,
  LADO_EMPLOYMENT_ACTIONS,
  SECTION_47_STATUSES,
  MASH_STATUSES,
  CHRONOLOGY_SOURCES,
} from '@/lib/db/schema/safeguarding';

// ---------------------------------------------------------------------------
// UI Labels
// ---------------------------------------------------------------------------

export const SEVERITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const CONCERN_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'Under Review',
  action_taken: 'Action Taken',
  closed: 'Closed',
};

export const CONCERN_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-800',
  under_review: 'bg-amber-100 text-amber-800',
  action_taken: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
};

export const DSL_DECISION_LABELS: Record<string, string> = {
  internal_monitoring: 'Internal Monitoring',
  refer_to_mash: 'Refer to MASH',
  refer_to_lado: 'Refer to LADO',
  refer_to_police: 'Refer to Police',
};

export const DSL_DECISION_DESCRIPTIONS: Record<string, string> = {
  internal_monitoring:
    'Continue monitoring within the home. Create an internal action plan.',
  refer_to_mash:
    'Refer to Multi-Agency Safeguarding Hub for assessment and coordination.',
  refer_to_lado:
    'Refer to Local Authority Designated Officer (allegation against staff).',
  refer_to_police:
    'Refer directly to police for immediate investigation.',
};

export const LADO_STATUS_LABELS: Record<string, string> = {
  allegation_received: 'Allegation Received',
  initial_assessment: 'Initial Assessment',
  investigation_ongoing: 'Investigation Ongoing',
  outcome_reached: 'Outcome Reached',
  closed: 'Closed',
};

export const LADO_OUTCOME_LABELS: Record<string, string> = {
  substantiated: 'Substantiated',
  unsubstantiated: 'Unsubstantiated',
  unfounded: 'Unfounded',
  malicious: 'Malicious',
  false: 'False',
};

export const LADO_EMPLOYMENT_ACTION_LABELS: Record<string, string> = {
  no_action: 'No Action',
  suspended: 'Suspended',
  redeployed: 'Redeployed',
  dismissed: 'Dismissed',
  resigned: 'Resigned',
  referred_to_dbs: 'Referred to DBS',
};

export const SECTION_47_STATUS_LABELS: Record<string, string> = {
  strategy_meeting_scheduled: 'Strategy Meeting Scheduled',
  strategy_meeting_held: 'Strategy Meeting Held',
  investigation_ongoing: 'Investigation Ongoing',
  outcome_reached: 'Outcome Reached',
  closed: 'Closed',
};

export const MASH_STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  acknowledged: 'Acknowledged',
  assessment_in_progress: 'Assessment In Progress',
  outcome_received: 'Outcome Received',
  closed: 'Closed',
};

export const CHRONOLOGY_SOURCE_LABELS: Record<string, string> = {
  concern: 'Safeguarding Concern',
  dsl_review: 'DSL Review',
  mash_referral: 'MASH Referral',
  lado_referral: 'LADO Referral',
  section_47: 'Section 47 Investigation',
  incident: 'Incident Report',
  missing_episode: 'Missing Episode',
  manual: 'Manual Entry',
};

export const CONCERN_CATEGORIES = [
  { value: 'physical', label: 'Physical Abuse' },
  { value: 'emotional', label: 'Emotional Abuse' },
  { value: 'sexual', label: 'Sexual Abuse' },
  { value: 'neglect', label: 'Neglect' },
  { value: 'exploitation', label: 'Exploitation (CSE/CCE)' },
  { value: 'radicalisation', label: 'Radicalisation' },
  { value: 'self_harm', label: 'Self-harm' },
  { value: 'peer_on_peer', label: 'Peer-on-peer Abuse' },
  { value: 'online', label: 'Online Abuse' },
  { value: 'other', label: 'Other' },
] as const;

/** Roles that can access LADO records (restricted access - VAL-CHILD-010) */
export const LADO_ACCESS_ROLES = [
  'owner',
  'admin',
  'manager',
] as const;

/** Roles that can perform DSL reviews */
export const DSL_REVIEW_ROLES = [
  'owner',
  'admin',
  'manager',
] as const;
