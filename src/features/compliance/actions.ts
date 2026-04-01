'use server';

/**
 * Compliance Dashboard Server Actions
 *
 * Aggregates compliance data across DBS, training, supervision, and qualifications
 * into a unified dashboard. Also provides agency register CRUD and recruitment tracking.
 *
 * Flow: Zod validate -> auth -> RBAC (compliance resource) -> tenant -> audit.
 * All actions are tenant-scoped and RBAC-protected.
 *
 * IMPORTANT: This module reads from existing feature schemas (dbs-checks, training,
 * supervisions) but does NOT modify them. New tables (agency_register, agency_workers,
 * recruitment_records) are managed here.
 */

import { and, count, desc, eq, isNull, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  staffProfiles,
  dbsChecks,
  trainingRecords,
  supervisions,
  qualifications,
  organisations,
  agencyRegister,
  agencyWorkers,
  recruitmentRecords,
} from '@/lib/db/schema';
import type { AgencyRegisterEntry } from '@/lib/db/schema/compliance';
import type { AgencyWorker } from '@/lib/db/schema/compliance';
import type { RecruitmentRecord } from '@/lib/db/schema/compliance';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createAgencySchema,
  updateAgencySchema,
  createAgencyWorkerSchema,
  updateAgencyWorkerSchema,
  createRecruitmentRecordSchema,
  updateRecruitmentRecordSchema,
} from './schema';
import type {
  CreateAgencyInput,
  UpdateAgencyInput,
  CreateAgencyWorkerInput,
  UpdateAgencyWorkerInput,
  CreateRecruitmentRecordInput,
  UpdateRecruitmentRecordInput,
  RagColour,
} from './schema';
import {
  computeDbsRag,
  computeTrainingRag,
  computeSupervisionRag,
  computeQualificationsRag,
  aggregateRag,
  daysUntil,
} from './utils';
import type { AreaRagStatus } from './utils';

// Re-export types for external use
export type {
  CreateAgencyInput,
  UpdateAgencyInput,
  CreateAgencyWorkerInput,
  UpdateAgencyWorkerInput,
  CreateRecruitmentRecordInput,
  UpdateRecruitmentRecordInput,
} from './schema';

// ---------------------------------------------------------------------------
// Helper: normalize reference entries to match DB type
// ---------------------------------------------------------------------------

function normalizeReferences(
  refs: CreateRecruitmentRecordInput['references'],
): import('@/lib/db/schema/compliance').RecruitmentReference[] {
  return refs.map((r) => ({
    id: r.id,
    refereeName: r.refereeName,
    relationship: r.relationship,
    contactEmail: r.contactEmail ?? null,
    contactPhone: r.contactPhone ?? null,
    status: r.status,
    receivedDate: r.receivedDate ?? null,
    notes: r.notes ?? null,
  }));
}

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

// ====================================================================
// COMPLIANCE OVERVIEW — Aggregated dashboard data
// ====================================================================

export type StaffComplianceRow = {
  staffId: string;
  staffName: string;
  jobTitle: string;
  overallStatus: RagColour;
  areas: AreaRagStatus[];
};

export type ComplianceOverviewData = {
  staff: StaffComplianceRow[];
  summary: {
    totalStaff: number;
    compliant: number;
    attention: number;
    nonCompliant: number;
  };
};

/**
 * Returns the compliance overview for all active staff in the organisation.
 * Aggregates DBS, training, supervision, and qualifications RAG status per staff member.
 */
