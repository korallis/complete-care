import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

/**
 * LAC (Looked After Children) Records — tracks legal status, placing authority,
 * social worker and IRO contact details for each child in the home.
 *
 * Legal statuses follow the Children Act 1989 / Children Act 2004:
 * - section20: Voluntary accommodation (s.20 CA 1989)
 * - section31: Care order (s.31 CA 1989)
 * - section38: Interim care order (s.38 CA 1989)
 * - epo: Emergency Protection Order (s.44 CA 1989)
 * - ico: Interim Care Order (court-granted)
 * - co: Full Care Order
 * - sgo: Special Guardianship Order
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const lacRecords = pgTable(
  'lac_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (child) this LAC record is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /**
     * Legal status of the child:
     * section20 | section31 | section38 | epo | ico | co | sgo
     */
    legalStatus: text('legal_status').notNull(),
    /** Date the current legal status took effect (ISO YYYY-MM-DD) */
    legalStatusDate: text('legal_status_date').notNull(),
    /** Local authority that placed the child */
    placingAuthority: text('placing_authority').notNull(),
    /** Assigned social worker name */
    socialWorkerName: text('social_worker_name'),
    /** Assigned social worker email */
    socialWorkerEmail: text('social_worker_email'),
    /** Assigned social worker phone */
    socialWorkerPhone: text('social_worker_phone'),
    /** Independent Reviewing Officer name */
    iroName: text('iro_name'),
    /** Independent Reviewing Officer email */
    iroEmail: text('iro_email'),
    /** Independent Reviewing Officer phone */
    iroPhone: text('iro_phone'),
    /** Date the child was admitted to the home (ISO YYYY-MM-DD) */
    admissionDate: text('admission_date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('lac_records_organisation_id_idx').on(t.organisationId),
    /** LAC records for a specific child */
    index('lac_records_org_person_idx').on(t.organisationId, t.personId),
    /** Filter by legal status */
    index('lac_records_org_status_idx').on(t.organisationId, t.legalStatus),
  ],
);

export type LacRecord = typeof lacRecords.$inferSelect;
export type NewLacRecord = typeof lacRecords.$inferInsert;

/**
 * Placement plan content shape stored in the content JSONB.
 */
export type PlacementPlanContent = {
  objectives?: string;
  arrangements?: string;
  educationPlan?: string;
  healthPlan?: string;
  contactArrangements?: string;
  notes?: string;
};

/**
 * Placement Plans — required within 5 working days of a child's admission
 * to the home (linked to the LA care plan).
 *
 * Tracks due dates, completion dates, review dates, and structured content.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const placementPlans = pgTable(
  'placement_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (child) this placement plan is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** The LAC record this placement plan is linked to */
    lacRecordId: uuid('lac_record_id')
      .notNull()
      .references(() => lacRecords.id, { onDelete: 'cascade' }),
    /** Due date for the placement plan (ISO YYYY-MM-DD) */
    dueDate: text('due_date').notNull(),
    /** Date the plan was completed (ISO YYYY-MM-DD) */
    completedDate: text('completed_date'),
    /** Structured plan content */
    content: jsonb('content').$type<PlacementPlanContent>().notNull().default({}),
    /** Plan status: pending | draft | completed | overdue */
    status: text('status').notNull().default('pending'),
    /** Next review date (ISO YYYY-MM-DD) */
    reviewDate: text('review_date'),
    /** User who last reviewed the plan */
    reviewedById: uuid('reviewed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('placement_plans_organisation_id_idx').on(t.organisationId),
    /** Plans for a specific child */
    index('placement_plans_org_person_idx').on(t.organisationId, t.personId),
    /** Plans linked to a LAC record */
    index('placement_plans_org_lac_idx').on(t.organisationId, t.lacRecordId),
    /** Filter by status for overdue tracking */
    index('placement_plans_org_status_idx').on(t.organisationId, t.status),
  ],
);

export type PlacementPlan = typeof placementPlans.$inferSelect;
export type NewPlacementPlan = typeof placementPlans.$inferInsert;

/**
 * LAC Status Changes — audit trail of legal status transitions.
 *
 * Records every change to a child's legal status with the reason,
 * who made the change, and when. Provides a complete history.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const lacStatusChanges = pgTable(
  'lac_status_changes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The LAC record this status change belongs to */
    lacRecordId: uuid('lac_record_id')
      .notNull()
      .references(() => lacRecords.id, { onDelete: 'cascade' }),
    /** Previous legal status */
    previousStatus: text('previous_status').notNull(),
    /** New legal status */
    newStatus: text('new_status').notNull(),
    /** Date the status changed (ISO YYYY-MM-DD) */
    changedDate: text('changed_date').notNull(),
    /** Reason for the status change */
    reason: text('reason'),
    /** User who made the change */
    changedById: uuid('changed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Name of the user who made the change (denormalized for audit trail) */
    changedByName: text('changed_by_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('lac_status_changes_organisation_id_idx').on(t.organisationId),
    /** Status changes for a specific LAC record */
    index('lac_status_changes_org_lac_idx').on(
      t.organisationId,
      t.lacRecordId,
    ),
  ],
);

export type LacStatusChange = typeof lacStatusChanges.$inferSelect;
export type NewLacStatusChange = typeof lacStatusChanges.$inferInsert;
