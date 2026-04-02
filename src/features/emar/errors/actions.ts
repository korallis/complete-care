/**
 * Medication error/incident reporting and topical/homely remedy actions.
 * VAL-EMAR-015: Medication error/incident reporting
 * VAL-EMAR-019: Topical MAR and homely remedies
 */
'use server';

import { and, eq, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLog } from '@/lib/audit';
import {
  homelyRemedyAdministrations,
  homelyRemedyProtocols,
  medicationErrors,
  memberships,
  topicalMar,
  topicalMarAdministrations,
} from '@/lib/db/schema';
import { requirePermission } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import {
  reportMedicationErrorSchema,
  updateInvestigationSchema,
  createTopicalMarSchema,
  recordTopicalAdministrationSchema,
  createHomelyRemedyProtocolSchema,
  recordHomelyRemedyAdministrationSchema,
} from './types';

function parseDoseUnits(value: string): number {
  const match = value.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

async function ensureActiveMemberInOrg(userId: string, organisationId: string): Promise<boolean> {
  const rows = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.organisationId, organisationId),
        eq(memberships.status, 'active'),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

async function loadMedicationError(errorId: string) {
  const rows = await db
    .select()
    .from(medicationErrors)
    .where(eq(medicationErrors.id, errorId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadTopicalMar(topicalMarId: string) {
  const rows = await db
    .select()
    .from(topicalMar)
    .where(eq(topicalMar.id, topicalMarId))
    .limit(1);

  return rows[0] ?? null;
}

async function loadHomelyRemedyProtocol(protocolId: string) {
  const rows = await db
    .select()
    .from(homelyRemedyProtocols)
    .where(eq(homelyRemedyProtocols.id, protocolId))
    .limit(1);

  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Medication Error Reporting (VAL-EMAR-015)
// ---------------------------------------------------------------------------

export async function reportMedicationError(
  organisationId: string,
  _userId: string,
  data: unknown,
) {
  const parsed = reportMedicationErrorSchema.parse(data);

  if (new Date(parsed.discoveredAt) < new Date(parsed.occurredAt)) {
    throw new Error('Discovery date cannot be before occurrence date');
  }

  const { orgId, userId } = await requirePermission('create', 'medications');
  assertBelongsToOrg(organisationId, orgId);

  const [error] = await db
    .insert(medicationErrors)
    .values({
      organisationId: orgId,
      errorType: parsed.errorType,
      severity: parsed.severity,
      occurredAt: new Date(parsed.occurredAt),
      discoveredAt: new Date(parsed.discoveredAt),
      personId: parsed.personId ?? null,
      medicationStockId: parsed.medicationStockId ?? null,
      administrationRecordId: parsed.administrationRecordId ?? null,
      involvedStaffId: parsed.involvedStaffId ?? null,
      reportedById: userId,
      description: parsed.description,
      immediateActions: parsed.immediateActions ?? null,
      investigationStatus: 'reported',
    })
    .returning();

  await auditLog(
    'create',
    'medication_error',
    error.id,
    {
      before: null,
      after: {
        errorType: error.errorType,
        severity: error.severity,
        personId: error.personId,
        investigationStatus: error.investigationStatus,
      },
    },
    { userId, organisationId: orgId },
  );

  return { success: true, data: error };
}

export async function updateInvestigation(
  organisationId: string,
  errorId: string,
  _userId: string,
  data: unknown,
) {
  const parsed = updateInvestigationSchema.parse(data);
  const { orgId, userId } = await requirePermission('update', 'medications');
  assertBelongsToOrg(organisationId, orgId);

  const existing = await loadMedicationError(errorId);
  if (!existing) {
    throw new Error('Medication error not found');
  }

  assertBelongsToOrg(existing.organisationId, orgId);

  const updatePayload: Record<string, unknown> = {
    ...parsed,
    updatedAt: new Date(),
  };

  if (parsed.investigationStatus === 'resolved' && !existing.resolvedAt) {
    updatePayload.resolvedAt = new Date();
  }

  if (parsed.gpNotified === true && !existing.gpNotifiedAt) {
    updatePayload.gpNotifiedAt = new Date();
  }

  if (parsed.personInformed === true && !existing.personInformedAt) {
    updatePayload.personInformedAt = new Date();
  }

  const [updated] = await db
    .update(medicationErrors)
    .set(updatePayload)
    .where(eq(medicationErrors.id, errorId))
    .returning();

  await auditLog(
    'update',
    'medication_error',
    updated.id,
    {
      before: {
        investigationStatus: existing.investigationStatus,
        investigatorId: existing.investigatorId,
        gpNotified: existing.gpNotified,
        personInformed: existing.personInformed,
      },
      after: {
        investigationStatus: updated.investigationStatus,
        investigatorId: updated.investigatorId,
        gpNotified: updated.gpNotified,
        personInformed: updated.personInformed,
      },
    },
    { userId, organisationId: orgId },
  );

  return { success: true, data: updated };
}

export async function assignInvestigator(
  organisationId: string,
  errorId: string,
  investigatorId: string,
  _userId: string,
) {
  void _userId;
  const { orgId, userId } = await requirePermission('update', 'medications');
  assertBelongsToOrg(organisationId, orgId);

  const existing = await loadMedicationError(errorId);
  if (!existing) {
    throw new Error('Medication error not found');
  }

  assertBelongsToOrg(existing.organisationId, orgId);

  const investigatorIsMember = await ensureActiveMemberInOrg(investigatorId, orgId);
  if (!investigatorIsMember) {
    throw new Error('Assigned investigator must be an active member of this organisation');
  }

  await db
    .update(medicationErrors)
    .set({
      investigatorId,
      investigationStatus: 'under_investigation',
      updatedAt: new Date(),
    })
    .where(eq(medicationErrors.id, errorId));

  await auditLog(
    'assign',
    'medication_error',
    errorId,
    {
      before: {
        investigatorId: existing.investigatorId,
        investigationStatus: existing.investigationStatus,
      },
      after: {
        investigatorId,
        investigationStatus: 'under_investigation',
      },
    },
    { userId, organisationId: orgId },
  );

  return { success: true };
}

// ---------------------------------------------------------------------------
// Topical MAR (VAL-EMAR-019)
// ---------------------------------------------------------------------------

export async function createTopicalMar(
  organisationId: string,
  _userId: string,
  data: unknown,
) {
  const parsed = createTopicalMarSchema.parse(data);
  const { orgId, userId } = await requirePermission('create', 'medications');
  assertBelongsToOrg(organisationId, orgId);

  const [record] = await db
    .insert(topicalMar)
    .values({
      organisationId: orgId,
      personId: parsed.personId,
      medicationStockId: parsed.medicationStockId ?? null,
      medicationName: parsed.medicationName,
      instructions: parsed.instructions,
      frequency: parsed.frequency,
      frequencyDescription: parsed.frequencyDescription ?? null,
      prescriber: parsed.prescriber ?? null,
      startDate: parsed.startDate,
      endDate: parsed.endDate ?? null,
      isActive: true,
    })
    .returning();

  await auditLog(
    'create',
    'topical_mar',
    record.id,
    {
      before: null,
      after: {
        personId: record.personId,
        medicationName: record.medicationName,
        frequency: record.frequency,
        startDate: record.startDate,
      },
    },
    { userId, organisationId: orgId },
  );

  return { success: true, data: record };
}

export async function recordTopicalAdministration(
  organisationId: string,
  _userId: string,
  data: unknown,
) {
  const parsed = recordTopicalAdministrationSchema.parse(data);
  const { orgId, userId } = await requirePermission('create', 'medications');
  assertBelongsToOrg(organisationId, orgId);

  const record = await loadTopicalMar(parsed.topicalMarId);
  if (!record) {
    throw new Error('Topical MAR not found');
  }

  assertBelongsToOrg(record.organisationId, orgId);

  const [administration] = await db
    .insert(topicalMarAdministrations)
    .values({
      organisationId: orgId,
      topicalMarId: parsed.topicalMarId,
      administeredById: userId,
      administeredAt: new Date(parsed.administeredAt),
      status: parsed.status,
      bodyMapData: parsed.bodyMapData ?? null,
      applicationSite: parsed.applicationSite,
      skinCondition: parsed.skinCondition ?? null,
      adverseReaction: parsed.adverseReaction ?? null,
      notes: parsed.notes ?? null,
    })
    .returning();

  await auditLog(
    'create',
    'topical_mar_administration',
    administration.id,
    {
      before: null,
      after: {
        topicalMarId: administration.topicalMarId,
        status: administration.status,
        applicationSite: administration.applicationSite,
      },
    },
    { userId, organisationId: orgId },
  );

  return {
    success: true,
    data: administration,
  };
}

export async function discontinueTopicalMar(
  organisationId: string,
  topicalMarId: string,
  _userId: string,
  endDate: string,
) {
  const { orgId, userId } = await requirePermission('update', 'medications');
  assertBelongsToOrg(organisationId, orgId);

  const existing = await loadTopicalMar(topicalMarId);
  if (!existing) {
    throw new Error('Topical MAR not found');
  }

  assertBelongsToOrg(existing.organisationId, orgId);

  await db
    .update(topicalMar)
    .set({
      isActive: false,
      endDate,
      updatedAt: new Date(),
    })
    .where(eq(topicalMar.id, topicalMarId));

  await auditLog(
    'update',
    'topical_mar',
    topicalMarId,
    {
      before: { isActive: existing.isActive, endDate: existing.endDate },
      after: { isActive: false, endDate },
    },
    { userId, organisationId: orgId },
  );

  return { success: true };
}

// ---------------------------------------------------------------------------
// Homely Remedies (VAL-EMAR-019)
// ---------------------------------------------------------------------------

export async function createHomelyRemedyProtocol(
  organisationId: string,
  _userId: string,
  data: unknown,
) {
  const parsed = createHomelyRemedyProtocolSchema.parse(data);
  const { orgId, userId } = await requirePermission('create', 'medications');
  assertBelongsToOrg(organisationId, orgId);

  const [protocol] = await db
    .insert(homelyRemedyProtocols)
    .values({
      organisationId: orgId,
      medicationName: parsed.medicationName,
      form: parsed.form,
      strength: parsed.strength,
      indication: parsed.indication,
      dosageInstructions: parsed.dosageInstructions,
      maxDose24Hours: parsed.maxDose24Hours,
      contraindications: parsed.contraindications ?? null,
      sideEffects: parsed.sideEffects ?? null,
      interactions: parsed.interactions ?? null,
      maxDurationDays: parsed.maxDurationDays ?? null,
      approvedBy: parsed.approvedBy,
      approvedDate: parsed.approvedDate,
      reviewDate: parsed.reviewDate ?? null,
      isActive: true,
      recordedById: userId,
    })
    .returning();

  await auditLog(
    'create',
    'homely_remedy_protocol',
    protocol.id,
    {
      before: null,
      after: {
        medicationName: protocol.medicationName,
        approvedBy: protocol.approvedBy,
        approvedDate: protocol.approvedDate,
        maxDose24Hours: protocol.maxDose24Hours,
      },
    },
    { userId, organisationId: orgId },
  );

  return { success: true, data: protocol };
}

export async function recordHomelyRemedyAdministration(
  organisationId: string,
  _userId: string,
  data: unknown,
) {
  const parsed = recordHomelyRemedyAdministrationSchema.parse(data);
  const { orgId, userId } = await requirePermission('create', 'medications');
  assertBelongsToOrg(organisationId, orgId);

  const protocol = await loadHomelyRemedyProtocol(parsed.protocolId);
  if (!protocol) {
    throw new Error('Homely remedy protocol not found');
  }

  assertBelongsToOrg(protocol.organisationId, orgId);

  const administeredAt = new Date(parsed.administeredAt);
  const lookback = new Date(administeredAt.getTime() - 24 * 60 * 60 * 1000);

  const priorAdministrations = await db
    .select({ doseGiven: homelyRemedyAdministrations.doseGiven })
    .from(homelyRemedyAdministrations)
    .where(
      and(
        eq(homelyRemedyAdministrations.organisationId, orgId),
        eq(homelyRemedyAdministrations.protocolId, parsed.protocolId),
        eq(homelyRemedyAdministrations.personId, parsed.personId),
        gte(homelyRemedyAdministrations.administeredAt, lookback),
      ),
    );

  const priorDoseUnits = priorAdministrations.reduce(
    (sum, row) => sum + parseDoseUnits(row.doseGiven),
    0,
  );
  const proposedUnits = parseDoseUnits(parsed.doseGiven);
  const maxDoseUnits = parseDoseUnits(protocol.maxDose24Hours);

  if (maxDoseUnits > 0 && priorDoseUnits + proposedUnits > maxDoseUnits) {
    throw new Error('Homely remedy dose exceeds the approved maximum in 24 hours');
  }

  const [administration] = await db
    .insert(homelyRemedyAdministrations)
    .values({
      organisationId: orgId,
      protocolId: parsed.protocolId,
      personId: parsed.personId,
      administeredById: userId,
      administeredAt,
      doseGiven: parsed.doseGiven,
      reason: parsed.reason,
      outcome: parsed.outcome ?? null,
      gpInformed: parsed.gpInformed,
      gpInformedAt: parsed.gpInformed ? administeredAt : null,
      notes: parsed.notes ?? null,
    })
    .returning();

  await auditLog(
    'create',
    'homely_remedy_administration',
    administration.id,
    {
      before: null,
      after: {
        protocolId: administration.protocolId,
        personId: administration.personId,
        doseGiven: administration.doseGiven,
      },
    },
    { userId, organisationId: orgId },
  );

  return {
    success: true,
    data: administration,
  };
}

export async function deactivateHomelyRemedyProtocol(
  organisationId: string,
  protocolId: string,
  _userId: string,
) {
  void _userId;
  const { orgId, userId } = await requirePermission('update', 'medications');
  assertBelongsToOrg(organisationId, orgId);

  const existing = await loadHomelyRemedyProtocol(protocolId);
  if (!existing) {
    throw new Error('Homely remedy protocol not found');
  }

  assertBelongsToOrg(existing.organisationId, orgId);

  await db
    .update(homelyRemedyProtocols)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(homelyRemedyProtocols.id, protocolId));

  await auditLog(
    'update',
    'homely_remedy_protocol',
    protocolId,
    {
      before: { isActive: existing.isActive },
      after: { isActive: false },
    },
    { userId, organisationId: orgId },
  );

  return { success: true };
}
