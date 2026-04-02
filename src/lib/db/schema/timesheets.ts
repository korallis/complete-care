import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  time,
  integer,
  real,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Timesheets — auto-generated from shift assignments, tracking actual hours worked.
 */
export const timesheets = pgTable(
  'timesheets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    staffId: uuid('staff_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** The date this timesheet entry covers */
    shiftDate: date('shift_date').notNull(),
    /** Scheduled start/end from rota */
    scheduledStart: time('scheduled_start').notNull(),
    scheduledEnd: time('scheduled_end').notNull(),
    /** Actual start/end recorded by staff */
    actualStart: time('actual_start'),
    actualEnd: time('actual_end'),
    /** Break duration in minutes */
    breakMinutes: integer('break_minutes').notNull().default(0),
    /** Total hours worked (calculated from actual times minus breaks) */
    totalHours: real('total_hours'),
    /** Overtime hours (calculated from org rules) */
    overtimeHours: real('overtime_hours').notNull().default(0),
    /** day | night | weekend | bank_holiday | overtime */
    shiftType: text('shift_type').notNull().default('day'),
    /** Hourly pay rate at time of shift */
    payRate: real('pay_rate'),
    /** draft | submitted | approved | rejected | paid */
    status: text('status').notNull().default('draft'),
    /** Optional notes from staff or manager */
    notes: text('notes'),
    /** Approved by manager */
    approvedBy: uuid('approved_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('timesheets_org_idx').on(t.organisationId),
    index('timesheets_staff_idx').on(t.staffId),
    index('timesheets_date_idx').on(t.shiftDate),
    index('timesheets_status_idx').on(t.status),
  ],
);

/**
 * Payroll exports — records of generated payroll data exports.
 */
export const payrollExports = pgTable(
  'payroll_exports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Who generated the export */
    generatedBy: uuid('generated_by')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    /** Period covered by this export */
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    /** Number of staff included */
    staffCount: integer('staff_count').notNull().default(0),
    /** Total hours across all staff */
    totalHours: real('total_hours').notNull().default(0),
    /** Total payroll amount */
    totalAmount: real('total_amount').notNull().default(0),
    /** generated | downloaded | submitted_to_payroll */
    status: text('status').notNull().default('generated'),
    /** Whether the CSV file has been downloaded */
    downloaded: boolean('downloaded').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('payroll_exports_org_idx').on(t.organisationId),
    index('payroll_exports_period_idx').on(t.periodStart, t.periodEnd),
  ],
);

export type Timesheet = typeof timesheets.$inferSelect;
export type NewTimesheet = typeof timesheets.$inferInsert;
export type PayrollExport = typeof payrollExports.$inferSelect;
export type NewPayrollExport = typeof payrollExports.$inferInsert;
