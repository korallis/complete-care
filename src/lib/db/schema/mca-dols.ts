import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ---------------------------------------------------------------------------
// Mental Capacity Assessment (MCA)
// ---------------------------------------------------------------------------

/**
 * Mental Capacity Assessments — decision-specific capacity evaluations
 * under the Mental Capacity Act 2005.
 *
 * Each assessment is tied to a specific decision for a specific person.
 * The two-stage test (diagnostic + functional) determines capacity.
 */
export const mcaAssessments = pgTable(
  'mca_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person being assessed (references persons table when it exists, stored as uuid) */
    personId: uuid('person_id').notNull(),
    /** The specific decision being assessed — MCA is always decision-specific */
    decisionToBeAssessed: text('decision_to_be_assessed').notNull(),
    /** Who performed the assessment */
    assessorId: uuid('assessor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    // -- Diagnostic test (Stage 1) --
    /** "Is there an impairment of, or disturbance in, the functioning of the mind or brain?" */
    diagnosticTestResult: boolean('diagnostic_test_result').notNull(),
    /** Mandatory evidence supporting the diagnostic test result */
    diagnosticTestEvidence: text('diagnostic_test_evidence').notNull(),

    // -- Functional test (Stage 2) — only required when diagnosticTestResult = true --
    /** Can they understand the relevant information? */
    canUnderstand: boolean('can_understand'),
    canUnderstandEvidence: text('can_understand_evidence'),
    /** Can they retain the information long enough to make the decision? */
    canRetain: boolean('can_retain'),
    canRetainEvidence: text('can_retain_evidence'),
    /** Can they use or weigh the information as part of the decision-making process? */
    canUseOrWeigh: boolean('can_use_or_weigh'),
    canUseOrWeighEvidence: text('can_use_or_weigh_evidence'),
    /** Can they communicate their decision (by any means)? */
    canCommunicate: boolean('can_communicate'),
    canCommunicateEvidence: text('can_communicate_evidence'),

    // -- Support & outcome --
    /** Steps taken to support the person in making their own decision — required */
    supportStepsTaken: text('support_steps_taken').notNull(),
    /**
     * Overall outcome — derived from the two-stage test:
     * - diagnosticTestResult = false → 'has_capacity'
     * - Any functional criterion = false → 'lacks_capacity'
     * - All functional criteria = true → 'has_capacity'
     */
    outcome: text('outcome').notNull(), // 'has_capacity' | 'lacks_capacity'

    /** Assessment date */
    assessmentDate: timestamp('assessment_date').notNull(),
    /** Next review date */
    reviewDate: timestamp('review_date'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('mca_assessments_org_idx').on(t.organisationId),
    index('mca_assessments_person_idx').on(t.organisationId, t.personId),
    index('mca_assessments_assessor_idx').on(t.assessorId),
    index('mca_assessments_outcome_idx').on(t.organisationId, t.outcome),
  ],
);

export type McaAssessment = typeof mcaAssessments.$inferSelect;
export type NewMcaAssessment = typeof mcaAssessments.$inferInsert;

// ---------------------------------------------------------------------------
// Best Interest Decision
// ---------------------------------------------------------------------------

/**
 * Best Interest Decisions — mandatory when an MCA concludes "lacks capacity".
 * Records the decision-making process under s4 Mental Capacity Act 2005.
 */
export const bestInterestDecisions = pgTable(
  'best_interest_decisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Link to the MCA that triggered this best interest decision */
    mcaAssessmentId: uuid('mca_assessment_id')
      .notNull()
      .references(() => mcaAssessments.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),

    /** The decision being made in the person's best interest */
    decisionBeingMade: text('decision_being_made').notNull(),
    /** Persons consulted: family, IMCA, carers, etc. */
    personsConsulted: jsonb('persons_consulted').notNull(), // Array<{ name, role, relationship, views }>
    /** The person's past and present wishes, feelings, beliefs, and values */
    personWishesFeelingsBeliefs: text('person_wishes_feelings_beliefs').notNull(),
    /** Less restrictive options that were considered */
    lessRestrictiveOptionsConsidered: text('less_restrictive_options_considered').notNull(),
    /** The decision reached */
    decisionReached: text('decision_reached').notNull(),
    /** Identity of the decision-maker */
    decisionMakerName: text('decision_maker_name').notNull(),
    decisionMakerRole: text('decision_maker_role').notNull(),

    /** Date the decision was made */
    decisionDate: timestamp('decision_date').notNull(),
    /** Next review date for this decision */
    reviewDate: timestamp('review_date'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('best_interest_decisions_org_idx').on(t.organisationId),
    index('best_interest_decisions_person_idx').on(t.organisationId, t.personId),
    index('best_interest_decisions_mca_idx').on(t.mcaAssessmentId),
  ],
);

export type BestInterestDecision = typeof bestInterestDecisions.$inferSelect;
export type NewBestInterestDecision = typeof bestInterestDecisions.$inferInsert;

// ---------------------------------------------------------------------------
// LPA & ADRT Tracking
// ---------------------------------------------------------------------------

/**
 * Lasting Power of Attorney and Advance Decision to Refuse Treatment records.
 * Tracked per person to flag on their profile.
 */
export const lpaAdrtRecords = pgTable(
  'lpa_adrt_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),

    /** Type of record: 'lpa_health' | 'lpa_finance' | 'adrt' */
    recordType: text('record_type').notNull(),
    /** Whether this is currently active */
    isActive: boolean('is_active').notNull().default(true),
    /** Name of the attorney or decision details */
    details: text('details').notNull(),
    /** Date registered/created */
    registeredDate: date('registered_date'),
    /** Any specific conditions or scope */
    conditions: text('conditions'),
    /** Document reference / location */
    documentReference: text('document_reference'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('lpa_adrt_records_org_idx').on(t.organisationId),
    index('lpa_adrt_records_person_idx').on(t.organisationId, t.personId),
  ],
);

export type LpaAdrtRecord = typeof lpaAdrtRecords.$inferSelect;
export type NewLpaAdrtRecord = typeof lpaAdrtRecords.$inferInsert;

// ---------------------------------------------------------------------------
// DoLS Applications
// ---------------------------------------------------------------------------

/**
 * Deprivation of Liberty Safeguards (DoLS) applications.
 * Tracks the full lifecycle from application to authorisation/expiry.
 */
export const dolsApplications = pgTable(
  'dols_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),

    /** Managing authority (the care home / hospital making the application) */
    managingAuthority: text('managing_authority').notNull(),
    /** Supervisory body — the Local Authority */
    supervisoryBody: text('supervisory_body').notNull(),
    /** Local Authority reference number */
    laReferenceNumber: text('la_reference_number'),

    /** Date of application */
    applicationDate: date('application_date').notNull(),
    /** Reason for the DoLS application */
    reason: text('reason').notNull(),
    /** Restrictions being applied to the person */
    restrictions: text('restrictions').notNull(),

    /** Linked MCA assessment */
    linkedMcaId: uuid('linked_mca_id').references(() => mcaAssessments.id, {
      onDelete: 'set null',
    }),
    /** Linked best interest assessment */
    linkedBestInterestId: uuid('linked_best_interest_id').references(
      () => bestInterestDecisions.id,
      { onDelete: 'set null' },
    ),

    /** Person's representative name */
    personsRepresentative: text('persons_representative'),
    /** Whether an IMCA (Independent Mental Capacity Advocate) has been instructed */
    imcaInstructed: boolean('imca_instructed').notNull().default(false),

    /**
     * Application status lifecycle:
     * applied → granted | refused
     * granted → expired | renewed
     */
    status: text('status').notNull().default('applied'), // applied | granted | refused | expired | renewed

    // -- Authorisation details (populated when status = granted) --
    /** Start date of the authorisation */
    authorisationStartDate: date('authorisation_start_date'),
    /** End date — max 12 months from start */
    authorisationEndDate: date('authorisation_end_date'),
    /** Conditions attached to the authorisation */
    conditions: text('conditions'),
    /** Review date (within the authorisation period) */
    reviewDate: date('review_date'),

    /** Configurable alert lead time in days before expiry (default 28 days) */
    expiryAlertDays: integer('expiry_alert_days').notNull().default(28),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('dols_applications_org_idx').on(t.organisationId),
    index('dols_applications_person_idx').on(t.organisationId, t.personId),
    index('dols_applications_status_idx').on(t.organisationId, t.status),
    index('dols_applications_expiry_idx').on(t.authorisationEndDate),
    index('dols_applications_linked_mca_idx').on(t.linkedMcaId),
  ],
);

