import {
  pgTable,
  uuid,
  text,
  timestamp,
  doublePrecision,
  integer,
  boolean,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ---------------------------------------------------------------------------
// Scheduled visits — the expected visit plan
// ---------------------------------------------------------------------------

/**
 * EVV scheduled visits — represents a planned domiciliary care visit.
 * Each visit has a client, assigned carer, expected times, and location.
 */
export const evvVisits = pgTable(
  'evv_visits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The client (service user) receiving the visit */
    clientId: uuid('client_id').notNull(),
    /** Display name cached for dashboard performance */
    clientName: text('client_name').notNull(),
    /** The carer assigned to perform the visit */
    carerId: uuid('carer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Display name cached for dashboard performance */
    carerName: text('carer_name').notNull(),
    /** Scheduled start time */
    scheduledStart: timestamp('scheduled_start').notNull(),
    /** Scheduled end time */
    scheduledEnd: timestamp('scheduled_end').notNull(),
    /** Expected location — latitude */
    expectedLatitude: doublePrecision('expected_latitude').notNull(),
    /** Expected location — longitude */
    expectedLongitude: doublePrecision('expected_longitude').notNull(),
    /** Client address for display */
    clientAddress: text('client_address').notNull(),
    /**
     * Visit status: scheduled | in_progress | completed | missed | cancelled
     */
    status: text('status').notNull().default('scheduled'),
    /** Actual check-in time (set when carer checks in) */
    actualStart: timestamp('actual_start'),
    /** Actual check-out time (set when carer checks out) */
    actualEnd: timestamp('actual_end'),
    /** Actual duration in minutes */
    actualDurationMinutes: integer('actual_duration_minutes'),
    /** Notes recorded by carer during visit */
    notes: text('notes'),
    /** Visit type: personal_care | medication | meal_prep | wellness_check | other */
    visitType: text('visit_type').notNull().default('personal_care'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('evv_visits_organisation_id_idx').on(t.organisationId),
    index('evv_visits_client_id_idx').on(t.clientId),
    index('evv_visits_carer_id_idx').on(t.carerId),
    index('evv_visits_status_idx').on(t.status),
    index('evv_visits_scheduled_start_idx').on(t.scheduledStart),
    index('evv_visits_org_status_idx').on(t.organisationId, t.status),
  ],
);

export type EvvVisit = typeof evvVisits.$inferSelect;
export type NewEvvVisit = typeof evvVisits.$inferInsert;

// ---------------------------------------------------------------------------
// Check-in / check-out records — GPS verification events
// ---------------------------------------------------------------------------

/**
 * EVV check-in events — captures GPS coordinates and verification method
 * at the moment a carer arrives or departs.
 */
export const evvCheckEvents = pgTable(
  'evv_check_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    visitId: uuid('visit_id')
      .notNull()
      .references(() => evvVisits.id, { onDelete: 'cascade' }),
    carerId: uuid('carer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** check_in | check_out */
    eventType: text('event_type').notNull(),
    /** GPS latitude at time of event */
    latitude: doublePrecision('latitude').notNull(),
    /** GPS longitude at time of event */
    longitude: doublePrecision('longitude').notNull(),
    /** GPS accuracy in metres */
    accuracyMetres: doublePrecision('accuracy_metres'),
    /** Distance from expected client location in metres */
    distanceFromExpectedMetres: doublePrecision('distance_from_expected_metres'),
    /** Whether the check was within the geofence */
    withinGeofence: boolean('within_geofence').notNull().default(false),
    /** Verification method: gps | qr_code | nfc | manual_override */
    verificationMethod: text('verification_method').notNull().default('gps'),
    /** If QR/NFC, the scanned payload */
    verificationPayload: text('verification_payload'),
    /** Device metadata */
    deviceInfo: jsonb('device_info'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (t) => [
    index('evv_check_events_organisation_id_idx').on(t.organisationId),
    index('evv_check_events_visit_id_idx').on(t.visitId),
    index('evv_check_events_carer_id_idx').on(t.carerId),
    index('evv_check_events_timestamp_idx').on(t.timestamp),
  ],
);

export type EvvCheckEvent = typeof evvCheckEvents.$inferSelect;
export type NewEvvCheckEvent = typeof evvCheckEvents.$inferInsert;

// ---------------------------------------------------------------------------
// Geofence configurations — per-client location verification settings
// ---------------------------------------------------------------------------

/**
 * Geofence configuration per client location.
 * Defines the allowed radius and address for EVV geofencing.
 */
export const evvGeofenceConfigs = pgTable(
  'evv_geofence_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The client this geofence applies to */
    clientId: uuid('client_id').notNull(),
    /** Centre latitude */
    latitude: doublePrecision('latitude').notNull(),
    /** Centre longitude */
    longitude: doublePrecision('longitude').notNull(),
    /** Allowed radius in metres (default 100m) */
    radiusMetres: integer('radius_metres').notNull().default(100),
    /** Human-readable address */
    address: text('address').notNull(),
    /** Whether this config is active */
    isActive: boolean('is_active').notNull().default(true),
    /** Optional QR code identifier for this location */
    qrCodeId: text('qr_code_id'),
    /** Optional NFC tag identifier for this location */
    nfcTagId: text('nfc_tag_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('evv_geofence_configs_organisation_id_idx').on(t.organisationId),
    index('evv_geofence_configs_client_id_idx').on(t.clientId),
  ],
);

export type EvvGeofenceConfig = typeof evvGeofenceConfigs.$inferSelect;
export type NewEvvGeofenceConfig = typeof evvGeofenceConfigs.$inferInsert;

// ---------------------------------------------------------------------------
// Visit alerts — missed/late visit notifications
// ---------------------------------------------------------------------------

/**
 * EVV alerts — generated when visits are late or missed.
 * Supports escalation from initial alert to coordinator notification.
 */
export const evvAlerts = pgTable(
  'evv_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    visitId: uuid('visit_id')
      .notNull()
      .references(() => evvVisits.id, { onDelete: 'cascade' }),
    /** Alert type: late_start | missed | late_checkout | geofence_breach */
    alertType: text('alert_type').notNull(),
    /** Severity: low | medium | high | critical */
    severity: text('severity').notNull().default('medium'),
    /** Alert message */
    message: text('message').notNull(),
    /** Alert status: active | acknowledged | resolved | escalated */
    status: text('status').notNull().default('active'),
    /** Minutes past the grace period when alert was triggered */
    minutesOverdue: integer('minutes_overdue'),
    /** User who acknowledged/resolved the alert */
    resolvedBy: uuid('resolved_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    resolvedAt: timestamp('resolved_at'),
    /** Resolution notes */
    resolutionNotes: text('resolution_notes'),
    /** Whether the alert has been escalated to a coordinator */
    escalated: boolean('escalated').notNull().default(false),
    escalatedAt: timestamp('escalated_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('evv_alerts_organisation_id_idx').on(t.organisationId),
    index('evv_alerts_visit_id_idx').on(t.visitId),
    index('evv_alerts_status_idx').on(t.status),
    index('evv_alerts_org_status_idx').on(t.organisationId, t.status),
    index('evv_alerts_created_at_idx').on(t.createdAt),
  ],
);

export type EvvAlert = typeof evvAlerts.$inferSelect;
export type NewEvvAlert = typeof evvAlerts.$inferInsert;

// ---------------------------------------------------------------------------
// Alert configuration — grace periods and escalation rules
// ---------------------------------------------------------------------------

/**
 * EVV alert configuration — per-organisation settings for alerting.
 */
export const evvAlertConfigs = pgTable(
  'evv_alert_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Grace period in minutes before a late alert is triggered (default 15) */
    gracePeriodMinutes: integer('grace_period_minutes').notNull().default(15),
    /** Minutes after grace period before escalation (default 30) */
    escalationDelayMinutes: integer('escalation_delay_minutes')
      .notNull()
      .default(30),
    /** Minutes after scheduled end to mark as missed if not started (default 60) */
    missedThresholdMinutes: integer('missed_threshold_minutes')
      .notNull()
      .default(60),
    /** Whether to auto-escalate to coordinator */
    autoEscalate: boolean('auto_escalate').notNull().default(true),
    /** Coordinator user ID for escalations */
    escalationContactId: uuid('escalation_contact_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('evv_alert_configs_organisation_id_idx').on(t.organisationId),
  ],
);

export type EvvAlertConfig = typeof evvAlertConfigs.$inferSelect;
export type NewEvvAlertConfig = typeof evvAlertConfigs.$inferInsert;
