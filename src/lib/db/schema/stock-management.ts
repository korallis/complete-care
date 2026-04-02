import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
  boolean,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ---------------------------------------------------------------------------
// Medication Stock Management (VAL-EMAR-012)
// ---------------------------------------------------------------------------

/**
 * Medication stock levels — current inventory per medication per organisation.
 * Tracks quantities, minimum thresholds, and reorder points.
 */
export const medicationStock = pgTable(
  'medication_stock',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Name/description of the medication */
    medicationName: text('medication_name').notNull(),
    /** Standardised drug code (dm+d / SNOMED CT) */
    medicationCode: text('medication_code'),
    /** Form: tablet, capsule, liquid, cream, inhaler, injection, patch, etc. */
    form: text('form').notNull(),
    /** Strength e.g. "500mg", "10mg/5ml" */
    strength: text('strength').notNull(),
    /** Current quantity in stock */
    currentQuantity: integer('current_quantity').notNull().default(0),
    /** Minimum stock threshold — triggers low-stock alert */
    minimumThreshold: integer('minimum_threshold').notNull().default(0),
    /** Reorder point — triggers reorder request when stock falls to/below */
    reorderPoint: integer('reorder_point').notNull().default(0),
    /** Default reorder quantity */
    reorderQuantity: integer('reorder_quantity').notNull().default(0),
    /** Unit of measure: tablets, ml, doses, patches, etc. */
    unit: text('unit').notNull().default('tablets'),
    /** Storage requirements: room_temp | refrigerated | controlled_drug_cabinet */
    storageRequirement: text('storage_requirement').notNull().default('room_temp'),
    /** Whether this is a controlled drug (CD) requiring CD register entries */
    isControlledDrug: boolean('is_controlled_drug').notNull().default(false),
    /** CD schedule if applicable: schedule_2 | schedule_3 | schedule_4 | schedule_5 */
    controlledDrugSchedule: text('controlled_drug_schedule'),
    /** Pharmacy supplier name */
    pharmacySupplier: text('pharmacy_supplier'),
    /** Active status */
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('medication_stock_org_idx').on(t.organisationId),
    index('medication_stock_name_idx').on(t.organisationId, t.medicationName),
    index('medication_stock_code_idx').on(t.organisationId, t.medicationCode),
  ],
);

export type MedicationStock = typeof medicationStock.$inferSelect;
export type NewMedicationStock = typeof medicationStock.$inferInsert;

// ---------------------------------------------------------------------------
// Stock Batches — batch-level expiry tracking (VAL-EMAR-013)
// ---------------------------------------------------------------------------

/**
 * Stock batches — tracks individual batches with expiry dates.
 * Enables FEFO (first-expiry-first-out) dispensing and expiry alerts.
 */
export const stockBatches = pgTable(
  'stock_batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    medicationStockId: uuid('medication_stock_id')
      .notNull()
      .references(() => medicationStock.id, { onDelete: 'cascade' }),
    /** Manufacturer batch number */
    batchNumber: text('batch_number').notNull(),
    /** Expiry date of this batch */
    expiryDate: date('expiry_date').notNull(),
    /** Quantity remaining in this batch */
    quantity: integer('quantity').notNull().default(0),
    /** Original quantity received */
    originalQuantity: integer('original_quantity').notNull(),
    /** Days before expiry to trigger alert (default 30) */
    expiryAlertDays: integer('expiry_alert_days').notNull().default(30),
    /** Whether expiry alert has been acknowledged */
    expiryAlertAcknowledged: boolean('expiry_alert_acknowledged').notNull().default(false),
    /** Staff who acknowledged the expiry alert */
    expiryAlertAcknowledgedById: uuid('expiry_alert_acknowledged_by_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    expiryAlertAcknowledgedAt: timestamp('expiry_alert_acknowledged_at'),
    /** Whether this batch has been fully used or disposed */
    isExhausted: boolean('is_exhausted').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('stock_batches_org_idx').on(t.organisationId),
    index('stock_batches_medication_idx').on(t.medicationStockId),
    index('stock_batches_expiry_idx').on(t.organisationId, t.expiryDate),
    unique('stock_batches_batch_unique').on(
      t.organisationId,
      t.medicationStockId,
      t.batchNumber,
    ),
  ],
);

