import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

/**
 * Care Notes — daily care records and observations for persons.
 *
 * Care notes are immutable once created (regulatory requirement).
 * Corrections are made by adding a new note that references the original.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a care note by ID requires assertBelongsToOrg() check.
 *
 * Extended columns (structured fields, note type, shift linkage) will
 * be added in m2-care-planning.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const careNotes = pgTable(
  'care_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this note is about */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** The staff member who created the note */
    authorId: uuid('author_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Note category: daily | handover | incident | safeguarding | medical */
    noteType: text('note_type').notNull().default('daily'),
    content: text('content').notNull(),
    /** The care period this note covers (e.g. '07:00–14:00') */
    shiftPeriod: text('shift_period'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('care_notes_organisation_id_idx').on(t.organisationId),
    /** Fetch notes for a specific person (timeline view) */
    index('care_notes_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter by note type within an org */
    index('care_notes_organisation_type_idx').on(
      t.organisationId,
      t.noteType,
    ),
    /** Chronological ordering within an org */
    index('care_notes_organisation_created_at_idx').on(
      t.organisationId,
      t.createdAt,
    ),
  ],
);

export type CareNote = typeof careNotes.$inferSelect;
export type NewCareNote = typeof careNotes.$inferInsert;
