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

/**
 * Care Plans — version-controlled care plans for persons.
 *
 * Care plans are scoped to both an organisation AND a person.
 * Accessing a care plan requires checking organisationId (not personId alone),
 * because a person ID could theoretically be guessed.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a care plan by ID requires assertBelongsToOrg() check.
 *
 * Extended columns (sections, review schedules, approval workflow) will be
 * added in m2-care-planning.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const carePlans = pgTable(
  'care_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this care plan belongs to */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** Lifecycle: draft | active | reviewed | archived */
    status: text('status').notNull().default('draft'),
    /** Version number — increments on significant edits */
    version: integer('version').notNull().default(1),
    /** Next scheduled review date */
    nextReviewDate: text('next_review_date'),
    /** Authorised by (user name / ID) */
    authorisedBy: text('authorised_by'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    /** Soft delete */
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('care_plans_organisation_id_idx').on(t.organisationId),
    /** List care plans for a specific person (always also scoped by org) */
    index('care_plans_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Status filtering within an org */
    index('care_plans_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
  ],
);

export type CarePlan = typeof carePlans.$inferSelect;
export type NewCarePlan = typeof carePlans.$inferInsert;
