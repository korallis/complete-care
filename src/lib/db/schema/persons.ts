import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';

/**
 * Persons — care recipients (residents / clients / young people).
 *
 * The person model is polymorphic by care domain:
 * - 'resident'    — supported living and children's residential
 * - 'client'      — domiciliary care
 * - 'young_person' — children's homes
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a person by ID requires assertBelongsToOrg() check.
 *
 * Extended columns (allergies, GP details, emergency contacts, etc.)
 * will be added in m2-person-management.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const persons = pgTable(
  'persons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    fullName: text('full_name').notNull(),
    /** Domain discriminator: resident | client | young_person */
    type: text('type').notNull().default('resident'),
    /** Lifecycle: active | archived */
    status: text('status').notNull().default('active'),
    dateOfBirth: text('date_of_birth'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    /** Soft delete — records are never physically removed */
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    /** Primary tenant isolation index — most queries start here */
    index('persons_organisation_id_idx').on(t.organisationId),
    /** List persons by org + status (e.g. active list, archived list) */
    index('persons_organisation_status_idx').on(t.organisationId, t.status),
    /** Full-text name search scoped to an org */
    index('persons_organisation_name_idx').on(t.organisationId, t.fullName),
  ],
);

export type Person = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
