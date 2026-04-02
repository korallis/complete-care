'use server';

/**
 * Travel Safety server actions — travel time tracking, welfare checks,
 * SOS alerts, GPS tracking, client environment records, route suggestions.
 * All actions enforce RBAC, multi-tenant isolation, and audit logging.
 */

import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  travelRecords,
  routeSuggestions,
  welfareChecks,
  sosAlerts,
  gpsTrackingRecords,
  clientEnvironments,
  loneWorkerConfigs,
  memberships,
  scheduledVisits,
  persons,
} from '@/lib/db/schema';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import type { Action, Resource, Role } from '@/lib/rbac/permissions';
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

type ActionFailure = { success: false; error: string };

type ActionResult<T = void> =
  | { success: true; data: T }
  | ActionFailure;

type PermissionContext = {
  userId: string;
  orgId: string;
  role: Role;
};

const NOT_FOUND_ERROR = 'Resource not found';
const IMPERSONATION_ERROR = 'Insufficient permissions';
const PRIVILEGED_ROLES = new Set<Role>([
  'owner',
  'admin',
  'manager',
  'senior_carer',
]);

async function getPermission(
  action: Action,
  resource: Resource,
): Promise<ActionResult<PermissionContext>> {
  try {
    return { success: true, data: await requirePermission(action, resource) };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }

    throw error;
  }
}

function ensureSameOrg(
  requestedOrgId: string,
  activeOrgId: string,
): ActionFailure | null {
  if (requestedOrgId !== activeOrgId) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  return null;
}

function isPrivilegedRole(role: Role): boolean {
  return PRIVILEGED_ROLES.has(role);
}

async function isMemberInOrg(userId: string, orgId: string): Promise<boolean> {
  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organisationId, orgId),
        eq(memberships.status, 'active'),
      ),
    )
    .limit(1);

  return Boolean(membership);
}

async function visitExistsInOrg(visitId: string, orgId: string): Promise<boolean> {
  const [visit] = await db
    .select({ id: scheduledVisits.id })
    .from(scheduledVisits)
    .where(
      and(
        eq(scheduledVisits.id, visitId),
        eq(scheduledVisits.organisationId, orgId),
      ),
    )
    .limit(1);

  return Boolean(visit);
}

async function allVisitsExistInOrg(
  visitIds: string[],
  orgId: string,
): Promise<boolean> {
  if (visitIds.length === 0) {
    return true;
  }

  const uniqueVisitIds = [...new Set(visitIds)];
  const rows = await db
    .select({ id: scheduledVisits.id })
    .from(scheduledVisits)
    .where(
      and(
        eq(scheduledVisits.organisationId, orgId),
        inArray(scheduledVisits.id, uniqueVisitIds),
      ),
    );

  return rows.length === uniqueVisitIds.length;
}

async function personExistsInOrg(personId: string, orgId: string): Promise<boolean> {
  const [person] = await db
    .select({ id: persons.id })
    .from(persons)
    .where(and(eq(persons.id, personId), eq(persons.organisationId, orgId)))
    .limit(1);

  return Boolean(person);
}

