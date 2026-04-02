import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

// ---------------------------------------------------------------------------
// Medication route & frequency types
// ---------------------------------------------------------------------------

export type MedicationRoute =
  | 'oral'
  | 'topical'
  | 'injection'
  | 'inhaled'
  | 'rectal'
  | 'sublingual'
  | 'patch'
  | 'other';

export type MedicationFrequency = 'regular' | 'prn' | 'once_only';

export type MedicationStatus = 'active' | 'discontinued' | 'suspended' | 'completed';

/**
 * Frequency detail — JSONB structure for scheduling.
 *
 * For regular medications, specifies times of day (e.g., ["08:00", "12:00", "18:00"])
 * and optionally which days of the week (e.g., ["mon", "wed", "fri"]).
 * For PRN, timesOfDay is empty (administered as needed).
 * For once_only, a single time is stored.
 */
export type FrequencyDetail = {
  /** Times of day in HH:mm format */
  timesOfDay: string[];
  /** Days of week (empty = every day). Mon-Sun lowercase. */
  daysOfWeek?: string[];
  /** Maximum doses per 24h (for PRN medications) */
  maxDosesPerDay?: number;
  /** Minimum hours between doses (for PRN medications) */
  minHoursBetweenDoses?: number;
};

// ---------------------------------------------------------------------------
// Medications table
// ---------------------------------------------------------------------------

