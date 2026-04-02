import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  time,
  integer,
  boolean,
  jsonb,
  real,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Staff availability — records when a staff member is available or unavailable.
 */
export const staffAvailability = pgTable(
  'staff_availability',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Day of the week: monday | tuesday | wednesday | thursday | friday | saturday | sunday */
    dayOfWeek: text('day_of_week').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    /** available | unavailable | preferred */
    type: text('type').notNull().default('available'),
    /** Effective from date (null = always) */
    effectiveFrom: date('effective_from'),
    /** Effective until date (null = indefinite) */
    effectiveUntil: date('effective_until'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('staff_availability_org_idx').on(t.organisationId),
    index('staff_availability_staff_idx').on(t.staffId),
  ],
);

/**
 * Staff qualifications — tracks qualifications and skills per staff member.
 */
export const staffQualifications = pgTable(
  'staff_qualifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Qualification name, e.g. "NVQ Level 3", "Manual Handling", "Medication Administration" */
    qualification: text('qualification').notNull(),
    /** Date qualification was obtained */
    obtainedDate: date('obtained_date'),
    /** Expiry date (null = no expiry) */
    expiryDate: date('expiry_date'),
    /** active | expired | pending */
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('staff_qualifications_org_idx').on(t.organisationId),
    index('staff_qualifications_staff_idx').on(t.staffId),
  ],
);

/**
 * Scheduling rules — configurable constraints for auto-scheduling.
 */
export const schedulingRules = pgTable(
  'scheduling_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Rule name */
    name: text('name').notNull(),
    /** hard | soft */
    constraintType: text('constraint_type').notNull(),
    /** qualification | availability | min_staffing | continuity | geography | cost | max_hours */
    ruleType: text('rule_type').notNull(),
    /** Rule-specific configuration (e.g. min staff count, required qualifications) */
    config: jsonb('config').notNull().default({}),
    /** Weight for soft constraints (0-100). Ignored for hard constraints. */
    weight: integer('weight').notNull().default(50),
    enabled: boolean('enabled').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('scheduling_rules_org_idx').on(t.organisationId)],
);

/**
 * Schedule runs — records of auto-scheduling engine executions.
 */
export const scheduleRuns = pgTable(
  'schedule_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Who triggered the run */
    triggeredBy: uuid('triggered_by')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    /** draft | approved | rejected */
    status: text('status').notNull().default('draft'),
    /** Date range the schedule covers */
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    /** Scored trade-off summary from the engine */
    summary: jsonb('summary'),
    /** Overall fitness score (0-100) */
    score: real('score'),
    /** Number of unfilled slots */
    unfilledSlots: integer('unfilled_slots').notNull().default(0),
    /** Total slots in the schedule */
    totalSlots: integer('total_slots').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('schedule_runs_org_idx').on(t.organisationId),
    index('schedule_runs_status_idx').on(t.status),
  ],
);

/**
 * Schedule assignments — individual shift assignments produced by a schedule run.
 */
export const scheduleAssignments = pgTable(
  'schedule_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    scheduleRunId: uuid('schedule_run_id')
      .notNull()
      .references(() => scheduleRuns.id, { onDelete: 'cascade' }),
    /** Assigned staff member (null = unfilled gap) */
    staffId: uuid('staff_id').references(() => users.id, { onDelete: 'set null' }),
    /** The shift date */
    shiftDate: date('shift_date').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
    /** Role required for this slot */
    requiredRole: text('required_role'),
    /** Required qualifications for this slot */
    requiredQualifications: text('required_qualifications').array().default([]),
    /** Location/site identifier */
    locationId: text('location_id'),
    /** assigned | unfilled | manually_overridden */
    status: text('status').notNull().default('assigned'),
    /** Suitability score for this assignment (0-100) */
    suitabilityScore: real('suitability_score'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('schedule_assignments_org_idx').on(t.organisationId),
    index('schedule_assignments_run_idx').on(t.scheduleRunId),
    index('schedule_assignments_staff_idx').on(t.staffId),
    index('schedule_assignments_date_idx').on(t.shiftDate),
  ],
);

export type StaffAvailability = typeof staffAvailability.$inferSelect;
export type NewStaffAvailability = typeof staffAvailability.$inferInsert;
export type StaffQualification = typeof staffQualifications.$inferSelect;
export type NewStaffQualification = typeof staffQualifications.$inferInsert;
export type SchedulingRule = typeof schedulingRules.$inferSelect;
export type NewSchedulingRule = typeof schedulingRules.$inferInsert;
export type ScheduleRun = typeof scheduleRuns.$inferSelect;
export type NewScheduleRun = typeof scheduleRuns.$inferInsert;
export type ScheduleAssignment = typeof scheduleAssignments.$inferSelect;
export type NewScheduleAssignment = typeof scheduleAssignments.$inferInsert;
