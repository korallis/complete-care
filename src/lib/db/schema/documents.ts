import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

/**
 * Documents — uploaded files associated with persons or the organisation.
 *
 * Documents are stored externally (e.g., Vercel Blob / S3). This table
 * holds metadata: name, category, upload details, and a reference to the
 * external storage URL.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a document by ID requires assertBelongsToOrg() check.
 *
 * Extended metadata (retention policies, access log, version history) will
 * be added in m2-care-planning.
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
    /** Display name of the document */
    name: text('name').notNull(),
    /** Category: medical | legal | correspondence | assessment | training | other */
    category: text('category').notNull().default('other'),
    /** MIME type of the uploaded file */
    mimeType: text('mime_type').notNull(),
    /** File size in bytes */
    sizeBytes: integer('size_bytes'),
    /** External storage URL (Vercel Blob / S3 presigned URL) */
    storageUrl: text('storage_url').notNull(),
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
