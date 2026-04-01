'use server';

/**
 * Incident Reporting Server Actions
 *
 * CRUD + investigation workflow for incident/accident reports.
 * All actions are tenant-scoped and RBAC-protected.
 *
 * Flow: Zod validate -> auth -> RBAC -> tenant isolation -> audit log
 */

import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  incidents,
  organisations,
  users,
  persons,
} from '@/lib/db/schema';
import type { Incident } from '@/lib/db/schema/incidents';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createIncidentSchema,
  updateInvestigationSchema,
  closeIncidentSchema,
  incidentFilterSchema,
} from './schema';
import type {
  CreateIncidentInput,
  UpdateInvestigationInput,
  CloseIncidentInput,
} from './schema';
import {
  STATUS_TRANSITIONS,
  triggersDutyOfCandour,
  isPotentiallyNotifiable,
  type SeverityLevel,
  type IncidentStatusValue,
} from './constants';
import { notifySeriousIncident, createDutyOfCandourReminder } from './notifications';

// Re-export for external use
export type { CreateIncidentInput, UpdateInvestigationInput, CloseIncidentInput } from './schema';

// ---------------------------------------------------------------------------
// Helper: get org slug for revalidation
// ---------------------------------------------------------------------------

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

// ---------------------------------------------------------------------------
// List incidents for a person (with filters + pagination)
// ---------------------------------------------------------------------------

export type IncidentListItem = {
  id: string;
  personId: string;
  reportedByName: string | null;
  dateTime: Date;
  location: string;
  description: string;
  severity: string;
  status: string;
  isNotifiable: string;
  dutyOfCandourTriggered: string;
  createdAt: Date;
};

export type IncidentListResult = {
  incidents: IncidentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listIncidents(
  filters: Record<string, unknown>,
): Promise<IncidentListResult> {
  const { orgId } = await requirePermission('read', 'incidents');

  const parsed = incidentFilterSchema.safeParse(filters);
  const f = parsed.success ? parsed.data : { page: 1, pageSize: 20 };

  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(incidents.organisationId, orgId)];

  if (f.personId) {
    conditions.push(eq(incidents.personId, f.personId));
  }

  if (f.severity) {
    conditions.push(eq(incidents.severity, f.severity));
  }

  if (f.status) {
    conditions.push(eq(incidents.status, f.status));
  }

  if (f.dateFrom) {
    conditions.push(gte(incidents.dateTime, new Date(f.dateFrom)));
  }

  if (f.dateTo) {
    const endDate = new Date(f.dateTo);
    endDate.setDate(endDate.getDate() + 1);
    conditions.push(lte(incidents.dateTime, endDate));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: incidents.id,
        personId: incidents.personId,
        reportedByName: incidents.reportedByName,
        dateTime: incidents.dateTime,
        location: incidents.location,
        description: incidents.description,
        severity: incidents.severity,
        status: incidents.status,
        isNotifiable: incidents.isNotifiable,
        dutyOfCandourTriggered: incidents.dutyOfCandourTriggered,
        createdAt: incidents.createdAt,
      })
      .from(incidents)
      .where(whereClause)
      .orderBy(desc(incidents.dateTime))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(incidents).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    incidents: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single incident
// ---------------------------------------------------------------------------

export async function getIncident(
  incidentId: string,
): Promise<Incident | null> {
  const { orgId } = await requirePermission('read', 'incidents');

  const [incident] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, incidentId))
    .limit(1);

  if (!incident) return null;

  assertBelongsToOrg(incident.organisationId, orgId);

  return incident;
}

// ---------------------------------------------------------------------------
// Create incident
// ---------------------------------------------------------------------------

