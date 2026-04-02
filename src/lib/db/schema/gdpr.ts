import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Subject Access Requests (SARs) — GDPR Article 15.
 * Tracks receipt, progress, and fulfilment of data subject access requests.
 * Must be fulfilled within 30 calendar days (ICO guidance).
 */
export const subjectAccessRequests = pgTable(
  'subject_access_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Name of the data subject making the request */
    subjectName: text('subject_name').notNull(),
    /** Email of the data subject */
    subjectEmail: text('subject_email').notNull(),
    /** ID of the person record this SAR relates to, if applicable */
    personId: uuid('person_id'),
    /** Date the SAR was received */
    receivedAt: timestamp('received_at').notNull(),
    /** Deadline: 30 days from receipt */
    deadlineAt: timestamp('deadline_at').notNull(),
    /** Status: received | in_progress | export_ready | fulfilled | rejected */
    status: text('status').notNull().default('received'),
    /** Reason for rejection, if applicable */
    rejectionReason: text('rejection_reason'),
    /** Format of the export: json | pdf | both */
    exportFormat: text('export_format').default('json'),
    /** URL or path to the generated export package */
    exportPath: text('export_path'),
    /** User who processed/fulfilled this SAR */
    processedByUserId: uuid('processed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Notes about the SAR processing */
    notes: text('notes'),
    fulfilledAt: timestamp('fulfilled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('sar_organisation_id_idx').on(t.organisationId),
    index('sar_status_idx').on(t.status),
    index('sar_deadline_idx').on(t.deadlineAt),
  ],
);

/**
 * Data retention policies — configurable per data type per organisation.
 * Supports children's 75-year retention per Schedule 3.
 */
export const dataRetentionPolicies = pgTable(
  'data_retention_policies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The data type this policy applies to: person | care_plan | medication | incident | assessment | children_case_record */
    dataType: text('data_type').notNull(),
    /** Retention period in days */
    retentionDays: integer('retention_days').notNull(),
    /** Whether this is a statutory requirement (cannot be shortened) */
    isStatutory: boolean('is_statutory').notNull().default(false),
    /** Legal basis for retention: consent | legal_obligation | vital_interests | public_task | legitimate_interests */
    legalBasis: text('legal_basis').notNull(),
    /** Description of the policy and legal basis */
    description: text('description'),
    /** Whether auto-deletion is enabled (requires approval workflow) */
    autoDeleteEnabled: boolean('auto_delete_enabled').notNull().default(false),
    /** Days before retention limit to flag records for review */
    warningDays: integer('warning_days').notNull().default(30),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('drp_organisation_id_idx').on(t.organisationId),
    index('drp_data_type_idx').on(t.dataType),
  ],
);

/**
 * Data retention flags — records flagged as approaching or past retention limit.
 */
export const dataRetentionFlags = pgTable(
  'data_retention_flags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The retention policy that triggered this flag */
    policyId: uuid('policy_id')
      .notNull()
      .references(() => dataRetentionPolicies.id, { onDelete: 'cascade' }),
    /** Type of entity being flagged */
    entityType: text('entity_type').notNull(),
    /** ID of the flagged entity */
    entityId: uuid('entity_id').notNull(),
    /** Date the record becomes eligible for deletion */
    retentionExpiresAt: timestamp('retention_expires_at').notNull(),
    /** Status: warning | expired | approved_for_deletion | deleted | retained */
    status: text('status').notNull().default('warning'),
    /** User who approved/rejected the deletion */
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at'),
    /** Reason for retaining beyond policy if applicable */
    retentionReason: text('retention_reason'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('drf_organisation_id_idx').on(t.organisationId),
    index('drf_status_idx').on(t.status),
    index('drf_expires_idx').on(t.retentionExpiresAt),
  ],
);

/**
 * Erasure requests — GDPR Article 17 right to erasure.
 * Records erasure requests and tracks the anonymisation workflow.
 */
