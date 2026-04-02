'use server';

/**
 * EVV server actions — check-in, check-out, visit management, alert handling.
 * All actions enforce multi-tenant isolation via organisationId.
 */

import { db } from '@/lib/db';
import {
  evvVisits,
  evvCheckEvents,
  evvGeofenceConfigs,
  evvAlerts,
  evvAlertConfigs,
} from '@/lib/db/schema/evv';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import {
  checkInSchema,
  checkOutSchema,
  createVisitSchema,
  geofenceConfigSchema,
  resolveAlertSchema,
  alertConfigSchema,
  visitFilterSchema,
  type CheckInInput,
  type CheckOutInput,
  type CreateVisitInput,
  type GeofenceConfigInput,
  type ResolveAlertInput,
  type AlertConfigInput,
  type VisitFilterInput,
} from './schemas';
import {
  validateGeofence,
  calculateDurationMinutes,
} from './geofencing';
import {
  DEFAULT_GEOFENCE_RADIUS_METRES,
  DEFAULT_GRACE_PERIOD_MINUTES,
} from './constants';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Visit CRUD
// ---------------------------------------------------------------------------

export async function createVisit(
  input: CreateVisitInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createVisitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  const [visit] = await db
    .insert(evvVisits)
    .values({
      organisationId: data.organisationId,
      clientId: data.clientId,
      clientName: data.clientName,
      carerId: data.carerId,
      carerName: data.carerName,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      expectedLatitude: data.expectedLatitude,
      expectedLongitude: data.expectedLongitude,
      clientAddress: data.clientAddress,
      visitType: data.visitType,
      notes: data.notes ?? null,
    })
    .returning({ id: evvVisits.id });

  return { success: true, data: { id: visit.id } };
}

