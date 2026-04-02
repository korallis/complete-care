'use server';

/**
 * MCA & DoLS Server Actions
 *
 * All mutations are:
 * - Validated with Zod
 * - Tenant-isolated via organisationId
 * - Audit-logged
 */

import { db } from '@/lib/db';
import {
  mcaAssessments,
  bestInterestDecisions,
  lpaAdrtRecords,
  dolsApplications,
  dolsRestrictions,
  auditLogs,
} from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import type { ActionResult } from '@/types';
import {
  mcaAssessmentSchema,
  bestInterestDecisionSchema,
  lpaAdrtRecordSchema,
  dolsApplicationSchema,
  dolsRestrictionSchema,
  deriveMcaOutcome,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function createAuditLog(params: {
  userId: string;
  organisationId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    userId: params.userId,
    organisationId: params.organisationId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    changes: params.changes ?? null,
  });
}

// ---------------------------------------------------------------------------
// MCA Assessment Actions
// ---------------------------------------------------------------------------

export async function createMcaAssessment(
  organisationId: string,
  userId: string,
  input: unknown,
): Promise<ActionResult<{ id: string; outcome: string }>> {
  const parsed = mcaAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const data = parsed.data;
  const outcome = deriveMcaOutcome({
    diagnosticTestResult: data.diagnosticTestResult,
    canUnderstand: data.canUnderstand ?? null,
    canRetain: data.canRetain ?? null,
    canUseOrWeigh: data.canUseOrWeigh ?? null,
    canCommunicate: data.canCommunicate ?? null,
  });

  const [row] = await db
    .insert(mcaAssessments)
    .values({
      organisationId,
      personId: data.personId,
      decisionToBeAssessed: data.decisionToBeAssessed,
      assessorId: data.assessorId,
      diagnosticTestResult: data.diagnosticTestResult,
      diagnosticTestEvidence: data.diagnosticTestEvidence,
      canUnderstand: data.diagnosticTestResult ? data.canUnderstand ?? null : null,
      canUnderstandEvidence: data.diagnosticTestResult ? data.canUnderstandEvidence ?? null : null,
      canRetain: data.diagnosticTestResult ? data.canRetain ?? null : null,
      canRetainEvidence: data.diagnosticTestResult ? data.canRetainEvidence ?? null : null,
      canUseOrWeigh: data.diagnosticTestResult ? data.canUseOrWeigh ?? null : null,
      canUseOrWeighEvidence: data.diagnosticTestResult ? data.canUseOrWeighEvidence ?? null : null,
      canCommunicate: data.diagnosticTestResult ? data.canCommunicate ?? null : null,
      canCommunicateEvidence: data.diagnosticTestResult ? data.canCommunicateEvidence ?? null : null,
      supportStepsTaken: data.supportStepsTaken,
      outcome,
      assessmentDate: data.assessmentDate,
      reviewDate: data.reviewDate ?? null,
    })
    .returning({ id: mcaAssessments.id });

  await createAuditLog({
    userId,
    organisationId,
    action: 'create',
    entityType: 'mca_assessment',
    entityId: row.id,
    changes: { after: { ...data, outcome } },
  });

  return { success: true, data: { id: row.id, outcome } };
}

export async function getMcaAssessmentsByPerson(
  organisationId: string,
  personId: string,
) {
  return db
    .select()
    .from(mcaAssessments)
    .where(
      and(
        eq(mcaAssessments.organisationId, organisationId),
        eq(mcaAssessments.personId, personId),
      ),
    )
    .orderBy(sql`${mcaAssessments.assessmentDate} desc`);
}

