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
 * Care Plan Section — a named content block within a care plan.
 *
 * Predefined section types map to UK care standards:
 * personal_details | health | mobility | nutrition | continence |
 * personal_care | communication | social | end_of_life | custom
 */
export type CarePlanSection = {
  /** Stable identifier for React keys and section lookup */
  id: string;
  /** Predefined type — determines icon, default title, and ordering */
  type: CarePlanSectionType;
  /** Display title (may differ from default for the type) */
  title: string;
  /** Rich text content (stored as plain text / markdown) */
  content: string;
  /** Display order within the plan */
  order: number;
};

export type CarePlanSectionType =
  | 'personal_details'
  | 'health'
  | 'mobility'
  | 'nutrition'
  | 'continence'
  | 'personal_care'
  | 'communication'
  | 'social'
  | 'end_of_life'
  | 'custom';

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
 * Approval workflow: draft → review → approved
 * Review scheduling: nextReviewDate + reviewFrequency
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
    /**
     * Approval workflow status: draft | review | approved | archived
     * - draft: being authored
     * - review: submitted for manager/senior_carer review
     * - approved: formally approved and active
     * - archived: no longer current
     */
    status: text('status').notNull().default('draft'),
    /** Version number — increments on every significant edit (save) */
    version: integer('version').notNull().default(1),
    /**
     * Care plan sections stored as JSONB.
     * Array of CarePlanSection objects ordered by `order` field.
     */
    sections: jsonb('sections').$type<CarePlanSection[]>().notNull().default([]),
    /**
     * Template used to create this plan (null = blank plan).
     * e.g., 'comprehensive' | 'personal_care' | 'health_mobility' | 'social_wellbeing'
     */
    template: text('template'),
    /**
     * Review frequency: weekly | monthly | quarterly
     * Used to calculate the next review date after each review.
     */
    reviewFrequency: text('review_frequency').default('monthly'),
    /** Next scheduled review date (ISO date string YYYY-MM-DD) */
    nextReviewDate: text('next_review_date'),
    /** Name/ID of the user who authorised/approved this plan */
    authorisedBy: text('authorised_by'),
    /** User who approved this care plan (FK) */
    approvedById: uuid('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
    /** When this care plan was approved */
    approvedAt: timestamp('approved_at'),
    /** When this plan was submitted for review */
    submittedAt: timestamp('submitted_at'),
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
    /** Review date queries for reminder engine */
    index('care_plans_organisation_review_date_idx').on(
      t.organisationId,
      t.nextReviewDate,
    ),
  ],
);

export type CarePlan = typeof carePlans.$inferSelect;
export type NewCarePlan = typeof carePlans.$inferInsert;
