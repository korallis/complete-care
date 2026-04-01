import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

// ---------------------------------------------------------------------------
// Bowel Records — Bristol Stool Scale tracking with clinical alerts
// ---------------------------------------------------------------------------

/**
 * Bowel Records — per-event bowel movement tracking.
 *
 * Records Bristol Stool Scale type (1-7), colour, blood/mucus presence,
 * and laxative linkage. Supports constipation alerts (no BM for 3/5 days)
 * and diarrhoea alerts (3+ type 6-7 in 24hrs).
 *
 * Colour clinical alerts: black/red_tinged/clay trigger immediate alerts.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a bowel record by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const bowelRecords = pgTable(
  'bowel_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this record is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Bristol Stool Scale type 1-7 */
    bristolType: integer('bristol_type').notNull(),
    /** Stool colour: brown, dark_brown, light_brown, yellow, green, black, red_tinged, clay, other */
    colour: text('colour').notNull(),
    /** Whether blood was observed */
    bloodPresent: boolean('blood_present').notNull().default(false),
    /** Whether mucus was observed */
    mucusPresent: boolean('mucus_present').notNull().default(false),
    /** Whether a laxative was given */
    laxativeGiven: boolean('laxative_given').notNull().default(false),
    /** Name of laxative administered (if any) */
    laxativeName: text('laxative_name'),
    /** Additional observations */
    notes: text('notes'),
    /** Staff member who recorded the entry */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised author name for display */
    recordedByName: text('recorded_by_name'),
    /** When the bowel movement occurred */
    recordedAt: timestamp('recorded_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('bowel_records_organisation_id_idx').on(t.organisationId),
    /** List bowel records for a specific person */
    index('bowel_records_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Time-based queries for constipation/diarrhoea detection */
    index('bowel_records_organisation_person_recorded_at_idx').on(
      t.organisationId,
      t.personId,
      t.recordedAt,
    ),
  ],
);

export type BowelRecord = typeof bowelRecords.$inferSelect;
export type NewBowelRecord = typeof bowelRecords.$inferInsert;

// ---------------------------------------------------------------------------
// Sleep Checks — night-time monitoring
// ---------------------------------------------------------------------------

/**
 * Sleep Checks — periodic night-time monitoring records.
 *
 * Records check-time status (asleep/awake/restless/out_of_bed),
 * position (left/right/back/sitting), repositioning, night wandering,
 * bed rails status, and call bell check.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a sleep check by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const sleepChecks = pgTable(
  'sleep_checks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this check is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** When the check was performed */
    checkTime: timestamp('check_time').notNull(),
    /** Status observed: asleep, awake, restless, out_of_bed */
    status: text('status').notNull(),
    /** Position observed: left, right, back, sitting */
    position: text('position').notNull(),
    /** Whether the person was repositioned during this check */
    repositioned: boolean('repositioned').notNull().default(false),
    /** Whether night wandering was observed */
    nightWandering: boolean('night_wandering').notNull().default(false),
    /** Bed rails status: up, down, not_applicable */
    bedRails: text('bed_rails').notNull(),
    /** Whether the call bell was checked and within reach */
    callBellChecked: boolean('call_bell_checked').notNull().default(false),
    /** Additional observations */
    notes: text('notes'),
    /** Staff member who recorded the check */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised author name for display */
    recordedByName: text('recorded_by_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('sleep_checks_organisation_id_idx').on(t.organisationId),
    /** List sleep checks for a specific person */
    index('sleep_checks_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Time-based queries for night summary */
    index('sleep_checks_organisation_person_check_time_idx').on(
      t.organisationId,
      t.personId,
      t.checkTime,
    ),
  ],
);

export type SleepCheck = typeof sleepChecks.$inferSelect;
export type NewSleepCheck = typeof sleepChecks.$inferInsert;

// ---------------------------------------------------------------------------
// Pain Assessments — NRS, Abbey, and PAINAD scales
// ---------------------------------------------------------------------------

/**
 * Pain Assessments — multi-tool pain assessment records.
 *
 * Supports three validated pain assessment tools:
 * - NRS (Numerical Rating Scale): 0-10 self-report
 * - Abbey Pain Scale: for non-verbal patients (0-18, six domains scored 0-3)
 * - PAINAD: for dementia patients (0-10, five domains scored 0-2)
 *
 * Each assessment records the tool used, location, pain type, individual
 * domain scores (as JSONB for Abbey/PAINAD), and calculated total score.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a pain assessment by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const painAssessments = pgTable(
  'pain_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this assessment is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Assessment tool used: nrs, abbey, painad */
    toolUsed: text('tool_used').notNull(),
    /** NRS score (0-10), only populated when toolUsed = 'nrs' */
    nrsScore: integer('nrs_score'),
    /** Body location of pain */
    location: text('location'),
    /** Pain type: sharp, dull, aching, burning, throbbing */
    painType: text('pain_type'),
    /** Abbey Pain Scale domain scores (JSONB), only for toolUsed = 'abbey' */
    abbeyScores: jsonb('abbey_scores'),
    /** PAINAD domain scores (JSONB), only for toolUsed = 'painad' */
    painadScores: jsonb('painad_scores'),
    /** Calculated total score from the chosen tool */
    totalScore: integer('total_score').notNull(),
    /** Additional observations */
    notes: text('notes'),
    /** Staff member who recorded the assessment */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised author name for display */
    recordedByName: text('recorded_by_name'),
    /** When the assessment was performed */
    recordedAt: timestamp('recorded_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('pain_assessments_organisation_id_idx').on(t.organisationId),
    /** List pain assessments for a specific person */
    index('pain_assessments_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Time-based queries for trend analysis */
    index('pain_assessments_organisation_person_recorded_at_idx').on(
      t.organisationId,
      t.personId,
      t.recordedAt,
    ),
    /** Filter by tool used */
    index('pain_assessments_organisation_person_tool_idx').on(
      t.organisationId,
      t.personId,
      t.toolUsed,
    ),
  ],
);

export type PainAssessment = typeof painAssessments.$inferSelect;
export type NewPainAssessment = typeof painAssessments.$inferInsert;
