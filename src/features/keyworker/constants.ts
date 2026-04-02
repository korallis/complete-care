/**
 * Key Worker Engagement — Constants
 *
 * Shared constants for session types, restraint techniques,
 * sanction types, visitor relationships, and voice categories.
 */

// ---------------------------------------------------------------------------
// Restraint techniques
// ---------------------------------------------------------------------------

export const RESTRAINT_TECHNIQUES = [
  'team_teach',
  'price',
  'mapa',
  'cpi',
  'other',
] as const;

export type RestraintTechnique = (typeof RESTRAINT_TECHNIQUES)[number];

export const RESTRAINT_TECHNIQUE_LABELS: Record<RestraintTechnique, string> = {
  team_teach: 'Team Teach',
  price: 'PRICE (Protecting Rights in a Caring Environment)',
  mapa: 'MAPA (Management of Actual or Potential Aggression)',
  cpi: 'CPI (Crisis Prevention Institute)',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Sanction types
// ---------------------------------------------------------------------------

export const SANCTION_TYPES = [
  'loss_of_privilege',
  'additional_chore',
  'earlier_bedtime',
  'reduced_screen_time',
  'grounding',
  'verbal_warning',
  'written_warning',
  'reparation',
  'other',
] as const;

export type SanctionType = (typeof SANCTION_TYPES)[number];

export const SANCTION_TYPE_LABELS: Record<SanctionType, string> = {
  loss_of_privilege: 'Loss of privilege',
  additional_chore: 'Additional chore',
  earlier_bedtime: 'Earlier bedtime',
  reduced_screen_time: 'Reduced screen time',
  grounding: 'Grounding',
  verbal_warning: 'Verbal warning',
  written_warning: 'Written warning',
  reparation: 'Reparation',
  other: 'Other',
};

/**
 * Prohibited measures under Children's Homes (England) Regulations 2015.
 * These MUST NOT be used as sanctions.
 */
export const PROHIBITED_MEASURES = [
  'corporal_punishment',
  'deprivation_of_food_or_drink',
  'restriction_of_contact',
  'requiring_child_to_wear_distinctive_clothing',
  'use_or_withholding_of_medication',
  'use_of_intimate_physical_examination',
  'withholding_of_sleep',
  'fines',
  'intimate_physical_searches',
] as const;

export type ProhibitedMeasure = (typeof PROHIBITED_MEASURES)[number];

export const PROHIBITED_MEASURE_LABELS: Record<ProhibitedMeasure, string> = {
  corporal_punishment: 'Corporal punishment',
  deprivation_of_food_or_drink: 'Deprivation of food or drink',
  restriction_of_contact: 'Restriction of contact with parents/family',
  requiring_child_to_wear_distinctive_clothing:
    'Requiring child to wear distinctive clothing',
  use_or_withholding_of_medication: 'Use or withholding of medication as punishment',
  use_of_intimate_physical_examination: 'Intimate physical examination',
  withholding_of_sleep: 'Withholding of sleep',
  fines: 'Financial penalties / fines',
  intimate_physical_searches: 'Intimate physical searches',
};

// ---------------------------------------------------------------------------
// Visitor relationships
// ---------------------------------------------------------------------------

export const VISITOR_RELATIONSHIPS = [
  'parent',
  'guardian',
  'sibling',
  'family_member',
  'social_worker',
  'iro',
  'advocate',
  'therapist',
  'solicitor',
  'ofsted_inspector',
  'professional',
  'friend',
  'other',
] as const;

export type VisitorRelationship = (typeof VISITOR_RELATIONSHIPS)[number];

export const VISITOR_RELATIONSHIP_LABELS: Record<VisitorRelationship, string> = {
  parent: 'Parent',
  guardian: 'Guardian',
  sibling: 'Sibling',
  family_member: 'Other family member',
  social_worker: 'Social worker',
  iro: 'Independent Reviewing Officer',
  advocate: 'Advocate',
  therapist: 'Therapist / Counsellor',
  solicitor: 'Solicitor / Legal representative',
  ofsted_inspector: 'Ofsted inspector',
  professional: 'Other professional',
  friend: 'Friend',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Children's voice categories
// ---------------------------------------------------------------------------

export const VOICE_CATEGORIES = [
  'daily_life',
  'education',
  'health',
  'family_contact',
  'placement',
  'activities',
  'food',
  'safety',
  'complaints',
  'compliments',
  'wishes',
  'other',
] as const;

export type VoiceCategory = (typeof VOICE_CATEGORIES)[number];

export const VOICE_CATEGORY_LABELS: Record<VoiceCategory, string> = {
  daily_life: 'Daily life in the home',
  education: 'Education & learning',
  health: 'Health & wellbeing',
  family_contact: 'Family contact',
  placement: 'Placement',
  activities: 'Activities & hobbies',
  food: 'Food & meals',
  safety: 'Feeling safe',
  complaints: 'Complaints',
  compliments: 'Compliments / Positive feedback',
  wishes: 'Wishes & feelings',
  other: 'Other',
};

// ---------------------------------------------------------------------------
// Voice gathering methods
// ---------------------------------------------------------------------------

export const VOICE_METHODS = [
  'direct_conversation',
  'keyworker_session',
  'survey',
  'advocate',
  'house_meeting',
  'feedback_form',
  'other',
] as const;

export type VoiceMethod = (typeof VOICE_METHODS)[number];

export const VOICE_METHOD_LABELS: Record<VoiceMethod, string> = {
  direct_conversation: 'Direct conversation',
  keyworker_session: 'Key worker session',
  survey: 'Survey / Questionnaire',
  advocate: 'Through an advocate',
  house_meeting: 'House meeting',
  feedback_form: 'Feedback form',
  other: 'Other',
};
