import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

// ---------------------------------------------------------------------------
// Fluid Entries — intake and output recording
// ---------------------------------------------------------------------------

/**
 * Fluid Entries — per-drink intake and output tracking.
 *
 * Records individual fluid intake (water, tea, coffee, juice, etc.) and
 * output (urine, vomit, drain, other) with volumes in millilitres.
 * Supports IDDSI consistency levels (0-4) for thickened fluids.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a fluid entry by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const fluidEntries = pgTable(
  'fluid_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this entry is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** intake or output */
    entryType: text('entry_type').notNull(),
    /** Type of fluid: water, tea, coffee, juice, milk, soup, squash, other (intake) or urine, vomit, drain, other (output) */
    fluidType: text('fluid_type').notNull(),
    /** Volume in millilitres */
    volume: integer('volume').notNull(),
    /** IDDSI consistency level for thickened fluids (0-4), nullable for regular fluids */
    iddsiLevel: integer('iddsi_level'),
    /** Characteristics for output: colour, consistency, etc. */
    characteristics: text('characteristics'),
    /** Staff member who recorded the entry */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised author name for display */
    recordedByName: text('recorded_by_name'),
    /** When the fluid was consumed/produced */
    recordedAt: timestamp('recorded_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('fluid_entries_organisation_id_idx').on(t.organisationId),
    /** List fluid entries for a specific person */
    index('fluid_entries_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter by entry type (intake/output) within an org+person */
    index('fluid_entries_organisation_person_type_idx').on(
      t.organisationId,
      t.personId,
      t.entryType,
    ),
    /** Time-based queries for 24hr totals */
    index('fluid_entries_organisation_person_recorded_at_idx').on(
      t.organisationId,
      t.personId,
      t.recordedAt,
    ),
  ],
);

export type FluidEntry = typeof fluidEntries.$inferSelect;
export type NewFluidEntry = typeof fluidEntries.$inferInsert;

// ---------------------------------------------------------------------------
// Meal Entries — food/nutrition recording
// ---------------------------------------------------------------------------

/**
 * Meal Entries — daily meal and snack tracking.
 *
 * Records meal type (breakfast/lunch/dinner/snack), description,
 * and portion consumed (all/three_quarters/half/quarter/refused).
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a meal entry by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const mealEntries = pgTable(
  'meal_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this entry is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** breakfast | lunch | dinner | snack */
    mealType: text('meal_type').notNull(),
    /** What was offered/eaten */
    description: text('description').notNull(),
    /** Portion consumed: all | three_quarters | half | quarter | refused */
    portionConsumed: text('portion_consumed').notNull(),
    /** Staff member who recorded the entry */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised author name for display */
    recordedByName: text('recorded_by_name'),
    /** When the meal occurred */
    recordedAt: timestamp('recorded_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('meal_entries_organisation_id_idx').on(t.organisationId),
    /** List meal entries for a specific person */
    index('meal_entries_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Time-based queries for daily summaries */
    index('meal_entries_organisation_person_recorded_at_idx').on(
      t.organisationId,
      t.personId,
      t.recordedAt,
    ),
  ],
);

export type MealEntry = typeof mealEntries.$inferSelect;
export type NewMealEntry = typeof mealEntries.$inferInsert;

// ---------------------------------------------------------------------------
// MUST Assessments — Malnutrition Universal Screening Tool
// ---------------------------------------------------------------------------

/**
 * MUST Assessments — Malnutrition Universal Screening Tool.
 *
 * Scored screening with three components:
 * - BMI score (0/1/2)
 * - Unplanned weight loss score (0/1/2)
 * - Acute disease effect score (0/2)
 *
 * Total score maps to risk category:
 * - 0 = low risk → routine care
 * - 1 = medium risk → observe
 * - 2+ = high risk → treat
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a MUST assessment by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const mustAssessments = pgTable(
  'must_assessments',
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
    /** BMI score: 0 (>20), 1 (18.5-20), 2 (<18.5) */
    bmiScore: integer('bmi_score').notNull(),
    /** Unplanned weight loss score: 0 (<5%), 1 (5-10%), 2 (>10%) */
    weightLossScore: integer('weight_loss_score').notNull(),
    /** Acute disease effect: 0 (no), 2 (yes - acutely ill with no nutritional intake >5 days) */
    acuteDiseaseScore: integer('acute_disease_score').notNull(),
    /** Total MUST score (sum of three components) */
    totalScore: integer('total_score').notNull(),
    /** Risk category: low | medium | high */
    riskCategory: text('risk_category').notNull(),
    /** Care pathway: routine | observe | treat */
    carePathway: text('care_pathway').notNull(),
    /** Staff member who assessed */
    assessedById: uuid('assessed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised assessor name for display */
    assessedByName: text('assessed_by_name'),
    /** Optional clinical notes */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('must_assessments_organisation_id_idx').on(t.organisationId),
    /** List assessments for a specific person */
    index('must_assessments_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter by risk category within an org */
    index('must_assessments_organisation_risk_idx').on(
      t.organisationId,
      t.riskCategory,
    ),
    /** Chronological ordering within an org+person */
    index('must_assessments_organisation_person_created_at_idx').on(
      t.organisationId,
      t.personId,
      t.createdAt,
    ),
  ],
);

export type MustAssessment = typeof mustAssessments.$inferSelect;
export type NewMustAssessment = typeof mustAssessments.$inferInsert;