async function validateTargetCarer(
  carerId: string,
  ctx: PermissionContext,
): Promise<ActionFailure | null> {
  if (!(await isMemberInOrg(carerId, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  if (!isPrivilegedRole(ctx.role) && carerId !== ctx.userId) {
    return { success: false, error: IMPERSONATION_ERROR };
  }

  return null;
}

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

  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const data = parsed.data;

  const sameOrg = ensureSameOrg(data.organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const targetCarer = await validateTargetCarer(data.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  if (!(await visitExistsInOrg(data.toVisitId, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  if (data.fromVisitId && !(await visitExistsInOrg(data.fromVisitId, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const isOverdue =
    data.expectedMinutes != null &&
    data.actualMinutes != null &&
    data.actualMinutes > data.expectedMinutes;

  const [record] = await db
    .insert(travelRecords)
    .values({
      organisationId: ctx.orgId,
      carerId: data.carerId,
      fromVisitId: data.fromVisitId ?? null,
      toVisitId: data.toVisitId,
      expectedMinutes: data.expectedMinutes ?? null,
      actualMinutes: data.actualMinutes ?? null,
      expectedDistanceMiles: data.expectedDistanceMiles ?? null,
      actualDistanceMiles: data.actualDistanceMiles ?? null,
      travelMode: data.travelMode,
      isOverdue,
      notes: data.notes ?? null,
      departedAt: data.departedAt ?? null,
      arrivedAt: data.arrivedAt ?? null,
      travelDate: data.travelDate,
    })
    .returning({ id: travelRecords.id });

  await auditLog(
    'create',
    'travel_record',
    record.id,
    {
      before: null,
      after: {
        carerId: data.carerId,
        fromVisitId: data.fromVisitId ?? null,
        toVisitId: data.toVisitId,
        expectedMinutes: data.expectedMinutes ?? null,
        actualMinutes: data.actualMinutes ?? null,
        isOverdue,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: record.id } };
}

export async function getTravelRecords(
  input: TravelRecordFilterInput,
): Promise<ActionResult<(typeof travelRecords.$inferSelect)[]>> {
  const parsed = travelRecordFilterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const filters = parsed.data;

  const sameOrg = ensureSameOrg(filters.organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  if (filters.carerId) {
    const targetCarer = await validateTargetCarer(filters.carerId, ctx);
    if (targetCarer) {
      return targetCarer;
    }
  }

  const conditions = [eq(travelRecords.organisationId, ctx.orgId)];

  if (filters.carerId) {
    conditions.push(eq(travelRecords.carerId, filters.carerId));
  } else if (!isPrivilegedRole(ctx.role)) {
    conditions.push(eq(travelRecords.carerId, ctx.userId));
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

  const permission = await getPermission('update', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const data = parsed.data;

  const sameOrg = ensureSameOrg(data.organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const targetCarer = await validateTargetCarer(data.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  if (!(await allVisitsExistInOrg(data.suggestedOrder, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [suggestion] = await db
    .insert(routeSuggestions)
    .values({
      organisationId: ctx.orgId,
      carerId: data.carerId,
      routeDate: data.routeDate,
      suggestedOrder: data.suggestedOrder,
      totalEstimatedMinutes: data.totalEstimatedMinutes ?? null,
      totalEstimatedMiles: data.totalEstimatedMiles ?? null,
      optimisationMethod: data.optimisationMethod,
    })
    .returning({ id: routeSuggestions.id });

  await auditLog(
    'create',
    'route_suggestion',
    suggestion.id,
    {
      before: null,
      after: {
        carerId: data.carerId,
        routeDate: data.routeDate,
        suggestedOrder: data.suggestedOrder,
        optimisationMethod: data.optimisationMethod,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: suggestion.id } };
}

export async function updateRouteSuggestionStatus(
  input: UpdateRouteSuggestionStatusInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateRouteSuggestionStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const permission = await getPermission('update', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const { id, organisationId, status } = parsed.data;

  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const [existing] = await db
    .select({
      id: routeSuggestions.id,
      carerId: routeSuggestions.carerId,
      status: routeSuggestions.status,
    })
    .from(routeSuggestions)
    .where(
      and(
        eq(routeSuggestions.id, id),
        eq(routeSuggestions.organisationId, ctx.orgId),
      ),
    )
    .limit(1);

  if (!existing) {
    return { success: false, error: 'Route suggestion not found' };
  }

  const targetCarer = await validateTargetCarer(existing.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  const [suggestion] = await db
    .update(routeSuggestions)
    .set({ status })
    .where(
      and(
        eq(routeSuggestions.id, id),
        eq(routeSuggestions.organisationId, ctx.orgId),
      ),
    )
    .returning({ id: routeSuggestions.id });

  if (!suggestion) {
    return { success: false, error: 'Route suggestion not found' };
  }

  await auditLog(
    'update',
    'route_suggestion',
    suggestion.id,
    {
      before: { status: existing.status },
      after: { status },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: suggestion.id } };
}

export async function getRouteSuggestion(
  organisationId: string,
  carerId: string,
  routeDate: Date,
): Promise<ActionResult<typeof routeSuggestions.$inferSelect | null>> {
  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const targetCarer = await validateTargetCarer(carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  const [suggestion] = await db
    .select()
    .from(routeSuggestions)
    .where(
      and(
        eq(routeSuggestions.organisationId, ctx.orgId),
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

  const permission = await getPermission('update', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const data = parsed.data;

  const sameOrg = ensureSameOrg(data.organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const targetCarer = await validateTargetCarer(data.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  if (!(await visitExistsInOrg(data.visitId, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [check] = await db
    .insert(welfareChecks)
    .values({
      organisationId: ctx.orgId,
      carerId: data.carerId,
      visitId: data.visitId,
      expectedBy: data.expectedBy,
    })
    .returning({ id: welfareChecks.id });

  await auditLog(
    'create',
    'welfare_check',
    check.id,
    {
      before: null,
      after: {
        carerId: data.carerId,
        visitId: data.visitId,
        expectedBy: data.expectedBy,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: check.id } };
}

export async function checkInWelfare(
  input: CheckInWelfareInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = checkInWelfareSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const { id, organisationId } = parsed.data;

  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const [existing] = await db
    .select({
      id: welfareChecks.id,
      carerId: welfareChecks.carerId,
      status: welfareChecks.status,
      checkedInAt: welfareChecks.checkedInAt,
    })
    .from(welfareChecks)
    .where(
      and(eq(welfareChecks.id, id), eq(welfareChecks.organisationId, ctx.orgId)),
    )
    .limit(1);

  if (!existing) {
    return { success: false, error: 'Welfare check not found' };
  }

  const targetCarer = await validateTargetCarer(existing.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  const checkedInAt = new Date();

  const [check] = await db
    .update(welfareChecks)
    .set({
      status: 'checked_in',
      checkedInAt,
      updatedAt: checkedInAt,
    })
    .where(
      and(eq(welfareChecks.id, id), eq(welfareChecks.organisationId, ctx.orgId)),
    )
    .returning({ id: welfareChecks.id });

  if (!check) {
    return { success: false, error: 'Welfare check not found' };
  }

  await auditLog(
    'check_in',
    'welfare_check',
    check.id,
    {
      before: { status: existing.status, checkedInAt: existing.checkedInAt },
      after: { status: 'checked_in', checkedInAt },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: check.id } };
}

export async function resolveWelfareCheck(
  input: ResolveWelfareCheckInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = resolveWelfareCheckSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const permission = await getPermission('update', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const { id, organisationId, resolution, resolutionNotes } = parsed.data;

  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const [existing] = await db
    .select({
      id: welfareChecks.id,
      status: welfareChecks.status,
      carerId: welfareChecks.carerId,
      resolution: welfareChecks.resolution,
      resolutionNotes: welfareChecks.resolutionNotes,
    })
    .from(welfareChecks)
    .where(
      and(eq(welfareChecks.id, id), eq(welfareChecks.organisationId, ctx.orgId)),
    )
    .limit(1);

  if (!existing) {
    return { success: false, error: 'Welfare check not found' };
  }

  const targetCarer = await validateTargetCarer(existing.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  const respondedAt = new Date();

  const [check] = await db
    .update(welfareChecks)
    .set({
      status: 'resolved',
      respondedBy: ctx.userId,
      respondedAt,
      resolution,
      resolutionNotes: resolutionNotes ?? null,
      updatedAt: respondedAt,
    })
    .where(
      and(eq(welfareChecks.id, id), eq(welfareChecks.organisationId, ctx.orgId)),
    )
    .returning({ id: welfareChecks.id });

  if (!check) {
    return { success: false, error: 'Welfare check not found' };
  }

  await auditLog(
    'resolve',
    'welfare_check',
    check.id,
    {
      before: {
        status: existing.status,
        resolution: existing.resolution,
        resolutionNotes: existing.resolutionNotes,
      },
      after: {
        status: 'resolved',
        resolution,
        resolutionNotes: resolutionNotes ?? null,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: check.id } };
}

export async function getOverdueWelfareChecks(
  organisationId: string,
): Promise<ActionResult<(typeof welfareChecks.$inferSelect)[]>> {
  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const now = new Date();
  const conditions = [
    eq(welfareChecks.organisationId, ctx.orgId),
    eq(welfareChecks.status, 'pending'),
    lte(welfareChecks.expectedBy, now),
  ];

  if (!isPrivilegedRole(ctx.role)) {
    conditions.push(eq(welfareChecks.carerId, ctx.userId));
  }

  const results = await db
    .select()
    .from(welfareChecks)
    .where(and(...conditions))
    .orderBy(welfareChecks.expectedBy);

  return { success: true, data: results };
}

export async function getActiveWelfareChecks(
  organisationId: string,
): Promise<ActionResult<(typeof welfareChecks.$inferSelect)[]>> {
  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const conditions = [
    eq(welfareChecks.organisationId, ctx.orgId),
    eq(welfareChecks.status, 'pending'),
  ];

  if (!isPrivilegedRole(ctx.role)) {
    conditions.push(eq(welfareChecks.carerId, ctx.userId));
  }

  const results = await db
    .select()
    .from(welfareChecks)
    .where(and(...conditions))
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

  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const data = parsed.data;

  const sameOrg = ensureSameOrg(data.organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const targetCarer = await validateTargetCarer(data.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  if (data.visitId && !(await visitExistsInOrg(data.visitId, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [alert] = await db
    .insert(sosAlerts)
    .values({
      organisationId: ctx.orgId,
      carerId: data.carerId,
      visitId: data.visitId ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      accuracyMetres: data.accuracyMetres ?? null,
      message: data.message ?? null,
    })
    .returning({ id: sosAlerts.id });

  await auditLog(
    'create',
    'sos_alert',
    alert.id,
    {
      before: null,
      after: {
        carerId: data.carerId,
        visitId: data.visitId ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        message: data.message ?? null,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: alert.id } };
}

export async function acknowledgeSosAlert(
  input: AcknowledgeSosAlertInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = acknowledgeSosAlertSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const permission = await getPermission('update', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const { id, organisationId } = parsed.data;

  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const [existing] = await db
    .select({
      id: sosAlerts.id,
      status: sosAlerts.status,
      carerId: sosAlerts.carerId,
      acknowledgedBy: sosAlerts.acknowledgedBy,
      acknowledgedAt: sosAlerts.acknowledgedAt,
    })
    .from(sosAlerts)
    .where(and(eq(sosAlerts.id, id), eq(sosAlerts.organisationId, ctx.orgId)))
    .limit(1);

  if (!existing) {
    return { success: false, error: 'SOS alert not found' };
  }

  const targetCarer = await validateTargetCarer(existing.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  const acknowledgedAt = new Date();

  const [alert] = await db
    .update(sosAlerts)
    .set({
      status: 'acknowledged',
      acknowledgedBy: ctx.userId,
      acknowledgedAt,
    })
    .where(and(eq(sosAlerts.id, id), eq(sosAlerts.organisationId, ctx.orgId)))
    .returning({ id: sosAlerts.id });

  if (!alert) {
    return { success: false, error: 'SOS alert not found' };
  }

  await auditLog(
    'acknowledge',
    'sos_alert',
    alert.id,
    {
      before: {
        status: existing.status,
        acknowledgedBy: existing.acknowledgedBy,
        acknowledgedAt: existing.acknowledgedAt,
      },
      after: {
        status: 'acknowledged',
        acknowledgedBy: ctx.userId,
        acknowledgedAt,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: alert.id } };
}

export async function resolveSosAlert(
  input: ResolveSosAlertInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = resolveSosAlertSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const permission = await getPermission('update', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const { id, organisationId, resolutionNotes, status } = parsed.data;

  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const [existing] = await db
    .select({
      id: sosAlerts.id,
      status: sosAlerts.status,
      carerId: sosAlerts.carerId,
      resolvedBy: sosAlerts.resolvedBy,
      resolvedAt: sosAlerts.resolvedAt,
      resolutionNotes: sosAlerts.resolutionNotes,
    })
    .from(sosAlerts)
    .where(and(eq(sosAlerts.id, id), eq(sosAlerts.organisationId, ctx.orgId)))
    .limit(1);

  if (!existing) {
    return { success: false, error: 'SOS alert not found' };
  }

  const targetCarer = await validateTargetCarer(existing.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  const resolvedAt = new Date();

  const [alert] = await db
    .update(sosAlerts)
    .set({
      status,
      resolvedBy: ctx.userId,
      resolvedAt,
      resolutionNotes: resolutionNotes ?? null,
    })
    .where(and(eq(sosAlerts.id, id), eq(sosAlerts.organisationId, ctx.orgId)))
    .returning({ id: sosAlerts.id });

  if (!alert) {
    return { success: false, error: 'SOS alert not found' };
  }

  await auditLog(
    'resolve',
    'sos_alert',
    alert.id,
    {
      before: {
        status: existing.status,
        resolvedBy: existing.resolvedBy,
        resolvedAt: existing.resolvedAt,
        resolutionNotes: existing.resolutionNotes,
      },
      after: {
        status,
        resolvedBy: ctx.userId,
        resolvedAt,
        resolutionNotes: resolutionNotes ?? null,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: alert.id } };
}

export async function getActiveSosAlerts(
  organisationId: string,
): Promise<ActionResult<(typeof sosAlerts.$inferSelect)[]>> {
  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const conditions = [
    eq(sosAlerts.organisationId, ctx.orgId),
    eq(sosAlerts.status, 'active'),
  ];

  if (!isPrivilegedRole(ctx.role)) {
    conditions.push(eq(sosAlerts.carerId, ctx.userId));
  }

  const results = await db
    .select()
    .from(sosAlerts)
    .where(and(...conditions))
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

  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const data = parsed.data;

  const sameOrg = ensureSameOrg(data.organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const targetCarer = await validateTargetCarer(data.carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  if (data.visitId && !(await visitExistsInOrg(data.visitId, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [record] = await db
    .insert(gpsTrackingRecords)
    .values({
      organisationId: ctx.orgId,
      carerId: data.carerId,
      visitId: data.visitId ?? null,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracyMetres: data.accuracyMetres ?? null,
      speedKmh: data.speedKmh ?? null,
      batteryLevel: data.batteryLevel ?? null,
      activityType: data.activityType ?? 'stationary',
    })
    .returning({ id: gpsTrackingRecords.id });

  await auditLog(
    'create',
    'gps_tracking_record',
    record.id,
    {
      before: null,
      after: {
        carerId: data.carerId,
        visitId: data.visitId ?? null,
        latitude: data.latitude,
        longitude: data.longitude,
        activityType: data.activityType ?? 'stationary',
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: record.id } };
}

export async function getCarerGpsTrail(
  organisationId: string,
  carerId: string,
  from: Date,
  to: Date,
): Promise<ActionResult<(typeof gpsTrackingRecords.$inferSelect)[]>> {
  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const targetCarer = await validateTargetCarer(carerId, ctx);
  if (targetCarer) {
    return targetCarer;
  }

  const results = await db
    .select()
    .from(gpsTrackingRecords)
    .where(
      and(
        eq(gpsTrackingRecords.organisationId, ctx.orgId),
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

  const permission = await getPermission('update', 'persons');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const data = parsed.data;

  const sameOrg = ensureSameOrg(data.organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  if (!(await personExistsInOrg(data.clientId, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const payload = {
    organisationId: ctx.orgId,
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
    lastVerifiedAt: new Date(),
    lastVerifiedBy: ctx.userId,
  };

  const [existing] = await db
    .select({
      id: clientEnvironments.id,
      clientName: clientEnvironments.clientName,
      riskLevel: clientEnvironments.riskLevel,
      keySafeLocation: clientEnvironments.keySafeLocation,
      accessInstructions: clientEnvironments.accessInstructions,
    })
    .from(clientEnvironments)
    .where(
      and(
        eq(clientEnvironments.organisationId, ctx.orgId),
        eq(clientEnvironments.clientId, data.clientId),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(clientEnvironments)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(clientEnvironments.id, existing.id))
      .returning({ id: clientEnvironments.id });

    await auditLog(
      'update',
      'client_environment',
      updated.id,
      {
        before: {
          clientName: existing.clientName,
          riskLevel: existing.riskLevel,
          keySafeLocation: existing.keySafeLocation,
          accessInstructions: existing.accessInstructions,
        },
        after: {
          clientName: payload.clientName,
          riskLevel: payload.riskLevel,
          keySafeLocation: payload.keySafeLocation,
          accessInstructions: payload.accessInstructions,
        },
      },
      { userId: ctx.userId, organisationId: ctx.orgId },
    );

    return { success: true, data: { id: updated.id } };
  }

  const [created] = await db
    .insert(clientEnvironments)
    .values(payload)
    .returning({ id: clientEnvironments.id });

  await auditLog(
    'create',
    'client_environment',
    created.id,
    {
      before: null,
      after: {
        clientId: payload.clientId,
        clientName: payload.clientName,
        riskLevel: payload.riskLevel,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: created.id } };
}

export async function getClientEnvironment(
  organisationId: string,
  clientId: string,
): Promise<ActionResult<typeof clientEnvironments.$inferSelect | null>> {
  const permission = await getPermission('read', 'persons');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  if (!(await personExistsInOrg(clientId, ctx.orgId))) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const [record] = await db
    .select()
    .from(clientEnvironments)
    .where(
      and(
        eq(clientEnvironments.organisationId, ctx.orgId),
        eq(clientEnvironments.clientId, clientId),
      ),
    );

  return { success: true, data: record ?? null };
}

export async function getClientEnvironments(
  organisationId: string,
): Promise<ActionResult<(typeof clientEnvironments.$inferSelect)[]>> {
  const permission = await getPermission('read', 'persons');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const results = await db
    .select()
    .from(clientEnvironments)
    .where(eq(clientEnvironments.organisationId, ctx.orgId))
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

  const permission = await getPermission('manage', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const data = parsed.data;

  const sameOrg = ensureSameOrg(data.organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  if (
    data.escalationContactId &&
    !(await isMemberInOrg(data.escalationContactId, ctx.orgId))
  ) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  if (
    data.secondaryEscalationContactId &&
    !(await isMemberInOrg(data.secondaryEscalationContactId, ctx.orgId))
  ) {
    return { success: false, error: NOT_FOUND_ERROR };
  }

  const payload = {
    organisationId: ctx.orgId,
    welfareCheckBufferMinutes: data.welfareCheckBufferMinutes,
    escalationDelayMinutes: data.escalationDelayMinutes,
    gpsTrackingEnabled: data.gpsTrackingEnabled,
    gpsPingIntervalSeconds: data.gpsPingIntervalSeconds,
    sosEnabled: data.sosEnabled,
    escalationContactId: data.escalationContactId ?? null,
    secondaryEscalationContactId: data.secondaryEscalationContactId ?? null,
    autoEmergencyCallEnabled: data.autoEmergencyCallEnabled,
    autoEmergencyCallDelayMinutes: data.autoEmergencyCallDelayMinutes,
  };

  const [existing] = await db
    .select({
      id: loneWorkerConfigs.id,
      welfareCheckBufferMinutes: loneWorkerConfigs.welfareCheckBufferMinutes,
      escalationDelayMinutes: loneWorkerConfigs.escalationDelayMinutes,
      gpsTrackingEnabled: loneWorkerConfigs.gpsTrackingEnabled,
      sosEnabled: loneWorkerConfigs.sosEnabled,
    })
    .from(loneWorkerConfigs)
    .where(eq(loneWorkerConfigs.organisationId, ctx.orgId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(loneWorkerConfigs)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(loneWorkerConfigs.id, existing.id))
      .returning({ id: loneWorkerConfigs.id });

    await auditLog(
      'update',
      'lone_worker_config',
      updated.id,
      {
        before: {
          welfareCheckBufferMinutes: existing.welfareCheckBufferMinutes,
          escalationDelayMinutes: existing.escalationDelayMinutes,
          gpsTrackingEnabled: existing.gpsTrackingEnabled,
          sosEnabled: existing.sosEnabled,
        },
        after: {
          welfareCheckBufferMinutes: payload.welfareCheckBufferMinutes,
          escalationDelayMinutes: payload.escalationDelayMinutes,
          gpsTrackingEnabled: payload.gpsTrackingEnabled,
          sosEnabled: payload.sosEnabled,
        },
      },
      { userId: ctx.userId, organisationId: ctx.orgId },
    );

    return { success: true, data: { id: updated.id } };
  }

  const [created] = await db
    .insert(loneWorkerConfigs)
    .values(payload)
    .returning({ id: loneWorkerConfigs.id });

  await auditLog(
    'create',
    'lone_worker_config',
    created.id,
    {
      before: null,
      after: {
        welfareCheckBufferMinutes: payload.welfareCheckBufferMinutes,
        escalationDelayMinutes: payload.escalationDelayMinutes,
        gpsTrackingEnabled: payload.gpsTrackingEnabled,
        sosEnabled: payload.sosEnabled,
      },
    },
    { userId: ctx.userId, organisationId: ctx.orgId },
  );

  return { success: true, data: { id: created.id } };
}

export async function getLoneWorkerConfig(
  organisationId: string,
): Promise<ActionResult<typeof loneWorkerConfigs.$inferSelect | null>> {
  const permission = await getPermission('read', 'rota');
  if (!permission.success) {
    return permission;
  }

  const ctx = permission.data;
  const sameOrg = ensureSameOrg(organisationId, ctx.orgId);
  if (sameOrg) {
    return sameOrg;
  }

  const [config] = await db
    .select()
    .from(loneWorkerConfigs)
    .where(eq(loneWorkerConfigs.organisationId, ctx.orgId));

  return { success: true, data: config ?? null };
}
