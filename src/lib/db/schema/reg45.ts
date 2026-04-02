import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Reg 45 Six-Monthly Quality Reviews — by Responsible Individual.
 * Template sections: summary of Reg 44 findings, actions taken,
 * quality of care assessment, staff development, children's progress,
 * recommendations.
 */
export const reg45Reports = pgTable(
  'reg45_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The reporting period label, e.g. "Oct 2025 – Mar 2026" */
    reportingPeriod: text('reporting_period').notNull(),
    reportingPeriodStart: timestamp('reporting_period_start').notNull(),
    reportingPeriodEnd: timestamp('reporting_period_end').notNull(),

    // Template sections
    reg44FindingsSummary: text('reg44_findings_summary'),
    actionsTaken: text('actions_taken'),
    qualityOfCareAssessment: text('quality_of_care_assessment'),
    staffDevelopment: text('staff_development'),
    childrensProgress: text('childrens_progress'),
    recommendations: text('recommendations'),

    /** Version number — incremented with each revision */
    version: integer('version').notNull().default(1),

    /** Sign-off status: draft | pending_review | signed_off | archived */
    status: text('status').notNull().default('draft'),

    /** The Responsible Individual who authored/owns this report */
    authorId: uuid('author_id').references(() => users.id, { onDelete: 'set null' }),
    /** The person who signed off on the report */
    signedOffBy: uuid('signed_off_by').references(() => users.id, { onDelete: 'set null' }),
    signedOffAt: timestamp('signed_off_at'),
    signOffNotes: text('sign_off_notes'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('reg45_reports_organisation_id_idx').on(t.organisationId),
    index('reg45_reports_status_idx').on(t.status),
    index('reg45_reports_period_idx').on(t.reportingPeriodStart, t.reportingPeriodEnd),
  ],
);

export type Reg45Report = typeof reg45Reports.$inferSelect;
export type NewReg45Report = typeof reg45Reports.$inferInsert;

/**
 * Reg 45 report versions — immutable snapshots of each version.
 */
export const reg45ReportVersions = pgTable(
  'reg45_report_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    reportId: uuid('report_id')
      .notNull()
      .references(() => reg45Reports.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    /** Full snapshot of the report content at this version */
    content: jsonb('content').notNull(),
    /** Who created this version */
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('reg45_versions_report_id_idx').on(t.reportId),
    index('reg45_versions_organisation_id_idx').on(t.organisationId),
  ],
);

export type Reg45ReportVersion = typeof reg45ReportVersions.$inferSelect;
export type NewReg45ReportVersion = typeof reg45ReportVersions.$inferInsert;
