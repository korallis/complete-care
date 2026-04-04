'use server';

/**
 * Clinical Alerts Server Actions
 *
 * Evaluate, acknowledge, resolve, escalate alerts, and configure thresholds.
 * All actions are tenant-scoped and RBAC-protected.
 *
 * RBAC rules:
 * - clinical resource: senior_carer+ can manage alerts (create/update), carer can view (read)
 *
 * Flow: Zod validate -> auth -> RBAC -> tenant isolation -> audit log
 */

import { and, count, desc, eq, gte, lte, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  clinicalAlerts,
  personAlertThresholds,
  organisations,
  users,
  fluidEntries,
  vitalSigns,
  bowelRecords,
  painAssessments,
} from '@/lib/db/schema';
import type { ClinicalAlert } from '@/lib/db/schema/clinical-alerts';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  acknowledgeAlertSchema,
  resolveAlertSchema,
  escalateAlertSchema,
  setCustomThresholdSchema,
  createManualAlertSchema,
} from './schema';
import type {
  AcknowledgeAlertInput,
  ResolveAlertInput,
  EscalateAlertInput,
  SetCustomThresholdInput,
  CreateManualAlertInput,
} from './schema';
import { evaluateAllAlerts } from './engine';
import type { CustomThresholds, FullEvaluationInput } from './engine';
import {
  getNextEscalationLevel,
  DEFAULT_ESCALATION_BY_SEVERITY,
  type EscalationLevel,
} from './constants';

// Re-export types for external use
export type {
  AcknowledgeAlertInput,
  ResolveAlertInput,
  EscalateAlertInput,
  SetCustomThresholdInput,
  CreateManualAlertInput,
} from './schema';

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
// Helper: load custom thresholds for a person
// ---------------------------------------------------------------------------

async function loadCustomThresholds(
  orgId: string,
  personId: string,
): Promise<CustomThresholds> {
  const rows = await db
    .select({
      alertType: personAlertThresholds.alertType,
      customThreshold: personAlertThresholds.customThreshold,
    })
    .from(personAlertThresholds)
    .where(
      and(
        eq(personAlertThresholds.organisationId, orgId),
        eq(personAlertThresholds.personId, personId),
      ),
    );

  const thresholds: CustomThresholds = {};
  for (const row of rows) {
    const key = row.alertType as keyof CustomThresholds;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (thresholds as any)[key] = row.customThreshold;
  }
  return thresholds;
}

// ---------------------------------------------------------------------------
// Evaluate alerts for a person (run the engine)
// ---------------------------------------------------------------------------