export const erasureRequests = pgTable(
  'erasure_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Name of the data subject requesting erasure */
    subjectName: text('subject_name').notNull(),
    /** Email of the data subject */
    subjectEmail: text('subject_email').notNull(),
    /** ID of the person record to be erased, if applicable */
    personId: uuid('person_id'),
    /** Date the request was received */
    receivedAt: timestamp('received_at').notNull(),
    /** Deadline: 30 days from receipt */
    deadlineAt: timestamp('deadline_at').notNull(),
    /** Status: received | approved | in_progress | completed | rejected */
    status: text('status').notNull().default('received'),
    /** Reason for rejection (e.g., legal obligation to retain) */
    rejectionReason: text('rejection_reason'),
    /** JSON list of tables/fields that were anonymised */
    anonymisedFields: jsonb('anonymised_fields'),
    /** User who approved and processed the request */
    processedByUserId: uuid('processed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('er_organisation_id_idx').on(t.organisationId),
    index('er_status_idx').on(t.status),
    index('er_deadline_idx').on(t.deadlineAt),
  ],
);

/**
 * Data exports — records of data exports for SARs or person data export/import.
 */
export const dataExports = pgTable(
  'data_exports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Type of export: sar | person_data | bulk */
    exportType: text('export_type').notNull(),
    /** Format: json | csv | pdf */
    format: text('format').notNull().default('json'),
    /** Status: pending | generating | completed | failed */
    status: text('status').notNull().default('pending'),
    /** ID of the person whose data is being exported, if applicable */
    personId: uuid('person_id'),
    /** Related SAR ID, if this export is for a SAR */
    sarId: uuid('sar_id').references(() => subjectAccessRequests.id, {
      onDelete: 'set null',
    }),
    /** URL or path to the generated export file */
    filePath: text('file_path'),
    /** Size of the export file in bytes */
    fileSizeBytes: integer('file_size_bytes'),
    /** User who initiated the export */
    initiatedByUserId: uuid('initiated_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Error message if the export failed */
    errorMessage: text('error_message'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('de_organisation_id_idx').on(t.organisationId),
    index('de_status_idx').on(t.status),
    index('de_export_type_idx').on(t.exportType),
  ],
);

/**
 * Data imports — records of data imported from external systems.
 */
export const dataImports = pgTable(
  'data_imports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Source system name */
    sourceSystem: text('source_system').notNull(),
    /** Format: csv | json */
    format: text('format').notNull().default('csv'),
    /** Status: pending | mapping | validating | importing | completed | failed */
    status: text('status').notNull().default('pending'),
    /** Column mapping configuration: { sourceColumn: targetField } */
    columnMapping: jsonb('column_mapping'),
    /** Total rows in the import file */
    totalRows: integer('total_rows'),
    /** Rows successfully imported */
    importedRows: integer('imported_rows'),
    /** Rows that failed validation */
    failedRows: integer('failed_rows'),
    /** Validation errors as JSON array */
    validationErrors: jsonb('validation_errors'),
    /** URL or path to the uploaded import file */
    filePath: text('file_path'),
    /** User who initiated the import */
    initiatedByUserId: uuid('initiated_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('di_organisation_id_idx').on(t.organisationId),
    index('di_status_idx').on(t.status),
  ],
);

// Type exports
export type SubjectAccessRequest = typeof subjectAccessRequests.$inferSelect;
export type NewSubjectAccessRequest = typeof subjectAccessRequests.$inferInsert;
export type DataRetentionPolicy = typeof dataRetentionPolicies.$inferSelect;
export type NewDataRetentionPolicy = typeof dataRetentionPolicies.$inferInsert;
export type DataRetentionFlag = typeof dataRetentionFlags.$inferSelect;
export type NewDataRetentionFlag = typeof dataRetentionFlags.$inferInsert;
export type ErasureRequest = typeof erasureRequests.$inferSelect;
export type NewErasureRequest = typeof erasureRequests.$inferInsert;
export type DataExport = typeof dataExports.$inferSelect;
export type NewDataExport = typeof dataExports.$inferInsert;
export type DataImport = typeof dataImports.$inferSelect;
export type NewDataImport = typeof dataImports.$inferInsert;
