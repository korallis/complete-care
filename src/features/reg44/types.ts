/**
 * Reg 44 Monitoring — shared types and constants.
 */

// ---------------------------------------------------------------------------
// Reg 44 Visit
// ---------------------------------------------------------------------------

export const VISIT_STATUSES = [
  'scheduled',
  'in-progress',
  'completed',
  'cancelled',
] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

// ---------------------------------------------------------------------------
// Reg 44 Report
// ---------------------------------------------------------------------------

export const REPORT_STATUSES = ['draft', 'submitted', 'approved'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const REPORT_SECTION_LABELS: Record<string, string> = {
  qualityOfCare: 'Quality of Care',
  viewsOfChildren: 'Views of Children',
  education: 'Education',
  health: 'Health',
  safeguarding: 'Safeguarding',
  staffing: 'Staffing',
  environment: 'Environment',
  complaintsAndConcerns: 'Complaints & Concerns',
  recommendations: 'Recommendations',
};

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export const RECOMMENDATION_PRIORITIES = [
  'high',
  'medium',
  'low',
] as const;
export type RecommendationPriority =
  (typeof RECOMMENDATION_PRIORITIES)[number];

export const RECOMMENDATION_STATUSES = [
  'open',
  'in-progress',
  'completed',
  'overdue',
] as const;
export type RecommendationStatus =
  (typeof RECOMMENDATION_STATUSES)[number];

// ---------------------------------------------------------------------------
// Reg 40 Notifiable Events
// ---------------------------------------------------------------------------

export const NOTIFIABLE_EVENT_CATEGORIES = [
  'death',
  'serious_injury',
  'serious_illness',
  'absconding',
  'allegation_against_staff',
  'serious_complaint',
  'other',
] as const;
export type NotifiableEventCategoryType =
  (typeof NOTIFIABLE_EVENT_CATEGORIES)[number];

export const NOTIFIABLE_EVENT_CATEGORY_LABELS: Record<
  NotifiableEventCategoryType,
  string
> = {
  death: 'Death',
  serious_injury: 'Serious Injury',
  serious_illness: 'Serious Illness',
  absconding: 'Absconding',
  allegation_against_staff: 'Allegation Against Staff',
  serious_complaint: 'Serious Complaint',
  other: 'Other',
};

export const EVENT_STATUSES = [
  'draft',
  'notified',
  'acknowledged',
  'closed',
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

// ---------------------------------------------------------------------------
// Transition / Pathway Plans
// ---------------------------------------------------------------------------

export const PATHWAY_PLAN_STATUSES = [
  'draft',
  'active',
  'reviewed',
  'closed',
] as const;
export type PathwayPlanStatus = (typeof PATHWAY_PLAN_STATUSES)[number];

export const MILESTONE_CATEGORIES = [
  'accommodation',
  'education',
  'employment',
  'health',
  'finance',
  'life_skills',
  'relationships',
] as const;
export type MilestoneCategory = (typeof MILESTONE_CATEGORIES)[number];

export const MILESTONE_STATUSES = [
  'not-started',
  'in-progress',
  'completed',
  'deferred',
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];
