import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Concern severity levels */
export const CONCERN_SEVERITIES = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

/** Concern statuses — append-only workflow */
export const CONCERN_STATUSES = [
  'open',
  'under_review',
  'action_taken',
  'closed',
] as const;

/** DSL review decision pathways (VAL-CHILD-009) */
export const DSL_DECISIONS = [
  'internal_monitoring',
  'refer_to_mash',
  'refer_to_lado',
  'refer_to_police',
] as const;

/** LADO investigation statuses */
export const LADO_STATUSES = [
  'allegation_received',
  'initial_assessment',
  'investigation_ongoing',
  'outcome_reached',
  'closed',
] as const;

/** LADO outcomes */
export const LADO_OUTCOMES = [
  'substantiated',
  'unsubstantiated',
  'unfounded',
  'malicious',
  'false',
] as const;

/** LADO employment actions */
export const LADO_EMPLOYMENT_ACTIONS = [
  'no_action',
  'suspended',
  'redeployed',
  'dismissed',
  'resigned',
  'referred_to_dbs',
] as const;

/** Section 47 outcome statuses */
export const SECTION_47_STATUSES = [
  'strategy_meeting_scheduled',
  'strategy_meeting_held',
  'investigation_ongoing',
  'outcome_reached',
  'closed',
] as const;

/** MASH referral statuses */
export const MASH_STATUSES = [
  'submitted',
  'acknowledged',
  'assessment_in_progress',
  'outcome_received',
  'closed',
] as const;

/** Chronology entry sources */
export const CHRONOLOGY_SOURCES = [
  'concern',
  'dsl_review',
  'mash_referral',
  'lado_referral',
  'section_47',
  'incident',
  'missing_episode',
  'manual',
] as const;

// ---------------------------------------------------------------------------
// Safeguarding Concerns (VAL-CHILD-008)
// ---------------------------------------------------------------------------

/**
 * Safeguarding concerns — immutable after submission.
 * Any staff can raise. Includes verbatim capture and body map link.
 * Corrections are append-only via the corrections table.
 */
export const safeguardingConcerns = pgTable(
  'safeguarding_concerns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The child this concern relates to (person UUID) */
    childId: uuid('child_id').notNull(),
    /** Staff member who raised the concern */
    reportedById: uuid('reported_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Date and time the concern was observed */
    observedAt: timestamp('observed_at').notNull(),
    /** Child's exact words — verbatim capture (VAL-CHILD-008) */
    verbatimAccount: text('verbatim_account'),
    /** Description of the concern */
    description: text('description').notNull(),
    /** Child's presentation at time of concern */
    childPresentation: text('child_presentation'),
    /** Link/reference to body map record (VAL-CHILD-008) */
    bodyMapId: uuid('body_map_id'),
    /** Severity assessment */
    severity: text('severity').notNull().default('medium'),
    /** Current status — progresses through workflow */
    status: text('status').notNull().default('open'),
    /** Location where concern was observed */
    location: text('location'),
    /** Category of concern (e.g. physical, emotional, neglect, sexual, exploitation) */
    category: text('category'),
    /** Any witnesses */
    witnesses: text('witnesses'),
    /** Actions taken immediately */
    immediateActions: text('immediate_actions'),
    /** Reference number (auto-generated: SC-YYYYMMDD-XXXX) */
    referenceNumber: text('reference_number').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('sg_concerns_org_idx').on(t.organisationId),
    index('sg_concerns_child_idx').on(t.childId),
    index('sg_concerns_status_idx').on(t.status),
    index('sg_concerns_reported_by_idx').on(t.reportedById),
    index('sg_concerns_observed_at_idx').on(t.observedAt),
  ],
);

export type SafeguardingConcern = typeof safeguardingConcerns.$inferSelect;
export type NewSafeguardingConcern = typeof safeguardingConcerns.$inferInsert;

// ---------------------------------------------------------------------------
// Concern Corrections (append-only immutability pattern)
// ---------------------------------------------------------------------------

/**
 * Append-only corrections to safeguarding concerns.
 * The original concern record is never modified. Instead, corrections
 * are added here, preserving a complete audit trail.
 */
export const concernCorrections = pgTable(
  'concern_corrections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    concernId: uuid('concern_id')
      .notNull()
      .references(() => safeguardingConcerns.id, { onDelete: 'restrict' }),
    /** User making the correction */
    correctedById: uuid('corrected_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Which field is being corrected */
    fieldName: text('field_name').notNull(),
    /** The corrected value */
    correctedValue: text('corrected_value').notNull(),
    /** Reason for the correction */
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('concern_corrections_concern_idx').on(t.concernId),
    index('concern_corrections_org_idx').on(t.organisationId),
  ],
);

