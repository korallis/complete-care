/**
 * Safeguarding Constants
 *
 * Concern statuses, DSL decisions, referral types, and display labels.
 * This file MUST NOT have 'use server' -- it is imported by client components too.
 */

// ---------------------------------------------------------------------------
// Concern statuses
// ---------------------------------------------------------------------------

export const CONCERN_STATUSES = [
  'raised',
  'under_review',
  'monitoring',
  'referred',
  'nfa',
  'closed',
] as const;

export type ConcernStatusValue = (typeof CONCERN_STATUSES)[number];

export const CONCERN_STATUS_LABELS: Record<ConcernStatusValue, string> = {
  raised: 'Raised',
  under_review: 'Under Review',
  monitoring: 'Monitoring',
  referred: 'Referred',
  nfa: 'No Further Action',
  closed: 'Closed',
};

export const CONCERN_STATUS_COLOURS: Record<ConcernStatusValue, string> = {
  raised: 'text-orange-700 bg-orange-50 border-orange-200',
  under_review: 'text-blue-700 bg-blue-50 border-blue-200',
  monitoring: 'text-amber-700 bg-amber-50 border-amber-200',
  referred: 'text-purple-700 bg-purple-50 border-purple-200',
  nfa: 'text-slate-700 bg-slate-50 border-slate-200',
  closed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
};

// ---------------------------------------------------------------------------
// DSL decisions
// ---------------------------------------------------------------------------

export const DSL_DECISIONS = ['monitor', 'refer', 'nfa'] as const;

export type DslDecisionValue = (typeof DSL_DECISIONS)[number];

export const DSL_DECISION_LABELS: Record<DslDecisionValue, string> = {
  monitor: 'Monitor',
  refer: 'Refer to external agency',
  nfa: 'No Further Action',
};

export const DSL_DECISION_DESCRIPTIONS: Record<DslDecisionValue, string> = {
  monitor:
    'Continue to monitor the child and record further observations. Schedule a review.',
  refer:
    'Make a formal referral to LADO, MASH, police, or initiate Section 47 cooperation.',
  nfa: 'No safeguarding risk identified. Record rationale and close.',
};

// ---------------------------------------------------------------------------
// Referral types
// ---------------------------------------------------------------------------

export const REFERRAL_TYPES = [
  'lado',
  'mash',
  'police',
  'section47',
] as const;

export type ReferralTypeValue = (typeof REFERRAL_TYPES)[number];

export const REFERRAL_TYPE_LABELS: Record<ReferralTypeValue, string> = {
  lado: 'LADO (Local Authority Designated Officer)',
  mash: 'MASH (Multi-Agency Safeguarding Hub)',
  police: 'Police',
  section47: 'Section 47 Enquiry',
};

export const REFERRAL_TYPE_SHORT_LABELS: Record<ReferralTypeValue, string> = {
  lado: 'LADO',
  mash: 'MASH',
  police: 'Police',
  section47: 'S.47',
};

// ---------------------------------------------------------------------------
// Timeline event types (for SafeguardingTimeline component)
// ---------------------------------------------------------------------------

export type TimelineEventType =
  | 'concern_raised'
  | 'dsl_review'
  | 'referral_made'
  | 'referral_outcome'
  | 'status_change';

export const TIMELINE_EVENT_LABELS: Record<TimelineEventType, string> = {
  concern_raised: 'Concern raised',
  dsl_review: 'DSL review',
  referral_made: 'Referral made',
  referral_outcome: 'Referral outcome received',
  status_change: 'Status changed',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the concern status indicates it is still active (not closed/NFA).
 */
export function isConcernActive(status: ConcernStatusValue): boolean {
  return status !== 'closed' && status !== 'nfa';
}

/**
 * Returns true if the concern requires DSL review (raised but not yet reviewed).
 */
export function requiresDslReview(status: ConcernStatusValue): boolean {
  return status === 'raised';
}