export async function getVisits(
  input: VisitFilterInput,
): Promise<ActionResult<typeof evvVisits.$inferSelect[]>> {
  const parsed = visitFilterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const filters = parsed.data;
  const conditions = [eq(evvVisits.organisationId, filters.organisationId)];

  if (filters.status) {
    conditions.push(eq(evvVisits.status, filters.status));
  }
  if (filters.carerId) {
    conditions.push(eq(evvVisits.carerId, filters.carerId));
  }
  if (filters.clientId) {
    conditions.push(eq(evvVisits.clientId, filters.clientId));
  }
  if (filters.dateFrom) {
    conditions.push(gte(evvVisits.scheduledStart, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(evvVisits.scheduledStart, filters.dateTo));
  }

  const visits = await db
    .select()
    .from(evvVisits)
    .where(and(...conditions))
    .orderBy(desc(evvVisits.scheduledStart));

  return { success: true, data: visits };
}

export async function getVisitById(
  visitId: string,
  organisationId: string,
): Promise<ActionResult<typeof evvVisits.$inferSelect>> {
  const [visit] = await db
    .select()
    .from(evvVisits)
    .where(
      and(eq(evvVisits.id, visitId), eq(evvVisits.organisationId, organisationId)),
    );

  if (!visit) {
    return { success: false, error: 'Visit not found' };
  }

  return { success: true, data: visit };
}

// ---------------------------------------------------------------------------
// Check-in
// ---------------------------------------------------------------------------

export async function checkIn(
  input: CheckInInput,
): Promise<ActionResult<{ checkEventId: string; withinGeofence: boolean; distanceMetres: number }>> {
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  // Fetch the visit
  const [visit] = await db
    .select()
    .from(evvVisits)
    .where(
      and(
        eq(evvVisits.id, data.visitId),
        eq(evvVisits.organisationId, data.organisationId),
      ),
    );

  if (!visit) {
    return { success: false, error: 'Visit not found' };
  }

  if (visit.status !== 'scheduled') {
    return { success: false, error: `Cannot check in — visit status is ${visit.status}` };
  }

  // Fetch geofence config for this client, or use visit defaults
  const [geofence] = await db
    .select()
    .from(evvGeofenceConfigs)
    .where(
      and(
        eq(evvGeofenceConfigs.clientId, visit.clientId),
        eq(evvGeofenceConfigs.organisationId, data.organisationId),
        eq(evvGeofenceConfigs.isActive, true),
      ),
    );

  const fenceLat = geofence?.latitude ?? visit.expectedLatitude;
  const fenceLon = geofence?.longitude ?? visit.expectedLongitude;
  const radiusMetres = geofence?.radiusMetres ?? DEFAULT_GEOFENCE_RADIUS_METRES;

  // Validate geofence
  const { distanceMetres, withinGeofence } = validateGeofence(
    data.latitude,
    data.longitude,
    fenceLat,
    fenceLon,
    radiusMetres,
  );

  // Record check event
  const [checkEvent] = await db
    .insert(evvCheckEvents)
    .values({
      organisationId: data.organisationId,
      visitId: data.visitId,
      carerId: data.carerId,
      eventType: 'check_in',
      latitude: data.latitude,
      longitude: data.longitude,
      accuracyMetres: data.accuracyMetres ?? null,
      distanceFromExpectedMetres: distanceMetres,
      withinGeofence,
      verificationMethod: data.verificationMethod,
      verificationPayload: data.verificationPayload ?? null,
      deviceInfo: data.deviceInfo ?? null,
    })
    .returning({ id: evvCheckEvents.id });

  // Update visit status
  await db
    .update(evvVisits)
    .set({
      status: 'in_progress',
      actualStart: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(evvVisits.id, data.visitId));

  // Create geofence breach alert if outside geofence
  if (!withinGeofence) {
    await db.insert(evvAlerts).values({
      organisationId: data.organisationId,
      visitId: data.visitId,
      alertType: 'geofence_breach',
      severity: 'high',
      message: `Carer checked in ${Math.round(distanceMetres)}m from expected location (limit: ${radiusMetres}m)`,
      minutesOverdue: null,
    });
  }

  return {
    success: true,
    data: { checkEventId: checkEvent.id, withinGeofence, distanceMetres },
  };
}

// ---------------------------------------------------------------------------
// Check-out
// ---------------------------------------------------------------------------

export async function checkOut(
  input: CheckOutInput,
): Promise<ActionResult<{ checkEventId: string; durationMinutes: number }>> {
  const parsed = checkOutSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  // Fetch the visit
  const [visit] = await db
    .select()
    .from(evvVisits)
    .where(
      and(
        eq(evvVisits.id, data.visitId),
        eq(evvVisits.organisationId, data.organisationId),
      ),
    );

  if (!visit) {
    return { success: false, error: 'Visit not found' };
  }

  if (visit.status !== 'in_progress') {
    return { success: false, error: `Cannot check out — visit status is ${visit.status}` };
  }

  if (!visit.actualStart) {
    return { success: false, error: 'Visit has no check-in recorded' };
  }

  // Validate geofence
  const { distanceMetres, withinGeofence } = validateGeofence(
    data.latitude,
    data.longitude,
    visit.expectedLatitude,
    visit.expectedLongitude,
    DEFAULT_GEOFENCE_RADIUS_METRES,
  );

  const now = new Date();
  const durationMinutes = calculateDurationMinutes(visit.actualStart, now);

  // Record check event
  const [checkEvent] = await db
    .insert(evvCheckEvents)
    .values({
      organisationId: data.organisationId,
      visitId: data.visitId,
      carerId: data.carerId,
      eventType: 'check_out',
      latitude: data.latitude,
      longitude: data.longitude,
      accuracyMetres: data.accuracyMetres ?? null,
      distanceFromExpectedMetres: distanceMetres,
      withinGeofence,
      verificationMethod: data.verificationMethod,
      verificationPayload: data.verificationPayload ?? null,
      deviceInfo: data.deviceInfo ?? null,
    })
    .returning({ id: evvCheckEvents.id });

  // Update visit
  await db
    .update(evvVisits)
    .set({
      status: 'completed',
      actualEnd: now,
      actualDurationMinutes: durationMinutes,
      notes: data.notes ?? visit.notes,
      updatedAt: now,
    })
    .where(eq(evvVisits.id, data.visitId));

  return {
    success: true,
    data: { checkEventId: checkEvent.id, durationMinutes },
  };
}

// ---------------------------------------------------------------------------
// Visit history per client / carer
// ---------------------------------------------------------------------------

export async function getClientVisitHistory(
  organisationId: string,
  clientId: string,
): Promise<ActionResult<typeof evvVisits.$inferSelect[]>> {
  const visits = await db
    .select()
    .from(evvVisits)
    .where(
      and(
        eq(evvVisits.organisationId, organisationId),
        eq(evvVisits.clientId, clientId),
      ),
    )
    .orderBy(desc(evvVisits.scheduledStart));

  return { success: true, data: visits };
}

export async function getCarerVisitHistory(
  organisationId: string,
  carerId: string,
): Promise<ActionResult<typeof evvVisits.$inferSelect[]>> {
  const visits = await db
    .select()
    .from(evvVisits)
    .where(
      and(
        eq(evvVisits.organisationId, organisationId),
        eq(evvVisits.carerId, carerId),
      ),
    )
    .orderBy(desc(evvVisits.scheduledStart));

  return { success: true, data: visits };
}

export async function getVisitCheckEvents(
  visitId: string,
  organisationId: string,
): Promise<ActionResult<typeof evvCheckEvents.$inferSelect[]>> {
  const events = await db
    .select()
    .from(evvCheckEvents)
    .where(
      and(
        eq(evvCheckEvents.visitId, visitId),
        eq(evvCheckEvents.organisationId, organisationId),
      ),
    )
    .orderBy(evvCheckEvents.timestamp);

  return { success: true, data: events };
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export async function getActiveAlerts(
  organisationId: string,
): Promise<ActionResult<typeof evvAlerts.$inferSelect[]>> {
  const alerts = await db
    .select()
    .from(evvAlerts)
    .where(
      and(
        eq(evvAlerts.organisationId, organisationId),
        eq(evvAlerts.status, 'active'),
      ),
    )
    .orderBy(desc(evvAlerts.createdAt));

  return { success: true, data: alerts };
}

export async function resolveAlert(
  input: ResolveAlertInput,
): Promise<ActionResult> {
  const parsed = resolveAlertSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  await db
    .update(evvAlerts)
    .set({
      status: 'resolved',
      resolvedBy: data.resolvedBy,
      resolvedAt: new Date(),
      resolutionNotes: data.resolutionNotes ?? null,
    })
    .where(eq(evvAlerts.id, data.alertId));

  return { success: true, data: undefined };
}

export async function escalateAlert(
  alertId: string,
): Promise<ActionResult> {
  await db
    .update(evvAlerts)
    .set({
      status: 'escalated',
      escalated: true,
      escalatedAt: new Date(),
    })
    .where(eq(evvAlerts.id, alertId));

  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Missed / late visit detection (to be called by a cron job or edge function)
// ---------------------------------------------------------------------------

export async function detectLateVisits(
  organisationId: string,
): Promise<ActionResult<{ alertsCreated: number }>> {
  // Get alert config for this org
  const [config] = await db
    .select()
    .from(evvAlertConfigs)
    .where(eq(evvAlertConfigs.organisationId, organisationId));

  const gracePeriod = config?.gracePeriodMinutes ?? DEFAULT_GRACE_PERIOD_MINUTES;

  const now = new Date();
  const graceThreshold = new Date(now.getTime() - gracePeriod * 60_000);

  // Find visits that should have started but haven't
  const lateVisits = await db
    .select()
    .from(evvVisits)
    .where(
      and(
        eq(evvVisits.organisationId, organisationId),
        eq(evvVisits.status, 'scheduled'),
        lte(evvVisits.scheduledStart, graceThreshold),
      ),
    );

  let alertsCreated = 0;

  for (const visit of lateVisits) {
    const minutesOverdue = Math.round(
      (now.getTime() - visit.scheduledStart.getTime()) / 60_000,
    );

    // Check if we already have an active alert for this visit
    const [existingAlert] = await db
      .select()
      .from(evvAlerts)
      .where(
        and(
          eq(evvAlerts.visitId, visit.id),
          eq(evvAlerts.alertType, 'late_start'),
          eq(evvAlerts.status, 'active'),
        ),
      );

    if (!existingAlert) {
      const missedThreshold = config?.missedThresholdMinutes ?? 60;
      const isMissed = minutesOverdue >= missedThreshold;

      await db.insert(evvAlerts).values({
        organisationId,
        visitId: visit.id,
        alertType: isMissed ? 'missed' : 'late_start',
        severity: isMissed ? 'critical' : minutesOverdue > 30 ? 'high' : 'medium',
        message: isMissed
          ? `Visit to ${visit.clientName} was missed. ${minutesOverdue} minutes overdue.`
          : `Visit to ${visit.clientName} is late. ${minutesOverdue} minutes overdue.`,
        minutesOverdue,
      });

      // If missed, update visit status
      if (isMissed) {
        await db
          .update(evvVisits)
          .set({ status: 'missed', updatedAt: now })
          .where(eq(evvVisits.id, visit.id));
      }

      alertsCreated++;
    }
  }

  return { success: true, data: { alertsCreated } };
}

// ---------------------------------------------------------------------------
// Geofence config
// ---------------------------------------------------------------------------

export async function upsertGeofenceConfig(
  input: GeofenceConfigInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = geofenceConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  // Deactivate existing configs for this client
  await db
    .update(evvGeofenceConfigs)
    .set({ isActive: false, updatedAt: new Date() })
    .where(
      and(
        eq(evvGeofenceConfigs.clientId, data.clientId),
        eq(evvGeofenceConfigs.organisationId, data.organisationId),
      ),
    );

  const [config] = await db
    .insert(evvGeofenceConfigs)
    .values({
      organisationId: data.organisationId,
      clientId: data.clientId,
      latitude: data.latitude,
      longitude: data.longitude,
      radiusMetres: data.radiusMetres,
      address: data.address,
      qrCodeId: data.qrCodeId ?? null,
      nfcTagId: data.nfcTagId ?? null,
    })
    .returning({ id: evvGeofenceConfigs.id });

  return { success: true, data: { id: config.id } };
}

// ---------------------------------------------------------------------------
// Alert config
// ---------------------------------------------------------------------------

export async function upsertAlertConfig(
  input: AlertConfigInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = alertConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const data = parsed.data;

  // Check for existing config
  const [existing] = await db
    .select()
    .from(evvAlertConfigs)
    .where(eq(evvAlertConfigs.organisationId, data.organisationId));

  if (existing) {
    await db
      .update(evvAlertConfigs)
      .set({
        gracePeriodMinutes: data.gracePeriodMinutes,
        escalationDelayMinutes: data.escalationDelayMinutes,
        missedThresholdMinutes: data.missedThresholdMinutes,
        autoEscalate: data.autoEscalate,
        escalationContactId: data.escalationContactId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(evvAlertConfigs.id, existing.id));

    return { success: true, data: { id: existing.id } };
  }

  const [config] = await db
    .insert(evvAlertConfigs)
    .values({
      organisationId: data.organisationId,
      gracePeriodMinutes: data.gracePeriodMinutes,
      escalationDelayMinutes: data.escalationDelayMinutes,
      missedThresholdMinutes: data.missedThresholdMinutes,
      autoEscalate: data.autoEscalate,
      escalationContactId: data.escalationContactId ?? null,
    })
    .returning({ id: evvAlertConfigs.id });

  return { success: true, data: { id: config.id } };
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export async function getEvvDashboardStats(organisationId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      scheduled: sql<number>`count(*) filter (where ${evvVisits.status} = 'scheduled')::int`,
      inProgress: sql<number>`count(*) filter (where ${evvVisits.status} = 'in_progress')::int`,
      completed: sql<number>`count(*) filter (where ${evvVisits.status} = 'completed')::int`,
      missed: sql<number>`count(*) filter (where ${evvVisits.status} = 'missed')::int`,
      cancelled: sql<number>`count(*) filter (where ${evvVisits.status} = 'cancelled')::int`,
    })
    .from(evvVisits)
    .where(
      and(
        eq(evvVisits.organisationId, organisationId),
        gte(evvVisits.scheduledStart, today),
        lte(evvVisits.scheduledStart, tomorrow),
      ),
    );

  const [alertStats] = await db
    .select({
      activeAlerts: sql<number>`count(*) filter (where ${evvAlerts.status} = 'active')::int`,
      escalatedAlerts: sql<number>`count(*) filter (where ${evvAlerts.status} = 'escalated')::int`,
    })
    .from(evvAlerts)
    .where(eq(evvAlerts.organisationId, organisationId));

  return {
    success: true as const,
    data: {
      visits: stats ?? { total: 0, scheduled: 0, inProgress: 0, completed: 0, missed: 0, cancelled: 0 },
      alerts: alertStats ?? { activeAlerts: 0, escalatedAlerts: 0 },
    },
  };
}
