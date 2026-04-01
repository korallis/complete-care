import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { staffProfiles } from './staff-profiles';

// ---------------------------------------------------------------------------
// JSONB types
// ---------------------------------------------------------------------------

/**
 * Commissioner entry — funding body for the care package.
 */
export type Commissioner = {
  id: string;
  name: string;
  type: 'local_authority' | 'nhs_chc' | 'private' | 'other';
  reference?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

/**
 * Client environment notes — stored as JSONB on the care package.
 * keySafeCode is sensitive and should only be displayed to assigned carers.
 */
export type EnvironmentNotes = {
  keySafeCode?: string;
  entryInstructions?: string;
  hazards?: string;
  parking?: string;
};

/**
 * Task within a visit type's task list.
 */
export type VisitTask = {
  id: string;
  description: string;
  required: boolean;
  order: number;
};

/**
 * Custom recurrence pattern for visit types.
 * Used when frequency is 'custom'.
 */
export type CustomPattern = {
  /** Which days of the week (0=Sun, 1=Mon, ..., 6=Sat) */
  daysOfWeek: number[];
  /** Week pattern: 'every' | 'week_a' | 'week_b' for alternating fortnightly */
  weekPattern: 'every' | 'week_a' | 'week_b';
};

// ---------------------------------------------------------------------------
// care_packages table
// ---------------------------------------------------------------------------

/**
 * Care Packages — domiciliary care package definitions for clients.
 *
 * A care package defines the overall care arrangement for a client,
 * including funding, environment details, and review scheduling.
 * Visit types are defined separately and linked to the package.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 */
export const carePackages = pgTable(
  'care_packages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The client this care package belongs to */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Package lifecycle: active | suspended | ended */
    status: text('status').notNull().default('active'),
    /** Start date of the care package (ISO YYYY-MM-DD) */
    startDate: text('start_date').notNull(),
    /** End date — null for ongoing packages (ISO YYYY-MM-DD) */
    endDate: text('end_date'),
    /** Next review date (ISO YYYY-MM-DD) */
    reviewDate: text('review_date'),
    /** Primary funding type */
    fundingType: text('funding_type').notNull().default('private'),
    /** JSONB array of Commissioner objects */
    commissioners: jsonb('commissioners').$type<Commissioner[]>().notNull().default([]),
    /** JSONB environment notes (keySafeCode, entryInstructions, hazards, parking) */
    environmentNotes: jsonb('environment_notes').$type<EnvironmentNotes>().notNull().default({}),
    /** Weekly allocated hours (total across all visit types) */
    weeklyHours: text('weekly_hours'),
    /** Free-text notes about the package */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    /** Soft delete */
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('care_packages_organisation_id_idx').on(t.organisationId),
    /** Look up package by client within an org */
    index('care_packages_organisation_person_idx').on(t.organisationId, t.personId),
    /** Filter by status */
    index('care_packages_organisation_status_idx').on(t.organisationId, t.status),
    /** Review date queries */
    index('care_packages_organisation_review_idx').on(t.organisationId, t.reviewDate),
  ],
);

export type CarePackage = typeof carePackages.$inferSelect;
export type NewCarePackage = typeof carePackages.$inferInsert;

// ---------------------------------------------------------------------------
// visit_types table
// ---------------------------------------------------------------------------

/**
 * Visit Types — define the different types of visits within a care package.
 *
 * Each visit type has a name (e.g. morning, lunch, tea, bedtime),
 * a time window, duration, task list, and recurrence pattern.
 */
export const visitTypes = pgTable(
  'visit_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Parent care package */
    carePackageId: uuid('care_package_id')
      .notNull()
      .references(() => carePackages.id, { onDelete: 'cascade' }),
    /** Tenant scope */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Visit type name: morning | lunch | tea | bedtime | custom */
    name: text('name').notNull(),
    /** Duration in minutes */
    duration: integer('duration').notNull().default(30),
    /** Earliest start time for this visit (HH:MM 24h) */
    timeWindowStart: text('time_window_start').notNull(),
    /** Latest start time for this visit (HH:MM 24h) */
    timeWindowEnd: text('time_window_end').notNull(),
    /** JSONB array of VisitTask objects */
    taskList: jsonb('task_list').$type<VisitTask[]>().notNull().default([]),
    /** Recurrence: daily | weekdays | custom */
    frequency: text('frequency').notNull().default('daily'),
    /** JSONB custom recurrence pattern (used when frequency is 'custom') */
    customPattern: jsonb('custom_pattern').$type<CustomPattern>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Look up visit types by care package */
    index('visit_types_care_package_id_idx').on(t.carePackageId),
    /** Tenant isolation */
    index('visit_types_organisation_id_idx').on(t.organisationId),
  ],
);

export type VisitType = typeof visitTypes.$inferSelect;
export type NewVisitType = typeof visitTypes.$inferInsert;

// ---------------------------------------------------------------------------
// scheduled_visits table
// ---------------------------------------------------------------------------

/**
 * Scheduled Visits — individual visit instances generated from visit types
 * or created ad-hoc.
 *
 * These are the actual visits that appear on the schedule.
 * Staff can be assigned, and visit status tracked through completion.
 */
export const scheduledVisits = pgTable(
  'scheduled_visits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** The visit type this was generated from (null for pure ad-hoc) */
    visitTypeId: uuid('visit_type_id').references(() => visitTypes.id, {
      onDelete: 'set null',
    }),
    /** Parent care package */
    carePackageId: uuid('care_package_id')
      .notNull()
      .references(() => carePackages.id, { onDelete: 'cascade' }),
    /** The client being visited */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Tenant scope */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Assigned carer (null = unassigned) */
    assignedStaffId: uuid('assigned_staff_id').references(
      () => staffProfiles.id,
      { onDelete: 'set null' },
    ),
    /** Visit date (ISO YYYY-MM-DD) */
    date: text('date').notNull(),
    /** Scheduled start time (HH:MM 24h) */
    scheduledStart: text('scheduled_start').notNull(),
    /** Scheduled end time (HH:MM 24h) */
    scheduledEnd: text('scheduled_end').notNull(),
    /** Visit lifecycle: scheduled | in_progress | completed | missed | cancelled */
    status: text('status').notNull().default('scheduled'),
    /** True if this visit was inserted ad-hoc (not from recurring pattern) */
    isAdHoc: boolean('is_ad_hoc').notNull().default(false),
    /** Visit notes */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Tenant isolation */
    index('scheduled_visits_organisation_id_idx').on(t.organisationId),
    /** Schedule view by date within an org */
    index('scheduled_visits_organisation_date_idx').on(t.organisationId, t.date),
    /** Schedule for a specific person */
    index('scheduled_visits_person_date_idx').on(t.personId, t.date),
    /** Unassigned visits queue */
    index('scheduled_visits_unassigned_idx').on(
      t.organisationId,
      t.date,
      t.assignedStaffId,
    ),
    /** Staff schedule view */
    index('scheduled_visits_staff_date_idx').on(t.assignedStaffId, t.date),
    /** Care package visits */
    index('scheduled_visits_care_package_idx').on(t.carePackageId),
  ],
);

export type ScheduledVisit = typeof scheduledVisits.$inferSelect;
export type NewScheduledVisit = typeof scheduledVisits.$inferInsert;
