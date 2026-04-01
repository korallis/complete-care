import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { staffProfiles } from './staff-profiles';

/**
 * DBS Checks — Disclosure and Barring Service certificate records per staff member.
 *
 * Tracks DBS certificates, their levels, expiry, and Update Service subscription.
 * Multiple records per staff member form a full DBS history.
 *
 * Expiry alert rules:
 * - AMBER: 30 days before recheck date
 * - RED:   7 days before (or past) recheck date
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a DBS check by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const dbsChecks = pgTable(
  'dbs_checks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The staff member this DBS check belongs to */
    staffProfileId: uuid('staff_profile_id')
      .notNull()
      .references(() => staffProfiles.id, { onDelete: 'cascade' }),
    /** DBS certificate number */
    certificateNumber: text('certificate_number').notNull(),
    /** Date the DBS certificate was issued (ISO date string YYYY-MM-DD) */
    issueDate: text('issue_date').notNull(),
    /** DBS check level: basic | standard | enhanced | enhanced_barred */
    level: text('level').notNull(),
    /** Whether the staff member is subscribed to the DBS Update Service */
    updateServiceSubscribed: boolean('update_service_subscribed')
      .notNull()
      .default(false),
    /** Next recheck date (ISO date string YYYY-MM-DD) */
    recheckDate: text('recheck_date').notNull(),
    /** Computed status: current | expiring_soon | expired */
    status: text('status').notNull().default('current'),
    /** Optional notes about this DBS check */
    notes: text('notes'),
    /** ID of the staff member who verified this DBS check (stored as text for flexibility) */
    verifiedById: text('verified_by_id'),
    /** Denormalised name of the verifier for display */
    verifiedByName: text('verified_by_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('dbs_checks_organisation_id_idx').on(t.organisationId),
    /** List DBS checks for a specific staff member within an org */
    index('dbs_checks_organisation_staff_idx').on(
      t.organisationId,
      t.staffProfileId,
    ),
    /** Filter by status within an org (compliance dashboard queries) */
    index('dbs_checks_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
    /** Recheck date queries for expiry alert engine */
    index('dbs_checks_organisation_recheck_date_idx').on(
      t.organisationId,
      t.recheckDate,
    ),
  ],
);

export type DbsCheck = typeof dbsChecks.$inferSelect;
export type NewDbsCheck = typeof dbsChecks.$inferInsert;