export async function getComplianceOverview(): Promise<ComplianceOverviewData> {
  const { orgId } = await requirePermission('read', 'compliance');

  // Fetch all active staff
  const staff = await db
    .select({
      id: staffProfiles.id,
      fullName: staffProfiles.fullName,
      jobTitle: staffProfiles.jobTitle,
    })
    .from(staffProfiles)
    .where(
      and(
        eq(staffProfiles.organisationId, orgId),
        eq(staffProfiles.status, 'active'),
        isNull(staffProfiles.deletedAt),
      ),
    )
    .orderBy(staffProfiles.fullName);

  if (staff.length === 0) {
    return {
      staff: [],
      summary: { totalStaff: 0, compliant: 0, attention: 0, nonCompliant: 0 },
    };
  }

  // Fetch all compliance data in parallel
  const [allDbsChecks, allTrainingRecords, allSupervisions, allQualifications] =
    await Promise.all([
      db
        .select({
          staffProfileId: dbsChecks.staffProfileId,
          recheckDate: dbsChecks.recheckDate,
          status: dbsChecks.status,
          issueDate: dbsChecks.issueDate,
        })
        .from(dbsChecks)
        .where(eq(dbsChecks.organisationId, orgId))
        .orderBy(desc(dbsChecks.issueDate)),
      db
        .select({
          staffProfileId: trainingRecords.staffProfileId,
          status: trainingRecords.status,
          expiryDate: trainingRecords.expiryDate,
        })
        .from(trainingRecords)
        .where(eq(trainingRecords.organisationId, orgId)),
      db
        .select({
          staffProfileId: supervisions.staffProfileId,
          status: supervisions.status,
          scheduledDate: supervisions.scheduledDate,
          nextDueDate: supervisions.nextDueDate,
        })
        .from(supervisions)
        .where(eq(supervisions.organisationId, orgId))
        .orderBy(desc(supervisions.scheduledDate)),
      db
        .select({
          staffProfileId: qualifications.staffProfileId,
          status: qualifications.status,
          targetDate: qualifications.targetDate,
        })
        .from(qualifications)
        .where(eq(qualifications.organisationId, orgId)),
    ]);

  // Build lookup maps: staffId -> data
  const dbsByStaff = new Map<string, (typeof allDbsChecks)[0]>();
  for (const check of allDbsChecks) {
    // Keep only the most recent per staff member (already ordered desc)
    if (!dbsByStaff.has(check.staffProfileId)) {
      dbsByStaff.set(check.staffProfileId, check);
    }
  }

  const trainingByStaff = new Map<string, (typeof allTrainingRecords)[0][]>();
  for (const record of allTrainingRecords) {
    const existing = trainingByStaff.get(record.staffProfileId) ?? [];
    existing.push(record);
    trainingByStaff.set(record.staffProfileId, existing);
  }

  const supervisionByStaff = new Map<
    string,
    (typeof allSupervisions)[0]
  >();
  for (const sup of allSupervisions) {
    if (!supervisionByStaff.has(sup.staffProfileId)) {
      supervisionByStaff.set(sup.staffProfileId, sup);
    }
  }

  const qualsByStaff = new Map<string, (typeof allQualifications)[0][]>();
  for (const qual of allQualifications) {
    const existing = qualsByStaff.get(qual.staffProfileId) ?? [];
    existing.push(qual);
    qualsByStaff.set(qual.staffProfileId, existing);
  }

  // Compute per-staff RAG
  let compliant = 0;
  let attention = 0;
  let nonCompliant = 0;

  const rows: StaffComplianceRow[] = staff.map((s) => {
    const dbsCheck = dbsByStaff.get(s.id) ?? null;
    const trainingRecs = trainingByStaff.get(s.id) ?? [];
    const latestSupervision = supervisionByStaff.get(s.id) ?? null;
    const quals = qualsByStaff.get(s.id) ?? [];

    const areas: AreaRagStatus[] = [
      computeDbsRag(dbsCheck),
      computeTrainingRag(trainingRecs),
      computeSupervisionRag(latestSupervision),
      computeQualificationsRag(quals),
    ];

    const overallStatus = aggregateRag(areas);

    if (overallStatus === 'green') compliant++;
    else if (overallStatus === 'amber') attention++;
    else if (overallStatus === 'red') nonCompliant++;

    return {
      staffId: s.id,
      staffName: s.fullName,
      jobTitle: s.jobTitle,
      overallStatus,
      areas,
    };
  });

  // Sort: red first, then amber, then green
  const colourOrder: Record<RagColour, number> = {
    red: 0,
    amber: 1,
    green: 2,
    grey: 3,
  };
  rows.sort(
    (a, b) =>
      colourOrder[a.overallStatus] - colourOrder[b.overallStatus],
  );

  return {
    staff: rows,
    summary: {
      totalStaff: staff.length,
      compliant,
      attention,
      nonCompliant,
    },
  };
}

// ====================================================================
// COMPLIANCE DETAIL — Single staff member
// ====================================================================

