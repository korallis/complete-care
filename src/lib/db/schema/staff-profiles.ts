import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Staff Profiles — employment records for care staff within an organisation.
 *
 * Links a platform user (users table) to an employment record within
 * a specific organisation. A person can be employed at multiple orgs.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a staff profile by ID requires assertBelongsToOrg() check.
 *
 * Extended columns (DBS, training, qualifications, supervision) will be
 * added in m3-staff-management.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const staffProfiles = pgTable(
  'staff_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Link to the platform user account (may be null for imported staff) */
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    fullName: text('full_name').notNull(),
    /** Job role / position title */
    jobTitle: text('job_title').notNull().default('Care Worker'),
    /** Employment type: full_time | part_time | bank | agency */
    employmentType: text('employment_type').notNull().default('full_time'),
    /** Lifecycle: active | inactive | suspended */
    status: text('status').notNull().default('active'),
    startDate: text('start_date'),
    endDate: text('end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    /** Soft delete */
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('staff_profiles_organisation_id_idx').on(t.organisationId),
    /** List staff by org + status */
    index('staff_profiles_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
    /** Look up staff by their user account within an org */
    index('staff_profiles_organisation_user_id_idx').on(
      t.organisationId,
      t.userId,
    ),
  ],
);

export type StaffProfile = typeof staffProfiles.$inferSelect;
export type NewStaffProfile = typeof staffProfiles.$inferInsert;