export async function evaluateAlerts({
  personId,
}: {
  personId: string;
}): Promise<ActionResult<ClinicalAlert[]>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    // Load custom thresholds
    const customThresholds = await loadCustomThresholds(orgId, personId);

    // Build 24hr window
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Gather clinical data in parallel
    const [fluidRows, vitalRows, bowelRows, painRows] = await Promise.all([
      // Fluid intake for today
      db
        .select({
          entryType: fluidEntries.entryType,
          volume: fluidEntries.volume,
        })
        .from(fluidEntries)
        .where(
          and(
            eq(fluidEntries.organisationId, orgId),
            eq(fluidEntries.personId, personId),
            gte(fluidEntries.recordedAt, startOfDay),
            lte(fluidEntries.recordedAt, endOfDay),
          ),
        ),

      // Latest vital signs with NEWS2
      db
        .select({
          news2Score: vitalSigns.news2Score,
          news2Escalation: vitalSigns.news2Escalation,
          recordedAt: vitalSigns.recordedAt,
        })
        .from(vitalSigns)
        .where(
          and(
            eq(vitalSigns.organisationId, orgId),
            eq(vitalSigns.personId, personId),
          ),
        )
        .orderBy(desc(vitalSigns.recordedAt))
        .limit(1),

      // Bowel records: last BM + 24hr Bristol types
      db
        .select({
          bristolType: bowelRecords.bristolType,
          recordedAt: bowelRecords.recordedAt,
        })
        .from(bowelRecords)
        .where(
          and(
            eq(bowelRecords.organisationId, orgId),
            eq(bowelRecords.personId, personId),
          ),
        )
        .orderBy(desc(bowelRecords.recordedAt))
        .limit(50),

      // Recent pain assessments
      db
        .select({
          totalScore: painAssessments.totalScore,
          recordedAt: painAssessments.recordedAt,
        })
        .from(painAssessments)
        .where(
          and(
            eq(painAssessments.organisationId, orgId),
            eq(painAssessments.personId, personId),
          ),
        )
        .orderBy(desc(painAssessments.recordedAt))
        .limit(10),
    ]);

    // Build evaluation input
    const evaluationInput: FullEvaluationInput = {};

    // Fluid intake total
    const totalIntakeMl = fluidRows
      .filter((r) => r.entryType === 'intake')
      .reduce((sum, r) => sum + r.volume, 0);
    evaluationInput.fluidIntake = { totalIntakeMl };

    // NEWS2 (latest)
    if (vitalRows.length > 0 && vitalRows[0].news2Score !== null) {
      const latestVitals = vitalRows[0];
      evaluationInput.news2 = {
        totalScore: latestVitals.news2Score!,
        hasClinicalConcern: false, // Would need parameter scores to determine; rely on score thresholds
      };
    }

    // Constipation
    const lastBm = bowelRows.length > 0 ? bowelRows[0].recordedAt : null;
    evaluationInput.constipation = {
      lastBowelMovementAt: lastBm,
      currentTime: now,
    };

    // Diarrhoea (24hr window)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last24hBowel = bowelRows.filter(
      (r) => r.recordedAt >= twentyFourHoursAgo,
    );
    evaluationInput.diarrhoea = {
      bristolTypes: last24hBowel.map((r) => r.bristolType),
    };

    // Pain
    if (painRows.length > 0) {
      evaluationInput.pain = {
        recentScores: painRows.map((r) => r.totalScore),
      };
    }

    // Run the evaluation engine
    const candidates = evaluateAllAlerts(evaluationInput, customThresholds);

    if (candidates.length === 0) {
      return { success: true, data: [] };
    }

    // Check for existing active alerts of the same type to avoid duplicates
    const existingActiveAlerts = await db
      .select({
        alertType: clinicalAlerts.alertType,
        severity: clinicalAlerts.severity,
      })
      .from(clinicalAlerts)
      .where(
        and(
          eq(clinicalAlerts.organisationId, orgId),
          eq(clinicalAlerts.personId, personId),
          eq(clinicalAlerts.status, 'active'),
          inArray(
            clinicalAlerts.alertType,
            candidates.map((c) => c.alertType),
          ),
        ),
      );

    const existingTypes = new Set(
      existingActiveAlerts.map((a) => `${a.alertType}:${a.severity}`),
    );

    // Filter out duplicates (same type + same or lower severity)
    const newCandidates = candidates.filter(
      (c) => !existingTypes.has(`${c.alertType}:${c.severity}`),
    );

    if (newCandidates.length === 0) {
      return { success: true, data: [] };
    }

    // Insert new alerts
    const inserted = await db
      .insert(clinicalAlerts)
      .values(
        newCandidates.map((c) => ({
          organisationId: orgId,
          personId,
          alertType: c.alertType,
          severity: c.severity,
          source: c.source,
          triggerValue: c.triggerValue,
          triggerThreshold: c.triggerThreshold,
          message: c.message,
          status: 'active' as const,
          escalationLevel: c.escalationLevel,
        })),
      )
      .returning();

    // Audit log for each alert
    for (const alert of inserted) {
      await auditLog(
        'create',
        'clinical_alert',
        alert.id,
        {
          before: null,
          after: {
            alertType: alert.alertType,
            severity: alert.severity,
            message: alert.message,
            personId,
          },
        },
        { userId, organisationId: orgId },
      );
    }

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${personId}/clinical/alerts`);
    }

    return { success: true, data: inserted };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[evaluateAlerts] Error:', error);
    return { success: false, error: 'Failed to evaluate alerts' };
  }
}

// ---------------------------------------------------------------------------
// Acknowledge alert
// ---------------------------------------------------------------------------

export async function acknowledgeAlert(
  input: AcknowledgeAlertInput,
): Promise<ActionResult<ClinicalAlert>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'clinical');

    const parsed = acknowledgeAlertSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Get user name for denormalisation
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Update the alert
    const [updated] = await db
      .update(clinicalAlerts)
      .set({
        status: 'acknowledged',
        acknowledgedById: userId,
        acknowledgedByName: user?.name ?? null,
        acknowledgedAt: new Date(),
        actionTaken: data.actionTaken,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clinicalAlerts.id, data.alertId),
          eq(clinicalAlerts.organisationId, orgId),
          eq(clinicalAlerts.status, 'active'),
        ),
      )
      .returning();

    if (!updated) {
      return { success: false, error: 'Alert not found or already processed' };
    }

    await auditLog(
      'update',
      'clinical_alert',
      updated.id,
      {
        before: { status: 'active' },
        after: {
          status: 'acknowledged',
          acknowledgedBy: user?.name,
          actionTaken: data.actionTaken,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(
        `/${slug}/persons/${updated.personId}/clinical/alerts`,
      );
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[acknowledgeAlert] Error:', error);
    return { success: false, error: 'Failed to acknowledge alert' };
  }
}

// ---------------------------------------------------------------------------
// Resolve alert
// ---------------------------------------------------------------------------

export async function resolveAlert(
  input: ResolveAlertInput,
): Promise<ActionResult<ClinicalAlert>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'clinical');

    const parsed = resolveAlertSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Get user name
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const now = new Date();

    // Build set clause — only set acknowledgedBy fields if not already set
    const [existing] = await db
      .select({
        acknowledgedById: clinicalAlerts.acknowledgedById,
        actionTaken: clinicalAlerts.actionTaken,
      })
      .from(clinicalAlerts)
      .where(
        and(
          eq(clinicalAlerts.id, data.alertId),
          eq(clinicalAlerts.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Alert not found' };
    }

    const setClause: Record<string, unknown> = {
      status: 'resolved',
      resolvedAt: now,
      updatedAt: now,
    };

    // If resolving directly (without prior acknowledgement), set acknowledger
    if (!existing.acknowledgedById) {
      setClause.acknowledgedById = userId;
      setClause.acknowledgedByName = user?.name ?? null;
      setClause.acknowledgedAt = now;
    }

    if (data.actionTaken) {
      setClause.actionTaken = data.actionTaken;
    }

    const [updated] = await db
      .update(clinicalAlerts)
      .set(setClause)
      .where(
        and(
          eq(clinicalAlerts.id, data.alertId),
          eq(clinicalAlerts.organisationId, orgId),
        ),
      )
      .returning();

    if (!updated) {
      return { success: false, error: 'Alert not found' };
    }

    await auditLog(
      'update',
      'clinical_alert',
      updated.id,
      {
        before: { status: 'acknowledged' },
        after: {
          status: 'resolved',
          resolvedAt: now.toISOString(),
          actionTaken: data.actionTaken,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(
        `/${slug}/persons/${updated.personId}/clinical/alerts`,
      );
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[resolveAlert] Error:', error);
    return { success: false, error: 'Failed to resolve alert' };
  }
}

// ---------------------------------------------------------------------------
// Escalate alert
// ---------------------------------------------------------------------------

export async function escalateAlert(
  input: EscalateAlertInput,
): Promise<ActionResult<ClinicalAlert>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'clinical');

    const parsed = escalateAlertSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Get current alert
    const [current] = await db
      .select()
      .from(clinicalAlerts)
      .where(
        and(
          eq(clinicalAlerts.id, data.alertId),
          eq(clinicalAlerts.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!current) {
      return { success: false, error: 'Alert not found' };
    }

    if (current.status === 'resolved') {
      return { success: false, error: 'Cannot escalate a resolved alert' };
    }

    const nextLevel = getNextEscalationLevel(
      current.escalationLevel as EscalationLevel,
    );

    if (!nextLevel) {
      return {
        success: false,
        error: 'Alert is already at the highest escalation level',
      };
    }

    const [updated] = await db
      .update(clinicalAlerts)
      .set({
        status: 'escalated',
        escalationLevel: nextLevel,
        actionTaken: data.reason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clinicalAlerts.id, data.alertId),
          eq(clinicalAlerts.organisationId, orgId),
        ),
      )
      .returning();

    if (!updated) {
      return { success: false, error: 'Failed to update alert' };
    }

    await auditLog(
      'update',
      'clinical_alert',
      updated.id,
      {
        before: {
          escalationLevel: current.escalationLevel,
          status: current.status,
        },
        after: {
          escalationLevel: nextLevel,
          status: 'escalated',
          reason: data.reason,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(
        `/${slug}/persons/${updated.personId}/clinical/alerts`,
      );
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[escalateAlert] Error:', error);
    return { success: false, error: 'Failed to escalate alert' };
  }
}

// ---------------------------------------------------------------------------
// List alerts
// ---------------------------------------------------------------------------

export type ClinicalAlertListItem = {
  id: string;
  alertType: string;
  severity: string;
  source: string;
  triggerValue: string | null;
  triggerThreshold: string | null;
  message: string;
  status: string;
  acknowledgedByName: string | null;
  acknowledgedAt: Date | null;
  actionTaken: string | null;
  resolvedAt: Date | null;
  escalationLevel: string;
  createdAt: Date;
};

export type ClinicalAlertListResult = {
  alerts: ClinicalAlertListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listAlerts({
  personId,
  status,
  alertType,
  severity,
  page = 1,
  pageSize = 20,
}: {
  personId: string;
  status?: string;
  alertType?: string;
  severity?: string;
  page?: number;
  pageSize?: number;
}): Promise<ClinicalAlertListResult> {
  const { orgId } = await requirePermission('read', 'clinical');

  const conditions = [
    eq(clinicalAlerts.organisationId, orgId),
    eq(clinicalAlerts.personId, personId),
  ];

  if (status) {
    conditions.push(eq(clinicalAlerts.status, status));
  }
  if (alertType) {
    conditions.push(eq(clinicalAlerts.alertType, alertType));
  }
  if (severity) {
    conditions.push(eq(clinicalAlerts.severity, severity));
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: clinicalAlerts.id,
        alertType: clinicalAlerts.alertType,
        severity: clinicalAlerts.severity,
        source: clinicalAlerts.source,
        triggerValue: clinicalAlerts.triggerValue,
        triggerThreshold: clinicalAlerts.triggerThreshold,
        message: clinicalAlerts.message,
        status: clinicalAlerts.status,
        acknowledgedByName: clinicalAlerts.acknowledgedByName,
        acknowledgedAt: clinicalAlerts.acknowledgedAt,
        actionTaken: clinicalAlerts.actionTaken,
        resolvedAt: clinicalAlerts.resolvedAt,
        escalationLevel: clinicalAlerts.escalationLevel,
        createdAt: clinicalAlerts.createdAt,
      })
      .from(clinicalAlerts)
      .where(whereClause)
      .orderBy(desc(clinicalAlerts.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(clinicalAlerts).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    alerts: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get active alerts for a person (banner display)
// ---------------------------------------------------------------------------

export async function getActiveAlerts({
  personId,
}: {
  personId: string;
}): Promise<ClinicalAlertListItem[]> {
  const { orgId } = await requirePermission('read', 'clinical');

  const rows = await db
    .select({
      id: clinicalAlerts.id,
      alertType: clinicalAlerts.alertType,
      severity: clinicalAlerts.severity,
      source: clinicalAlerts.source,
      triggerValue: clinicalAlerts.triggerValue,
      triggerThreshold: clinicalAlerts.triggerThreshold,
      message: clinicalAlerts.message,
      status: clinicalAlerts.status,
      acknowledgedByName: clinicalAlerts.acknowledgedByName,
      acknowledgedAt: clinicalAlerts.acknowledgedAt,
      actionTaken: clinicalAlerts.actionTaken,
      resolvedAt: clinicalAlerts.resolvedAt,
      escalationLevel: clinicalAlerts.escalationLevel,
      createdAt: clinicalAlerts.createdAt,
    })
    .from(clinicalAlerts)
    .where(
      and(
        eq(clinicalAlerts.organisationId, orgId),
        eq(clinicalAlerts.personId, personId),
        inArray(clinicalAlerts.status, ['active', 'escalated']),
      ),
    )
    .orderBy(desc(clinicalAlerts.createdAt));

  return rows;
}

// ---------------------------------------------------------------------------
// Create manual alert
// ---------------------------------------------------------------------------

export async function createManualAlert(
  input: CreateManualAlertInput,
): Promise<ActionResult<ClinicalAlert>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    const parsed = createManualAlertSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [alert] = await db
      .insert(clinicalAlerts)
      .values({
        organisationId: orgId,
        personId: data.personId,
        alertType: data.alertType,
        severity: data.severity,
        source: 'manual',
        message: data.message,
        status: 'active',
        escalationLevel:
          DEFAULT_ESCALATION_BY_SEVERITY[
            data.severity as keyof typeof DEFAULT_ESCALATION_BY_SEVERITY
          ],
      })
      .returning();

    await auditLog(
      'create',
      'clinical_alert',
      alert.id,
      {
        before: null,
        after: {
          alertType: data.alertType,
          severity: data.severity,
          message: data.message,
          source: 'manual',
          personId: data.personId,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/clinical/alerts`);
    }

    return { success: true, data: alert };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createManualAlert] Error:', error);
    return { success: false, error: 'Failed to create alert' };
  }
}

