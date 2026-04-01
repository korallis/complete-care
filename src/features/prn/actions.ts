'use server';

/**
 * PRN Management Server Actions
 *
 * Protocol CRUD, administration recording, follow-up, and usage reporting.
 * All actions are tenant-scoped and RBAC-protected.
 *
 * RBAC rules: reuses medications resource — manager+ can create/update protocols,
 * senior_carer+ can administer, carer can record administrations and view.
 */

import { and, count, desc, eq, gte, lte, asc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  medications,
  organisations,
  users,
  prnProtocols,
  prnAdministrations,
} from '@/lib/db/schema';
import type { PrnProtocol, PrnAdministration } from '@/lib/db/schema/prn-protocols';
import type { Medication } from '@/lib/db/schema/medications';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createPrnProtocolSchema,
  updatePrnProtocolSchema,
  recordPrnAdministrationSchema,
  recordFollowUpSchema,
} from './schema';
import type {
  CreatePrnProtocolInput,
  UpdatePrnProtocolInput,
  RecordPrnAdministrationInput,
  RecordFollowUpInput,
} from './schema';

// Re-export types
export type {
  CreatePrnProtocolInput,
  UpdatePrnProtocolInput,
  RecordPrnAdministrationInput,
  RecordFollowUpInput,
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
// List PRN protocols for a person (via their medications)
// ---------------------------------------------------------------------------

export type PrnProtocolListItem = PrnProtocol & {
  medication: {
    id: string;
    drugName: string;
    dose: string;
    doseUnit: string;
    route: string;
    status: string;
  };
};

export async function listPrnProtocols({
  personId,
}: {
  personId: string;
}): Promise<PrnProtocolListItem[]> {
  const { orgId } = await requirePermission('read', 'medications');

  const rows = await db
    .select({
      protocol: prnProtocols,
      medication: {
        id: medications.id,
        drugName: medications.drugName,
        dose: medications.dose,
        doseUnit: medications.doseUnit,
        route: medications.route,
        status: medications.status,
      },
    })
    .from(prnProtocols)
    .innerJoin(medications, eq(prnProtocols.medicationId, medications.id))
    .where(
      and(
        eq(prnProtocols.organisationId, orgId),
        eq(medications.personId, personId),
      ),
    )
    .orderBy(asc(medications.drugName));

  return rows.map((r) => ({
    ...r.protocol,
    medication: r.medication,
  }));
}

// ---------------------------------------------------------------------------
// Get single PRN protocol
// ---------------------------------------------------------------------------

export type PrnProtocolDetail = PrnProtocol & {
  medication: Medication;
};

export async function getPrnProtocol(
  protocolId: string,
): Promise<PrnProtocolDetail | null> {
  const { orgId } = await requirePermission('read', 'medications');

  const [row] = await db
    .select({
      protocol: prnProtocols,
      medication: medications,
    })
    .from(prnProtocols)
    .innerJoin(medications, eq(prnProtocols.medicationId, medications.id))
    .where(eq(prnProtocols.id, protocolId))
    .limit(1);

  if (!row) return null;

  assertBelongsToOrg(row.protocol.organisationId, orgId);

  return {
    ...row.protocol,
    medication: row.medication,
  };
}

// ---------------------------------------------------------------------------
// Create PRN protocol
// ---------------------------------------------------------------------------

export async function createPrnProtocol(
  input: CreatePrnProtocolInput,
): Promise<ActionResult<PrnProtocol>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'medications');

    const parsed = createPrnProtocolSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify medication belongs to this org and is PRN
    const [med] = await db
      .select()
      .from(medications)
      .where(eq(medications.id, data.medicationId))
      .limit(1);

    if (!med) {
      return { success: false, error: 'Medication not found' };
    }

    assertBelongsToOrg(med.organisationId, orgId);

    if (med.frequency !== 'prn') {
      return { success: false, error: 'Protocol can only be created for PRN medications' };
    }

    // Check if protocol already exists for this medication
    const [existing] = await db
      .select({ id: prnProtocols.id })
      .from(prnProtocols)
      .where(
        and(
          eq(prnProtocols.medicationId, data.medicationId),
          eq(prnProtocols.organisationId, orgId),
        ),
      )
      .limit(1);

    if (existing) {
      return { success: false, error: 'A protocol already exists for this medication' };
    }

    const [protocol] = await db
      .insert(prnProtocols)
      .values({
        medicationId: data.medicationId,
        organisationId: orgId,
        indication: data.indication,
        signsSymptoms: data.signsSymptoms,
        doseRange: data.doseRange,
        maxDose24hr: data.maxDose24hr,
        minInterval: data.minInterval,
        nonPharmAlternatives: data.nonPharmAlternatives ?? null,
        expectedEffect: data.expectedEffect,
        escalationCriteria: data.escalationCriteria ?? null,
        followUpMinutes: data.followUpMinutes,
      })
      .returning();

    await auditLog('create', 'prn_protocol', protocol.id, {
      before: null,
      after: {
        medicationId: data.medicationId,
        indication: data.indication,
        drugName: med.drugName,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${med.personId}/emar/prn`);
    }

    return { success: true, data: protocol };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createPrnProtocol] Error:', error);
    return { success: false, error: 'Failed to create PRN protocol' };
  }
}

// ---------------------------------------------------------------------------
// Update PRN protocol
// ---------------------------------------------------------------------------

export async function updatePrnProtocol(
  protocolId: string,
  input: UpdatePrnProtocolInput,
): Promise<ActionResult<PrnProtocol>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'medications');

    const parsed = updatePrnProtocolSchema.safeParse(input);
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
      .from(prnProtocols)
      .where(eq(prnProtocols.id, protocolId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Protocol not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof prnProtocols.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.indication !== undefined) updates.indication = data.indication;
    if (data.signsSymptoms !== undefined) updates.signsSymptoms = data.signsSymptoms;
    if (data.doseRange !== undefined) updates.doseRange = data.doseRange;
    if (data.maxDose24hr !== undefined) updates.maxDose24hr = data.maxDose24hr;
    if (data.minInterval !== undefined) updates.minInterval = data.minInterval;
    if (data.nonPharmAlternatives !== undefined) updates.nonPharmAlternatives = data.nonPharmAlternatives;
    if (data.expectedEffect !== undefined) updates.expectedEffect = data.expectedEffect;
    if (data.escalationCriteria !== undefined) updates.escalationCriteria = data.escalationCriteria;
    if (data.followUpMinutes !== undefined) updates.followUpMinutes = data.followUpMinutes;

    const [updated] = await db
      .update(prnProtocols)
      .set(updates)
      .where(eq(prnProtocols.id, protocolId))
      .returning();

    await auditLog('update', 'prn_protocol', protocolId, {
      before: { indication: existing.indication },
      after: { indication: updated.indication },
    }, { userId, organisationId: orgId });

    // Find person ID for revalidation
    const [med] = await db
      .select({ personId: medications.personId })
      .from(medications)
      .where(eq(medications.id, existing.medicationId))
      .limit(1);

    const slug = await getOrgSlug(orgId);
    if (slug && med) {
      revalidatePath(`/${slug}/persons/${med.personId}/emar/prn`);
      revalidatePath(`/${slug}/persons/${med.personId}/emar/prn/${protocolId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updatePrnProtocol] Error:', error);
    return { success: false, error: 'Failed to update PRN protocol' };
  }
}

// ---------------------------------------------------------------------------
// Record PRN administration (pre-dose + give)
// ---------------------------------------------------------------------------

export async function recordPrnAdministration(
  input: RecordPrnAdministrationInput,
): Promise<ActionResult<PrnAdministration>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'medications');

    const parsed = recordPrnAdministrationSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify protocol belongs to this org
    const [protocol] = await db
      .select()
      .from(prnProtocols)
      .where(eq(prnProtocols.id, data.prnProtocolId))
      .limit(1);

    if (!protocol) {
      return { success: false, error: 'PRN protocol not found' };
    }

    assertBelongsToOrg(protocol.organisationId, orgId);

    // Verify medication matches
    if (protocol.medicationId !== data.medicationId) {
      return { success: false, error: 'Medication does not match protocol' };
    }

    // Check minimum interval — find last administration
    const [lastAdmin] = await db
      .select({ administeredAt: prnAdministrations.administeredAt })
      .from(prnAdministrations)
      .where(
        and(
          eq(prnAdministrations.prnProtocolId, data.prnProtocolId),
          eq(prnAdministrations.personId, data.personId),
          eq(prnAdministrations.organisationId, orgId),
        ),
      )
      .orderBy(desc(prnAdministrations.administeredAt))
      .limit(1);

    if (lastAdmin) {
      const minIntervalMs = protocol.minInterval * 60 * 1000;
      const timeSinceLastAdmin =
        Date.now() - lastAdmin.administeredAt.getTime();
      if (timeSinceLastAdmin < minIntervalMs) {
        const minutesRemaining = Math.ceil(
          (minIntervalMs - timeSinceLastAdmin) / 60000,
        );
        return {
          success: false,
          error: `Minimum interval not met. Please wait ${minutesRemaining} more minute${minutesRemaining !== 1 ? 's' : ''}.`,
        };
      }
    }

    // Get administering user name
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const administeredAt = data.administeredAt
      ? new Date(data.administeredAt)
      : new Date();

    const [admin] = await db
      .insert(prnAdministrations)
      .values({
        prnProtocolId: data.prnProtocolId,
        medicationId: data.medicationId,
        personId: data.personId,
        organisationId: orgId,
        preDoseAssessment: data.preDoseAssessment,
        administeredAt,
        administeredById: userId,
        administeredByName: user?.name ?? null,
      })
      .returning();

    await auditLog('record_prn_administration', 'prn_administration', admin.id, {
      before: null,
      after: {
        prnProtocolId: data.prnProtocolId,
        medicationId: data.medicationId,
        painScore: data.preDoseAssessment.painScore,
        administeredByName: user?.name,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/emar/prn`);
    }

    return { success: true, data: admin };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[recordPrnAdministration] Error:', error);
    return { success: false, error: 'Failed to record PRN administration' };
  }
}

// ---------------------------------------------------------------------------
// Record follow-up assessment
// ---------------------------------------------------------------------------

export async function recordFollowUp(
  input: RecordFollowUpInput,
): Promise<ActionResult<PrnAdministration>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'medications');

    const parsed = recordFollowUpSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [existing] = await db
      .select()
      .from(prnAdministrations)
      .where(eq(prnAdministrations.id, data.prnAdministrationId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'PRN administration not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.postDoseAssessment) {
      return { success: false, error: 'Follow-up assessment already recorded' };
    }

    const [updated] = await db
      .update(prnAdministrations)
      .set({
        postDoseAssessment: data.postDoseAssessment,
        postDoseAssessedAt: new Date(),
        followUpActions: data.followUpActions ?? null,
        updatedAt: new Date(),
      })
      .where(eq(prnAdministrations.id, data.prnAdministrationId))
      .returning();

    await auditLog('record_follow_up', 'prn_administration', data.prnAdministrationId, {
      before: { postDoseAssessment: null },
      after: {
        postDoseAssessment: data.postDoseAssessment,
        followUpActions: data.followUpActions,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/emar/prn`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[recordFollowUp] Error:', error);
    return { success: false, error: 'Failed to record follow-up' };
  }
}

// ---------------------------------------------------------------------------
// Get PRN administration history for a protocol
// ---------------------------------------------------------------------------

export type PrnAdministrationListItem = PrnAdministration & {
  medication: {
    drugName: string;
    dose: string;
    doseUnit: string;
  };
};

export async function listPrnAdministrations({
  protocolId,
  personId,
  page = 1,
  pageSize = 20,
}: {
  protocolId?: string;
  personId: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  administrations: PrnAdministrationListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { orgId } = await requirePermission('read', 'medications');

  const conditions = [
    eq(prnAdministrations.organisationId, orgId),
    eq(prnAdministrations.personId, personId),
  ];

  if (protocolId) {
    conditions.push(eq(prnAdministrations.prnProtocolId, protocolId));
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        admin: prnAdministrations,
        medication: {
          drugName: medications.drugName,
          dose: medications.dose,
          doseUnit: medications.doseUnit,
        },
      })
      .from(prnAdministrations)
      .innerJoin(medications, eq(prnAdministrations.medicationId, medications.id))
      .where(whereClause)
      .orderBy(desc(prnAdministrations.administeredAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(prnAdministrations).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    administrations: rows.map((r) => ({
      ...r.admin,
      medication: r.medication,
    })),
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// PRN usage report
// ---------------------------------------------------------------------------

export type PrnUsageReportItem = {
  protocolId: string;
  medicationId: string;
  drugName: string;
  totalAdministrations: number;
  assessedCount: number;
  effectiveCount: number;
  partialCount: number;
  notEffectiveCount: number;
  effectivenessRate: number | null;
  averagePrePainScore: number | null;
  averagePostPainScore: number | null;
};

export type PrnUsageReport = {
  items: PrnUsageReportItem[];
  dateFrom: string;
  dateTo: string;
  pendingFollowUps: number;
};

export async function getPrnUsageReport({
  personId,
  dateFrom,
  dateTo,
}: {
  personId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<PrnUsageReport> {
  const { orgId } = await requirePermission('read', 'medications');

  const from = new Date(`${dateFrom}T00:00:00.000Z`);
  const to = new Date(`${dateTo}T23:59:59.999Z`);

  // Get all protocols for this person
  const protocols = await listPrnProtocols({ personId });

  // Get all administrations in the date range
  const admins = await db
    .select({
      admin: prnAdministrations,
      drugName: medications.drugName,
    })
    .from(prnAdministrations)
    .innerJoin(medications, eq(prnAdministrations.medicationId, medications.id))
    .where(
      and(
        eq(prnAdministrations.organisationId, orgId),
        eq(prnAdministrations.personId, personId),
        gte(prnAdministrations.administeredAt, from),
        lte(prnAdministrations.administeredAt, to),
      ),
    )
    .orderBy(asc(prnAdministrations.administeredAt));

  // Count pending follow-ups
  const pendingResult = await db
    .select({ count: count() })
    .from(prnAdministrations)
    .where(
      and(
        eq(prnAdministrations.organisationId, orgId),
        eq(prnAdministrations.personId, personId),
        sql`${prnAdministrations.postDoseAssessment} IS NULL`,
      ),
    );

  const pendingFollowUps = pendingResult[0]?.count ?? 0;

  // Group by protocol
  const items: PrnUsageReportItem[] = protocols.map((protocol) => {
    const protocolAdmins = admins.filter(
      (a) => a.admin.prnProtocolId === protocol.id,
    );

    const assessed = protocolAdmins.filter(
      (a) => a.admin.postDoseAssessment != null,
    );

    type PostDoseAssessment = { effectAchieved: 'yes' | 'partial' | 'no'; painScore: number };

    const effectiveCount = assessed.filter(
      (a) => (a.admin.postDoseAssessment as PostDoseAssessment | null)?.effectAchieved === 'yes',
    ).length;

    const partialCount = assessed.filter(
      (a) => (a.admin.postDoseAssessment as PostDoseAssessment | null)?.effectAchieved === 'partial',
    ).length;

    const notEffectiveCount = assessed.filter(
      (a) => (a.admin.postDoseAssessment as PostDoseAssessment | null)?.effectAchieved === 'no',
    ).length;

    type PreDoseAssessment = { painScore: number };

    const prePainScores = protocolAdmins.map(
      (a) => (a.admin.preDoseAssessment as PreDoseAssessment).painScore,
    );
    const postPainScores = assessed
      .map((a) => (a.admin.postDoseAssessment as PostDoseAssessment | null)?.painScore)
      .filter((s): s is number => s != null);

    const averagePrePainScore =
      prePainScores.length > 0
        ? Math.round(
            (prePainScores.reduce((sum, s) => sum + s, 0) /
              prePainScores.length) *
              10,
          ) / 10
        : null;

    const averagePostPainScore =
      postPainScores.length > 0
        ? Math.round(
            (postPainScores.reduce((sum, s) => sum + s, 0) /
              postPainScores.length) *
              10,
          ) / 10
        : null;

    const effectivenessRate =
      assessed.length > 0
        ? Math.round(((effectiveCount + partialCount * 0.5) / assessed.length) * 100)
        : null;

    return {
      protocolId: protocol.id,
      medicationId: protocol.medicationId,
      drugName: protocol.medication.drugName,
      totalAdministrations: protocolAdmins.length,
      assessedCount: assessed.length,
      effectiveCount,
      partialCount,
      notEffectiveCount,
      effectivenessRate,
      averagePrePainScore,
      averagePostPainScore,
    };
  });

  return {
    items,
    dateFrom,
    dateTo,
    pendingFollowUps,
  };
}

// ---------------------------------------------------------------------------
// Get pending follow-ups (administrations without post-dose assessment)
// ---------------------------------------------------------------------------

export async function getPendingFollowUps({
  personId,
}: {
  personId: string;
}): Promise<PrnAdministrationListItem[]> {
  const { orgId } = await requirePermission('read', 'medications');

  const rows = await db
    .select({
      admin: prnAdministrations,
      medication: {
        drugName: medications.drugName,
        dose: medications.dose,
        doseUnit: medications.doseUnit,
      },
    })
    .from(prnAdministrations)
    .innerJoin(medications, eq(prnAdministrations.medicationId, medications.id))
    .where(
      and(
        eq(prnAdministrations.organisationId, orgId),
        eq(prnAdministrations.personId, personId),
        sql`${prnAdministrations.postDoseAssessment} IS NULL`,
      ),
    )
    .orderBy(asc(prnAdministrations.administeredAt));

  return rows.map((r) => ({
    ...r.admin,
    medication: r.medication,
  }));
}

// ---------------------------------------------------------------------------
// List PRN medications without protocols (helper for protocol creation)
// ---------------------------------------------------------------------------

export async function listPrnMedicationsWithoutProtocol({
  personId,
}: {
  personId: string;
}): Promise<Medication[]> {
  const { orgId } = await requirePermission('read', 'medications');

  // Get all active PRN medications for this person
  const prnMeds = await db
    .select()
    .from(medications)
    .where(
      and(
        eq(medications.organisationId, orgId),
        eq(medications.personId, personId),
        eq(medications.frequency, 'prn'),
        eq(medications.status, 'active'),
      ),
    )
    .orderBy(asc(medications.drugName));

  // Get medication IDs that already have protocols
  const existingProtocols = await db
    .select({ medicationId: prnProtocols.medicationId })
    .from(prnProtocols)
    .where(eq(prnProtocols.organisationId, orgId));

  const existingMedIds = new Set(existingProtocols.map((p) => p.medicationId));

  return prnMeds.filter((med) => !existingMedIds.has(med.id));
}
