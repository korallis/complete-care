import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
  doublePrecision,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { staffProfiles } from './staff-profiles';
import { scheduledVisits } from './care-packages';
import { users } from './users';

// ---------------------------------------------------------------------------
// visit_verifications table
// ---------------------------------------------------------------------------

/**
 * Visit Verifications — Electronic Visit Verification (EVV) records.
 *
 * Captures check-in/check-out data for scheduled visits including
 * GPS coordinates, verification method, and geofence compliance.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 */
export const visitVerifications = pgTable(
  'visit_verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** The scheduled visit being verified */
    scheduledVisitId: uuid('scheduled_visit_id')
      .notNull()
      .references(() => scheduledVisits.id, { onDelete: 'cascade' }),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The carer performing the visit */
    carerId: uuid('carer_id')
      .notNull()
      .references(() => staffProfiles.id, { onDelete: 'cascade' }),
    /** Check-in timestamp (null = not yet checked in) */
    checkInTime: timestamp('check_in_time'),
    /** Check-out timestamp (null = not yet checked out) */
    checkOutTime: timestamp('check_out_time'),
    /** Method used for check-in: gps | qr | manual */
    checkInMethod: text('check_in_method'),
    /** Method used for check-out: gps | qr | manual */
    checkOutMethod: text('check_out_method'),
    /** GPS latitude at check-in */
    checkInLat: doublePrecision('check_in_lat'),
    /** GPS longitude at check-in */
    checkInLng: doublePrecision('check_in_lng'),
    /** GPS latitude at check-out */
    checkOutLat: doublePrecision('check_out_lat'),
    /** GPS longitude at check-out */
    checkOutLng: doublePrecision('check_out_lng'),
    /** Distance in metres from client location at check-in */
    checkInDistance: doublePrecision('check_in_distance'),
    /** Whether check-in was within geofence radius */
    isWithinGeofence: boolean('is_within_geofence'),
    /** Reason for manual override (required when method is 'manual') */
    manualOverrideReason: text('manual_override_reason'),
    /** Coordinator who approved the manual override */
    approvedById: uuid('approved_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Whether the manual override has been approved */
    overrideApproved: boolean('override_approved'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('visit_verifications_organisation_id_idx').on(t.organisationId),
    /** Look up verification by scheduled visit */
    index('visit_verifications_scheduled_visit_idx').on(
      t.scheduledVisitId,
    ),
    /** Verifications by carer */
    index('visit_verifications_carer_idx').on(
      t.organisationId,
      t.carerId,
    ),
    /** Pending manual overrides */
    index('visit_verifications_pending_override_idx').on(
      t.organisationId,
      t.checkInMethod,
      t.overrideApproved,
    ),
  ],
);

export type VisitVerification = typeof visitVerifications.$inferSelect;
export type NewVisitVerification = typeof visitVerifications.$inferInsert;

// ---------------------------------------------------------------------------
// client_locations table
// ---------------------------------------------------------------------------

/**
 * Client Locations — GPS coordinates and QR codes for EVV geofencing.
 *
 * Each client has a stored location with a configurable geofence radius.
 * A unique QR code is generated for each client to enable QR-based check-in.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 */
export const clientLocations = pgTable(
  'client_locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** The client this location belongs to */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Tenant scope */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** GPS latitude of client address */
    lat: doublePrecision('lat').notNull(),
    /** GPS longitude of client address */
    lng: doublePrecision('lng').notNull(),
    /** Geofence radius in metres (default 50m) */
    geofenceRadius: integer('geofence_radius').notNull().default(50),
    /** Unique QR code string for this client */
    qrCode: text('qr_code').notNull().unique(),
    /** Optional label (e.g. "Home", "Day centre") */
    label: text('label'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Tenant isolation */
    index('client_locations_organisation_id_idx').on(t.organisationId),
    /** Look up location by person */
    index('client_locations_person_idx').on(t.organisationId, t.personId),
    /** QR code lookup */
    index('client_locations_qr_code_idx').on(t.qrCode),
  ],
);

export type ClientLocation = typeof clientLocations.$inferSelect;
export type NewClientLocation = typeof clientLocations.$inferInsert;