// ---------------------------------------------------------------------------
// Set custom threshold
// ---------------------------------------------------------------------------

export async function setCustomThreshold(
  input: SetCustomThresholdInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'clinical');

    const parsed = setCustomThresholdSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Get user name
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // Check if a threshold already exists for this person + type
    const [existing] = await db
      .select({ id: personAlertThresholds.id })
      .from(personAlertThresholds)
      .where(
        and(
          eq(personAlertThresholds.organisationId, orgId),
          eq(personAlertThresholds.personId, data.personId),
          eq(personAlertThresholds.alertType, data.alertType),
        ),
      )
      .limit(1);

    let resultId: string;

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(personAlertThresholds)
        .set({
          customThreshold: data.customThreshold,
          reason: data.reason,
          setById: userId,
          setByName: user?.name ?? null,
          updatedAt: new Date(),
        })
        .where(eq(personAlertThresholds.id, existing.id))
        .returning();

      resultId = updated.id;

      await auditLog(
        'update',
        'person_alert_threshold',
        resultId,
        {
          before: { id: existing.id },
          after: {
            alertType: data.alertType,
            customThreshold: data.customThreshold,
            reason: data.reason,
            personId: data.personId,
          },
        },
        { userId, organisationId: orgId },
      );
    } else {
      // Create new
      const [created] = await db
        .insert(personAlertThresholds)
        .values({
          organisationId: orgId,
          personId: data.personId,
          alertType: data.alertType,
          customThreshold: data.customThreshold,
          reason: data.reason,
          setById: userId,
          setByName: user?.name ?? null,
        })
        .returning();

      resultId = created.id;

      await auditLog(
        'create',
        'person_alert_threshold',
        resultId,
        {
          before: null,
          after: {
            alertType: data.alertType,
            customThreshold: data.customThreshold,
            reason: data.reason,
            personId: data.personId,
          },
        },
        { userId, organisationId: orgId },
      );
    }

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/clinical/alerts`);
    }

    return { success: true, data: { id: resultId } };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[setCustomThreshold] Error:', error);
    return { success: false, error: 'Failed to set custom threshold' };
  }
}

// ---------------------------------------------------------------------------
// Get custom thresholds for a person
// ---------------------------------------------------------------------------

export type PersonThresholdListItem = {
  id: string;
  alertType: string;
  customThreshold: unknown;
  reason: string | null;
  setByName: string | null;
  updatedAt: Date;
};

export async function getPersonThresholds({
  personId,
}: {
  personId: string;
}): Promise<PersonThresholdListItem[]> {
  const { orgId } = await requirePermission('read', 'clinical');

  const rows = await db
    .select({
      id: personAlertThresholds.id,
      alertType: personAlertThresholds.alertType,
      customThreshold: personAlertThresholds.customThreshold,
      reason: personAlertThresholds.reason,
      setByName: personAlertThresholds.setByName,
      updatedAt: personAlertThresholds.updatedAt,
    })
    .from(personAlertThresholds)
    .where(
      and(
        eq(personAlertThresholds.organisationId, orgId),
        eq(personAlertThresholds.personId, personId),
      ),
    )
    .orderBy(personAlertThresholds.alertType);

  return rows;
}
