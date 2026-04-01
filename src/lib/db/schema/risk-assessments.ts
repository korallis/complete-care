import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

/**
 * Risk Assessment Scores — stored as JSONB.
 *
 * Each entry maps a question ID to the selected score value.
 * The scoring engine sums all values and maps to a risk level
 * using the template's threshold configuration.
 */
export type RiskAssessmentScores = Record<string, number>;

/**
 * Risk level derived from the total score against template thresholds.
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Risk Assessments — scored clinical assessments for persons.
 *
 * Each assessment is created from a template (falls, Waterlow, MUST, etc.)
 * and contains scored responses that auto-calculate a risk level.
 *
 * Assessments are versioned — completing a new assessment for the same
 * template creates a new record with an incremented version number.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a risk assessment by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const riskAssessments = pgTable(
  'risk_assessments',
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
    /** Template identifier: falls | waterlow | must | moving_handling | fire_peep | medication | choking */
    templateId: text('template_id').notNull(),
    /** JSONB map of questionId → score value */
    scores: jsonb('scores').$type<RiskAssessmentScores>().notNull().default({}),
    /** Total calculated score */
    totalScore: integer('total_score').notNull().default(0),
    /** Auto-calculated risk level: low | medium | high | critical */
    riskLevel: text('risk_level').notNull().default('low'),
    /** Assessment status: draft | completed */
    status: text('status').notNull().default('draft'),
    /** Version number — increments for each new assessment of the same template for a person */
    version: integer('version').notNull().default(1),
    /** Staff member who completed the assessment */
    completedById: uuid('completed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised author name for display */
    completedByName: text('completed_by_name'),
    /** When the assessment was completed */
    completedAt: timestamp('completed_at'),
    /** Review frequency: weekly | monthly | quarterly */
    reviewFrequency: text('review_frequency').default('monthly'),
    /** Next scheduled review date (ISO date string YYYY-MM-DD) */
    reviewDate: text('review_date'),
    /** Optional notes / clinical observations */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('risk_assessments_organisation_id_idx').on(t.organisationId),
    /** List assessments for a specific person */
    index('risk_assessments_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter by template within an org */
    index('risk_assessments_organisation_template_idx').on(
      t.organisationId,
      t.templateId,
    ),
    /** Filter by risk level within an org (alert queries) */
    index('risk_assessments_organisation_risk_level_idx').on(
      t.organisationId,
      t.riskLevel,
    ),
    /** Review date queries for reminder engine */
    index('risk_assessments_organisation_review_date_idx').on(
      t.organisationId,
      t.reviewDate,
    ),
    /** Filter by status within an org */
    index('risk_assessments_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
  ],
);

export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type NewRiskAssessment = typeof riskAssessments.$inferInsert;
