import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';
import { medications } from './medications';

// ---------------------------------------------------------------------------
// Controlled Drugs Register — per-person per-drug per-strength
// VAL-EMAR-008 / VAL-EMAR-020
// ---------------------------------------------------------------------------

/**
 * CD Register — one register per person+drug+strength combination.
 * Running balance maintained via cdRegisterEntries.
 */
export const cdRegisters = pgTable(
  'cd_registers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    /** Drug name (denormalised for register page header) */
    name: text('drug_name').notNull(),
    /** Strength (denormalised for register page header) */
    strength: text('strength').notNull(),
    /** Form: tablet | capsule | liquid | patch | ampoule | other */
    form: text('form').notNull(),
    /** CD Schedule: 2 | 3 | 4 | 5 */
    schedule: text('schedule').notNull(),
    /** Current running balance */
    currentBalance: integer('current_balance').notNull().default(0),
    /** Status: active | closed */
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('cd_registers_org_person_idx').on(t.organisationId, t.personId),
    index('cd_registers_org_med_idx').on(t.organisationId, t.medicationId),
  ],
);

/**
 * CD Register entries — every transaction in the CD register.
 * Each entry records: receipt, administration, disposal, destruction, adjustment.
 * Dual-witness is mandatory for all CD operations (VAL-EMAR-020).
 */
export const cdRegisterEntries = pgTable(
  'cd_register_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    registerId: uuid('register_id')
      .notNull()
      .references(() => cdRegisters.id, { onDelete: 'cascade' }),
    /** Transaction type: receipt | administration | disposal | destruction | adjustment | return_to_pharmacy */
    transactionType: text('transaction_type').notNull(),
    /** Quantity received (positive for receipt, negative for disposal etc) */
    quantityIn: integer('quantity_in').notNull().default(0),
    /** Quantity out */
    quantityOut: integer('quantity_out').notNull().default(0),
    /** Running balance after this transaction */
    balanceAfter: integer('balance_after').notNull(),
    /** Date and time of the transaction */
    transactionDate: timestamp('transaction_date').notNull(),
    /** Primary staff member performing the operation */
    performedBy: uuid('performed_by')
      .notNull()
      .references(() => users.id),
    /** Second witness — MANDATORY for all CD operations */
    witnessedBy: uuid('witnessed_by')
      .notNull()
      .references(() => users.id),
    /** Source of receipt (pharmacy name) or destination of disposal */
    sourceOrDestination: text('source_or_destination'),
    /** Batch number for traceability */
    batchNumber: text('batch_number'),
    /** For administration: link to the person receiving */
    administeredToPersonId: uuid('administered_to_person_id'),
    /** Disposal/destruction method */
    disposalMethod: text('disposal_method'),
    /** Notes */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('cd_entries_register_idx').on(t.registerId),
    index('cd_entries_org_date_idx').on(
      t.organisationId,
      t.transactionDate,
    ),
    index('cd_entries_performed_by_idx').on(t.performedBy),
    index('cd_entries_witnessed_by_idx').on(t.witnessedBy),
  ],
);

// ---------------------------------------------------------------------------
// Transdermal Patch Tracking — VAL-EMAR-020
// ---------------------------------------------------------------------------

/**
 * Transdermal patch application and removal tracking.
 * Tracks application site, rotation schedule, disposal witnessing.
 */
