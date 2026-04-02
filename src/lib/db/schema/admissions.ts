import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Referrals — incoming referrals from placing authorities for children's residential homes.
 * Captures child background, needs, behaviours, placement history, and placing authority details.
 *
 * Workflow: received → assessment_complete → accepted | declined → admitted
 * Each transition is timestamped and attributed (see referralTransitions).
 *
 * VAL-CHILD-007: Referral progresses through staged workflow with timestamped transitions.
 * Relations defined in ./relations.ts.
 */
export const referrals = pgTable(
  'referrals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),

    /** Current workflow status */
    status: text('status', {
      enum: [
        'received',
        'assessment_complete',
        'accepted',
        'declined',
        'admitted',
      ],
    })
      .notNull()
      .default('received'),

    // ── Child information ──────────────────────────────────────────────
    childFirstName: text('child_first_name').notNull(),
    childLastName: text('child_last_name').notNull(),
    childDateOfBirth: text('child_date_of_birth').notNull(),
    childGender: text('child_gender').notNull(),
    childEthnicity: text('child_ethnicity'),
    childNationality: text('child_nationality'),
    childLanguage: text('child_language'),
    childReligion: text('child_religion'),

    // ── Needs & behaviours ─────────────────────────────────────────────
    /** JSON: { physical: string[], emotional: string[], educational: string[], medical: string[] } */
    needs: jsonb('needs'),
    /** JSON: { description: string, triggers: string[], managementStrategies: string[] }[] */
    behaviours: jsonb('behaviours'),
    /** JSON: { diagnosis: string, medication: string, allergies: string, gpDetails: string } */
    medicalInformation: jsonb('medical_information'),
    /** Free-text background narrative */
    backgroundSummary: text('background_summary'),

    // ── Placement history ──────────────────────────────────────────────
    /** JSON: { placementType: string, provider: string, startDate: string, endDate: string, reason: string }[] */
    placementHistory: jsonb('placement_history'),
    /** Reason the child is being referred now */
    referralReason: text('referral_reason').notNull(),

    // ── Placing authority details ──────────────────────────────────────
    placingAuthorityName: text('placing_authority_name').notNull(),
    socialWorkerName: text('social_worker_name').notNull(),
    socialWorkerEmail: text('social_worker_email').notNull(),
    socialWorkerPhone: text('social_worker_phone'),
    teamManagerName: text('team_manager_name'),
    teamManagerEmail: text('team_manager_email'),

    // ── Legal status ───────────────────────────────────────────────────
    legalStatus: text('legal_status'),

    // ── Decision fields ────────────────────────────────────────────────
    /** User who made the accept/decline decision */
    decisionBy: uuid('decision_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    decisionAt: timestamp('decision_at'),
    decisionReason: text('decision_reason'),
    /** Conditions attached to acceptance (if accept with conditions) */
    acceptanceConditions: text('acceptance_conditions'),

    // ── Admission fields ───────────────────────────────────────────────
    admittedAt: timestamp('admitted_at'),
    admittedBy: uuid('admitted_by').references(() => users.id, {
      onDelete: 'set null',
    }),

    // ── Metadata ───────────────────────────────────────────────────────
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('referrals_organisation_id_idx').on(t.organisationId),
    index('referrals_status_idx').on(t.organisationId, t.status),
    index('referrals_created_at_idx').on(t.organisationId, t.createdAt),
  ],
);

export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

/**
 * Referral transitions — immutable audit trail for each workflow status change.
 * VAL-CHILD-007: each transition timestamped and attributed.
 */
export const referralTransitions = pgTable(
  'referral_transitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    referralId: uuid('referral_id')
      .notNull()
      .references(() => referrals.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    /** User who triggered the transition */
    performedBy: uuid('performed_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('referral_transitions_referral_id_idx').on(t.referralId),
    index('referral_transitions_organisation_id_idx').on(t.organisationId),
  ],
);

export type ReferralTransition = typeof referralTransitions.$inferSelect;
export type NewReferralTransition = typeof referralTransitions.$inferInsert;

/**
 * Matching / impact risk assessments — evaluates referred child against existing children.
 *
 * VAL-CHILD-024: Covers risk-to, risk-from, compatibility, capacity; produces rating & recommendation.
 */
export const matchingAssessments = pgTable(
  'matching_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    referralId: uuid('referral_id')
      .notNull()
      .references(() => referrals.id, { onDelete: 'cascade' }),

    // ── Risk-to: risks new child poses to existing children ────────────
    /** JSON: { childId?: string, childName: string, riskDescription: string, likelihood: string, severity: string, mitigations: string }[] */
    riskToExisting: jsonb('risk_to_existing'),
    riskToRating: text('risk_to_rating', {
      enum: ['low', 'medium', 'high'],
    }),

    // ── Risk-from: risks existing children pose to new child ───────────
    /** JSON: { childId?: string, childName: string, riskDescription: string, likelihood: string, severity: string, mitigations: string }[] */
    riskFromExisting: jsonb('risk_from_existing'),
    riskFromRating: text('risk_from_rating', {
      enum: ['low', 'medium', 'high'],
    }),

    // ── Compatibility factors ──────────────────────────────────────────
    /** JSON: { factor: string, assessment: string, rating: 'compatible'|'neutral'|'incompatible' }[] */
    compatibilityFactors: jsonb('compatibility_factors'),

    // ── Home capacity ──────────────────────────────────────────────────
    currentOccupancy: integer('current_occupancy'),
    maxCapacity: integer('max_capacity'),
    bedsAvailable: integer('beds_available'),
    capacityNotes: text('capacity_notes'),

    // ── Overall assessment ─────────────────────────────────────────────
    overallRiskRating: text('overall_risk_rating', {
      enum: ['low', 'medium', 'high'],
    }).notNull(),
    recommendation: text('recommendation', {
      enum: ['accept', 'decline', 'accept_with_conditions'],
    }).notNull(),
    recommendationRationale: text('recommendation_rationale').notNull(),
    conditions: text('conditions'),

    // ── Metadata ───────────────────────────────────────────────────────
    assessedBy: uuid('assessed_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('matching_assessments_referral_id_idx').on(t.referralId),
    index('matching_assessments_organisation_id_idx').on(t.organisationId),
  ],
);

export type MatchingAssessment = typeof matchingAssessments.$inferSelect;
export type NewMatchingAssessment = typeof matchingAssessments.$inferInsert;

/**
 * Admission checklist items — tracks required documentation before physical admission.
 * Created after referral is accepted.
 */
export const admissionChecklistItems = pgTable(
  'admission_checklist_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    referralId: uuid('referral_id')
      .notNull()
      .references(() => referrals.id, { onDelete: 'cascade' }),

    /** Category: documentation | health | education | legal | placement_plan */
    category: text('category').notNull(),
    /** Human-readable item name */
    title: text('title').notNull(),
    description: text('description'),
    /** Is this item required before admission can proceed? */
    required: boolean('required').notNull().default(true),
    /** Has this item been completed? */
    completed: boolean('completed').notNull().default(false),
    completedBy: uuid('completed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    completedAt: timestamp('completed_at'),
    notes: text('notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('admission_checklist_items_referral_id_idx').on(t.referralId),
    index('admission_checklist_items_organisation_id_idx').on(
      t.organisationId,
    ),
  ],
);

export type AdmissionChecklistItem =
  typeof admissionChecklistItems.$inferSelect;
export type NewAdmissionChecklistItem =
  typeof admissionChecklistItems.$inferInsert;
