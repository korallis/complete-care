import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { staffProfiles } from './staff-profiles';

/**
 * Training Courses — configurable course catalogue per organisation.
 *
 * Each organisation has its own set of required training courses.
 * Default care sector courses are seeded on first use (isDefault = true).
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const trainingCourses = pgTable(
  'training_courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Course name (e.g. "Moving and Handling", "Fire Safety") */
    name: text('name').notNull(),
    /** Course category for grouping (e.g. "mandatory", "clinical", "specialist") */
    category: text('category').notNull().default('mandatory'),
    /** JSONB array of role strings this course is required for */
    requiredForRoles: jsonb('required_for_roles')
      .$type<string[]>()
      .notNull()
      .default([]),
    /** Default training provider name */
    defaultProvider: text('default_provider'),
    /** Validity period in months (how long a completion lasts before expiry) */
    validityMonths: integer('validity_months'),
    /** Whether this is a default care sector course (vs. custom org course) */
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('training_courses_organisation_id_idx').on(t.organisationId),
    /** Filter by category within an org */
    index('training_courses_organisation_category_idx').on(
      t.organisationId,
      t.category,
    ),
  ],
);

export type TrainingCourse = typeof trainingCourses.$inferSelect;
export type NewTrainingCourse = typeof trainingCourses.$inferInsert;

/**
 * Training Records — tracks completion of training courses by staff.
 *
 * Each record represents one course completion by one staff member.
 * Status is computed from completedDate + expiryDate relative to today.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const trainingRecords = pgTable(
  'training_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The staff member who completed the training */
    staffProfileId: uuid('staff_profile_id')
      .notNull()
      .references(() => staffProfiles.id, { onDelete: 'cascade' }),
    /** Reference to the course catalogue entry (nullable for ad-hoc records) */
    courseId: uuid('course_id').references(() => trainingCourses.id, {
      onDelete: 'set null',
    }),
    /** Course name (denormalised for display + supports ad-hoc courses) */
    courseName: text('course_name').notNull(),
    /** Training provider */
    provider: text('provider'),
    /** Date the training was completed (ISO date string YYYY-MM-DD) */
    completedDate: text('completed_date').notNull(),
    /** Date the certificate expires (ISO date string YYYY-MM-DD) */
    expiryDate: text('expiry_date'),
    /** URL to uploaded certificate file */
    certificateUrl: text('certificate_url'),
    /** Computed status: current | expiring_soon | expired | not_completed */
    status: text('status').notNull().default('current'),
    /** Optional notes */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('training_records_organisation_id_idx').on(t.organisationId),
    /** List records for a specific staff member within an org */
    index('training_records_organisation_staff_idx').on(
      t.organisationId,
      t.staffProfileId,
    ),
    /** Filter by status within an org (compliance queries) */
    index('training_records_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
    /** Expiry date queries for alert engine */
    index('training_records_organisation_expiry_idx').on(
      t.organisationId,
      t.expiryDate,
    ),
    /** Course-level queries (e.g. who has completed a specific course) */
    index('training_records_organisation_course_idx').on(
      t.organisationId,
      t.courseId,
    ),
  ],
);

export type TrainingRecord = typeof trainingRecords.$inferSelect;
export type NewTrainingRecord = typeof trainingRecords.$inferInsert;

/**
 * Qualifications — domain-specific qualifications (e.g. NVQ/QCF Diplomas).
 *
 * Tracks formal qualifications including "working towards" status with
 * target completion deadlines.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const qualifications = pgTable(
  'qualifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The staff member this qualification belongs to */
    staffProfileId: uuid('staff_profile_id')
      .notNull()
      .references(() => staffProfiles.id, { onDelete: 'cascade' }),
    /** Qualification name (e.g. "Health & Social Care") */
    name: text('name').notNull(),
    /** Qualification level (e.g. "Level 2", "Level 3 Diploma", "Level 5 Diploma") */
    level: text('level').notNull(),
    /** Status: completed | working_towards */
    status: text('status').notNull().default('working_towards'),
    /** Date qualification was achieved (ISO date string YYYY-MM-DD) */
    completedDate: text('completed_date'),
    /** Target completion date for working_towards (ISO date string YYYY-MM-DD) */
    targetDate: text('target_date'),
    /** Optional notes about the qualification */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('qualifications_organisation_id_idx').on(t.organisationId),
    /** List qualifications for a specific staff member within an org */
    index('qualifications_organisation_staff_idx').on(
      t.organisationId,
      t.staffProfileId,
    ),
    /** Filter by status within an org */
    index('qualifications_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
  ],
);

export type Qualification = typeof qualifications.$inferSelect;
export type NewQualification = typeof qualifications.$inferInsert;