export type ConcernCorrection = typeof concernCorrections.$inferSelect;
export type NewConcernCorrection = typeof concernCorrections.$inferInsert;

// ---------------------------------------------------------------------------
// DSL Reviews (VAL-CHILD-009)
// ---------------------------------------------------------------------------

/**
 * Designated Safeguarding Lead reviews of concerns.
 * Each concern gets one DSL review with one of four decision pathways.
 * External referrals capture additional tracking fields.
 */
export const dslReviews = pgTable(
  'dsl_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    concernId: uuid('concern_id')
      .notNull()
      .references(() => safeguardingConcerns.id, { onDelete: 'restrict' }),
    /** The DSL performing the review */
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Decision: internal_monitoring | refer_to_mash | refer_to_lado | refer_to_police */
    decision: text('decision').notNull(),
    /** Rationale for the decision */
    rationale: text('rationale').notNull(),
    /** Risk assessment notes */
    riskAssessment: text('risk_assessment'),
    /** For external referrals: date of referral */
    referralDate: timestamp('referral_date'),
    /** For external referrals: receiving agency name */
    referralAgency: text('referral_agency'),
    /** For external referrals: reference number from the agency */
    referralReference: text('referral_reference'),
    /** For external referrals: expected response timeframe */
    expectedResponseDate: timestamp('expected_response_date'),
    /** Any additional actions required */
    additionalActions: text('additional_actions'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('dsl_reviews_org_idx').on(t.organisationId),
    index('dsl_reviews_concern_idx').on(t.concernId),
    index('dsl_reviews_reviewer_idx').on(t.reviewerId),
    index('dsl_reviews_decision_idx').on(t.decision),
  ],
);

export type DslReview = typeof dslReviews.$inferSelect;
export type NewDslReview = typeof dslReviews.$inferInsert;

// ---------------------------------------------------------------------------
// LADO Referrals (VAL-CHILD-010)
// ---------------------------------------------------------------------------

/**
 * LADO (Local Authority Designated Officer) referral tracking.
 * Restricted-access: only DSL + senior leadership can view.
 * For allegations against staff members.
 */
export const ladoReferrals = pgTable(
  'lado_referrals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Linked concern, if originated from a concern */
    concernId: uuid('concern_id').references(() => safeguardingConcerns.id, {
      onDelete: 'set null',
    }),
    /** Linked DSL review, if originated from a DSL review */
    dslReviewId: uuid('dsl_review_id').references(() => dslReviews.id, {
      onDelete: 'set null',
    }),
    /** The child involved */
    childId: uuid('child_id').notNull(),
    /** The staff member the allegation is against */
    allegationAgainstStaffId: uuid('allegation_against_staff_id'),
    /** Staff member name (captured at time of referral for record integrity) */
    allegationAgainstStaffName: text('allegation_against_staff_name').notNull(),
    /** Details of the allegation */
    allegationDetails: text('allegation_details').notNull(),
    /** Category of allegation */
    allegationCategory: text('allegation_category'),
    /** LADO reference number from the local authority */
    ladoReference: text('lado_reference'),
    /** LADO officer name */
    ladoOfficerName: text('lado_officer_name'),
    /** LADO officer contact */
    ladoOfficerContact: text('lado_officer_contact'),
    /** Date referred to LADO */
    referralDate: timestamp('referral_date').notNull(),
    /** Investigation status */
    status: text('status').notNull().default('allegation_received'),
    /** Investigation outcome */
    outcome: text('outcome'),
    /** Employment action taken */
    employmentAction: text('employment_action'),
    /** Date of outcome determination */
    outcomeDate: timestamp('outcome_date'),
    /** Summary notes */
    notes: text('notes'),
    /** Who created this record (must be DSL or senior leadership) */
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Is the record restricted (only DSL + senior leadership) */
    isRestricted: boolean('is_restricted').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('lado_referrals_org_idx').on(t.organisationId),
    index('lado_referrals_child_idx').on(t.childId),
    index('lado_referrals_status_idx').on(t.status),
    index('lado_referrals_staff_idx').on(t.allegationAgainstStaffId),
  ],
);

export type LadoReferral = typeof ladoReferrals.$inferSelect;
export type NewLadoReferral = typeof ladoReferrals.$inferInsert;

// ---------------------------------------------------------------------------
// Section 47 Investigations (VAL-CHILD-010)
// ---------------------------------------------------------------------------

/**
 * Section 47 (Children Act 1989) cooperation tracking.
 * Tracks strategy meetings, attendees, decisions, and outcomes.
 */