export type ComplianceDetailData = {
  staffId: string;
  staffName: string;
  jobTitle: string;
  overallStatus: RagColour;
  areas: AreaRagStatus[];
  dbs: Array<{
    id: string;
    certificateNumber: string;
    level: string;
    issueDate: string;
    recheckDate: string;
    status: string;
  }>;
  training: Array<{
    id: string;
    courseName: string;
    completedDate: string;
    expiryDate: string | null;
    status: string;
  }>;
  supervisions: Array<{
    id: string;
    scheduledDate: Date;
    completedDate: Date | null;
    status: string;
    type: string;
  }>;
  qualifications: Array<{
    id: string;
    name: string;
    level: string;
    status: string;
    completedDate: string | null;
    targetDate: string | null;
  }>;
};

/**
 * Returns detailed compliance data for a single staff member.
 */
export async function getComplianceDetail(
  staffProfileId: string,
): Promise<ComplianceDetailData | null> {
  const { orgId } = await requirePermission('read', 'compliance');

  // Fetch staff profile
  const [staffProfile] = await db
    .select({
      id: staffProfiles.id,
      fullName: staffProfiles.fullName,
      jobTitle: staffProfiles.jobTitle,
      organisationId: staffProfiles.organisationId,
    })
    .from(staffProfiles)
    .where(eq(staffProfiles.id, staffProfileId))
    .limit(1);

  if (!staffProfile) return null;
  assertBelongsToOrg(staffProfile.organisationId, orgId);

  // Fetch all compliance data in parallel
  const [dbsData, trainingData, supervisionData, qualificationData] =
    await Promise.all([
      db
        .select({
          id: dbsChecks.id,
          certificateNumber: dbsChecks.certificateNumber,
          level: dbsChecks.level,
          issueDate: dbsChecks.issueDate,
          recheckDate: dbsChecks.recheckDate,
          status: dbsChecks.status,
        })
        .from(dbsChecks)
        .where(
          and(
            eq(dbsChecks.organisationId, orgId),
            eq(dbsChecks.staffProfileId, staffProfileId),
          ),
        )
        .orderBy(desc(dbsChecks.issueDate)),
      db
        .select({
          id: trainingRecords.id,
          courseName: trainingRecords.courseName,
          completedDate: trainingRecords.completedDate,
          expiryDate: trainingRecords.expiryDate,
          status: trainingRecords.status,
        })
        .from(trainingRecords)
        .where(
          and(
            eq(trainingRecords.organisationId, orgId),
            eq(trainingRecords.staffProfileId, staffProfileId),
          ),
        )
        .orderBy(desc(trainingRecords.completedDate)),
      db
        .select({
          id: supervisions.id,
          scheduledDate: supervisions.scheduledDate,
          completedDate: supervisions.completedDate,
          status: supervisions.status,
          type: supervisions.type,
          nextDueDate: supervisions.nextDueDate,
        })
        .from(supervisions)
        .where(
          and(
            eq(supervisions.organisationId, orgId),
            eq(supervisions.staffProfileId, staffProfileId),
          ),
        )
        .orderBy(desc(supervisions.scheduledDate)),
      db
        .select({
          id: qualifications.id,
          name: qualifications.name,
          level: qualifications.level,
          status: qualifications.status,
          completedDate: qualifications.completedDate,
          targetDate: qualifications.targetDate,
        })
        .from(qualifications)
        .where(
          and(
            eq(qualifications.organisationId, orgId),
            eq(qualifications.staffProfileId, staffProfileId),
          ),
        )
        .orderBy(desc(qualifications.createdAt)),
    ]);

  // Compute RAG areas
  const latestDbs = dbsData[0] ?? null;
  const latestSupervision = supervisionData[0] ?? null;

  const areas: AreaRagStatus[] = [
    computeDbsRag(latestDbs),
    computeTrainingRag(trainingData),
    computeSupervisionRag(latestSupervision),
    computeQualificationsRag(qualificationData),
  ];

  return {
    staffId: staffProfile.id,
    staffName: staffProfile.fullName,
    jobTitle: staffProfile.jobTitle,
    overallStatus: aggregateRag(areas),
    areas,
    dbs: dbsData,
    training: trainingData,
    supervisions: supervisionData,
    qualifications: qualificationData,
  };
}