export async function createIncident(
  input: CreateIncidentInput,
): Promise<ActionResult<Incident>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'incidents');

    // 1. Validate input
    const parsed = createIncidentSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // 2. Verify person belongs to this org (tenant isolation)
    const [person] = await db
      .select({ id: persons.id })
      .from(persons)
      .where(
        and(
          eq(persons.id, data.personId),
          eq(persons.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!person) {
      return { success: false, error: 'Person not found' };
    }

    // 3. Get reporter name for denormalised display
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const reporterName = user?.name ?? 'Unknown';

    // 4. Determine auto-flags based on severity
    const severity = data.severity as SeverityLevel;
    const dutyOfCandour = triggersDutyOfCandour(severity) ? 'yes' : 'no';
    const isNotifiable = data.isNotifiable === 'yes' || isPotentiallyNotifiable(severity)
      ? 'yes'
      : 'no';

    // 5. Insert the incident
    const [incident] = await db
      .insert(incidents)
      .values({
        organisationId: orgId,
        personId: data.personId,
        reportedById: userId,
        reportedByName: reporterName,
        dateTime: new Date(data.dateTime),
        location: data.location,
        description: data.description,
        immediateActions: data.immediateActions ?? null,
        severity: data.severity,
        status: 'reported',
        involvedPersons: data.involvedPersons,
        witnesses: data.witnesses,
        injuryDetails: data.injuryDetails,
        linkedBodyMapEntryIds: data.linkedBodyMapEntryIds,
        isNotifiable,
        regulatoryBody: data.regulatoryBody ?? null,
        dutyOfCandourTriggered: dutyOfCandour,
      })
      .returning();

    // 6. Audit log
    await auditLog('create', 'incident', incident.id, {
      before: null,
      after: {
        personId: data.personId,
        severity: data.severity,
        location: data.location,
        status: 'reported',
      },
    }, { userId, organisationId: orgId });

    // 7. Auto-notifications for serious incidents (non-blocking)
    await notifySeriousIncident(incident, reporterName);

    // 8. Duty of Candour reminder (non-blocking)
    await createDutyOfCandourReminder(incident);

    // 9. Revalidate
    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/incidents`);
    }

    return { success: true, data: incident };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createIncident] Error:', error);
    return { success: false, error: 'Failed to create incident report' };
  }
}

// ---------------------------------------------------------------------------
// Update investigation
// ---------------------------------------------------------------------------

export async function updateInvestigation(
  incidentId: string,
  input: UpdateInvestigationInput,
): Promise<ActionResult<Incident>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'incidents');

    const parsed = updateInvestigationSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, incidentId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Incident not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;

    // Validate status transition if status is being changed
    if (data.status) {
      const currentStatus = existing.status as IncidentStatusValue;
      const allowedTransitions = STATUS_TRANSITIONS[currentStatus] ?? [];
      if (!allowedTransitions.includes(data.status)) {
        return {
          success: false,
          error: `Cannot transition from '${currentStatus}' to '${data.status}'`,
        };
      }
    }

    const now = new Date();
    const updates: Record<string, unknown> = {
      updatedAt: now,
    };

    if (data.status) {
      updates.status = data.status;
      // When transitioning to investigating, set the investigator
      if (data.status === 'investigating') {
        updates.investigatorId = userId;
      }
    }

    if (data.investigationNotes !== undefined) {
      updates.investigationNotes = data.investigationNotes;
    }

    if (data.outcome !== undefined) {
      updates.outcome = data.outcome;
    }

    if (data.isNotifiable !== undefined) {
      updates.isNotifiable = data.isNotifiable;
    }

    if (data.regulatoryBody !== undefined) {
      updates.regulatoryBody = data.regulatoryBody;
    }

    const [updated] = await db
      .update(incidents)
      .set(updates)
      .where(eq(incidents.id, incidentId))
      .returning();

    await auditLog('update', 'incident', incidentId, {
      before: { status: existing.status },
      after: { status: updated.status, ...data },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/incidents`);
      revalidatePath(`/${slug}/persons/${existing.personId}/incidents/${incidentId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateInvestigation] Error:', error);
    return { success: false, error: 'Failed to update investigation' };
  }
}

// ---------------------------------------------------------------------------
// Close incident
// ---------------------------------------------------------------------------

export async function closeIncident(
  incidentId: string,
  input: CloseIncidentInput,
): Promise<ActionResult<Incident>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'incidents');

    const parsed = closeIncidentSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(incidents)
      .where(eq(incidents.id, incidentId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Incident not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    // Only resolved incidents can be closed
    if (existing.status !== 'resolved') {
      return {
        success: false,
        error: 'Only resolved incidents can be closed',
      };
    }

    const now = new Date();
    const [updated] = await db
      .update(incidents)
      .set({
        status: 'closed',
        outcome: parsed.data.outcome,
        closedAt: now,
        closedById: userId,
        updatedAt: now,
      })
      .where(eq(incidents.id, incidentId))
      .returning();

    await auditLog('close', 'incident', incidentId, {
      before: { status: 'resolved' },
      after: { status: 'closed', outcome: parsed.data.outcome },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/incidents`);
      revalidatePath(`/${slug}/persons/${existing.personId}/incidents/${incidentId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[closeIncident] Error:', error);
    return { success: false, error: 'Failed to close incident' };
  }
}

// ---------------------------------------------------------------------------
// Incident trends
// ---------------------------------------------------------------------------

export type IncidentTrends = {
  totalIncidents: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  byLocation: Record<string, number>;
  recentIncidents: IncidentListItem[];
};

export async function getIncidentTrends({
  personId,
  days = 30,
}: {
  personId?: string;
  days?: number;
}): Promise<IncidentTrends> {
  const { orgId } = await requirePermission('read', 'incidents');

  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - days);

  const conditions = [
    eq(incidents.organisationId, orgId),
    gte(incidents.dateTime, sinceDate),
  ];

  if (personId) {
    conditions.push(eq(incidents.personId, personId));
  }

  const whereClause = and(...conditions);

  // Get all incidents in the period
  const rows = await db
    .select({
      id: incidents.id,
      personId: incidents.personId,
      reportedByName: incidents.reportedByName,
      dateTime: incidents.dateTime,
      location: incidents.location,
      description: incidents.description,
      severity: incidents.severity,
      status: incidents.status,
      isNotifiable: incidents.isNotifiable,
      dutyOfCandourTriggered: incidents.dutyOfCandourTriggered,
      createdAt: incidents.createdAt,
    })
    .from(incidents)
    .where(whereClause)
    .orderBy(desc(incidents.dateTime));

  // Aggregate by severity
  const bySeverity: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byLocation: Record<string, number> = {};

  for (const row of rows) {
    bySeverity[row.severity] = (bySeverity[row.severity] ?? 0) + 1;
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    byLocation[row.location] = (byLocation[row.location] ?? 0) + 1;
  }

  return {
    totalIncidents: rows.length,
    bySeverity,
    byStatus,
    byLocation,
    recentIncidents: rows.slice(0, 5),
  };
}
