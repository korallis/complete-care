/**
 * Zod validation schemas for EVV feature — used in server actions and forms.
 */
import { z } from 'zod';
import {
  VISIT_STATUSES,
  VISIT_TYPES,
  VERIFICATION_METHODS,
} from './constants';

// ---------------------------------------------------------------------------
// GPS coordinates
// ---------------------------------------------------------------------------

export const gpsCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMetres: z.number().min(0).optional(),
});

export type GpsCoordinates = z.infer<typeof gpsCoordinatesSchema>;

// ---------------------------------------------------------------------------
// Check-in / check-out
// ---------------------------------------------------------------------------

export const checkInSchema = z.object({
  visitId: z.string().uuid(),
  organisationId: z.string().uuid(),
  carerId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMetres: z.number().min(0).optional(),
  verificationMethod: z.enum(VERIFICATION_METHODS).default('gps'),
  verificationPayload: z.string().optional(),
  deviceInfo: z.record(z.unknown()).optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  visitId: z.string().uuid(),
  organisationId: z.string().uuid(),
  carerId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMetres: z.number().min(0).optional(),
  verificationMethod: z.enum(VERIFICATION_METHODS).default('gps'),
  verificationPayload: z.string().optional(),
  notes: z.string().max(2000).optional(),
  deviceInfo: z.record(z.unknown()).optional(),
});

export type CheckOutInput = z.infer<typeof checkOutSchema>;

// ---------------------------------------------------------------------------
// Visit creation
// ---------------------------------------------------------------------------

export const createVisitSchema = z
  .object({
    organisationId: z.string().uuid(),
    clientId: z.string().uuid(),
    clientName: z.string().min(1).max(200),
    carerId: z.string().uuid(),
    carerName: z.string().min(1).max(200),
    scheduledStart: z.coerce.date(),
    scheduledEnd: z.coerce.date(),
    expectedLatitude: z.number().min(-90).max(90),
    expectedLongitude: z.number().min(-180).max(180),
    clientAddress: z.string().min(1).max(500),
    visitType: z.enum(VISIT_TYPES).default('personal_care'),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => data.scheduledEnd > data.scheduledStart, {
    message: 'Scheduled end must be after scheduled start',
    path: ['scheduledEnd'],
  });

export type CreateVisitInput = z.infer<typeof createVisitSchema>;

// ---------------------------------------------------------------------------
// Geofence configuration
// ---------------------------------------------------------------------------

export const geofenceConfigSchema = z.object({
  organisationId: z.string().uuid(),
  clientId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMetres: z.number().int().min(10).max(1000).default(100),
  address: z.string().min(1).max(500),
  qrCodeId: z.string().optional(),
  nfcTagId: z.string().optional(),
});

export type GeofenceConfigInput = z.infer<typeof geofenceConfigSchema>;

// ---------------------------------------------------------------------------
// Alert resolution
// ---------------------------------------------------------------------------

export const resolveAlertSchema = z.object({
  alertId: z.string().uuid(),
  resolvedBy: z.string().uuid(),
  resolutionNotes: z.string().max(1000).optional(),
});

export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;

// ---------------------------------------------------------------------------
// Alert configuration
// ---------------------------------------------------------------------------

export const alertConfigSchema = z.object({
  organisationId: z.string().uuid(),
  gracePeriodMinutes: z.number().int().min(1).max(120).default(15),
  escalationDelayMinutes: z.number().int().min(1).max(240).default(30),
  missedThresholdMinutes: z.number().int().min(1).max(480).default(60),
  autoEscalate: z.boolean().default(true),
  escalationContactId: z.string().uuid().optional(),
});

export type AlertConfigInput = z.infer<typeof alertConfigSchema>;

// ---------------------------------------------------------------------------
// Query filters
// ---------------------------------------------------------------------------

export const visitFilterSchema = z.object({
  organisationId: z.string().uuid(),
  status: z.enum(VISIT_STATUSES).optional(),
  carerId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type VisitFilterInput = z.infer<typeof visitFilterSchema>;
