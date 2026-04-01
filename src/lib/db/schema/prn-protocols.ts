import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';
import { medications } from './medications';

// ---------------------------------------------------------------------------
// JSONB types for PRN protocols and administrations
// ---------------------------------------------------------------------------

/** Signs and symptoms that indicate PRN medication may be needed */
export type PrnSignSymptom = {
  description: string;
};

/** Pre-dose assessment recorded before PRN administration */
export type PrnPreDoseAssessment = {
  /** Pain score 0-10 */
  painScore: number;
  /** Observed symptoms at time of assessment */
  symptoms: string[];
  /** Free-text notes */
  notes?: string;
};

/** Post-dose assessment recorded after PRN administration */
export type PrnPostDoseAssessment = {
  /** Pain score 0-10 after medication */
  painScore: number;
  /** Was the expected effect achieved? */
  effectAchieved: 'yes' | 'partial' | 'no';
  /** Free-text notes about effectiveness */
  notes?: string;
};

// ---------------------------------------------------------------------------
// PRN Protocols table
// ---------------------------------------------------------------------------

/**
 * PRN Protocols — defines the standing protocol for each PRN medication.
 *
 * Each protocol is linked to a medication record and defines indications,
 * dose parameters, non-pharmacological alternatives, and follow-up criteria.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 */
export const prnProtocols = pgTable(
  'prn_protocols',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** FK to the PRN medication this protocol covers */
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Clinical indication for PRN use (e.g., "Pain relief", "Anxiety") */
    indication: text('indication').notNull(),
    /** Signs and symptoms that trigger PRN consideration (JSONB array) */
    signsSymptoms: jsonb('signs_symptoms')
      .$type<PrnSignSymptom[]>()
      .notNull()
      .default([]),
    /** Dose range description (e.g., "500mg - 1000mg") */
    doseRange: text('dose_range').notNull(),
    /** Maximum dose in 24 hours (e.g., "4000mg") */
    maxDose24hr: text('max_dose_24hr').notNull(),
    /** Minimum interval between doses in minutes */
    minInterval: integer('min_interval').notNull(),
    /** Non-pharmacological alternatives to try first */
    nonPharmAlternatives: text('non_pharm_alternatives'),
    /** Expected effect of the medication (e.g., "Pain reduced to below 4/10") */
    expectedEffect: text('expected_effect').notNull(),
    /** Escalation criteria if PRN is not effective */
    escalationCriteria: text('escalation_criteria'),
    /** Minutes after administration to perform follow-up assessment */
    followUpMinutes: integer('follow_up_minutes').notNull().default(60),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('prn_protocols_organisation_id_idx').on(t.organisationId),
    /** Find protocol for a specific medication */
    index('prn_protocols_medication_id_idx').on(t.medicationId),
    /** Lookup by org + medication */
    index('prn_protocols_org_medication_idx').on(
      t.organisationId,
      t.medicationId,
    ),
  ],
);

export type PrnProtocol = typeof prnProtocols.$inferSelect;
export type NewPrnProtocol = typeof prnProtocols.$inferInsert;

// ---------------------------------------------------------------------------
// PRN Administrations table
// ---------------------------------------------------------------------------

/**
 * PRN Administrations — individual PRN administration events with
 * pre-dose and post-dose assessments for effectiveness tracking.
 *
 * Each record captures the full PRN cycle: assessment, administration,
 * follow-up, and outcome evaluation.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 */
export const prnAdministrations = pgTable(
  'prn_administrations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** FK to the PRN protocol governing this administration */
    prnProtocolId: uuid('prn_protocol_id')
      .notNull()
      .references(() => prnProtocols.id, { onDelete: 'cascade' }),
    /** FK to the medication being administered */
    medicationId: uuid('medication_id')
      .notNull()
      .references(() => medications.id, { onDelete: 'cascade' }),
    /** The person receiving the medication */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Pre-dose assessment (JSONB — painScore, symptoms) */
    preDoseAssessment: jsonb('pre_dose_assessment')
      .$type<PrnPreDoseAssessment>()
      .notNull(),
    /** When the medication was administered */
    administeredAt: timestamp('administered_at').notNull(),
    /** Staff member who administered */
    administeredById: uuid('administered_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised name of administering staff */
    administeredByName: text('administered_by_name'),
    /** Post-dose assessment (JSONB — painScore, effectAchieved, notes) */
    postDoseAssessment: jsonb('post_dose_assessment')
      .$type<PrnPostDoseAssessment>(),
    /** When the post-dose assessment was completed */
    postDoseAssessedAt: timestamp('post_dose_assessed_at'),
    /** Follow-up actions taken if effect was partial or not achieved */
    followUpActions: text('follow_up_actions'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('prn_admin_organisation_id_idx').on(t.organisationId),
    /** Find administrations for a protocol */
    index('prn_admin_protocol_id_idx').on(t.prnProtocolId),
    /** Find administrations for a person (date-ordered) */
    index('prn_admin_org_person_administered_idx').on(
      t.organisationId,
      t.personId,
      t.administeredAt,
    ),
    /** Find administrations by medication */
    index('prn_admin_medication_id_idx').on(t.medicationId),
    /** Staff administration history */
    index('prn_admin_administered_by_idx').on(t.administeredById),
  ],
);

export type PrnAdministration = typeof prnAdministrations.$inferSelect;
export type NewPrnAdministration = typeof prnAdministrations.$inferInsert;
