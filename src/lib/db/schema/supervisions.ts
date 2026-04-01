import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { staffProfiles } from './staff-profiles';

/**
 * Supervisions — supervision sessions and appraisal records per staff member.
 *
 * Tracks scheduled and completed supervision sessions with structured templates:
 * workload discussion, wellbeing check, development goals, concerns raised, and
 * actions agreed (with assignee and deadline tracking).
 *
 * Also supports annual/bi-annual appraisal cycles linked to development goals.
 *
 * Alert rules:
 * - AMBER: scheduled supervision within 7 days
 * - RED:   supervision is overdue (past scheduled date without completion)
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a supervision by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */

/**
 * Development goal entry stored in the developmentGoals JSONB array.
 */
export type DevelopmentGoal = {
  id: string;
  goal: string;
  targetDate: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  notes: string | null;
};

/**
 * Action agreed entry stored in the actionsAgreed JSONB array.
 */
export type ActionAgreed = {
  id: string;
  action: string;
  assigneeId: string | null;
  assigneeName: string | null;
  deadline: string | null;
  completed: boolean;
};

export const supervisions = pgTable(
  'supervisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The staff member being supervised */
    staffProfileId: uuid('staff_profile_id')
      .notNull()
      .references(() => staffProfiles.id, { onDelete: 'cascade' }),
    /** The supervisor conducting the session (staff profile ID) */
    supervisorId: uuid('supervisor_id')
      .notNull()
      .references(() => staffProfiles.id, { onDelete: 'cascade' }),
    /** Scheduled date/time for the supervision session */
    scheduledDate: timestamp('scheduled_date').notNull(),
    /** Date the session was actually completed */
    completedDate: timestamp('completed_date'),
    /** Type: supervision or appraisal */
    type: text('type').notNull().default('supervision'),
    /** Frequency: monthly, six_weekly, quarterly, annual */
    frequency: text('frequency').notNull().default('monthly'),
    /** Status: scheduled, completed, overdue, cancelled */
    status: text('status').notNull().default('scheduled'),
    /** Workload discussion notes */
    workloadDiscussion: text('workload_discussion'),
    /** Wellbeing check notes */
    wellbeingCheck: text('wellbeing_check'),
    /** JSONB array of development goals */
    developmentGoals: jsonb('development_goals')
      .$type<DevelopmentGoal[]>()
      .notNull()
      .default([]),
    /** Concerns raised during the session */
    concernsRaised: text('concerns_raised'),
    /** JSONB array of agreed actions with assignee and deadline */
    actionsAgreed: jsonb('actions_agreed')
      .$type<ActionAgreed[]>()
      .notNull()
      .default([]),
    /** Next scheduled supervision date */
    nextDueDate: timestamp('next_due_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('supervisions_organisation_id_idx').on(t.organisationId),
    /** List supervisions for a specific staff member within an org */
    index('supervisions_organisation_staff_idx').on(
      t.organisationId,
      t.staffProfileId,
    ),
    /** Filter by status within an org (overdue queries) */
    index('supervisions_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
    /** Scheduled date queries for calendar and alert engine */
    index('supervisions_organisation_scheduled_date_idx').on(
      t.organisationId,
      t.scheduledDate,
    ),
    /** Supervisor lookup within an org */
    index('supervisions_organisation_supervisor_idx').on(
      t.organisationId,
      t.supervisorId,
    ),
  ],
);

export type Supervision = typeof supervisions.$inferSelect;
export type NewSupervision = typeof supervisions.$inferInsert;
