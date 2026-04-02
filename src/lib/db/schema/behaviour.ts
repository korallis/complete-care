import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  date,
  index,
  boolean,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ---------------------------------------------------------------------------
// 1. Baseline Assessments
// ---------------------------------------------------------------------------

/**
 * Baseline assessments for a young person across development domains.
 * Captures initial and periodic reassessments using tools like Outcomes Star
 * and BERRI.
 */
export const baselineAssessments = pgTable(
  'baseline_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The young person being assessed (reference by ID — persons table not yet created) */
    personId: uuid('person_id').notNull(),
    /** Who performed the assessment */
    assessedById: uuid('assessed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Assessment tool: outcomes_star | berri | custom */
    assessmentTool: text('assessment_tool').notNull(),
    /** Assessment date */
    assessmentDate: date('assessment_date').notNull(),
    /**
     * Domain scores — JSON object keyed by domain name.
     * Example: { "physical": 5, "emotional": 3, "identity": 4, ... }
     */
    domainScores: jsonb('domain_scores')
      .$type<Record<string, number>>()
      .notNull(),
    /** Optional free-text notes */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('baseline_assessments_org_idx').on(t.organisationId),
    index('baseline_assessments_person_idx').on(t.personId),
    index('baseline_assessments_date_idx').on(t.assessmentDate),
  ],
);

export type BaselineAssessment = typeof baselineAssessments.$inferSelect;
export type NewBaselineAssessment = typeof baselineAssessments.$inferInsert;

// ---------------------------------------------------------------------------
// 2. Progress Records
// ---------------------------------------------------------------------------

/**
 * Individual progress entries linked to a baseline assessment domain.
 * Enables tracking progress between full assessments.
 */
export const progressRecords = pgTable(
  'progress_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Link to the assessment this progress relates to */
    assessmentId: uuid('assessment_id')
      .notNull()
      .references(() => baselineAssessments.id, { onDelete: 'cascade' }),
    /** Development domain: physical | emotional | identity | relationships | social | self_care | education */
    domain: text('domain').notNull(),
    /** Numeric score at time of recording (same scale as the assessment tool) */
    score: integer('score').notNull(),
    /** Narrative description of progress */
    narrative: text('narrative'),
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    recordedAt: timestamp('recorded_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('progress_records_org_idx').on(t.organisationId),
    index('progress_records_person_idx').on(t.personId),
    index('progress_records_assessment_idx').on(t.assessmentId),
  ],
);

export type ProgressRecord = typeof progressRecords.$inferSelect;
export type NewProgressRecord = typeof progressRecords.$inferInsert;

// ---------------------------------------------------------------------------
// 3. Positive Behaviour / Rewards
// ---------------------------------------------------------------------------

/**
 * Positive behaviour events and rewards/points for a young person.
 */
export const positiveBehaviours = pgTable(
  'positive_behaviours',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Description of the positive behaviour observed */
    description: text('description').notNull(),
    /** Category: kindness | achievement | cooperation | responsibility | resilience | other */
    category: text('category').notNull(),
    /** Points/rewards earned */
    points: integer('points').notNull().default(0),
    /** Staff member who recorded the observation */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    occurredAt: timestamp('occurred_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('positive_behaviours_org_idx').on(t.organisationId),
    index('positive_behaviours_person_idx').on(t.personId),
    index('positive_behaviours_occurred_idx').on(t.occurredAt),
  ],
);

export type PositiveBehaviour = typeof positiveBehaviours.$inferSelect;
export type NewPositiveBehaviour = typeof positiveBehaviours.$inferInsert;

// ---------------------------------------------------------------------------
// 4. Behaviour Incidents (ABC Model)
// ---------------------------------------------------------------------------

/**
 * Behaviour incidents recorded using the ABC model
 * (Antecedent, Behaviour, Consequence).
 */
export const behaviourIncidents = pgTable(
  'behaviour_incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** What happened before the behaviour (trigger/antecedent) */
    antecedent: text('antecedent').notNull(),
    /** The behaviour itself */
    behaviour: text('behaviour').notNull(),
    /** What happened after (consequence / response) */
    consequence: text('consequence').notNull(),
    /** Severity: low | medium | high | critical */
    severity: text('severity').notNull().default('low'),
    /** Type of behaviour: verbal_aggression | physical_aggression | self_harm | absconding | property_damage | other */
    behaviourType: text('behaviour_type').notNull(),
    /** Physical location within the home */
    location: text('location'),
    /** Duration in minutes */
    durationMinutes: integer('duration_minutes'),
    /** De-escalation techniques used */
    deescalationUsed: text('deescalation_used'),
    /** Whether physical intervention was required */
    physicalIntervention: boolean('physical_intervention')
      .notNull()
      .default(false),
    /** Staff who were involved */
    staffInvolved: jsonb('staff_involved').$type<string[]>(),
    /** Staff member who recorded */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    occurredAt: timestamp('occurred_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('behaviour_incidents_org_idx').on(t.organisationId),
    index('behaviour_incidents_person_idx').on(t.personId),
    index('behaviour_incidents_occurred_idx').on(t.occurredAt),
    index('behaviour_incidents_type_idx').on(t.behaviourType),
    index('behaviour_incidents_severity_idx').on(t.severity),
  ],
);

export type BehaviourIncident = typeof behaviourIncidents.$inferSelect;
export type NewBehaviourIncident = typeof behaviourIncidents.$inferInsert;

// ---------------------------------------------------------------------------
// 5. Statement of Purpose
// ---------------------------------------------------------------------------

/**
 * Statement of Purpose documents with version control.
 * Each row is an immutable version — new versions are created on update.
 */
export const statementsOfPurpose = pgTable(
  'statements_of_purpose',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Version number (auto-incremented per organisation) */
    version: integer('version').notNull(),
    /** Document title */
    title: text('title').notNull(),
    /** Rich text content of the statement */
    content: text('content').notNull(),
    /** Status: draft | published | archived */
    status: text('status').notNull().default('draft'),
    /** Date of the next annual review */
    nextReviewDate: date('next_review_date'),
    /** Whether an annual review reminder has been sent */
    reviewReminderSent: boolean('review_reminder_sent')
      .notNull()
      .default(false),
    /** Who created this version */
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Who approved/published this version */
    approvedById: uuid('approved_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('statements_of_purpose_org_idx').on(t.organisationId),
    index('statements_of_purpose_status_idx').on(t.status),
    index('statements_of_purpose_review_idx').on(t.nextReviewDate),
  ],
);

export type StatementOfPurpose = typeof statementsOfPurpose.$inferSelect;
export type NewStatementOfPurpose = typeof statementsOfPurpose.$inferInsert;