// ====================================================================
// COMPLIANCE ALERTS — Approaching expiry and overdue items
// ====================================================================

export type ComplianceAlert = {
  id: string;
  severity: 'red' | 'amber';
  area: string;
  staffId: string;
  staffName: string;
  title: string;
  detail: string;
  daysUntilExpiry: number;
  entityId: string;
};

/**
 * Returns prioritized compliance alerts (overdue items first, then approaching expiry).
 */
export async function getComplianceAlerts(): Promise<ComplianceAlert[]> {
  const { orgId } = await requirePermission('read', 'compliance');

  const today = new Date();
  const amberWindow = new Date(today);
  amberWindow.setDate(today.getDate() + 30);

  const amberStr = amberWindow.toISOString().slice(0, 10);

  // Fetch staff name lookup
  const staffList = await db
    .select({ id: staffProfiles.id, fullName: staffProfiles.fullName })
    .from(staffProfiles)
    .where(
      and(
        eq(staffProfiles.organisationId, orgId),
        eq(staffProfiles.status, 'active'),
        isNull(staffProfiles.deletedAt),
      ),
    );
  const staffNameMap = new Map(staffList.map((s) => [s.id, s.fullName]));

  const alerts: ComplianceAlert[] = [];

  // DBS alerts: expiring within 30 days or overdue
  const dbsAlerts = await db
    .select({
      id: dbsChecks.id,
      staffProfileId: dbsChecks.staffProfileId,
      certificateNumber: dbsChecks.certificateNumber,
      recheckDate: dbsChecks.recheckDate,
    })
    .from(dbsChecks)
    .where(
      and(
        eq(dbsChecks.organisationId, orgId),
        lte(dbsChecks.recheckDate, amberStr),
      ),
    )
    .orderBy(dbsChecks.recheckDate)
    .limit(100);

  for (const check of dbsAlerts) {
    const days = daysUntil(check.recheckDate);
    const staffName =
      staffNameMap.get(check.staffProfileId) ?? 'Unknown Staff';
    const severity = days <= 7 ? 'red' : 'amber';

    alerts.push({
      id: `dbs-${check.id}`,
      severity: severity as 'red' | 'amber',
      area: 'DBS',
      staffId: check.staffProfileId,
      staffName,
      title:
        days < 0
          ? `DBS expired: ${staffName}`
          : `DBS expiring: ${staffName}`,
      detail:
        days < 0
          ? `Certificate ${check.certificateNumber} expired ${Math.abs(days)} day(s) ago`
          : `Certificate ${check.certificateNumber} expires in ${days} day(s)`,
      daysUntilExpiry: days,
      entityId: check.id,
    });
  }

  // Training alerts: expiring within 30 days or expired
  const trainingAlerts = await db
    .select({
      id: trainingRecords.id,
      staffProfileId: trainingRecords.staffProfileId,
      courseName: trainingRecords.courseName,
      expiryDate: trainingRecords.expiryDate,
    })
    .from(trainingRecords)
    .where(
      and(
        eq(trainingRecords.organisationId, orgId),
        lte(trainingRecords.expiryDate, amberStr),
      ),
    )
    .orderBy(trainingRecords.expiryDate)
    .limit(100);

  for (const record of trainingAlerts) {
    if (!record.expiryDate) continue;
    const days = daysUntil(record.expiryDate);
    const staffName =
      staffNameMap.get(record.staffProfileId) ?? 'Unknown Staff';
    const severity = days <= 7 ? 'red' : 'amber';

    alerts.push({
      id: `training-${record.id}`,
      severity: severity as 'red' | 'amber',
      area: 'Training',
      staffId: record.staffProfileId,
      staffName,
      title:
        days < 0
          ? `Training expired: ${record.courseName}`
          : `Training expiring: ${record.courseName}`,
      detail:
        days < 0
          ? `${staffName}: ${record.courseName} expired ${Math.abs(days)} day(s) ago`
          : `${staffName}: ${record.courseName} expires in ${days} day(s)`,
      daysUntilExpiry: days,
      entityId: record.id,
    });
  }

  // Supervision alerts: overdue
  const supervisionAlerts = await db
    .select({
      id: supervisions.id,
      staffProfileId: supervisions.staffProfileId,
      scheduledDate: supervisions.scheduledDate,
      status: supervisions.status,
    })
    .from(supervisions)
    .where(
      and(
        eq(supervisions.organisationId, orgId),
        eq(supervisions.status, 'overdue'),
      ),
    )
    .orderBy(supervisions.scheduledDate)
    .limit(100);

  for (const sup of supervisionAlerts) {
    const staffName =
      staffNameMap.get(sup.staffProfileId) ?? 'Unknown Staff';
    const scheduledStr = sup.scheduledDate.toISOString().slice(0, 10);
    const days = daysUntil(scheduledStr);

    alerts.push({
      id: `supervision-${sup.id}`,
      severity: 'red',
      area: 'Supervision',
      staffId: sup.staffProfileId,
      staffName,
      title: `Supervision overdue: ${staffName}`,
      detail: `Supervision was due on ${scheduledStr} (${Math.abs(days)} day(s) ago)`,
      daysUntilExpiry: days,
      entityId: sup.id,
    });
  }

  // Sort by severity (red first) then by days until expiry (most urgent first)
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'red' ? -1 : 1;
    }
    return a.daysUntilExpiry - b.daysUntilExpiry;
  });

  return alerts;
}

