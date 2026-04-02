import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

// ---------------------------------------------------------------------------
// hospital_admissions table
// ---------------------------------------------------------------------------

/**
 * Hospital Admissions -- tracks when a client is admitted to hospital.
 *
 * When a client is admitted, their scheduled visits should be suspended.
 * On discharge, visits can be resumed with optional discharge planning notes.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 */
export const hospitalAdmissions = pgTable(
  'hospital_admissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope -- all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The client who has been admitted */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Date of admission (ISO YYYY-MM-DD) */
    admittedDate: text('admitted_date').notNull(),
    /** Hospital name */
    hospital: text('hospital').notNull(),
    /** Ward name/number */
    ward: text('ward'),
    /** Expected discharge date (ISO YYYY-MM-DD) */
    expectedDischarge: text('expected_discharge'),
    /** Actual discharge date (ISO YYYY-MM-DD) */
    dischargedDate: text('discharged_date'),
    /** Admission lifecycle: admitted | discharged */
    status: text('status').notNull().default('admitted'),
    /** Reason for admission */
    reason: text('reason'),
    /** Discharge planning / follow-up notes */
    notes: text('notes'),
    /** User who recorded the admission */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** User who recorded the discharge */
    dischargedById: uuid('discharged_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('hospital_admissions_organisation_id_idx').on(t.organisationId),
    /** Look up admissions by person within an org */
    index('hospital_admissions_org_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter active admissions */
    index('hospital_admissions_org_status_idx').on(
      t.organisationId,
      t.status,
    ),
  ],
);

export type HospitalAdmission = typeof hospitalAdmissions.$inferSelect;
export type NewHospitalAdmission = typeof hospitalAdmissions.$inferInsert;

// ---------------------------------------------------------------------------
// visit_cancellations table
// ---------------------------------------------------------------------------

/**
 * Visit Cancellations -- records the reason and metadata for cancelled visits.
 *
 * A separate table rather than columns on scheduled_visits, so that
 * cancellation metadata is cleanly separated and the scheduled_visits
 * table stays lean for the core scheduling queries.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 */
export const visitCancellations = pgTable(
  'visit_cancellations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The visit that was cancelled (references scheduled_visits.id) */
    visitId: uuid('visit_id').notNull(),
    /** Reason code for cancellation */
    reasonCode: text('reason_code').notNull(),
    /** Free-text additional details */
    reasonNotes: text('reason_notes'),
    /** Whether this visit should be excluded from billing */
    billingExcluded: boolean('billing_excluded').notNull().default(true),
    /** Whether the assigned carer has been notified */
    carerNotified: boolean('carer_notified').notNull().default(false),
    /** User who cancelled the visit */
    cancelledById: uuid('cancelled_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    cancelledAt: timestamp('cancelled_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    /** Tenant isolation */
    index('visit_cancellations_organisation_id_idx').on(t.organisationId),
    /** Look up cancellation by visit */
    index('visit_cancellations_visit_id_idx').on(t.visitId),
  ],
);

export type VisitCancellation = typeof visitCancellations.$inferSelect;
export type NewVisitCancellation = typeof visitCancellations.$inferInsert;
