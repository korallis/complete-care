import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
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
 * Relations are defined in ./relations.ts to avoid circular imports.
 */

/**
 * Emergency contact shape stored in the emergencyContacts JSONB array.
 */
export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  /** Lower number = higher priority. 1 = primary contact. */
  priority: number;
  email?: string;
};

export const persons = pgTable(
  'persons',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),

    // ---------------------------------------------------------------------------
    // Core / display name fields
    // ---------------------------------------------------------------------------
    /** Computed full name (firstName + lastName) — kept for backward compat and search */
    fullName: text('full_name').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    /** Preferred name / known as */
    preferredName: text('preferred_name'),

    // ---------------------------------------------------------------------------
    // Domain discriminator
    // ---------------------------------------------------------------------------
    /** Domain discriminator: resident | client | young_person */
    type: text('type').notNull().default('resident'),
    /** Lifecycle: active | archived */
    status: text('status').notNull().default('active'),

    // ---------------------------------------------------------------------------
    // Demographics
    // ---------------------------------------------------------------------------
    dateOfBirth: text('date_of_birth'),
    gender: text('gender'),
    ethnicity: text('ethnicity'),
    religion: text('religion'),
    firstLanguage: text('first_language'),

    // ---------------------------------------------------------------------------
    // Medical information
    // ---------------------------------------------------------------------------
    nhsNumber: text('nhs_number'),
    gpName: text('gp_name'),
    gpPractice: text('gp_practice'),
    /** Array of allergy strings e.g. ['Penicillin', 'Latex'] */
    allergies: text('allergies').array().notNull().default([]),
    /** Array of medical condition strings */
    medicalConditions: text('medical_conditions').array().notNull().default([]),

    // ---------------------------------------------------------------------------
    // Contact / address
    // ---------------------------------------------------------------------------
    contactPhone: text('contact_phone'),
    contactEmail: text('contact_email'),
    address: text('address'),

    // ---------------------------------------------------------------------------
    // Emergency contacts (ordered by priority)
    // ---------------------------------------------------------------------------
    /** JSONB array of EmergencyContact objects */
    emergencyContacts: jsonb('emergency_contacts').$type<EmergencyContact[]>().notNull().default([]),

    // ---------------------------------------------------------------------------
    // Photo
    // ---------------------------------------------------------------------------
    /** URL to the person's profile photo (stored in object storage / base64) */
    photoUrl: text('photo_url'),

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
    /** NHS number lookup scoped to org */
    index('persons_organisation_nhs_idx').on(t.organisationId, t.nhsNumber),
  ],
);

export type Person = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