// ====================================================================
// COMPLIANCE EXPORT
// ====================================================================

export type ComplianceExportRow = {
  staffName: string;
  jobTitle: string;
  overallStatus: string;
  dbsStatus: string;
  dbsDetail: string;
  trainingStatus: string;
  trainingDetail: string;
  supervisionStatus: string;
  supervisionDetail: string;
  qualificationsStatus: string;
  qualificationsDetail: string;
};

/**
 * Returns compliance data formatted for CSV export.
 */
export async function exportComplianceReport(): Promise<ComplianceExportRow[]> {
  await requirePermission('export', 'compliance');

  const overview = await getComplianceOverview();

  return overview.staff.map((row) => {
    const findArea = (area: string) =>
      row.areas.find((a) => a.area === area);

    const dbs = findArea('dbs');
    const training = findArea('training');
    const supervision = findArea('supervision');
    const quals = findArea('qualifications');

    return {
      staffName: row.staffName,
      jobTitle: row.jobTitle,
      overallStatus: row.overallStatus.toUpperCase(),
      dbsStatus: dbs?.colour.toUpperCase() ?? 'N/A',
      dbsDetail: dbs?.detail ?? '',
      trainingStatus: training?.colour.toUpperCase() ?? 'N/A',
      trainingDetail: training?.detail ?? '',
      supervisionStatus: supervision?.colour.toUpperCase() ?? 'N/A',
      supervisionDetail: supervision?.detail ?? '',
      qualificationsStatus: quals?.colour.toUpperCase() ?? 'N/A',
      qualificationsDetail: quals?.detail ?? '',
    };
  });
}

// ====================================================================
// AGENCY REGISTER CRUD
// ====================================================================

// ---------------------------------------------------------------------------
// List agencies
// ---------------------------------------------------------------------------

export type AgencyListItem = {
  id: string;
  agencyName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  status: string;
  workerCount: number;
  createdAt: Date;
};

