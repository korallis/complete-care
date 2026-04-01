import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { staffProfiles } from './staff-profiles';

/**
 * Leave Requests -- staff leave applications with approval workflow.
 *
 * Tracks the full lifecycle of leave requests from submission through
 * manager approval/denial to cancellation. Linked to staff profiles and
 * scoped to an organisation.
 *
 * Statuses:
 * - pending: awaiting manager review
 * - approved: leave granted
 * - denied: leave refused (reviewNote explains why)
 * - cancelled: withdrawn by staff or manager
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a leave request by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */

export const leaveRequests = pgTable(
  'leave_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope -- all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The staff member requesting leave */
    staffProfileId: uuid('staff_profile_id')
      .notNull()
      .references(() => staffProfiles.id, { onDelete: 'cascade' }),
    /** Leave type: annual, sick, compassionate, unpaid */
    type: text('type').notNull(),
    /** Start date (ISO YYYY-MM-DD) */
    startDate: text('start_date').notNull(),
    /** End date (ISO YYYY-MM-DD) */
    endDate: text('end_date').notNull(),
    /** Total working days of leave */
    totalDays: integer('total_days').notNull(),
    /** Reason for leave request */
    reason: text('reason'),
    /** Workflow status: pending, approved, denied, cancelled */
    status: text('status').notNull().default('pending'),
    /** Staff profile ID of the reviewer (manager) */
    reviewedById: uuid('reviewed_by_id').references(() => staffProfiles.id, {
      onDelete: 'set null',
    }),
    /** Denormalised reviewer name for display */
    reviewedByName: text('reviewed_by_name'),
    /** Timestamp of the review decision */
    reviewedAt: timestamp('reviewed_at'),
    /** Manager's note when approving/denying */
    reviewNote: text('review_note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('leave_requests_organisation_id_idx').on(t.organisationId),
    /** List leave requests for a specific staff member */
    index('leave_requests_org_staff_idx').on(
      t.organisationId,
      t.staffProfileId,
    ),
    /** Filter by status within an org (pending approvals) */
    index('leave_requests_org_status_idx').on(t.organisationId, t.status),
    /** Date range queries for calendar views */
    index('leave_requests_org_dates_idx').on(
      t.organisationId,
      t.startDate,
      t.endDate,
    ),
  ],
);

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;

/**
 * Leave Balances -- annual leave entitlement tracking per staff member per year.
 *
 * Tracks annual leave entitlement and usage. Sick days are also tracked
 * for reporting purposes. Balances are recalculated when leave is
 * approved or cancelled.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 */

export const leaveBalances = pgTable(
  'leave_balances',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope -- all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The staff member */
    staffProfileId: uuid('staff_profile_id')
      .notNull()
      .references(() => staffProfiles.id, { onDelete: 'cascade' }),
    /** Calendar year this balance applies to */
    year: integer('year').notNull(),
    /** Total annual leave entitlement in days */
    annualEntitlement: integer('annual_entitlement').notNull().default(28),
    /** Annual leave days used */
    annualUsed: integer('annual_used').notNull().default(0),
    /** Annual leave days remaining (derived: entitlement - used) */
    annualRemaining: integer('annual_remaining').notNull().default(28),
    /** Sick days taken this year */
    sickDays: integer('sick_days').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('leave_balances_organisation_id_idx').on(t.organisationId),
    /** Unique balance per staff member per year within an org */
    index('leave_balances_org_staff_year_idx').on(
      t.organisationId,
      t.staffProfileId,
      t.year,
    ),
  ],
);

export type LeaveBalance = typeof leaveBalances.$inferSelect;
export type NewLeaveBalance = typeof leaveBalances.$inferInsert;
