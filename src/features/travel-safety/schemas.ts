/**
 * Zod validation schemas for Travel Safety feature — server actions and forms.
 */
import { z } from 'zod';
import {
  TRAVEL_MODES,
  WELFARE_RESOLUTIONS,
  ROUTE_SUGGESTION_STATUSES,
  OPTIMISATION_METHODS,
  RISK_LEVELS,
} from './constants';

// ---------------------------------------------------------------------------
// Travel records
// ---------------------------------------------------------------------------

export const createTravelRecordSchema = z.object({
  organisationId: z.string().uuid(),
  carerId: z.string().uuid(),
  fromVisitId: z.string().uuid().optional(),
  toVisitId: z.string().uuid(),
  expectedMinutes: z.number().int().min(0).optional(),
  actualMinutes: z.number().int().min(0).optional(),
  expectedDistanceMiles: z.number().min(0).optional(),
  actualDistanceMiles: z.number().min(0).optional(),
  travelMode: z.enum(TRAVEL_MODES).default('car'),
  notes: z.string().max(1000).optional(),
  departedAt: z.coerce.date().optional(),
  arrivedAt: z.coerce.date().optional(),
  travelDate: z.coerce.date(),
});

export type CreateTravelRecordInput = z.infer<typeof createTravelRecordSchema>;

export const travelRecordFilterSchema = z.object({
  organisationId: z.string().uuid(),
  carerId: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type TravelRecordFilterInput = z.infer<typeof travelRecordFilterSchema>;

// ---------------------------------------------------------------------------
// Route suggestions
// ---------------------------------------------------------------------------

export const createRouteSuggestionSchema = z.object({
  organisationId: z.string().uuid(),
  carerId: z.string().uuid(),
  routeDate: z.coerce.date(),
  suggestedOrder: z.array(z.string().uuid()).min(1),
  totalEstimatedMinutes: z.number().int().min(0).optional(),
  totalEstimatedMiles: z.number().min(0).optional(),
  optimisationMethod: z.enum(OPTIMISATION_METHODS).default('simple_nearest'),
});

export type CreateRouteSuggestionInput = z.infer<typeof createRouteSuggestionSchema>;

export const updateRouteSuggestionStatusSchema = z.object({
  id: z.string().uuid(),
  organisationId: z.string().uuid(),
  status: z.enum(ROUTE_SUGGESTION_STATUSES),
});

export type UpdateRouteSuggestionStatusInput = z.infer<typeof updateRouteSuggestionStatusSchema>;

// ---------------------------------------------------------------------------
// Welfare checks
// ---------------------------------------------------------------------------

export const createWelfareCheckSchema = z.object({
  organisationId: z.string().uuid(),
  carerId: z.string().uuid(),
  visitId: z.string().uuid(),
  expectedBy: z.coerce.date(),
});

export type CreateWelfareCheckInput = z.infer<typeof createWelfareCheckSchema>;

export const resolveWelfareCheckSchema = z.object({
  id: z.string().uuid(),
  organisationId: z.string().uuid(),
  respondedBy: z.string().uuid(),
  resolution: z.enum(WELFARE_RESOLUTIONS),
  resolutionNotes: z.string().max(1000).optional(),
});

export type ResolveWelfareCheckInput = z.infer<typeof resolveWelfareCheckSchema>;

export const checkInWelfareSchema = z.object({
  id: z.string().uuid(),
  organisationId: z.string().uuid(),
});

export type CheckInWelfareInput = z.infer<typeof checkInWelfareSchema>;

// ---------------------------------------------------------------------------
// SOS alerts
// ---------------------------------------------------------------------------

export const createSosAlertSchema = z.object({
  organisationId: z.string().uuid(),
  carerId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracyMetres: z.number().min(0).optional(),
  message: z.string().max(500).optional(),
});

export type CreateSosAlertInput = z.infer<typeof createSosAlertSchema>;

export const acknowledgeSosAlertSchema = z.object({
  id: z.string().uuid(),
  organisationId: z.string().uuid(),
  acknowledgedBy: z.string().uuid(),
});

export type AcknowledgeSosAlertInput = z.infer<typeof acknowledgeSosAlertSchema>;

export const resolveSosAlertSchema = z.object({
  id: z.string().uuid(),
  organisationId: z.string().uuid(),
  resolvedBy: z.string().uuid(),
  resolutionNotes: z.string().max(1000).optional(),
  status: z.enum(['resolved', 'false_alarm'] as const),
});

export type ResolveSosAlertInput = z.infer<typeof resolveSosAlertSchema>;

// ---------------------------------------------------------------------------
// GPS tracking
// ---------------------------------------------------------------------------

export const recordGpsPositionSchema = z.object({
  organisationId: z.string().uuid(),
  carerId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMetres: z.number().min(0).optional(),
  speedKmh: z.number().min(0).optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  activityType: z.enum(['stationary', 'walking', 'driving', 'unknown'] as const).optional(),
});

export type RecordGpsPositionInput = z.infer<typeof recordGpsPositionSchema>;

// ---------------------------------------------------------------------------
// Client environment records
// ---------------------------------------------------------------------------

export const upsertClientEnvironmentSchema = z.object({
  organisationId: z.string().uuid(),
  clientId: z.string().uuid(),
  clientName: z.string().min(1).max(200),
  keySafeCodeEncrypted: z.string().max(500).optional(),
  keySafeLocation: z.string().max(500).optional(),
  accessInstructions: z.string().max(2000).optional(),
  riskNotes: z.string().max(2000).optional(),
  riskLevel: z.enum(RISK_LEVELS).default('low'),
  parkingInfo: z.string().max(1000).optional(),
  environmentNotes: z.string().max(2000).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: z.string().max(30).optional(),
  mobilityConsiderations: z.string().max(1000).optional(),
});

export type UpsertClientEnvironmentInput = z.infer<typeof upsertClientEnvironmentSchema>;

// ---------------------------------------------------------------------------
// Lone worker configuration
// ---------------------------------------------------------------------------

export const upsertLoneWorkerConfigSchema = z.object({
  organisationId: z.string().uuid(),
  welfareCheckBufferMinutes: z.number().int().min(1).max(120).default(15),
  escalationDelayMinutes: z.number().int().min(1).max(120).default(15),
  gpsTrackingEnabled: z.boolean().default(true),
  gpsPingIntervalSeconds: z.number().int().min(10).max(600).default(60),
  sosEnabled: z.boolean().default(true),
  escalationContactId: z.string().uuid().optional(),
  secondaryEscalationContactId: z.string().uuid().optional(),
  autoEmergencyCallEnabled: z.boolean().default(false),
  autoEmergencyCallDelayMinutes: z.number().int().min(15).max(240).default(60),
});

export type UpsertLoneWorkerConfigInput = z.infer<typeof upsertLoneWorkerConfigSchema>;
