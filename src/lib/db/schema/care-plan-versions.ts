import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { carePlans } from './care-plans';
import { users } from './users';
import type { CarePlanSection } from './care-plans';

/**
 * Care Plan Versions — immutable snapshots of care plans at each save.
 *
 * Every time a care plan is saved (edited), a new version row is inserted here.
 * The current state remains on the carePlans table.
 * Older versions are preserved here for history and comparison.
 *
 * These records are NEVER deleted or updated — append-only.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts.
 */
export const carePlanVersions = pgTable(
  'care_plan_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The care plan this version belongs to */
    carePlanId: uuid('care_plan_id')
      .notNull()
      .references(() => carePlans.id, { onDelete: 'cascade' }),
    /** Version number at the time of this snapshot */
    versionNumber: integer('version_number').notNull(),
    /** Care plan title at the time of this version */
    title: text('title').notNull(),
    /** Sections snapshot — full copy of the sections at this version */
    sections: jsonb('sections').$type<CarePlanSection[]>().notNull().default([]),
    /** Status at the time of this version */
    status: text('status').notNull().default('draft'),
    /** The user who saved this version (FK, nullable if user was deleted) */
    createdById: uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    /** Display name of the author at time of saving (cached for historical accuracy) */
    createdByName: text('created_by_name'),
    /** When this version was saved */
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    /** Retrieve all versions for a care plan in order */
    index('care_plan_versions_plan_idx').on(t.carePlanId, t.versionNumber),
    /** Tenant isolation query */
    index('care_plan_versions_org_idx').on(t.organisationId),
    /** Find versions by org + care plan (tenant-safe query) */
    index('care_plan_versions_org_plan_idx').on(t.organisationId, t.carePlanId),
  ],
);

export type CarePlanVersion = typeof carePlanVersions.$inferSelect;
export type NewCarePlanVersion = typeof carePlanVersions.$inferInsert;
