import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

/**
 * Documents — uploaded files associated with persons or the organisation.
 *
 * Documents are stored externally (e.g., Vercel Blob / S3). This table
 * holds metadata: name, category, upload details, version tracking,
 * retention policy tagging, and a reference to the external storage URL.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a document by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Person this document belongs to (null for org-level documents) */
    personId: uuid('person_id').references(() => persons.id, {
      onDelete: 'cascade',
    }),
    /** The staff member who uploaded the document */
    uploadedById: uuid('uploaded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised uploader name for display (persists even if user is deleted) */
    uploadedByName: text('uploaded_by_name'),
    /** Display name of the document */
    name: text('name').notNull(),
    /** Original file name */
    fileName: text('file_name').notNull(),
    /** MIME type of the uploaded file */
    fileType: text('file_type').notNull(),
    /** File size in bytes */
    fileSize: integer('file_size'),
    /** Category: care_plan | assessment | correspondence | consent | other */
    category: text('category').notNull().default('other'),
    /** Document version number */
    version: integer('version').notNull().default(1),
    /** Retention policy: standard | extended | permanent */
    retentionPolicy: text('retention_policy').notNull().default('standard'),
    /** External storage URL (Vercel Blob / S3 presigned URL) */
    storageUrl: text('storage_url').notNull(),
    /** Storage key for the file (used to generate presigned URLs) */
    storageKey: text('storage_key'),
    /** Soft delete — documents are retained per retention policy */
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('documents_organisation_id_idx').on(t.organisationId),
    /** Documents for a specific person */
    index('documents_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter by category within an org */
    index('documents_organisation_category_idx').on(
      t.organisationId,
      t.category,
    ),
  ],
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

/**
 * Body Map Entries — injury/wound/bruise markers placed on the body map.
 *
 * Each entry records a specific observation on a person's body with
 * precise coordinates (xPercent, yPercent) relative to the body outline SVG.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a body map entry by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const bodyMapEntries = pgTable(
  'body_map_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this entry is about */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Body region label: head, torso, left_arm, right_arm, left_leg, right_leg, back, other */
    bodyRegion: text('body_region').notNull(),
    /** Which view the mark is on: front | back */
    side: text('side').notNull().default('front'),
    /** Horizontal position as percentage (0-100) of the SVG width */
    xPercent: real('x_percent').notNull(),
    /** Vertical position as percentage (0-100) of the SVG height */
    yPercent: real('y_percent').notNull(),
    /** Type of observation: injury | wound | bruise | mark | other */
    entryType: text('entry_type').notNull().default('mark'),
    /** Free-text description of the observation */
    description: text('description').notNull(),
    /** Date the mark/injury was first observed (ISO YYYY-MM-DD) */
    dateObserved: text('date_observed').notNull(),
    /** Optional link to an incident report */
    linkedIncidentId: uuid('linked_incident_id'),
    /** The staff member who created this entry */
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised creator name for display */
    createdByName: text('created_by_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('body_map_entries_organisation_id_idx').on(t.organisationId),
    /** Entries for a specific person (timeline view) */
    index('body_map_entries_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter by entry type within an org */
    index('body_map_entries_organisation_type_idx').on(
      t.organisationId,
      t.entryType,
    ),
    /** Chronological ordering within an org */
    index('body_map_entries_organisation_date_idx').on(
      t.organisationId,
      t.dateObserved,
    ),
  ],
);

export type BodyMapEntry = typeof bodyMapEntries.$inferSelect;
export type NewBodyMapEntry = typeof bodyMapEntries.$inferInsert;
