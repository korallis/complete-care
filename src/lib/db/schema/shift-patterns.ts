import {
  pgTable,
  uuid,
  text,
  timestamp,
  time,
  integer,
  boolean,
  numeric,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';

/**
 * Shift Patterns — domain-specific shift templates for rostering.
 *
 * Supports domiciliary care runs, supported-living 12-hour days/nights/sleep-ins,
 * and children's home 2-on-2-off patterns.
 *
 * Relations defined in ./relations.ts.
 */
export const shiftPatterns = pgTable(
  'shift_patterns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Human-readable name: "Early Morning Run", "Day Shift 12hr", "Night Sleep-In" */
    name: text('name').notNull(),
    /** Care domain: domiciliary_care | supported_living | childrens_home */
    careDomain: text('care_domain').notNull(),
    /** Pattern type: standard | sleep_in | waking_night | on_call */
    shiftType: text('shift_type').notNull().default('standard'),
    /** Shift start time (HH:MM:SS) */
    startTime: time('start_time').notNull(),
    /** Shift end time (HH:MM:SS) — can be next day for overnight shifts */
    endTime: time('end_time').notNull(),
    /** Whether this shift spans midnight (overnight shift) */
    isOvernight: boolean('is_overnight').notNull().default(false),
    /** Total shift duration in minutes (computed from start/end but stored for query efficiency) */
    durationMinutes: integer('duration_minutes').notNull(),
    /** Unpaid break duration in minutes */
    breakMinutes: integer('break_minutes').notNull().default(0),
    /** Paid hours (duration minus unpaid break) */
    paidMinutes: integer('paid_minutes').notNull(),
    /** Hourly pay rate multiplier (1.0 = standard, 1.5 = time-and-a-half, etc.) */
    payRateMultiplier: numeric('pay_rate_multiplier', {
      precision: 4,
      scale: 2,
    })
      .notNull()
      .default('1.00'),
    /** Sleep-in configuration (only for sleep_in shift type) */
    sleepInConfig: jsonb('sleep_in_config').$type<{
      sleepInStart: string; // HH:MM
      sleepInEnd: string; // HH:MM
      flatRate: number; // Flat rate for sleep-in period
      enhancedRateIfDisturbed: number; // Hourly rate if woken
    } | null>(),
    /** Recurrence pattern for multi-day cycles: "2on2off" | "4on4off" | "5on2off" | "custom" | null */
    rotaPattern: text('rota_pattern'),
    /** Custom recurrence config for complex patterns */
    rotaPatternConfig: jsonb('rota_pattern_config').$type<{
      daysOn: number;
      daysOff: number;
      cycleWeeks?: number;
    } | null>(),
    /** Required qualifications/competencies for this shift pattern (IDs) */
    requiredQualifications: text('required_qualifications').array().default([]),
    /** Minimum staff count for this shift pattern */
    minimumStaff: integer('minimum_staff').notNull().default(1),
    /** Colour hex for visual rota display */
    colour: text('colour').notNull().default('#3B82F6'),
    /** Whether this pattern is active and available for scheduling */
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('shift_patterns_organisation_id_idx').on(t.organisationId),
    index('shift_patterns_care_domain_idx').on(
      t.organisationId,
      t.careDomain,
    ),
  ],
);

/**
 * Rota Periods — a defined scheduling period (week, fortnight, 4-week block).
 */
export const rotaPeriods = pgTable(
  'rota_periods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Period name: "Week 14 2026", "Fortnight 7" */
    name: text('name').notNull(),
    /** Period type: week | fortnight | four_week */
    periodType: text('period_type').notNull().default('week'),
    /** Inclusive start date */
    startDate: timestamp('start_date').notNull(),
    /** Inclusive end date */
    endDate: timestamp('end_date').notNull(),
    /** Status: draft | published | confirmed | archived */
    status: text('status').notNull().default('draft'),
    /** ID of the user who confirmed/published the rota */
    confirmedBy: uuid('confirmed_by'),
    confirmedAt: timestamp('confirmed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('rota_periods_organisation_id_idx').on(t.organisationId),
    index('rota_periods_dates_idx').on(t.startDate, t.endDate),
  ],
);

/**
 * Shift Assignments — individual shift slots on the rota, linking a pattern + staff + date.
 */
export const shiftAssignments = pgTable(
  'shift_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    rotaPeriodId: uuid('rota_period_id')
      .notNull()
      .references(() => rotaPeriods.id, { onDelete: 'cascade' }),
    shiftPatternId: uuid('shift_pattern_id')
      .notNull()
      .references(() => shiftPatterns.id),
    /** The date this shift occurs */
    shiftDate: timestamp('shift_date').notNull(),
    /** Assigned staff member user ID — null means unassigned slot */
    staffId: uuid('staff_id'),
    /** Actual start time override (if different from pattern) */
    actualStartTime: time('actual_start_time'),
    /** Actual end time override (if different from pattern) */
    actualEndTime: time('actual_end_time'),
    /** Assignment status: unassigned | assigned | confirmed | completed | cancelled */
    status: text('status').notNull().default('unassigned'),
    /** Notes for coordinators */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('shift_assignments_organisation_id_idx').on(t.organisationId),
    index('shift_assignments_rota_period_id_idx').on(t.rotaPeriodId),
    index('shift_assignments_staff_id_idx').on(t.staffId),
    index('shift_assignments_date_idx').on(t.shiftDate),
  ],
);

/**
 * Conflict Overrides — when a coordinator overrides a detected conflict (double-booking).
 */
export const conflictOverrides = pgTable(
  'conflict_overrides',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The assignment that was flagged */
    shiftAssignmentId: uuid('shift_assignment_id')
      .notNull()
      .references(() => shiftAssignments.id, { onDelete: 'cascade' }),
    /** Conflict type: double_booking | skills_gap */
    conflictType: text('conflict_type').notNull(),
    /** Reason the coordinator provided for overriding */
    overrideReason: text('override_reason').notNull(),
    /** Who approved the override */
    overriddenBy: uuid('overridden_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('conflict_overrides_assignment_idx').on(t.shiftAssignmentId),
  ],
);

// Type exports
export type ShiftPattern = typeof shiftPatterns.$inferSelect;
export type NewShiftPattern = typeof shiftPatterns.$inferInsert;
export type RotaPeriod = typeof rotaPeriods.$inferSelect;
export type NewRotaPeriod = typeof rotaPeriods.$inferInsert;
export type ShiftAssignment = typeof shiftAssignments.$inferSelect;
export type NewShiftAssignment = typeof shiftAssignments.$inferInsert;
export type ConflictOverride = typeof conflictOverrides.$inferSelect;
export type NewConflictOverride = typeof conflictOverrides.$inferInsert;