export const section47Investigations = pgTable(
  'section_47_investigations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Linked concern */
    concernId: uuid('concern_id').references(() => safeguardingConcerns.id, {
      onDelete: 'set null',
    }),
    /** The child involved */
    childId: uuid('child_id').notNull(),
    /** Local authority reference number */
    localAuthorityReference: text('local_authority_reference'),
    /** Social worker name */
    socialWorkerName: text('social_worker_name'),
    /** Social worker contact */
    socialWorkerContact: text('social_worker_contact'),
    /** Strategy meeting date */
    strategyMeetingDate: timestamp('strategy_meeting_date'),
    /** Strategy meeting attendees (JSON array of {name, role, organisation}) */
    strategyMeetingAttendees: jsonb('strategy_meeting_attendees'),
    /** Decisions from strategy meeting */
    strategyMeetingDecisions: text('strategy_meeting_decisions'),
    /** Investigation status */
    status: text('status').notNull().default('strategy_meeting_scheduled'),
    /** Investigation outcome */
    outcome: text('outcome'),
    /** Outcome date */
    outcomeDate: timestamp('outcome_date'),
    /** Notes */
    notes: text('notes'),
    /** Created by */
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('s47_org_idx').on(t.organisationId),
    index('s47_child_idx').on(t.childId),
    index('s47_status_idx').on(t.status),
  ],
);

export type Section47Investigation =
  typeof section47Investigations.$inferSelect;
export type NewSection47Investigation =
  typeof section47Investigations.$inferInsert;

// ---------------------------------------------------------------------------
// MASH Referrals (VAL-CHILD-009)
// ---------------------------------------------------------------------------

/**
 * MASH (Multi-Agency Safeguarding Hub) referral tracking.
 * Captures reference numbers and outcomes.
 */
export const mashReferrals = pgTable(
  'mash_referrals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Linked concern */
    concernId: uuid('concern_id').references(() => safeguardingConcerns.id, {
      onDelete: 'set null',
    }),
    /** Linked DSL review */
    dslReviewId: uuid('dsl_review_id').references(() => dslReviews.id, {
      onDelete: 'set null',
    }),
    /** The child involved */
    childId: uuid('child_id').notNull(),
    /** MASH reference number */
    mashReference: text('mash_reference'),
    /** Date of referral */
    referralDate: timestamp('referral_date').notNull(),
    /** Reason for referral */
    referralReason: text('referral_reason').notNull(),
    /** Agency referred to */
    referralAgency: text('referral_agency'),
    /** Status */
    status: text('status').notNull().default('submitted'),
    /** Outcome from MASH */
    outcome: text('outcome'),
    /** Outcome date */
    outcomeDate: timestamp('outcome_date'),
    /** Response received details */
    responseDetails: text('response_details'),
    /** Expected response timeframe */
    expectedResponseDate: timestamp('expected_response_date'),
    /** Created by */
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('mash_referrals_org_idx').on(t.organisationId),
    index('mash_referrals_child_idx').on(t.childId),
    index('mash_referrals_status_idx').on(t.status),
  ],
);

export type MashReferral = typeof mashReferrals.$inferSelect;
export type NewMashReferral = typeof mashReferrals.$inferInsert;

// ---------------------------------------------------------------------------
// Safeguarding Chronology (VAL-CHILD-025)
// ---------------------------------------------------------------------------

/**
 * Safeguarding chronology — auto-generated per child from all record types.
 * Also supports manual entries for historical events.
 * Read-only (auto-entries are system-generated), exportable as PDF.
 */
export const safeguardingChronology = pgTable(
  'safeguarding_chronology',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The child this chronology entry belongs to */
    childId: uuid('child_id').notNull(),
    /** Date of the event */
    eventDate: timestamp('event_date').notNull(),
    /** Source of the chronology entry */
    source: text('source').notNull(),
    /** Reference to source record ID (concern, referral, etc.) */
    sourceRecordId: uuid('source_record_id'),
    /** Title/summary of the event */
    title: text('title').notNull(),
    /** Detailed description */
    description: text('description').notNull(),
    /** Category for filtering */
    category: text('category'),
    /** Significance level */
    significance: text('significance').notNull().default('standard'),
    /** Is this a manual entry (vs auto-generated)? */
    isManual: boolean('is_manual').notNull().default(false),
    /** Is this entry restricted-access? */
    isRestricted: boolean('is_restricted').notNull().default(false),
    /** Sequential order for same-date entries */
    sortOrder: integer('sort_order').notNull().default(0),
    /** Created by (user who created manual entry, or system for auto) */
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('sg_chronology_org_idx').on(t.organisationId),
    index('sg_chronology_child_idx').on(t.childId),
    index('sg_chronology_event_date_idx').on(t.eventDate),
    index('sg_chronology_source_idx').on(t.source),
  ],
);

export type SafeguardingChronologyEntry =
  typeof safeguardingChronology.$inferSelect;
export type NewSafeguardingChronologyEntry =
  typeof safeguardingChronology.$inferInsert;
