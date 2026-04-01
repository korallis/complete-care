'use server';

/**
 * Vital Signs Server Actions
 *
 * Record, list, and analyse vital sign observations with NEWS2 auto-scoring.
 * All actions are tenant-scoped and RBAC-protected.
 *
 * RBAC rules:
 * - clinical resource: senior_carer+ can record (create/update), carer can view (read)
 *
 * Flow: Zod validate -> auth -> RBAC -> tenant isolation -> audit log
 */

import { and, count, desc, eq, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { vitalSigns, organisations, users } from '@/lib/db/schema';
import type { VitalSign } from '@/lib/db/schema/vital-signs';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import { recordVitalSignsSchema } from './schema';
import type { RecordVitalSignsInput } from './schema';
import { calculateNews2 } from './news2';
import type { AvpuLevel } from './constants';

// Re-export types for external use
export type { RecordVitalSignsInput } from './schema';

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
// Record vital signs
// ---------------------------------------------------------------------------

export async function recordVitalSigns(
  input: RecordVitalSignsInput,
): Promise<ActionResult<VitalSign>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    const parsed = recordVitalSignsSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Calculate NEWS2 if all 6 required parameters are present
    let news2Score: number | null = null;
    let news2ScaleUsed: number | null = null;
    let news2Escalation: string | null = null;

    const canCalculateNews2 =
      data.respiratoryRate != null &&
      data.spo2 != null &&
      data.supplementalOxygen != null &&
      data.systolicBp != null &&
      data.pulseRate != null &&
      data.avpu != null &&
      data.temperature != null;

    if (canCalculateNews2) {
      const result = calculateNews2({
        respiratoryRate: data.respiratoryRate!,
        spo2: data.spo2!,
        supplementalOxygen: data.supplementalOxygen!,
        systolicBp: data.systolicBp!,
        pulseRate: data.pulseRate!,
        consciousness: data.avpu! as AvpuLevel,
        temperature: data.temperature!,
        isCopd: data.isCopd,
      });

      news2Score = result.totalScore;
      news2ScaleUsed = result.scaleUsed;
      news2Escalation = result.escalation;
    }

    // Get user name for denormalisation
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [entry] = await db
      .insert(vitalSigns)
      .values({
        organisationId: orgId,
        personId: data.personId,
        temperature: data.temperature ?? null,
        systolicBp: data.systolicBp ?? null,
        diastolicBp: data.diastolicBp ?? null,
        bpPosition: data.bpPosition ?? null,
        pulseRate: data.pulseRate ?? null,
        pulseRhythm: data.pulseRhythm ?? null,
        respiratoryRate: data.respiratoryRate ?? null,
        spo2: data.spo2 ?? null,
        supplementalOxygen: data.supplementalOxygen ?? null,
        oxygenFlowRate: data.oxygenFlowRate ?? null,
        avpu: data.avpu ?? null,
        bloodGlucose: data.bloodGlucose ?? null,
        painScore: data.painScore ?? null,
        news2Score,
        news2ScaleUsed,
        news2Escalation,
        isCopd: data.isCopd,
        recordedById: userId,
        recordedByName: user?.name ?? null,
        recordedAt: new Date(data.recordedAt),
        notes: data.notes ?? null,
      })
      .returning();

    await auditLog(
      'create',
      'vital_signs',
      entry.id,
      {
        before: null,
        after: {
          personId: data.personId,
          news2Score,
          news2Escalation,
          temperature: data.temperature,
          systolicBp: data.systolicBp,
          pulseRate: data.pulseRate,
          respiratoryRate: data.respiratoryRate,
          spo2: data.spo2,
          avpu: data.avpu,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/clinical/vitals`);
    }

    return { success: true, data: entry };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[recordVitalSigns] Error:', error);
    return { success: false, error: 'Failed to record vital signs' };
  }
}

// ---------------------------------------------------------------------------
// List vital signs for a person (paginated)
// ---------------------------------------------------------------------------

export type VitalSignListItem = {
  id: string;
  temperature: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  bpPosition: string | null;
  pulseRate: number | null;
  pulseRhythm: string | null;
  respiratoryRate: number | null;
  spo2: number | null;
  supplementalOxygen: boolean | null;
  oxygenFlowRate: number | null;
  avpu: string | null;
  bloodGlucose: number | null;
  painScore: number | null;
  news2Score: number | null;
  news2ScaleUsed: number | null;
  news2Escalation: string | null;
  isCopd: boolean;
  recordedByName: string | null;
  recordedAt: Date;
  notes: string | null;
};

export type VitalSignListResult = {
  entries: VitalSignListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listVitalSigns({
  personId,
  page = 1,
  pageSize = 20,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
}): Promise<VitalSignListResult> {
  const { orgId } = await requirePermission('read', 'clinical');

  const whereClause = and(
    eq(vitalSigns.organisationId, orgId),
    eq(vitalSigns.personId, personId),
  );
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: vitalSigns.id,
        temperature: vitalSigns.temperature,
        systolicBp: vitalSigns.systolicBp,
        diastolicBp: vitalSigns.diastolicBp,
        bpPosition: vitalSigns.bpPosition,
        pulseRate: vitalSigns.pulseRate,
        pulseRhythm: vitalSigns.pulseRhythm,
        respiratoryRate: vitalSigns.respiratoryRate,
        spo2: vitalSigns.spo2,
        supplementalOxygen: vitalSigns.supplementalOxygen,
        oxygenFlowRate: vitalSigns.oxygenFlowRate,
        avpu: vitalSigns.avpu,
        bloodGlucose: vitalSigns.bloodGlucose,
        painScore: vitalSigns.painScore,
        news2Score: vitalSigns.news2Score,
        news2ScaleUsed: vitalSigns.news2ScaleUsed,
        news2Escalation: vitalSigns.news2Escalation,
        isCopd: vitalSigns.isCopd,
        recordedByName: vitalSigns.recordedByName,
        recordedAt: vitalSigns.recordedAt,
        notes: vitalSigns.notes,
      })
      .from(vitalSigns)
      .where(whereClause)
      .orderBy(desc(vitalSigns.recordedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(vitalSigns).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    entries: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get latest vital signs for a person
// ---------------------------------------------------------------------------

export async function getLatestVitals({
  personId,
}: {
  personId: string;
}): Promise<VitalSignListItem | null> {
  const { orgId } = await requirePermission('read', 'clinical');

  const [row] = await db
    .select({
      id: vitalSigns.id,
      temperature: vitalSigns.temperature,
      systolicBp: vitalSigns.systolicBp,
      diastolicBp: vitalSigns.diastolicBp,
      bpPosition: vitalSigns.bpPosition,
      pulseRate: vitalSigns.pulseRate,
      pulseRhythm: vitalSigns.pulseRhythm,
      respiratoryRate: vitalSigns.respiratoryRate,
      spo2: vitalSigns.spo2,
      supplementalOxygen: vitalSigns.supplementalOxygen,
      oxygenFlowRate: vitalSigns.oxygenFlowRate,
      avpu: vitalSigns.avpu,
      bloodGlucose: vitalSigns.bloodGlucose,
      painScore: vitalSigns.painScore,
      news2Score: vitalSigns.news2Score,
      news2ScaleUsed: vitalSigns.news2ScaleUsed,
      news2Escalation: vitalSigns.news2Escalation,
      isCopd: vitalSigns.isCopd,
      recordedByName: vitalSigns.recordedByName,
      recordedAt: vitalSigns.recordedAt,
      notes: vitalSigns.notes,
    })
    .from(vitalSigns)
    .where(
      and(
        eq(vitalSigns.organisationId, orgId),
        eq(vitalSigns.personId, personId),
      ),
    )
    .orderBy(desc(vitalSigns.recordedAt))
    .limit(1);

  return row ?? null;
}

// ---------------------------------------------------------------------------
// Get vital sign trends (for chart display)
// ---------------------------------------------------------------------------

export type VitalTrendPoint = {
  recordedAt: Date;
  temperature: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  pulseRate: number | null;
  respiratoryRate: number | null;
  spo2: number | null;
  news2Score: number | null;
};

export async function getVitalTrends({
  personId,
  days = 7,
}: {
  personId: string;
  days?: number;
}): Promise<VitalTrendPoint[]> {
  const { orgId } = await requirePermission('read', 'clinical');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db
    .select({
      recordedAt: vitalSigns.recordedAt,
      temperature: vitalSigns.temperature,
      systolicBp: vitalSigns.systolicBp,
      diastolicBp: vitalSigns.diastolicBp,
      pulseRate: vitalSigns.pulseRate,
      respiratoryRate: vitalSigns.respiratoryRate,
      spo2: vitalSigns.spo2,
      news2Score: vitalSigns.news2Score,
    })
    .from(vitalSigns)
    .where(
      and(
        eq(vitalSigns.organisationId, orgId),
        eq(vitalSigns.personId, personId),
        gte(vitalSigns.recordedAt, startDate),
      ),
    )
    .orderBy(vitalSigns.recordedAt);

  return rows;
}
