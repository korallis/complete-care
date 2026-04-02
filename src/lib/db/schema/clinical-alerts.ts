import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

// ---------------------------------------------------------------------------
// Clinical Alerts — threshold-based alerting with escalation workflows
// ---------------------------------------------------------------------------

/**
 * Clinical Alerts — system-generated and manual clinical alerts.
 *
 * Tracks alerts raised by the clinical alerting engine (fluid intake,
 * NEWS2, weight loss, constipation, diarrhoea, pain) with a full
 * escalation workflow: staff -> senior -> nurse -> GP -> 999.
 *
 * Each alert carries severity (info/amber/red/emergency), a status
 * lifecycle (active -> acknowledged -> resolved | escalated), and
 * a complete audit trail of who acknowledged and what action was taken.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing an alert by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const clinicalAlerts = pgTable(
  'clinical_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this alert is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Alert type: fluid_low, news2_elevated, weight_loss, constipation, diarrhoea, pain_sustained, custom */
    alertType: text('alert_type').notNull(),
    /** Severity: info, amber, red, emergency */
    severity: text('severity').notNull(),
    /** Source: auto (engine-generated) or manual (staff-raised) */
    source: text('source').notNull().default('auto'),
    /** The actual measured value that triggered the alert */
    triggerValue: text('trigger_value'),
    /** The threshold that was breached */
    triggerThreshold: text('trigger_threshold'),
    /** Human-readable alert message */
    message: text('message').notNull(),
    /** Status lifecycle: active, acknowledged, resolved, escalated */
    status: text('status').notNull().default('active'),
    /** Who acknowledged this alert */
    acknowledgedById: uuid('acknowledged_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised acknowledger name for display */
    acknowledgedByName: text('acknowledged_by_name'),
    /** When the alert was acknowledged */
    acknowledgedAt: timestamp('acknowledged_at'),
    /** Description of the action taken in response to the alert */
    actionTaken: text('action_taken'),
    /** When the alert was resolved */
    resolvedAt: timestamp('resolved_at'),
    /** Current escalation level: staff, senior, nurse, gp, emergency */
    escalationLevel: text('escalation_level').notNull().default('staff'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('clinical_alerts_organisation_id_idx').on(t.organisationId),
    /** List alerts for a specific person */
    index('clinical_alerts_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter active alerts (most common query) */
    index('clinical_alerts_organisation_person_status_idx').on(
      t.organisationId,
      t.personId,
      t.status,
    ),
    /** Filter by severity within an org */
    index('clinical_alerts_organisation_severity_idx').on(
      t.organisationId,
      t.severity,
    ),
    /** Filter by alert type */
    index('clinical_alerts_organisation_type_idx').on(
      t.organisationId,
      t.alertType,
    ),
    /** Chronological ordering */
    index('clinical_alerts_organisation_person_created_at_idx').on(
      t.organisationId,
      t.personId,
      t.createdAt,
    ),
  ],
);

export type ClinicalAlert = typeof clinicalAlerts.$inferSelect;
export type NewClinicalAlert = typeof clinicalAlerts.$inferInsert;

// ---------------------------------------------------------------------------
// Person Alert Thresholds — per-person overrides to default thresholds
// ---------------------------------------------------------------------------

/**
 * Person Alert Thresholds — customisable per-person alert thresholds.
 *
 * Allows overriding default clinical alert thresholds for a specific person,
 * e.g. a person with known low fluid requirements or a higher NEWS2 baseline.
 *
 * The customThreshold field is JSONB and its shape depends on the alertType:
 * - fluid_low: { amberMl: number, redMl: number }
 * - news2_elevated: { amberScore: number, redScore: number, emergencyScore: number }
 * - weight_loss: { amberPercent: number, redPercent: number, periodDays: number }
 * - constipation: { amberDays: number, redDays: number }
 * - diarrhoea: { thresholdCount: number }
 * - pain_sustained: { thresholdScore: number, consecutiveCount: number }
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const personAlertThresholds = pgTable(
  'person_alert_thresholds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this threshold override is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** The alert type this threshold applies to */
    alertType: text('alert_type').notNull(),
    /** Custom threshold values (shape depends on alertType) */
    customThreshold: jsonb('custom_threshold').notNull(),
    /** Clinical reason for the override */
    reason: text('reason'),
    /** Who set this threshold */
    setById: uuid('set_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised setter name */
    setByName: text('set_by_name'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('person_alert_thresholds_organisation_id_idx').on(t.organisationId),
    /** Look up thresholds for a specific person */
    index('person_alert_thresholds_org_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Unique per person + alert type (upsert pattern) */
    index('person_alert_thresholds_org_person_type_idx').on(
      t.organisationId,
      t.personId,
      t.alertType,
    ),
  ],
);

export type PersonAlertThreshold = typeof personAlertThresholds.$inferSelect;
export type NewPersonAlertThreshold = typeof personAlertThresholds.$inferInsert;