export type DolsApplication = typeof dolsApplications.$inferSelect;
export type NewDolsApplication = typeof dolsApplications.$inferInsert;

// ---------------------------------------------------------------------------
// DoLS Restrictions Register
// ---------------------------------------------------------------------------

/**
 * DoLS Restrictions Register — tracks individual restrictions applied
 * under a DoLS authorisation.
 */
export const dolsRestrictions = pgTable(
  'dols_restrictions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    dolsApplicationId: uuid('dols_application_id')
      .notNull()
      .references(() => dolsApplications.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),

    /** Type of restriction */
    restrictionType: text('restriction_type').notNull(),
    /** Description of the specific restriction */
    description: text('description').notNull(),
    /** Justification for the restriction */
    justification: text('justification').notNull(),
    /** Whether the restriction is currently active */
    isActive: boolean('is_active').notNull().default(true),
    /** Date restriction started */
    startDate: date('start_date').notNull(),
    /** Date restriction ended (null if still active) */
    endDate: date('end_date'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('dols_restrictions_org_idx').on(t.organisationId),
    index('dols_restrictions_dols_app_idx').on(t.dolsApplicationId),
    index('dols_restrictions_person_idx').on(t.organisationId, t.personId),
  ],
);

export type DolsRestriction = typeof dolsRestrictions.$inferSelect;
export type NewDolsRestriction = typeof dolsRestrictions.$inferInsert;