export async function listAgencies(): Promise<AgencyListItem[]> {
  const { orgId } = await requirePermission('read', 'compliance');

  const agencies = await db
    .select({
      id: agencyRegister.id,
      agencyName: agencyRegister.agencyName,
      contactEmail: agencyRegister.contactEmail,
      contactPhone: agencyRegister.contactPhone,
      contractStart: agencyRegister.contractStart,
      contractEnd: agencyRegister.contractEnd,
      status: agencyRegister.status,
      createdAt: agencyRegister.createdAt,
    })
    .from(agencyRegister)
    .where(eq(agencyRegister.organisationId, orgId))
    .orderBy(agencyRegister.agencyName);

  // Get worker counts
  const workerCounts = await db
    .select({
      agencyId: agencyWorkers.agencyId,
      count: count(),
    })
    .from(agencyWorkers)
    .where(eq(agencyWorkers.organisationId, orgId))
    .groupBy(agencyWorkers.agencyId);

  const countMap = new Map(workerCounts.map((c) => [c.agencyId, c.count]));

  return agencies.map((a) => ({
    ...a,
    workerCount: countMap.get(a.id) ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// Create agency
// ---------------------------------------------------------------------------

export async function createAgency(
  input: CreateAgencyInput,
): Promise<ActionResult<AgencyRegisterEntry>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = createAgencySchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [agency] = await db
      .insert(agencyRegister)
      .values({
        organisationId: orgId,
        agencyName: data.agencyName,
        contactEmail: data.contactEmail ?? null,
        contactPhone: data.contactPhone ?? null,
        contractStart: data.contractStart ?? null,
        contractEnd: data.contractEnd ?? null,
        status: data.status,
      })
      .returning();

    await auditLog(
      'create',
      'agency',
      agency.id,
      { before: null, after: { agencyName: data.agencyName } },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/agencies`);
    }

    return { success: true, data: agency };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createAgency] Error:', error);
    return { success: false, error: 'Failed to create agency' };
  }
}

// ---------------------------------------------------------------------------
// Update agency
// ---------------------------------------------------------------------------

export async function updateAgency(
  agencyId: string,
  input: UpdateAgencyInput,
): Promise<ActionResult<AgencyRegisterEntry>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = updateAgencySchema.safeParse(input);
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
      .from(agencyRegister)
      .where(eq(agencyRegister.id, agencyId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Agency not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof agencyRegister.$inferInsert> = {};

    if (data.agencyName !== undefined) updates.agencyName = data.agencyName;
    if (data.contactEmail !== undefined)
      updates.contactEmail = data.contactEmail ?? null;
    if (data.contactPhone !== undefined)
      updates.contactPhone = data.contactPhone ?? null;
    if (data.contractStart !== undefined)
      updates.contractStart = data.contractStart ?? null;
    if (data.contractEnd !== undefined)
      updates.contractEnd = data.contractEnd ?? null;
    if (data.status !== undefined) updates.status = data.status;

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(agencyRegister)
      .set(updates)
      .where(eq(agencyRegister.id, agencyId))
      .returning();

    await auditLog(
      'update',
      'agency',
      agencyId,
      {
        before: {
          ...Object.fromEntries(
            Object.keys(updates).map((k) => [
              k,
              existing[k as keyof typeof existing],
            ]),
          ),
        },
        after: updates,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/agencies`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateAgency] Error:', error);
    return { success: false, error: 'Failed to update agency' };
  }
}

// ---------------------------------------------------------------------------
// Delete agency
// ---------------------------------------------------------------------------

export async function deleteAgency(
  agencyId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const [existing] = await db
      .select()
      .from(agencyRegister)
      .where(eq(agencyRegister.id, agencyId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Agency not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(agencyRegister).where(eq(agencyRegister.id, agencyId));

    await auditLog(
      'delete',
      'agency',
      agencyId,
      {
        before: { agencyName: existing.agencyName },
        after: null,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/agencies`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteAgency] Error:', error);
    return { success: false, error: 'Failed to delete agency' };
  }
}

// ====================================================================
// AGENCY WORKERS CRUD
// ====================================================================

// ---------------------------------------------------------------------------
// List agency workers
// ---------------------------------------------------------------------------

export type AgencyWorkerListItem = {
  id: string;
  agencyId: string;
  name: string;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  dbsCertificateNumber: string | null;
  createdAt: Date;
};

export async function listAgencyWorkers(
  agencyId: string,
): Promise<AgencyWorkerListItem[]> {
  const { orgId } = await requirePermission('read', 'compliance');

  const rows = await db
    .select({
      id: agencyWorkers.id,
      agencyId: agencyWorkers.agencyId,
      name: agencyWorkers.name,
      role: agencyWorkers.role,
      startDate: agencyWorkers.startDate,
      endDate: agencyWorkers.endDate,
      dbsCertificateNumber: agencyWorkers.dbsCertificateNumber,
      createdAt: agencyWorkers.createdAt,
    })
    .from(agencyWorkers)
    .where(
      and(
        eq(agencyWorkers.organisationId, orgId),
        eq(agencyWorkers.agencyId, agencyId),
      ),
    )
    .orderBy(agencyWorkers.name);

  return rows;
}

// ---------------------------------------------------------------------------
// Create agency worker
// ---------------------------------------------------------------------------

export async function createAgencyWorker(
  input: CreateAgencyWorkerInput,
): Promise<ActionResult<AgencyWorker>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = createAgencyWorkerSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify the agency belongs to this org
    const [agency] = await db
      .select({ id: agencyRegister.id, organisationId: agencyRegister.organisationId })
      .from(agencyRegister)
      .where(eq(agencyRegister.id, data.agencyId))
      .limit(1);

    if (!agency) {
      return { success: false, error: 'Agency not found' };
    }
    assertBelongsToOrg(agency.organisationId, orgId);

    const [worker] = await db
      .insert(agencyWorkers)
      .values({
        organisationId: orgId,
        agencyId: data.agencyId,
        name: data.name,
        role: data.role ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        dbsCertificateNumber: data.dbsCertificateNumber ?? null,
      })
      .returning();

    await auditLog(
      'create',
      'agency_worker',
      worker.id,
      { before: null, after: { name: data.name, agencyId: data.agencyId } },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/agencies`);
    }

    return { success: true, data: worker };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createAgencyWorker] Error:', error);
    return { success: false, error: 'Failed to create agency worker' };
  }
}

// ---------------------------------------------------------------------------
// Update agency worker
// ---------------------------------------------------------------------------

export async function updateAgencyWorker(
  workerId: string,
  input: UpdateAgencyWorkerInput,
): Promise<ActionResult<AgencyWorker>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = updateAgencyWorkerSchema.safeParse(input);
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
      .from(agencyWorkers)
      .where(eq(agencyWorkers.id, workerId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Agency worker not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof agencyWorkers.$inferInsert> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.role !== undefined) updates.role = data.role ?? null;
    if (data.startDate !== undefined) updates.startDate = data.startDate ?? null;
    if (data.endDate !== undefined) updates.endDate = data.endDate ?? null;
    if (data.dbsCertificateNumber !== undefined)
      updates.dbsCertificateNumber = data.dbsCertificateNumber ?? null;

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(agencyWorkers)
      .set(updates)
      .where(eq(agencyWorkers.id, workerId))
      .returning();

    await auditLog(
      'update',
      'agency_worker',
      workerId,
      {
        before: {
          ...Object.fromEntries(
            Object.keys(updates).map((k) => [
              k,
              existing[k as keyof typeof existing],
            ]),
          ),
        },
        after: updates,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/agencies`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateAgencyWorker] Error:', error);
    return { success: false, error: 'Failed to update agency worker' };
  }
}

// ---------------------------------------------------------------------------
// Delete agency worker
// ---------------------------------------------------------------------------

export async function deleteAgencyWorker(
  workerId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const [existing] = await db
      .select()
      .from(agencyWorkers)
      .where(eq(agencyWorkers.id, workerId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Agency worker not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(agencyWorkers).where(eq(agencyWorkers.id, workerId));

    await auditLog(
      'delete',
      'agency_worker',
      workerId,
      { before: { name: existing.name }, after: null },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/agencies`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteAgencyWorker] Error:', error);
    return { success: false, error: 'Failed to delete agency worker' };
  }
}

// ====================================================================
// RECRUITMENT RECORDS CRUD
// ====================================================================

// ---------------------------------------------------------------------------
// List recruitment records
// ---------------------------------------------------------------------------

export type RecruitmentRecordListItem = {
  id: string;
  staffProfileId: string;
  staffName: string;
  interviewDate: string | null;
  offerDate: string | null;
  offerStatus: string;
  startDate: string | null;
  referenceCount: number;
  createdAt: Date;
};

export async function listRecruitmentRecords(): Promise<
  RecruitmentRecordListItem[]
> {
  const { orgId } = await requirePermission('read', 'compliance');

  const rows = await db
    .select({
      id: recruitmentRecords.id,
      staffProfileId: recruitmentRecords.staffProfileId,
      staffName: staffProfiles.fullName,
      interviewDate: recruitmentRecords.interviewDate,
      offerDate: recruitmentRecords.offerDate,
      offerStatus: recruitmentRecords.offerStatus,
      startDate: recruitmentRecords.startDate,
      references: recruitmentRecords.references,
      createdAt: recruitmentRecords.createdAt,
    })
    .from(recruitmentRecords)
    .innerJoin(
      staffProfiles,
      eq(recruitmentRecords.staffProfileId, staffProfiles.id),
    )
    .where(eq(recruitmentRecords.organisationId, orgId))
    .orderBy(desc(recruitmentRecords.createdAt));

  return rows.map((r) => ({
    id: r.id,
    staffProfileId: r.staffProfileId,
    staffName: r.staffName,
    interviewDate: r.interviewDate,
    offerDate: r.offerDate,
    offerStatus: r.offerStatus,
    startDate: r.startDate,
    referenceCount: Array.isArray(r.references) ? r.references.length : 0,
    createdAt: r.createdAt,
  }));
}

// ---------------------------------------------------------------------------
// Get single recruitment record
// ---------------------------------------------------------------------------

export async function getRecruitmentRecord(
  recordId: string,
): Promise<RecruitmentRecord | null> {
  const { orgId } = await requirePermission('read', 'compliance');

  const [record] = await db
    .select()
    .from(recruitmentRecords)
    .where(eq(recruitmentRecords.id, recordId))
    .limit(1);

  if (!record) return null;
  assertBelongsToOrg(record.organisationId, orgId);

  return record;
}

// ---------------------------------------------------------------------------
// Create recruitment record
// ---------------------------------------------------------------------------

export async function createRecruitmentRecord(
  input: CreateRecruitmentRecordInput,
): Promise<ActionResult<RecruitmentRecord>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = createRecruitmentRecordSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [record] = await db
      .insert(recruitmentRecords)
      .values({
        organisationId: orgId,
        staffProfileId: data.staffProfileId,
        interviewDate: data.interviewDate ?? null,
        references: normalizeReferences(data.references),
        offerDate: data.offerDate ?? null,
        offerStatus: data.offerStatus,
        startDate: data.startDate ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    await auditLog(
      'create',
      'recruitment_record',
      record.id,
      {
        before: null,
        after: {
          staffProfileId: data.staffProfileId,
          offerStatus: data.offerStatus,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/compliance`);
    }

    return { success: true, data: record };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createRecruitmentRecord] Error:', error);
    return { success: false, error: 'Failed to create recruitment record' };
  }
}

// ---------------------------------------------------------------------------
// Update recruitment record
// ---------------------------------------------------------------------------

export async function updateRecruitmentRecord(
  recordId: string,
  input: UpdateRecruitmentRecordInput,
): Promise<ActionResult<RecruitmentRecord>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = updateRecruitmentRecordSchema.safeParse(input);
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
      .from(recruitmentRecords)
      .where(eq(recruitmentRecords.id, recordId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Recruitment record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof recruitmentRecords.$inferInsert> = {};

    if (data.interviewDate !== undefined)
      updates.interviewDate = data.interviewDate ?? null;
    if (data.references !== undefined)
      updates.references = normalizeReferences(data.references);
    if (data.offerDate !== undefined)
      updates.offerDate = data.offerDate ?? null;
    if (data.offerStatus !== undefined) updates.offerStatus = data.offerStatus;
    if (data.startDate !== undefined)
      updates.startDate = data.startDate ?? null;
    if (data.notes !== undefined) updates.notes = data.notes ?? null;

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(recruitmentRecords)
      .set(updates)
      .where(eq(recruitmentRecords.id, recordId))
      .returning();

    await auditLog(
      'update',
      'recruitment_record',
      recordId,
      {
        before: {
          ...Object.fromEntries(
            Object.keys(updates).map((k) => [
              k,
              existing[k as keyof typeof existing],
            ]),
          ),
        },
        after: updates,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/compliance`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateRecruitmentRecord] Error:', error);
    return { success: false, error: 'Failed to update recruitment record' };
  }
}

// ---------------------------------------------------------------------------
// Delete recruitment record
// ---------------------------------------------------------------------------

export async function deleteRecruitmentRecord(
  recordId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const [existing] = await db
      .select()
      .from(recruitmentRecords)
      .where(eq(recruitmentRecords.id, recordId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Recruitment record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db
      .delete(recruitmentRecords)
      .where(eq(recruitmentRecords.id, recordId));

    await auditLog(
      'delete',
      'recruitment_record',
      recordId,
      {
        before: { staffProfileId: existing.staffProfileId },
        after: null,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/compliance`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteRecruitmentRecord] Error:', error);
    return { success: false, error: 'Failed to delete recruitment record' };
  }
}