export const transdermalPatches = pgTable(
  'transdermal_patches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    registerId: uuid('register_id')
      .notNull()
      .references(() => cdRegisters.id, { onDelete: 'cascade' }),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Application site: left_upper_arm | right_upper_arm | left_chest | right_chest | left_back | right_back | left_thigh | right_thigh | other */
    applicationSite: text('application_site').notNull(),
    /** Custom site description when applicationSite is 'other' */
    applicationSiteDetail: text('application_site_detail'),
    /** Date/time patch was applied */
    appliedAt: timestamp('applied_at').notNull(),
    /** Date/time patch was removed (null = still in place) */
    removedAt: timestamp('removed_at'),
    /** Scheduled removal date/time */
    scheduledRemovalAt: timestamp('scheduled_removal_at'),
    /** Staff who applied the patch */
    appliedBy: uuid('applied_by')
      .notNull()
      .references(() => users.id),
    /** Witness for application */
    applicationWitnessedBy: uuid('application_witnessed_by')
      .notNull()
      .references(() => users.id),
    /** Staff who removed the patch */
    removedBy: uuid('removed_by').references(() => users.id),
    /** Witness for removal/disposal */
    removalWitnessedBy: uuid('removal_witnessed_by').references(() => users.id),
    /** Disposal method: folded_and_flushed | returned_to_pharmacy | clinical_waste | other */
    disposalMethod: text('disposal_method'),
    /** Disposal witnessed */
    disposalWitnessed: boolean('disposal_witnessed').notNull().default(false),
    /** Previous application sites (JSON array for rotation tracking) */
    rotationHistory: jsonb('rotation_history'),
    /** Status: active | removed | overdue */
    status: text('status').notNull().default('active'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('patches_org_person_idx').on(t.organisationId, t.personId),
    index('patches_register_idx').on(t.registerId),
    index('patches_status_idx').on(t.organisationId, t.status),
  ],
);

// ---------------------------------------------------------------------------
// Stock Reconciliation — Weekly check workflow (VAL-EMAR-008)
// ---------------------------------------------------------------------------

/**
 * CD stock reconciliation records.
 * Weekly reconciliation comparing running balance to physical count.
 */
export const cdStockReconciliations = pgTable(
  'cd_stock_reconciliations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    registerId: uuid('register_id')
      .notNull()
      .references(() => cdRegisters.id, { onDelete: 'cascade' }),
    /** Expected balance from register */
    expectedBalance: integer('expected_balance').notNull(),
    /** Actual physical count */
    actualCount: integer('actual_count').notNull(),
    /** Whether there is a discrepancy */
    hasDiscrepancy: boolean('has_discrepancy').notNull().default(false),
    /** Discrepancy amount (actual - expected) */
    discrepancyAmount: integer('discrepancy_amount').notNull().default(0),
    /** Reconciliation date */
    reconciliationDate: timestamp('reconciliation_date').notNull(),
    /** Staff who performed the count */
    performedBy: uuid('performed_by')
      .notNull()
      .references(() => users.id),
    /** Witness for the count */
    witnessedBy: uuid('witnessed_by')
      .notNull()
      .references(() => users.id),
    /** Investigation notes — mandatory when discrepancy exists */
    investigationNotes: text('investigation_notes'),
    /** Flag for CDAO notification */
    cdaoNotified: boolean('cdao_notified').notNull().default(false),
    /** CDAO notification date */
    cdaoNotifiedDate: timestamp('cdao_notified_date'),
    /** CDAO user who was notified */
    cdaoUserId: uuid('cdao_user_id').references(() => users.id),
    /** Outcome: resolved | under_investigation | escalated */
    outcome: text('outcome'),
    /** Resolution notes */
    resolutionNotes: text('resolution_notes'),
    /** Status: completed | pending_investigation | resolved */
    status: text('status').notNull().default('completed'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('cd_reconciliations_org_register_idx').on(
      t.organisationId,
      t.registerId,
    ),
    index('cd_reconciliations_date_idx').on(
      t.organisationId,
      t.reconciliationDate,
    ),
    index('cd_reconciliations_discrepancy_idx').on(
      t.organisationId,
      t.hasDiscrepancy,
    ),
  ],
);

export type CdRegister = typeof cdRegisters.$inferSelect;
export type NewCdRegister = typeof cdRegisters.$inferInsert;
export type CdRegisterEntry = typeof cdRegisterEntries.$inferSelect;
export type NewCdRegisterEntry = typeof cdRegisterEntries.$inferInsert;
export type TransdermalPatch = typeof transdermalPatches.$inferSelect;
export type NewTransdermalPatch = typeof transdermalPatches.$inferInsert;
export type CdStockReconciliation = typeof cdStockReconciliations.$inferSelect;
export type NewCdStockReconciliation = typeof cdStockReconciliations.$inferInsert;
