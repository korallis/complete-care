'use server';

/**
 * Travel Safety server actions — travel time tracking, welfare checks,
 * SOS alerts, GPS tracking, client environment records, route suggestions.
 * All actions enforce multi-tenant isolation via organisationId.
 */

import { db } from '@/lib/db';
import {
  travelRecords,
  routeSuggestions,
  welfareChecks,
  sosAlerts,
  gpsTrackingRecords,
  clientEnvironments,
  loneWorkerConfigs,
} from '@/lib/db/schema/visit-tasks';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import {
  createTravelRecordSchema,
  travelRecordFilterSchema,
  createRouteSuggestionSchema,
  updateRouteSuggestionStatusSchema,
  createWelfareCheckSchema,
  resolveWelfareCheckSchema,
  checkInWelfareSchema,
  createSosAlertSchema,
  acknowledgeSosAlertSchema,
  resolveSosAlertSchema,
  recordGpsPositionSchema,
  upsertClientEnvironmentSchema,
  upsertLoneWorkerConfigSchema,
  type CreateTravelRecordInput,
  type TravelRecordFilterInput,
  type CreateRouteSuggestionInput,
  type UpdateRouteSuggestionStatusInput,
  type CreateWelfareCheckInput,
  type ResolveWelfareCheckInput,
  type CheckInWelfareInput,
  type CreateSosAlertInput,
  type AcknowledgeSosAlertInput,
  type ResolveSosAlertInput,
  type RecordGpsPositionInput,
  type UpsertClientEnvironmentInput,
  type UpsertLoneWorkerConfigInput,
} from './schemas';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Travel Records
// ---------------------------------------------------------------------------

export async function createTravelRecord(
  input: CreateTravelRecordInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createTravelRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;
  const isOverdue =
    data.expectedMinutes != null &&
    data.actualMinutes != null &&
    data.actualMinutes > data.expectedMinutes;

  const [record] = await db
    .insert(travelRecords)
    .values({
      ...data,
      fromVisitId: data.fromVisitId ?? null,
      isOverdue,
    })
    .returning({ id: travelRecords.id });

  return { success: true, data: { id: record.id } };
}