export async function getMcaAssessment(
  organisationId: string,
  assessmentId: string,
) {
  const [row] = await db
    .select()
    .from(mcaAssessments)
    .where(
      and(
        eq(mcaAssessments.organisationId, organisationId),
        eq(mcaAssessments.id, assessmentId),
      ),
    );
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Best Interest Decision Actions
// ---------------------------------------------------------------------------

export async function createBestInterestDecision(
  organisationId: string,
  userId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = bestInterestDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const data = parsed.data;

  // Verify the linked MCA exists and belongs to this org and has lacks_capacity outcome
  const mca = await getMcaAssessment(organisationId, data.mcaAssessmentId);
  if (!mca) {
    return { success: false, error: 'Linked MCA assessment not found' };
  }
  if (mca.outcome !== 'lacks_capacity') {
    return {
      success: false,
      error: 'Best interest decision can only be created for assessments with "lacks capacity" outcome',
    };
  }

  const [row] = await db
    .insert(bestInterestDecisions)
    .values({
      organisationId,
      mcaAssessmentId: data.mcaAssessmentId,
      personId: data.personId,
      decisionBeingMade: data.decisionBeingMade,
      personsConsulted: data.personsConsulted,
      personWishesFeelingsBeliefs: data.personWishesFeelingsBeliefs,
      lessRestrictiveOptionsConsidered: data.lessRestrictiveOptionsConsidered,
      decisionReached: data.decisionReached,
      decisionMakerName: data.decisionMakerName,
      decisionMakerRole: data.decisionMakerRole,
      decisionDate: data.decisionDate,
      reviewDate: data.reviewDate ?? null,
    })
    .returning({ id: bestInterestDecisions.id });

  await createAuditLog({
    userId,
    organisationId,
    action: 'create',
    entityType: 'best_interest_decision',
    entityId: row.id,
    changes: { after: data },
  });

  return { success: true, data: { id: row.id } };
}

export async function getBestInterestDecisionsByPerson(
  organisationId: string,
  personId: string,
) {
  return db
    .select()
    .from(bestInterestDecisions)
    .where(
      and(
        eq(bestInterestDecisions.organisationId, organisationId),
        eq(bestInterestDecisions.personId, personId),
      ),
    )
    .orderBy(sql`${bestInterestDecisions.decisionDate} desc`);
}

// ---------------------------------------------------------------------------
// LPA / ADRT Actions
// ---------------------------------------------------------------------------

export async function createLpaAdrtRecord(
  organisationId: string,
  userId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = lpaAdrtRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const data = parsed.data;

  const [row] = await db
    .insert(lpaAdrtRecords)
    .values({
      organisationId,
      personId: data.personId,
      recordType: data.recordType,
      isActive: data.isActive,
      details: data.details,
      registeredDate: data.registeredDate ?? null,
      conditions: data.conditions ?? null,
      documentReference: data.documentReference ?? null,
    })
    .returning({ id: lpaAdrtRecords.id });

  await createAuditLog({
    userId,
    organisationId,
    action: 'create',
    entityType: 'lpa_adrt_record',
    entityId: row.id,
    changes: { after: data },
  });

  return { success: true, data: { id: row.id } };
}

export async function getLpaAdrtRecordsByPerson(
  organisationId: string,
  personId: string,
) {
  return db
    .select()
    .from(lpaAdrtRecords)
    .where(
      and(
        eq(lpaAdrtRecords.organisationId, organisationId),
        eq(lpaAdrtRecords.personId, personId),
      ),
    );
}

// ---------------------------------------------------------------------------
// DoLS Application Actions
// ---------------------------------------------------------------------------

export async function createDolsApplication(
  organisationId: string,
  userId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = dolsApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const data = parsed.data;

  const [row] = await db
    .insert(dolsApplications)
    .values({
      organisationId,
      personId: data.personId,
      managingAuthority: data.managingAuthority,
      supervisoryBody: data.supervisoryBody,
      laReferenceNumber: data.laReferenceNumber ?? null,
      applicationDate: data.applicationDate,
      reason: data.reason,
      restrictions: data.restrictions,
      linkedMcaId: data.linkedMcaId ?? null,
      linkedBestInterestId: data.linkedBestInterestId ?? null,
      personsRepresentative: data.personsRepresentative ?? null,
      imcaInstructed: data.imcaInstructed,
      status: data.status,
      authorisationStartDate: data.authorisationStartDate ?? null,
      authorisationEndDate: data.authorisationEndDate ?? null,
      conditions: data.conditions ?? null,
      reviewDate: data.reviewDate ?? null,
      expiryAlertDays: data.expiryAlertDays,
    })
    .returning({ id: dolsApplications.id });

  await createAuditLog({
    userId,
    organisationId,
    action: 'create',
    entityType: 'dols_application',
    entityId: row.id,
    changes: { after: data },
  });

  return { success: true, data: { id: row.id } };
}

export async function updateDolsStatus(
  organisationId: string,
  userId: string,
  dolsId: string,
  newStatus: string,
  authorisationDetails?: {
    authorisationStartDate?: string;
    authorisationEndDate?: string;
    conditions?: string;
    reviewDate?: string;
  },
): Promise<ActionResult<{ id: string }>> {
  const validStatuses = ['applied', 'granted', 'refused', 'expired', 'renewed'];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, error: `Invalid status: ${newStatus}` };
  }

  const existing = await getDolsApplication(organisationId, dolsId);
  if (!existing) {
    return { success: false, error: 'DoLS application not found' };
  }

  const updateValues: Record<string, unknown> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === 'granted' && authorisationDetails) {
    updateValues.authorisationStartDate = authorisationDetails.authorisationStartDate ?? null;
    updateValues.authorisationEndDate = authorisationDetails.authorisationEndDate ?? null;
    updateValues.conditions = authorisationDetails.conditions ?? null;
    updateValues.reviewDate = authorisationDetails.reviewDate ?? null;
  }

  await db
    .update(dolsApplications)
    .set(updateValues)
    .where(
      and(
        eq(dolsApplications.organisationId, organisationId),
        eq(dolsApplications.id, dolsId),
      ),
    );

  await createAuditLog({
    userId,
    organisationId,
    action: 'update',
    entityType: 'dols_application',
    entityId: dolsId,
    changes: { before: { status: existing.status }, after: { status: newStatus, ...authorisationDetails } },
  });

  return { success: true, data: { id: dolsId } };
}