/**
 * Medications — active and historical medication records for persons.
 *
 * Each medication is scoped to both an organisation AND a person.
 * Forms the basis of the MAR chart — each row in the chart is a medication.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a medication by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const medications = pgTable(
  'medications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this medication is prescribed for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Drug name (brand or generic) */
    drugName: text('drug_name').notNull(),
    /** Dose amount (e.g., "500", "10", "2 puffs") */
    dose: text('dose').notNull(),
    /** Dose unit (e.g., "mg", "ml", "mcg", "units", "puffs", "patches") */
    doseUnit: text('dose_unit').notNull(),
    /** Administration route */
    route: text('route').notNull().default('oral'),
    /** Frequency type: regular | prn | once_only */
    frequency: text('frequency').notNull().default('regular'),
    /** JSONB scheduling detail — times of day, days of week, PRN limits */
    frequencyDetail: jsonb('frequency_detail').$type<FrequencyDetail>().notNull().default({
      timesOfDay: [],
    }),
    /** Date prescribed (ISO YYYY-MM-DD) */
    prescribedDate: text('prescribed_date').notNull(),
    /** Name of prescriber (GP, consultant, etc.) */
    prescriberName: text('prescriber_name').notNull(),
    /** Pharmacy dispensing the medication */
    pharmacy: text('pharmacy'),
    /** Medication status: active | discontinued | suspended | completed */
    status: text('status').notNull().default('active'),
    /** Date when medication was discontinued/completed (ISO YYYY-MM-DD) */
    discontinuedDate: text('discontinued_date'),
    /** Reason for discontinuation/suspension */
    discontinuedReason: text('discontinued_reason'),
    /** Special instructions (e.g., "take with food", "crush before giving") */
    specialInstructions: text('special_instructions'),
    /** Whether this is a controlled drug (Schedule 2-5) */
    isControlledDrug: boolean('is_controlled_drug').notNull().default(false),
    /** CD Schedule: 2 | 3 | 4 | 5 — null for non-CDs */
    cdSchedule: text('cd_schedule'),
    /** Therapeutic class for duplicate checking */
    therapeuticClass: text('therapeutic_class'),
    /** Active ingredient(s) for allergy cross-referencing */
    activeIngredients: text('active_ingredients').array(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('medications_organisation_id_idx').on(t.organisationId),
    /** List medications for a specific person (always also scoped by org) */
    index('medications_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Status filtering within an org */
    index('medications_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
    /** Active medications for a person (most common query) */
    index('medications_org_person_status_idx').on(
      t.organisationId,
      t.personId,
      t.status,
    ),
  ],
);

export type Medication = typeof medications.$inferSelect;
export type NewMedication = typeof medications.$inferInsert;

// ---------------------------------------------------------------------------
// Administration status type
// ---------------------------------------------------------------------------

export type AdministrationStatus =
  | 'given'
  | 'refused'
  | 'not_available'
  | 'self_administered'
  | 'withheld'
  | 'omitted';

// ---------------------------------------------------------------------------
// Medication administrations table
// ---------------------------------------------------------------------------

/**
 * Medication Administrations — individual administration records.
 *
 * Each record represents a single scheduled or actual administration event.
 * These form the cells in the MAR chart grid.
 *
 * NICE SC1 compliance: records administering staff identity, witness where
 * required, time of administration, and reason for non-administration.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 */
export const medicationAdministrations = pgTable(
  'medication_administrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** FK to the medication being administered */
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    /** The person receiving the medication (denormalised for efficient queries) */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The scheduled time for this administration (ISO timestamp) */
    scheduledTime: timestamp('scheduled_time').notNull(),
    /** Actual time of administration (null if not yet administered) */
    administeredAt: timestamp('administered_at'),
    /** Administration outcome */
    status: text('status').notNull().default('given'),
    /** Reason for refused/withheld/omitted — required when status is not 'given' or 'self_administered' */
    reason: text('reason'),
    /** Staff member who administered (FK to users) */
    administeredById: uuid('administered_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised name of administering staff for display/print */
    administeredByName: text('administered_by_name'),
    /** Witness staff member (FK to users) — required for controlled drugs */
    witnessId: uuid('witness_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised witness name for display/print */
    witnessName: text('witness_name'),
    /** Additional notes about this administration */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('med_admin_organisation_id_idx').on(t.organisationId),
    /** MAR chart query: all administrations for a person on a date range */
    index('med_admin_org_person_scheduled_idx').on(
      t.organisationId,
      t.personId,
      t.scheduledTime,
    ),
    /** Filter by medication */
    index('med_admin_medication_id_idx').on(t.medicationId),
    /** Filter by status within org */
    index('med_admin_org_status_idx').on(t.organisationId, t.status),
    /** Staff administration history */
    index('med_admin_administered_by_idx').on(t.administeredById),
  ],
);

export type MedicationAdministration = typeof medicationAdministrations.$inferSelect;
export type NewMedicationAdministration = typeof medicationAdministrations.$inferInsert;

// ---------------------------------------------------------------------------
// Allergies — per-resident allergy records for medication safety alerts
// ---------------------------------------------------------------------------

export const allergies = pgTable(
  'allergies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    allergen: text('allergen').notNull(),
    allergyType: text('allergy_type').notNull().default('drug'),
    severity: text('severity').notNull().default('moderate'),
    reaction: text('reaction'),
    identifiedDate: timestamp('identified_date'),
    status: text('status').notNull().default('active'),
    recordedBy: uuid('recorded_by').references(() => users.id),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('allergies_org_person_idx').on(t.organisationId, t.personId),
    index('allergies_allergen_idx').on(t.organisationId, t.allergen),
  ],
);

// ---------------------------------------------------------------------------
// Drug Interactions — known interaction reference data
// ---------------------------------------------------------------------------

export const drugInteractions = pgTable(
  'drug_interactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    drugA: text('drug_a').notNull(),
    drugB: text('drug_b').notNull(),
    severity: text('severity').notNull(),
    description: text('description').notNull(),
    recommendation: text('recommendation'),
    source: text('source'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('drug_interactions_org_drugs_idx').on(t.organisationId, t.drugA, t.drugB),
  ],
);

// ---------------------------------------------------------------------------
// Allergy Alert Overrides — immutable audit trail
// ---------------------------------------------------------------------------

export const allergyAlertOverrides = pgTable(
  'allergy_alert_overrides',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id),
    allergyId: uuid('allergy_id')
      .notNull()
      .references(() => allergies.id),
    administrationId: uuid('administration_id').references(
      () => medicationAdministrations.id,
    ),
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id),
    authorisedBy: uuid('authorised_by')
      .notNull()
      .references(() => users.id),
    clinicalJustification: text('clinical_justification').notNull(),
    matchedAllergen: text('matched_allergen').notNull(),
    matchedMedicationDetail: text('matched_medication_detail').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('allergy_overrides_org_person_idx').on(t.organisationId, t.personId),
    index('allergy_overrides_org_med_idx').on(t.organisationId, t.medicationId),
  ],
);

export type Allergy = typeof allergies.$inferSelect;
export type NewAllergy = typeof allergies.$inferInsert;
export type DrugInteraction = typeof drugInteractions.$inferSelect;
export type AllergyAlertOverride = typeof allergyAlertOverrides.$inferSelect;