export async function getTravelRecords(
  input: TravelRecordFilterInput,
): Promise<ActionResult<(typeof travelRecords.$inferSelect)[]>> {
  const parsed = travelRecordFilterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const filters = parsed.data;
  const conditions = [eq(travelRecords.organisationId, filters.organisationId)];

  if (filters.carerId) {
    conditions.push(eq(travelRecords.carerId, filters.carerId));
  }
  if (filters.dateFrom) {
    conditions.push(gte(travelRecords.travelDate, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(travelRecords.travelDate, filters.dateTo));
  }

  const results = await db
    .select()
    .from(travelRecords)
    .where(and(...conditions))
    .orderBy(desc(travelRecords.travelDate));

  return { success: true, data: results };
}

// ---------------------------------------------------------------------------
// Route Suggestions
// ---------------------------------------------------------------------------

export async function createRouteSuggestion(
  input: CreateRouteSuggestionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createRouteSuggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const [suggestion] = await db
    .insert(routeSuggestions)
    .values(parsed.data)
    .returning({ id: routeSuggestions.id });

  return { success: true, data: { id: suggestion.id } };
}

export async function updateRouteSuggestionStatus(
  input: UpdateRouteSuggestionStatusInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateRouteSuggestionStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { id, organisationId, status } = parsed.data;

  const [suggestion] = await db
    .update(routeSuggestions)
    .set({ status })
    .where(
      and(
        eq(routeSuggestions.id, id),
        eq(routeSuggestions.organisationId, organisationId),
      ),
    )
    .returning({ id: routeSuggestions.id });

  if (!suggestion) {
    return { success: false, error: 'Route suggestion not found' };
  }

  return { success: true, data: { id: suggestion.id } };
}

export async function getRouteSuggestion(
  organisationId: string,
  carerId: string,
  routeDate: Date,
): Promise<ActionResult<typeof routeSuggestions.$inferSelect | null>> {
  const [suggestion] = await db
    .select()
    .from(routeSuggestions)
    .where(
      and(
        eq(routeSuggestions.organisationId, organisationId),
        eq(routeSuggestions.carerId, carerId),
        eq(routeSuggestions.routeDate, routeDate),
      ),
    );

  return { success: true, data: suggestion ?? null };
}

// ---------------------------------------------------------------------------
// Welfare Checks
// ---------------------------------------------------------------------------

export async function createWelfareCheck(
  input: CreateWelfareCheckInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createWelfareCheckSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const [check] = await db
    .insert(welfareChecks)
    .values(parsed.data)
    .returning({ id: welfareChecks.id });

  return { success: true, data: { id: check.id } };
}

export async function checkInWelfare(
  input: CheckInWelfareInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = checkInWelfareSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { id, organisationId } = parsed.data;

  const [check] = await db
    .update(welfareChecks)
    .set({
      status: 'checked_in',
      checkedInAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(welfareChecks.id, id),
        eq(welfareChecks.organisationId, organisationId),
      ),
    )
    .returning({ id: welfareChecks.id });

  if (!check) {
    return { success: false, error: 'Welfare check not found' };
  }

  return { success: true, data: { id: check.id } };
}

export async function resolveWelfareCheck(
  input: ResolveWelfareCheckInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = resolveWelfareCheckSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { id, organisationId, respondedBy, resolution, resolutionNotes } =
    parsed.data;

  const [check] = await db
    .update(welfareChecks)
    .set({
      status: 'resolved',
      respondedBy,
      respondedAt: new Date(),
      resolution,
      resolutionNotes: resolutionNotes ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(welfareChecks.id, id),
        eq(welfareChecks.organisationId, organisationId),
      ),
    )
    .returning({ id: welfareChecks.id });

  if (!check) {
    return { success: false, error: 'Welfare check not found' };
  }

  return { success: true, data: { id: check.id } };
}

export async function getOverdueWelfareChecks(
  organisationId: string,
): Promise<ActionResult<(typeof welfareChecks.$inferSelect)[]>> {
  const now = new Date();

  const results = await db
    .select()
    .from(welfareChecks)
    .where(
      and(
        eq(welfareChecks.organisationId, organisationId),
        eq(welfareChecks.status, 'pending'),
        lte(welfareChecks.expectedBy, now),
      ),
    )
    .orderBy(welfareChecks.expectedBy);

  return { success: true, data: results };
}

export async function getActiveWelfareChecks(
  organisationId: string,
): Promise<ActionResult<(typeof welfareChecks.$inferSelect)[]>> {
  const results = await db
    .select()
    .from(welfareChecks)
    .where(
      and(
        eq(welfareChecks.organisationId, organisationId),
        eq(welfareChecks.status, 'pending'),
      ),
    )
    .orderBy(welfareChecks.expectedBy);

  return { success: true, data: results };
}

// ---------------------------------------------------------------------------
// SOS Alerts
// ---------------------------------------------------------------------------

export async function createSosAlert(
  input: CreateSosAlertInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createSosAlertSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const [alert] = await db
    .insert(sosAlerts)
    .values({
      ...parsed.data,
      visitId: parsed.data.visitId ?? null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      accuracyMetres: parsed.data.accuracyMetres ?? null,
      message: parsed.data.message ?? null,
    })
    .returning({ id: sosAlerts.id });

  return { success: true, data: { id: alert.id } };
}

export async function acknowledgeSosAlert(
  input: AcknowledgeSosAlertInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = acknowledgeSosAlertSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { id, organisationId, acknowledgedBy } = parsed.data;

  const [alert] = await db
    .update(sosAlerts)
    .set({
      status: 'acknowledged',
      acknowledgedBy,
      acknowledgedAt: new Date(),
    })
    .where(
      and(
        eq(sosAlerts.id, id),
        eq(sosAlerts.organisationId, organisationId),
      ),
    )
    .returning({ id: sosAlerts.id });

  if (!alert) {
    return { success: false, error: 'SOS alert not found' };
  }

  return { success: true, data: { id: alert.id } };
}

export async function resolveSosAlert(
  input: ResolveSosAlertInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = resolveSosAlertSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { id, organisationId, resolvedBy, resolutionNotes, status } =
    parsed.data;

  const [alert] = await db
    .update(sosAlerts)
    .set({
      status,
      resolvedBy,
      resolvedAt: new Date(),
      resolutionNotes: resolutionNotes ?? null,
    })
    .where(
      and(
        eq(sosAlerts.id, id),
        eq(sosAlerts.organisationId, organisationId),
      ),
    )
    .returning({ id: sosAlerts.id });

  if (!alert) {
    return { success: false, error: 'SOS alert not found' };
  }

  return { success: true, data: { id: alert.id } };
}

export async function getActiveSosAlerts(
  organisationId: string,
): Promise<ActionResult<(typeof sosAlerts.$inferSelect)[]>> {
  const results = await db
    .select()
    .from(sosAlerts)
    .where(
      and(
        eq(sosAlerts.organisationId, organisationId),
        eq(sosAlerts.status, 'active'),
      ),
    )
    .orderBy(desc(sosAlerts.createdAt));

  return { success: true, data: results };
}

// ---------------------------------------------------------------------------
// GPS Tracking
// ---------------------------------------------------------------------------

export async function recordGpsPosition(
  input: RecordGpsPositionInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = recordGpsPositionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const [record] = await db
    .insert(gpsTrackingRecords)
    .values({
      ...parsed.data,
      visitId: parsed.data.visitId ?? null,
      accuracyMetres: parsed.data.accuracyMetres ?? null,
      speedKmh: parsed.data.speedKmh ?? null,
      batteryLevel: parsed.data.batteryLevel ?? null,
      activityType: parsed.data.activityType ?? 'stationary',
    })
    .returning({ id: gpsTrackingRecords.id });

  return { success: true, data: { id: record.id } };
}

export async function getCarerGpsTrail(
  organisationId: string,
  carerId: string,
  from: Date,
  to: Date,
): Promise<ActionResult<(typeof gpsTrackingRecords.$inferSelect)[]>> {
  const results = await db
    .select()
    .from(gpsTrackingRecords)
    .where(
      and(
        eq(gpsTrackingRecords.organisationId, organisationId),
        eq(gpsTrackingRecords.carerId, carerId),
        gte(gpsTrackingRecords.timestamp, from),
        lte(gpsTrackingRecords.timestamp, to),
      ),
    )
    .orderBy(gpsTrackingRecords.timestamp);

  return { success: true, data: results };
}

// ---------------------------------------------------------------------------
// Client Environment Records
// ---------------------------------------------------------------------------

export async function upsertClientEnvironment(
  input: UpsertClientEnvironmentInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = upsertClientEnvironmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  // Check if record exists
  const [existing] = await db
    .select({ id: clientEnvironments.id })
    .from(clientEnvironments)
    .where(
      and(
        eq(clientEnvironments.organisationId, data.organisationId),
        eq(clientEnvironments.clientId, data.clientId),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(clientEnvironments)
      .set({
        clientName: data.clientName,
        keySafeCodeEncrypted: data.keySafeCodeEncrypted ?? null,
        keySafeLocation: data.keySafeLocation ?? null,
        accessInstructions: data.accessInstructions ?? null,
        riskNotes: data.riskNotes ?? null,
        riskLevel: data.riskLevel,
        parkingInfo: data.parkingInfo ?? null,
        environmentNotes: data.environmentNotes ?? null,
        emergencyContactName: data.emergencyContactName ?? null,
        emergencyContactPhone: data.emergencyContactPhone ?? null,
        mobilityConsiderations: data.mobilityConsiderations ?? null,
        updatedAt: new Date(),
      })
      .where(eq(clientEnvironments.id, existing.id))
      .returning({ id: clientEnvironments.id });

    return { success: true, data: { id: updated.id } };
  }

  const [created] = await db
    .insert(clientEnvironments)
    .values({
      organisationId: data.organisationId,
      clientId: data.clientId,
      clientName: data.clientName,
      keySafeCodeEncrypted: data.keySafeCodeEncrypted ?? null,
      keySafeLocation: data.keySafeLocation ?? null,
      accessInstructions: data.accessInstructions ?? null,
      riskNotes: data.riskNotes ?? null,
      riskLevel: data.riskLevel,
      parkingInfo: data.parkingInfo ?? null,
      environmentNotes: data.environmentNotes ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      mobilityConsiderations: data.mobilityConsiderations ?? null,
    })
    .returning({ id: clientEnvironments.id });

  return { success: true, data: { id: created.id } };
}

export async function getClientEnvironment(
  organisationId: string,
  clientId: string,
): Promise<ActionResult<typeof clientEnvironments.$inferSelect | null>> {
  const [record] = await db
    .select()
    .from(clientEnvironments)
    .where(
      and(
        eq(clientEnvironments.organisationId, organisationId),
        eq(clientEnvironments.clientId, clientId),
      ),
    );

  return { success: true, data: record ?? null };
}

export async function getClientEnvironments(
  organisationId: string,
): Promise<ActionResult<(typeof clientEnvironments.$inferSelect)[]>> {
  const results = await db
    .select()
    .from(clientEnvironments)
    .where(eq(clientEnvironments.organisationId, organisationId))
    .orderBy(clientEnvironments.clientName);

  return { success: true, data: results };
}

// ---------------------------------------------------------------------------
// Lone Worker Configuration
// ---------------------------------------------------------------------------

export async function upsertLoneWorkerConfig(
  input: UpsertLoneWorkerConfigInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = upsertLoneWorkerConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  const [existing] = await db
    .select({ id: loneWorkerConfigs.id })
    .from(loneWorkerConfigs)
    .where(eq(loneWorkerConfigs.organisationId, data.organisationId));

  if (existing) {
    const [updated] = await db
      .update(loneWorkerConfigs)
      .set({
        ...data,
        escalationContactId: data.escalationContactId ?? null,
        secondaryEscalationContactId: data.secondaryEscalationContactId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(loneWorkerConfigs.id, existing.id))
      .returning({ id: loneWorkerConfigs.id });

    return { success: true, data: { id: updated.id } };
  }

  const [created] = await db
    .insert(loneWorkerConfigs)
    .values({
      ...data,
      escalationContactId: data.escalationContactId ?? null,
      secondaryEscalationContactId: data.secondaryEscalationContactId ?? null,
    })
    .returning({ id: loneWorkerConfigs.id });

  return { success: true, data: { id: created.id } };
}

export async function getLoneWorkerConfig(
  organisationId: string,
): Promise<ActionResult<typeof loneWorkerConfigs.$inferSelect | null>> {
  const [config] = await db
    .select()
    .from(loneWorkerConfigs)
    .where(eq(loneWorkerConfigs.organisationId, organisationId));

  return { success: true, data: config ?? null };
}