export type StockBatch = typeof stockBatches.$inferSelect;
export type NewStockBatch = typeof stockBatches.$inferInsert;

// ---------------------------------------------------------------------------
// Stock Transactions (VAL-EMAR-012)
// ---------------------------------------------------------------------------

/**
 * Stock transactions — immutable ledger of all stock movements.
 * Types: receipt, issue, adjustment, return, disposal.
 */
export const stockTransactions = pgTable(
  'stock_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    medicationStockId: uuid('medication_stock_id')
      .notNull()
      .references(() => medicationStock.id, { onDelete: 'cascade' }),
    /** Optional batch reference */
    stockBatchId: uuid('stock_batch_id').references(() => stockBatches.id, {
      onDelete: 'set null',
    }),
    /** Transaction type: receipt | issue | adjustment | return | disposal */
    transactionType: text('transaction_type').notNull(),
    /** Positive for receipts, negative for issues/disposals */
    quantity: integer('quantity').notNull(),
    /** Running balance after this transaction */
    balanceAfter: integer('balance_after').notNull(),
    /** Staff member who performed/recorded the transaction */
    performedById: uuid('performed_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Witnessing staff member (required for CDs) */
    witnessedById: uuid('witnessed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Reason for adjustment/disposal */
    reason: text('reason'),
    /** Free-text notes */
    notes: text('notes'),
    /** Reference to linked administration record if transaction type is 'issue' */
    administrationRecordId: uuid('administration_record_id'),
    /** Reference to linked reorder if transaction type is 'receipt' */
    reorderRequestId: uuid('reorder_request_id'),
    /** Source/destination: pharmacy | ward | patient | destroyed */
    sourceDestination: text('source_destination'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('stock_transactions_org_idx').on(t.organisationId),
    index('stock_transactions_medication_idx').on(t.medicationStockId),
    index('stock_transactions_type_idx').on(t.organisationId, t.transactionType),
    index('stock_transactions_date_idx').on(t.organisationId, t.createdAt),
    index('stock_transactions_performed_by_idx').on(t.performedById),
  ],
);

export type StockTransaction = typeof stockTransactions.$inferSelect;
export type NewStockTransaction = typeof stockTransactions.$inferInsert;

// ---------------------------------------------------------------------------
// Reorder Requests (VAL-EMAR-012)
// ---------------------------------------------------------------------------

/**
 * Reorder requests — generated when stock hits minimum threshold.
 * Tracks the ordering lifecycle from request to receipt.
 */
export const reorderRequests = pgTable(
  'reorder_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    medicationStockId: uuid('medication_stock_id')
      .notNull()
      .references(() => medicationStock.id, { onDelete: 'cascade' }),
    /** Quantity to order */
    quantityRequested: integer('quantity_requested').notNull(),
    /** Quantity actually received (may differ from requested) */
    quantityReceived: integer('quantity_received'),
    /** Status: pending | approved | ordered | partially_received | received | cancelled */
    status: text('status').notNull().default('pending'),
    /** Whether this was auto-generated by threshold trigger */
    isAutoGenerated: boolean('is_auto_generated').notNull().default(false),
    /** Staff who raised the request */
    requestedById: uuid('requested_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Staff who approved the request */
    approvedById: uuid('approved_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    /** Pharmacy notified flag and timestamp */
    pharmacyNotified: boolean('pharmacy_notified').notNull().default(false),
    pharmacyNotifiedAt: timestamp('pharmacy_notified_at'),
    /** Pharmacy reference/order number */
    pharmacyReference: text('pharmacy_reference'),
    /** Expected delivery date */
    expectedDeliveryDate: date('expected_delivery_date'),
    /** Actual delivery date */
    receivedAt: timestamp('received_at'),
    /** Staff who received the delivery */
    receivedById: uuid('received_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Cancellation reason if cancelled */
    cancellationReason: text('cancellation_reason'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('reorder_requests_org_idx').on(t.organisationId),
    index('reorder_requests_medication_idx').on(t.medicationStockId),
    index('reorder_requests_status_idx').on(t.organisationId, t.status),
  ],
);

export type ReorderRequest = typeof reorderRequests.$inferSelect;
export type NewReorderRequest = typeof reorderRequests.$inferInsert;

// ---------------------------------------------------------------------------
// Medication Errors / Incident Reporting (VAL-EMAR-015)
// ---------------------------------------------------------------------------

/**
 * Medication errors — incident reports for medication-related errors.
 * Supports investigation workflow with severity classification.
 */
export const medicationErrors = pgTable(
  'medication_errors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Error type: wrong_dose | wrong_person | wrong_time | missed | wrong_medication | wrong_route | wrong_form | other */
    errorType: text('error_type').notNull(),
    /** Severity: no_harm | low | moderate | severe | death */
    severity: text('severity').notNull(),
    /** Date and time the error occurred */
    occurredAt: timestamp('occurred_at').notNull(),
    /** Date and time the error was discovered */
    discoveredAt: timestamp('discovered_at').notNull(),
    /** Person (service user) affected — stored as UUID ref */
    personId: uuid('person_id'),
    /** Medication involved */
    medicationStockId: uuid('medication_stock_id').references(() => medicationStock.id, {
      onDelete: 'set null',
    }),
    /** Linked administration record if applicable */
    administrationRecordId: uuid('administration_record_id'),
    /** Staff member involved in the error */
    involvedStaffId: uuid('involved_staff_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Staff member who reported the error */
    reportedById: uuid('reported_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Description of what happened */
    description: text('description').notNull(),
    /** Immediate actions taken */
    immediateActions: text('immediate_actions'),
    /** Investigation status: reported | under_investigation | resolved | closed */
    investigationStatus: text('investigation_status').notNull().default('reported'),
    /** Staff assigned to investigate */
    investigatorId: uuid('investigator_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Investigation findings */
    investigationFindings: text('investigation_findings'),
    /** Root cause analysis */
    rootCause: text('root_cause'),
    /** Corrective actions taken/planned */
    correctiveActions: text('corrective_actions'),
    /** Whether the error was reported to external bodies (CQC, safeguarding) */
    externallyReported: boolean('externally_reported').notNull().default(false),
    /** External reporting details */
    externalReportingDetails: text('external_reporting_details'),
    /** Whether the person/family was informed */
    personInformed: boolean('person_informed').notNull().default(false),
    personInformedAt: timestamp('person_informed_at'),
    /** Whether GP was notified */
    gpNotified: boolean('gp_notified').notNull().default(false),
    gpNotifiedAt: timestamp('gp_notified_at'),
    /** Resolution date */
    resolvedAt: timestamp('resolved_at'),
    /** Lessons learned */
    lessonsLearned: text('lessons_learned'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('medication_errors_org_idx').on(t.organisationId),
    index('medication_errors_type_idx').on(t.organisationId, t.errorType),
    index('medication_errors_severity_idx').on(t.organisationId, t.severity),
    index('medication_errors_status_idx').on(t.organisationId, t.investigationStatus),
    index('medication_errors_person_idx').on(t.organisationId, t.personId),
    index('medication_errors_date_idx').on(t.organisationId, t.occurredAt),
  ],
);

export type MedicationError = typeof medicationErrors.$inferSelect;
export type NewMedicationError = typeof medicationErrors.$inferInsert;

// ---------------------------------------------------------------------------
// Handover Reports (VAL-EMAR-016)
// ---------------------------------------------------------------------------

/**
 * Shift handover reports — auto-generated summaries of medication events
 * for each shift. Includes administrations, refusals, PRN usage, errors, CD balances.
 */
export const handoverReports = pgTable(
  'handover_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Shift type: day | night | twilight | long_day */
    shiftType: text('shift_type').notNull(),
    /** Shift start time */
    shiftStartAt: timestamp('shift_start_at').notNull(),
    /** Shift end time */
    shiftEndAt: timestamp('shift_end_at').notNull(),
    /** Staff who generated/compiled the report */
    generatedById: uuid('generated_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /**
     * Compiled summary data (JSON).
     * Structure: {
     *   administrations: { total, onTime, late, missed },
     *   refusals: [{ personId, medicationName, time, reason }],
     *   prnUsage: [{ personId, medicationName, time, reason, effectiveness }],
     *   errors: [{ errorId, type, severity, personId }],
     *   cdBalances: [{ medicationName, expectedBalance, actualBalance, discrepancy }],
     *   notes: string
     * }
     */
    summary: jsonb('summary').notNull(),
    /** Outgoing staff signature (staff ID) */
    outgoingStaffId: uuid('outgoing_staff_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    outgoingSignedAt: timestamp('outgoing_signed_at'),
    /** Incoming staff signature (staff ID) */
    incomingStaffId: uuid('incoming_staff_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    incomingSignedAt: timestamp('incoming_signed_at'),
    /** Whether the handover has been completed (both parties signed) */
    isCompleted: boolean('is_completed').notNull().default(false),
    /** Additional notes added during handover */
    handoverNotes: text('handover_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('handover_reports_org_idx').on(t.organisationId),
    index('handover_reports_shift_idx').on(t.organisationId, t.shiftStartAt),
    index('handover_reports_generated_by_idx').on(t.generatedById),
  ],
);

export type HandoverReport = typeof handoverReports.$inferSelect;
export type NewHandoverReport = typeof handoverReports.$inferInsert;

// ---------------------------------------------------------------------------
// Topical MAR (VAL-EMAR-019)
// ---------------------------------------------------------------------------

/**
 * Topical medication records — separate tracking for topical medications
 * with body map linkage and application site recording.
 */
export const topicalMar = pgTable(
  'topical_mar',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Person (service user) this topical MAR is for */
    personId: uuid('person_id').notNull(),
    /** Medication stock reference */
    medicationStockId: uuid('medication_stock_id').references(() => medicationStock.id, {
      onDelete: 'set null',
    }),
    /** Medication name (denormalised for display) */
    medicationName: text('medication_name').notNull(),
    /** Application instructions */
    instructions: text('instructions').notNull(),
    /** Frequency: as_needed | once_daily | twice_daily | three_times_daily | four_times_daily | other */
    frequency: text('frequency').notNull(),
    /** Custom frequency description if 'other' */
    frequencyDescription: text('frequency_description'),
    /** Prescriber name */
    prescriber: text('prescriber'),
    /** Start date of topical regime */
    startDate: date('start_date').notNull(),
    /** End date (null = ongoing) */
    endDate: date('end_date'),
    /** Whether this topical MAR is currently active */
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('topical_mar_org_idx').on(t.organisationId),
    index('topical_mar_person_idx').on(t.organisationId, t.personId),
  ],
);

export type TopicalMar = typeof topicalMar.$inferSelect;
export type NewTopicalMar = typeof topicalMar.$inferInsert;

/**
 * Topical MAR administrations — individual application records
 * with body map site tracking.
 */
export const topicalMarAdministrations = pgTable(
  'topical_mar_administrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    topicalMarId: uuid('topical_mar_id')
      .notNull()
      .references(() => topicalMar.id, { onDelete: 'cascade' }),
    /** Staff who applied the medication */
    administeredById: uuid('administered_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** When the medication was applied */
    administeredAt: timestamp('administered_at').notNull(),
    /** Status: applied | refused | not_required | skin_condition_prevented */
    status: text('status').notNull().default('applied'),
    /**
     * Body map data — JSON describing application site(s).
     * Structure: { sites: [{ region: string, x: number, y: number, description: string }] }
     */
    bodyMapData: jsonb('body_map_data'),
    /** Description of application site in text */
    applicationSite: text('application_site').notNull(),
    /** Skin condition observation at time of application */
    skinCondition: text('skin_condition'),
    /** Any adverse reactions noted */
    adverseReaction: text('adverse_reaction'),
    /** Notes about the application */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('topical_mar_admin_org_idx').on(t.organisationId),
    index('topical_mar_admin_mar_idx').on(t.topicalMarId),
    index('topical_mar_admin_date_idx').on(t.organisationId, t.administeredAt),
  ],
);

export type TopicalMarAdministration = typeof topicalMarAdministrations.$inferSelect;
export type NewTopicalMarAdministration = typeof topicalMarAdministrations.$inferInsert;

// ---------------------------------------------------------------------------
// Homely Remedies (VAL-EMAR-019)
// ---------------------------------------------------------------------------

/**
 * Homely remedy protocols — OTC medications approved for use within
 * the care setting. Each protocol requires clinical approval.
 */
export const homelyRemedyProtocols = pgTable(
  'homely_remedy_protocols',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** OTC medication name */
    medicationName: text('medication_name').notNull(),
    /** Form: tablet, liquid, cream, lozenge, etc. */
    form: text('form').notNull(),
    /** Strength */
    strength: text('strength').notNull(),
    /** Indication / what it's used for */
    indication: text('indication').notNull(),
    /** Dosage instructions */
    dosageInstructions: text('dosage_instructions').notNull(),
    /** Maximum dose in 24 hours */
    maxDose24Hours: text('max_dose_24_hours').notNull(),
    /** Contraindications / when NOT to give */
    contraindications: text('contraindications'),
    /** Side effects to watch for */
    sideEffects: text('side_effects'),
    /** Interactions with prescribed medications */
    interactions: text('interactions'),
    /** Duration — how long can it be given before GP review required */
    maxDurationDays: integer('max_duration_days'),
    /** Approved by (GP/pharmacist name) */
    approvedBy: text('approved_by').notNull(),
    /** Approval date */
    approvedDate: date('approved_date').notNull(),
    /** Review date */
    reviewDate: date('review_date'),
    /** Whether this protocol is currently active */
    isActive: boolean('is_active').notNull().default(true),
    /** Staff who recorded the protocol */
    recordedById: uuid('recorded_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('homely_remedy_protocols_org_idx').on(t.organisationId),
    index('homely_remedy_protocols_name_idx').on(t.organisationId, t.medicationName),
  ],
);

export type HomelyRemedyProtocol = typeof homelyRemedyProtocols.$inferSelect;
export type NewHomelyRemedyProtocol = typeof homelyRemedyProtocols.$inferInsert;

/**
 * Homely remedy administrations — records of OTC medications given
 * under an approved protocol.
 */
export const homelyRemedyAdministrations = pgTable(
  'homely_remedy_administrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    protocolId: uuid('protocol_id')
      .notNull()
      .references(() => homelyRemedyProtocols.id, { onDelete: 'cascade' }),
    /** Person (service user) who received the medication */
    personId: uuid('person_id').notNull(),
    /** Staff who administered */
    administeredById: uuid('administered_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** When it was administered */
    administeredAt: timestamp('administered_at').notNull(),
    /** Dose given */
    doseGiven: text('dose_given').notNull(),
    /** Reason for administration */
    reason: text('reason').notNull(),
    /** Outcome / effectiveness */
    outcome: text('outcome'),
    /** Whether the person's GP was informed */
    gpInformed: boolean('gp_informed').notNull().default(false),
    gpInformedAt: timestamp('gp_informed_at'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('homely_remedy_admin_org_idx').on(t.organisationId),
    index('homely_remedy_admin_protocol_idx').on(t.protocolId),
    index('homely_remedy_admin_person_idx').on(t.organisationId, t.personId),
    index('homely_remedy_admin_date_idx').on(t.organisationId, t.administeredAt),
  ],
);

export type HomelyRemedyAdministration = typeof homelyRemedyAdministrations.$inferSelect;
export type NewHomelyRemedyAdministration = typeof homelyRemedyAdministrations.$inferInsert;