export async function getDolsApplication(
  organisationId: string,
  dolsId: string,
) {
  const [row] = await db
    .select()
    .from(dolsApplications)
    .where(
      and(
        eq(dolsApplications.organisationId, organisationId),
        eq(dolsApplications.id, dolsId),
      ),
    );
  return row ?? null;
}

export async function getDolsApplicationsByPerson(
  organisationId: string,
  personId: string,
) {
  return db
    .select()
    .from(dolsApplications)
    .where(
      and(
        eq(dolsApplications.organisationId, organisationId),
        eq(dolsApplications.personId, personId),
      ),
    )
    .orderBy(sql`${dolsApplications.applicationDate} desc`);
}

/**
 * Get all DoLS applications expiring within their alert window.
 * Used by the clinical alert engine to generate DoLS expiry alerts.
 */
export async function getDolsExpiringSoon(organisationId: string) {
  const now = new Date();

  // Get all granted DoLS with end dates
  const granted = await db
    .select()
    .from(dolsApplications)
    .where(
      and(
        eq(dolsApplications.organisationId, organisationId),
        eq(dolsApplications.status, 'granted'),
      ),
    );

  return granted.filter((dols) => {
    if (!dols.authorisationEndDate) return false;
    const endDate = new Date(dols.authorisationEndDate);
    const alertDate = new Date(endDate);
    alertDate.setDate(alertDate.getDate() - dols.expiryAlertDays);
    return now >= alertDate && now < endDate;
  });
}

/**
 * Get all expired DoLS that have not been renewed.
 * These should be prominently flagged on the person's profile.
 */
export async function getDolsExpired(organisationId: string) {
  const today = new Date().toISOString().split('T')[0];

  return db
    .select()
    .from(dolsApplications)
    .where(
      and(
        eq(dolsApplications.organisationId, organisationId),
        eq(dolsApplications.status, 'granted'),
        lte(dolsApplications.authorisationEndDate, today),
      ),
    );
}

/**
 * Get the DoLS register for an organisation — all applications with current status.
 */
export async function getDolsRegister(organisationId: string) {
  return db
    .select()
    .from(dolsApplications)
    .where(eq(dolsApplications.organisationId, organisationId))
    .orderBy(sql`${dolsApplications.applicationDate} desc`);
}

// ---------------------------------------------------------------------------
// DoLS Restriction Actions
// ---------------------------------------------------------------------------

export async function createDolsRestriction(
  organisationId: string,
  userId: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = dolsRestrictionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const data = parsed.data;

  const [row] = await db
    .insert(dolsRestrictions)
    .values({
      organisationId,
      dolsApplicationId: data.dolsApplicationId,
      personId: data.personId,
      restrictionType: data.restrictionType,
      description: data.description,
      justification: data.justification,
      isActive: data.isActive,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
    })
    .returning({ id: dolsRestrictions.id });

  await createAuditLog({
    userId,
    organisationId,
    action: 'create',
    entityType: 'dols_restriction',
    entityId: row.id,
    changes: { after: data },
  });

  return { success: true, data: { id: row.id } };
}

export async function getDolsRestrictionsByApplication(
  organisationId: string,
  dolsApplicationId: string,
) {
  return db
    .select()
    .from(dolsRestrictions)
    .where(
      and(
        eq(dolsRestrictions.organisationId, organisationId),
        eq(dolsRestrictions.dolsApplicationId, dolsApplicationId),
      ),
    );
}

export async function getDolsRestrictionsRegister(organisationId: string) {
  return db
    .select()
    .from(dolsRestrictions)
    .where(
      and(
        eq(dolsRestrictions.organisationId, organisationId),
        eq(dolsRestrictions.isActive, true),
      ),
    );
}
