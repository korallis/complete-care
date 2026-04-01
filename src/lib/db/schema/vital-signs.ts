import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

// ---------------------------------------------------------------------------
// Vital Signs — clinical observations with NEWS2 auto-scoring
// ---------------------------------------------------------------------------

/**
 * Vital Signs — individual clinical observation sets.
 *
 * Records temperature, blood pressure, pulse, respiratory rate, SpO2,
 * consciousness (AVPU), blood glucose, and pain score. Automatically
 * calculates a NEWS2 (National Early Warning Score 2) from the six
 * contributing parameters.
 *
 * NEWS2 scoring supports both Scale 1 (standard) and Scale 2 (COPD/chronic
 * hypoxaemia patients who have a prescribed SpO2 target of 88-92%).
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a vital sign entry by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const vitalSigns = pgTable(
  'vital_signs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this observation is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),

    // --- Vital parameters ---

    /** Temperature in degrees Celsius (32.0 - 42.0) */
    temperature: real('temperature'),
    /** Systolic blood pressure in mmHg (60 - 250) */
    systolicBp: integer('systolic_bp'),
    /** Diastolic blood pressure in mmHg (30 - 150) */
    diastolicBp: integer('diastolic_bp'),
    /** Position during BP measurement: sitting | standing | lying */
    bpPosition: text('bp_position'),
    /** Pulse rate in beats per minute (20 - 250) */
    pulseRate: integer('pulse_rate'),
    /** Pulse rhythm: regular | irregular */
    pulseRhythm: text('pulse_rhythm'),
    /** Respiratory rate in breaths per minute (1 - 60) */
    respiratoryRate: integer('respiratory_rate'),
    /** SpO2 percentage (50 - 100) */
    spo2: integer('spo2'),
    /** Whether the patient is on supplemental oxygen */
    supplementalOxygen: boolean('supplemental_oxygen'),
    /** Oxygen flow rate in litres/min when on supplemental oxygen */
    oxygenFlowRate: real('oxygen_flow_rate'),
    /** AVPU consciousness level: alert | voice | pain | unresponsive */
    avpu: text('avpu'),
    /** Blood glucose in mmol/L (1.0 - 40.0) */
    bloodGlucose: real('blood_glucose'),
    /** Pain score 0-10 */
    painScore: integer('pain_score'),

    // --- NEWS2 calculated fields ---

    /** Total NEWS2 score (0 - 20) */
    news2Score: integer('news2_score'),
    /** Which NEWS2 scale was used: 1 (standard) or 2 (COPD) */
    news2ScaleUsed: integer('news2_scale_used'),
    /** Escalation level derived from NEWS2 score */
    news2Escalation: text('news2_escalation'),
    /** Whether this person has COPD (determines Scale 2 usage) */
    isCopd: boolean('is_copd').notNull().default(false),

    // --- Recording metadata ---

    /** Staff member who recorded the observation */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised author name for display */
    recordedByName: text('recorded_by_name'),
    /** When the observation was taken */
    recordedAt: timestamp('recorded_at').notNull(),
    /** Optional clinical notes */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('vital_signs_organisation_id_idx').on(t.organisationId),
    /** List vital signs for a specific person */
    index('vital_signs_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Time-based queries for trend analysis */
    index('vital_signs_organisation_person_recorded_at_idx').on(
      t.organisationId,
      t.personId,
      t.recordedAt,
    ),
    /** Filter by escalation level (e.g. find all urgent/emergency) */
    index('vital_signs_organisation_escalation_idx').on(
      t.organisationId,
      t.news2Escalation,
    ),
  ],
);

export type VitalSign = typeof vitalSigns.$inferSelect;
export type NewVitalSign = typeof vitalSigns.$inferInsert;
