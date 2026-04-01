import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
  numeric,
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
 * Relations are defined in ./relations.ts to avoid circular imports.
 */

/**
 * Employment history entry shape stored in the employmentHistory JSONB array.
 */
export type EmploymentHistoryEntry = {
  id: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  contractType: string;
  weeklyHours: number | null;
  notes: string | null;
};

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
    firstName: text('first_name'),
    lastName: text('last_name'),
    /** Job role / position title */
    jobTitle: text('job_title').notNull().default('Care Worker'),
    /** Contract type: full_time | part_time | zero_hours | agency | bank */
    contractType: text('contract_type').notNull().default('full_time'),
    /** Contracted weekly hours (e.g. 37.5) */
    weeklyHours: numeric('weekly_hours', { precision: 5, scale: 2 }),
    /** Employment start date (ISO string YYYY-MM-DD) */
    startDate: text('start_date'),
    /** Employment end date (ISO string YYYY-MM-DD) — set on termination */
    endDate: text('end_date'),
    /** National Insurance number — sensitive, nullable */
    niNumber: text('ni_number'),
    /** Emergency contact — name */
    emergencyContactName: text('emergency_contact_name'),
    /** Emergency contact — phone */
    emergencyContactPhone: text('emergency_contact_phone'),
    /** Emergency contact — relationship */
    emergencyContactRelation: text('emergency_contact_relation'),
    /** Staff email (may differ from user account email) */
    email: text('email'),
    /** Staff phone number */
    phone: text('phone'),
    /** Lifecycle: active | suspended | on_leave | terminated */
    status: text('status').notNull().default('active'),
    /** JSONB array of past employment history entries within this org */
    employmentHistory: jsonb('employment_history')
      .$type<EmploymentHistoryEntry[]>()
      .notNull()
      .default([]),
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
    /** Full-text name search scoped to an org */
    index('staff_profiles_organisation_name_idx').on(
      t.organisationId,
      t.fullName,
    ),
  ],
);

export type StaffProfile = typeof staffProfiles.$inferSelect;
export type NewStaffProfile = typeof staffProfiles.$inferInsert;
