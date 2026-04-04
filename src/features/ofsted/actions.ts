'use server';

/**
 * Ofsted Compliance Engine — Server Actions
 *
 * CRUD for standards, evidence, children's register, and statement of purpose.
 * Includes compliance scoring and gap identification.
 *
 * Flow: Zod validate -> auth -> RBAC (ofsted resource) -> tenant -> audit.
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, eq, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  ofstedStandards,
  ofstedEvidence,
  childrensRegister,
  statementOfPurpose,
  lacRecords,
  persons,
  users,
} from '@/lib/db/schema';
import { requirePermission } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import type { OfstedStandard, OfstedEvidence } from '@/lib/db/schema/ofsted';
import {
  createEvidenceSchema,
  updateEvidenceSchema,
  createRegisterEntrySchema,
  updateRegisterEntrySchema,
  createStatementSchema,
  updateStatementSchema,
} from './schema';
import type {
  CreateEvidenceInput,
  UpdateEvidenceInput,
  CreateRegisterEntryInput,
  UpdateRegisterEntryInput,
  CreateStatementInput,
  UpdateStatementInput,
} from './schema';
import { QUALITY_STANDARDS } from './standards';
import { computeComplianceScore } from './constants';
import type { EvidenceStatus } from './constants';

// Re-export types for external use
export type {
  CreateEvidenceInput,
  UpdateEvidenceInput,
  CreateRegisterEntryInput,
  UpdateRegisterEntryInput,
  CreateStatementInput,
  UpdateStatementInput,
} from './schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StandardWithCounts = OfstedStandard & {
  evidenced: number;
  partial: number;
  missing: number;
  total: number;
  score: number;
};

export type ComplianceDashboardData = {
  standards: StandardWithCounts[];
  overallScore: number;
  totalEvidenced: number;
  totalPartial: number;
  totalMissing: number;
};

export type ComplianceGap = {
  standardId: string;
  standardName: string;
  regulationNumber: number;
  subRequirementId: string;
  subRequirementText: string;
  status: EvidenceStatus;
};

export type OfstedEvidenceWithReviewer = OfstedEvidence & {
  reviewedByName: string | null;
};

export type LinkedStandardSummary = {
  standardId: string;
  standardName: string;
  regulationNumber: number;
  evidenceId: string;
};

// ---------------------------------------------------------------------------
// Standards — Seed & List
// ---------------------------------------------------------------------------

/**
 * Seed the 9 Quality Standards for the authenticated organisation.
 * Idempotent — skips if standards already exist for the org.
 */
export async function seedStandards(): Promise<
  ActionResult<{ seeded: number }>
> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    // Check if standards already exist
    const existing = await db
      .select({ id: ofstedStandards.id })
      .from(ofstedStandards)
      .where(eq(ofstedStandards.organisationId, orgId))
      .limit(1);

    if (existing.length > 0) {
      return { success: true, data: { seeded: 0 } };
    }

    // Insert all 9 standards
    const rows = QUALITY_STANDARDS.map((s) => ({
      organisationId: orgId,
      regulationNumber: s.regulationNumber,
      standardName: s.standardName,
      description: s.description,
    }));

    await db.insert(ofstedStandards).values(rows);

    await auditLog('create', 'ofsted_standards', orgId, undefined, {
      userId,
      organisationId: orgId,
    });

    return { success: true, data: { seeded: rows.length } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to seed standards',
    };
  }
}

/**
 * List all standards for the authenticated organisation with evidence counts.
 */
export async function getStandardsWithCounts(): Promise<StandardWithCounts[]> {
  const { orgId } = await requirePermission('read', 'ofsted');

  const standards = await db
    .select()
    .from(ofstedStandards)
    .where(eq(ofstedStandards.organisationId, orgId))
    .orderBy(ofstedStandards.regulationNumber);

  // For each standard, count evidence statuses
  const result: StandardWithCounts[] = [];

  for (const standard of standards) {
    const evidence = await db
      .select()
      .from(ofstedEvidence)
      .where(
        and(
          eq(ofstedEvidence.organisationId, orgId),
          eq(ofstedEvidence.standardId, standard.id),
        ),
      );

    const evidenced = evidence.filter((e) => e.status === 'evidenced').length;
    const partial = evidence.filter((e) => e.status === 'partial').length;
    const missing = evidence.filter((e) => e.status === 'missing').length;

    // Find sub-requirements from template that have NO evidence row yet
    const template = QUALITY_STANDARDS.find(
      (s) => s.regulationNumber === standard.regulationNumber,
    );
    const subReqIds = template?.subRequirements.map((sr) => sr.id) ?? [];
    const evidencedSubReqIds = evidence.map((e) => e.subRequirementId);
    const unevidencedCount = subReqIds.filter(
      (id) => !evidencedSubReqIds.includes(id),
    ).length;

    const totalMissing = missing + unevidencedCount;
    const total = evidenced + partial + totalMissing;
    const score = computeComplianceScore({
      evidenced,
      partial,
      missing: totalMissing,
    });

    result.push({
      ...standard,
      evidenced,
      partial,
      missing: totalMissing,
      total,
      score,
    });
  }

  return result;
}

/**
 * Get a single standard for the authenticated organisation.
 */
export async function getStandardById(
  standardId: string,
): Promise<OfstedStandard | null> {
  const { orgId } = await requirePermission('read', 'ofsted');

  const [standard] = await db
    .select()
    .from(ofstedStandards)
    .where(
      and(
        eq(ofstedStandards.id, standardId),
        eq(ofstedStandards.organisationId, orgId),
      ),
    )
    .limit(1);

  return standard ?? null;
}

/**
 * Get overall compliance dashboard data.
 */
export async function getComplianceDashboard(): Promise<ComplianceDashboardData> {
  const standards = await getStandardsWithCounts();

  const totalEvidenced = standards.reduce((s, st) => s + st.evidenced, 0);
  const totalPartial = standards.reduce((s, st) => s + st.partial, 0);
  const totalMissing = standards.reduce((s, st) => s + st.missing, 0);
  const overallScore = computeComplianceScore({
    evidenced: totalEvidenced,
    partial: totalPartial,
    missing: totalMissing,
  });

  return {
    standards,
    overallScore,
    totalEvidenced,
    totalPartial,
    totalMissing,
  };
}

// ---------------------------------------------------------------------------
// Evidence — CRUD
// ---------------------------------------------------------------------------

/**
 * Create evidence linking a sub-requirement to a system record.
 */
export async function createEvidence(
  input: CreateEvidenceInput,
): Promise<ActionResult<OfstedEvidence>> {
  try {
    const parsed = createEvidenceSchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    // Verify the standard belongs to the org
    const [standard] = await db
      .select()
      .from(ofstedStandards)
      .where(
        and(
          eq(ofstedStandards.id, parsed.standardId),
          eq(ofstedStandards.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!standard) {
      return { success: false, error: 'Standard not found' };
    }

    const [row] = await db
      .insert(ofstedEvidence)
      .values({
        organisationId: orgId,
        standardId: parsed.standardId,
        subRequirementId: parsed.subRequirementId,
        evidenceType: parsed.evidenceType,
        evidenceId: parsed.evidenceId ?? null,
        description: parsed.description ?? null,
        status: parsed.status,
        reviewedById: userId,
        reviewedAt: new Date(),
      })
      .returning();

    await auditLog('create', 'ofsted_evidence', row.id, undefined, {
      userId,
      organisationId: orgId,
    });

    revalidatePath('/', 'layout');

    return { success: true, data: row };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create evidence',
    };
  }
}

/**
 * Update an evidence record.
 */
export async function updateEvidence(
  evidenceId: string,
  input: UpdateEvidenceInput,
): Promise<ActionResult<OfstedEvidence>> {
  try {
    const parsed = updateEvidenceSchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const [existing] = await db
      .select()
      .from(ofstedEvidence)
      .where(eq(ofstedEvidence.id, evidenceId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Evidence not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const [row] = await db
      .update(ofstedEvidence)
      .set({
        ...parsed,
        reviewedById: userId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(ofstedEvidence.id, evidenceId))
      .returning();

    await auditLog(
      'update',
      'ofsted_evidence',
      row.id,
      { before: existing, after: row },
      { userId, organisationId: orgId },
    );

    revalidatePath('/', 'layout');

    return { success: true, data: row };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update evidence',
    };
  }
}

/**
 * Delete an evidence record.
 */
export async function deleteEvidence(
  evidenceId: string,
): Promise<ActionResult> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const [existing] = await db
      .select()
      .from(ofstedEvidence)
      .where(eq(ofstedEvidence.id, evidenceId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Evidence not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(ofstedEvidence).where(eq(ofstedEvidence.id, evidenceId));

    await auditLog('delete', 'ofsted_evidence', evidenceId, undefined, {
      userId,
      organisationId: orgId,
    });

    revalidatePath('/', 'layout');

    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete evidence',
    };
  }
}

/**
 * List evidence for a specific standard.
 */
export async function listEvidenceForStandard(
  standardId: string,
): Promise<OfstedEvidenceWithReviewer[]> {
  const { orgId } = await requirePermission('read', 'ofsted');

  const rows = await db
    .select({
      id: ofstedEvidence.id,
      organisationId: ofstedEvidence.organisationId,
      standardId: ofstedEvidence.standardId,
      subRequirementId: ofstedEvidence.subRequirementId,
      evidenceType: ofstedEvidence.evidenceType,
      evidenceId: ofstedEvidence.evidenceId,
      description: ofstedEvidence.description,
      status: ofstedEvidence.status,
      reviewedById: ofstedEvidence.reviewedById,
      reviewedAt: ofstedEvidence.reviewedAt,
      createdAt: ofstedEvidence.createdAt,
      updatedAt: ofstedEvidence.updatedAt,
      reviewedByName: users.name,
    })
    .from(ofstedEvidence)
    .leftJoin(users, eq(users.id, ofstedEvidence.reviewedById))
    .where(
      and(
        eq(ofstedEvidence.organisationId, orgId),
        eq(ofstedEvidence.standardId, standardId),
      ),
    )
    .orderBy(ofstedEvidence.subRequirementId);

  return rows.map((row) => ({
    ...row,
    reviewedByName: row.reviewedByName ?? null,
  }));
}

export async function listLinkedStandardsForRecord(
  evidenceType: 'care_plan' | 'note' | 'incident' | 'training' | 'document',
  evidenceId: string,
): Promise<LinkedStandardSummary[]> {
  const { orgId } = await requirePermission('read', 'ofsted');

  const rows = await db
    .select({
      standardId: ofstedStandards.id,
      standardName: ofstedStandards.standardName,
      regulationNumber: ofstedStandards.regulationNumber,
      evidenceId: ofstedEvidence.id,
    })
    .from(ofstedEvidence)
    .innerJoin(ofstedStandards, eq(ofstedStandards.id, ofstedEvidence.standardId))
    .where(
      and(
        eq(ofstedEvidence.organisationId, orgId),
        eq(ofstedEvidence.evidenceType, evidenceType),
        eq(ofstedEvidence.evidenceId, evidenceId),
      ),
    )
    .orderBy(ofstedStandards.regulationNumber);

  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.standardId)) return false;
    seen.add(row.standardId);
    return true;
  });
}

export async function syncRecordStandardLinks(input: {
  evidenceType: 'care_plan' | 'note' | 'incident' | 'training' | 'document';
  evidenceId: string;
  recordTitle: string;
  standardIds: string[];
}): Promise<ActionResult<{ linked: number }>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');
    const uniqueStandardIds = [...new Set(input.standardIds)];

    const existing = await db
      .select()
      .from(ofstedEvidence)
      .where(
        and(
          eq(ofstedEvidence.organisationId, orgId),
          eq(ofstedEvidence.evidenceType, input.evidenceType),
          eq(ofstedEvidence.evidenceId, input.evidenceId),
        ),
      );

    const standards = uniqueStandardIds.length
      ? await db
          .select()
          .from(ofstedStandards)
          .where(
            and(
              eq(ofstedStandards.organisationId, orgId),
              inArray(ofstedStandards.id, uniqueStandardIds),
            ),
          )
      : [];

    const validStandardIds = new Set(standards.map((row) => row.id));
    const existingByStandard = new Map(existing.map((row) => [row.standardId, row]));

    for (const row of existing) {
      if (!validStandardIds.has(row.standardId)) {
        await db.delete(ofstedEvidence).where(eq(ofstedEvidence.id, row.id));
        await auditLog('delete', 'ofsted_evidence', row.id, undefined, {
          userId,
          organisationId: orgId,
        });
      }
    }

    for (const standard of standards) {
      if (existingByStandard.has(standard.id)) continue;

      const template = QUALITY_STANDARDS.find(
        (entry) => entry.regulationNumber === standard.regulationNumber,
      );
      const subRequirement =
        template?.subRequirements.find((entry) =>
          entry.suggestedEvidenceTypes.includes(input.evidenceType),
        ) ?? template?.subRequirements[0];

      if (!subRequirement) continue;

      const [created] = await db
        .insert(ofstedEvidence)
        .values({
          organisationId: orgId,
          standardId: standard.id,
          subRequirementId: subRequirement.id,
          evidenceType: input.evidenceType,
          evidenceId: input.evidenceId,
          description: `Linked from ${input.recordTitle}`,
          status: 'evidenced',
          reviewedById: userId,
          reviewedAt: new Date(),
        })
        .returning();

      await auditLog('create', 'ofsted_evidence', created.id, undefined, {
        userId,
        organisationId: orgId,
      });
    }

    revalidatePath('/', 'layout');

    return { success: true, data: { linked: standards.length } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update linked standards',
    };
  }
}

// ---------------------------------------------------------------------------
// Compliance Gap Analysis
// ---------------------------------------------------------------------------

/**
 * Identify compliance gaps — sub-requirements that are missing or partially evidenced.
 */
export async function getComplianceGaps(): Promise<ComplianceGap[]> {
  const { orgId } = await requirePermission('read', 'ofsted');

  const standards = await db
    .select()
    .from(ofstedStandards)
    .where(eq(ofstedStandards.organisationId, orgId))
    .orderBy(ofstedStandards.regulationNumber);

  const evidence = await db
    .select()
    .from(ofstedEvidence)
    .where(eq(ofstedEvidence.organisationId, orgId));

  const gaps: ComplianceGap[] = [];

  for (const standard of standards) {
    const template = QUALITY_STANDARDS.find(
      (s) => s.regulationNumber === standard.regulationNumber,
    );
    if (!template) continue;

    for (const subReq of template.subRequirements) {
      const existingEvidence = evidence.find(
        (e) =>
          e.standardId === standard.id &&
          e.subRequirementId === subReq.id,
      );

      if (!existingEvidence) {
        gaps.push({
          standardId: standard.id,
          standardName: standard.standardName,
          regulationNumber: standard.regulationNumber,
          subRequirementId: subReq.id,
          subRequirementText: subReq.text,
          status: 'missing',
        });
      } else if (existingEvidence.status === 'partial') {
        gaps.push({
          standardId: standard.id,
          standardName: standard.standardName,
          regulationNumber: standard.regulationNumber,
          subRequirementId: subReq.id,
          subRequirementText: subReq.text,
          status: 'partial',
        });
      }
    }
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Children's Register — CRUD
// ---------------------------------------------------------------------------

/**
 * List all children's register entries for the org.
 */
export async function listRegisterEntries() {
  const { orgId } = await requirePermission('read', 'ofsted');

  return db
    .select()
    .from(childrensRegister)
    .where(eq(childrensRegister.organisationId, orgId))
    .orderBy(desc(childrensRegister.admissionDate));
}

export async function ensureRegisterEntriesForOrganisation(): Promise<
  ActionResult<{ created: number }>
> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const existing = await db
      .select({ personId: childrensRegister.personId })
      .from(childrensRegister)
      .where(eq(childrensRegister.organisationId, orgId));

    const existingPersonIds = new Set(existing.map((row) => row.personId));

    const lacRows = await db
      .select({
        personId: lacRecords.personId,
        admissionDate: lacRecords.admissionDate,
        legalStatus: lacRecords.legalStatus,
        placingAuthority: lacRecords.placingAuthority,
        socialWorkerName: lacRecords.socialWorkerName,
        socialWorkerEmail: lacRecords.socialWorkerEmail,
        socialWorkerPhone: lacRecords.socialWorkerPhone,
        iroName: lacRecords.iroName,
        emergencyContacts: persons.emergencyContacts,
      })
      .from(lacRecords)
      .innerJoin(persons, eq(persons.id, lacRecords.personId))
      .where(eq(lacRecords.organisationId, orgId));

    const toCreate = lacRows
      .filter((row) => !existingPersonIds.has(row.personId))
      .map((row) => {
        const emergencyContact = [...(row.emergencyContacts ?? [])]
          .sort((a, b) => a.priority - b.priority)[0];

        return {
          organisationId: orgId,
          personId: row.personId,
          admissionDate: row.admissionDate,
          legalStatus: row.legalStatus,
          placingAuthority: row.placingAuthority,
          socialWorkerName: row.socialWorkerName ?? null,
          socialWorkerEmail: row.socialWorkerEmail ?? null,
          socialWorkerPhone: row.socialWorkerPhone ?? null,
          iroName: row.iroName ?? null,
          emergencyContact: emergencyContact
            ? {
                name: emergencyContact.name,
                relationship: emergencyContact.relationship,
                phone: emergencyContact.phone,
                email: emergencyContact.email ?? null,
              }
            : {
                name: 'Not recorded',
                relationship: 'Not recorded',
                phone: 'Not recorded',
                email: null,
              },
        };
      });

    if (toCreate.length > 0) {
      await db.insert(childrensRegister).values(toCreate);
      await auditLog('create', 'childrens_register', orgId, undefined, {
        userId,
        organisationId: orgId,
      });
      revalidatePath('/', 'layout');
    }

    return { success: true, data: { created: toCreate.length } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to ensure register coverage',
    };
  }
}

/**
 * Get a single register entry by ID.
 */
export async function getRegisterEntry(entryId: string) {
  const { orgId } = await requirePermission('read', 'ofsted');

  const [entry] = await db
    .select()
    .from(childrensRegister)
    .where(
      and(
        eq(childrensRegister.id, entryId),
        eq(childrensRegister.organisationId, orgId),
      ),
    )
    .limit(1);

  return entry ?? null;
}

/**
 * Create a children's register entry.
 */
export async function createRegisterEntry(
  input: CreateRegisterEntryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = createRegisterEntrySchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const [row] = await db
      .insert(childrensRegister)
      .values({
        organisationId: orgId,
        personId: parsed.personId,
        admissionDate: parsed.admissionDate,
        dischargeDate: parsed.dischargeDate ?? null,
        legalStatus: parsed.legalStatus,
        placingAuthority: parsed.placingAuthority,
        socialWorkerName: parsed.socialWorkerName ?? null,
        socialWorkerEmail: parsed.socialWorkerEmail ?? null,
        socialWorkerPhone: parsed.socialWorkerPhone ?? null,
        iroName: parsed.iroName ?? null,
        emergencyContact: parsed.emergencyContact,
      })
      .returning();

    await auditLog('create', 'childrens_register', row.id, undefined, {
      userId,
      organisationId: orgId,
    });

    revalidatePath('/', 'layout');

    return { success: true, data: { id: row.id } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create register entry',
    };
  }
}

/**
 * Update a children's register entry.
 */
export async function updateRegisterEntry(
  entryId: string,
  input: UpdateRegisterEntryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = updateRegisterEntrySchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const [existing] = await db
      .select()
      .from(childrensRegister)
      .where(eq(childrensRegister.id, entryId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Register entry not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const [row] = await db
      .update(childrensRegister)
      .set({
        ...parsed,
        updatedAt: new Date(),
      })
      .where(eq(childrensRegister.id, entryId))
      .returning();

    await auditLog(
      'update',
      'childrens_register',
      row.id,
      { before: existing, after: row },
      { userId, organisationId: orgId },
    );

    revalidatePath('/', 'layout');

    return { success: true, data: { id: row.id } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update register entry',
    };
  }
}

// ---------------------------------------------------------------------------
// Statement of Purpose — CRUD
// ---------------------------------------------------------------------------

/**
 * Get the current (or latest) Statement of Purpose for the org.
 */
export async function getCurrentStatement() {
  const { orgId } = await requirePermission('read', 'ofsted');

  // Prefer 'current', fall back to latest draft
  const [current] = await db
    .select()
    .from(statementOfPurpose)
    .where(
      and(
        eq(statementOfPurpose.organisationId, orgId),
        eq(statementOfPurpose.status, 'current'),
      ),
    )
    .limit(1);

  if (current) return current;

  const [latest] = await db
    .select()
    .from(statementOfPurpose)
    .where(eq(statementOfPurpose.organisationId, orgId))
    .orderBy(desc(statementOfPurpose.version))
    .limit(1);

  return latest ?? null;
}

/**
 * List all Statement of Purpose versions for the org.
 */
export async function listStatements() {
  const { orgId } = await requirePermission('read', 'ofsted');

  return db
    .select()
    .from(statementOfPurpose)
    .where(eq(statementOfPurpose.organisationId, orgId))
    .orderBy(desc(statementOfPurpose.version));
}

/**
 * Create a new Statement of Purpose draft.
 */
export async function createStatement(
  input: CreateStatementInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = createStatementSchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    // Get latest version number
    const [latest] = await db
      .select({ version: statementOfPurpose.version })
      .from(statementOfPurpose)
      .where(eq(statementOfPurpose.organisationId, orgId))
      .orderBy(desc(statementOfPurpose.version))
      .limit(1);

    const newVersion = (latest?.version ?? 0) + 1;

    const [row] = await db
      .insert(statementOfPurpose)
      .values({
        organisationId: orgId,
        version: newVersion,
        content: parsed.content,
        status: parsed.status,
      })
      .returning();

    await auditLog('create', 'statement_of_purpose', row.id, undefined, {
      userId,
      organisationId: orgId,
    });

    revalidatePath('/', 'layout');

    return { success: true, data: { id: row.id } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create statement',
    };
  }
}

/**
 * Update a Statement of Purpose.
 */
export async function updateStatement(
  statementId: string,
  input: UpdateStatementInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = updateStatementSchema.parse(input);
    const { orgId, userId } = await requirePermission('manage', 'ofsted');

    const [existing] = await db
      .select()
      .from(statementOfPurpose)
      .where(eq(statementOfPurpose.id, statementId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Statement not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    // If publishing (status -> 'current'), archive any existing current version
    if (parsed.status === 'current' && existing.status !== 'current') {
      await db
        .update(statementOfPurpose)
        .set({ status: 'archived', updatedAt: new Date() })
        .where(
          and(
            eq(statementOfPurpose.organisationId, orgId),
            eq(statementOfPurpose.status, 'current'),
          ),
        );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (parsed.content !== undefined) updateData.content = parsed.content;
    if (parsed.status !== undefined) {
      updateData.status = parsed.status;
      if (parsed.status === 'current') {
        updateData.approvedById = userId;
        updateData.approvedAt = new Date();
      }
    }

    const [row] = await db
      .update(statementOfPurpose)
      .set(updateData)
      .where(eq(statementOfPurpose.id, statementId))
      .returning();

    await auditLog(
      'update',
      'statement_of_purpose',
      row.id,
      { before: existing, after: row },
      { userId, organisationId: orgId },
    );

    revalidatePath('/', 'layout');

    return { success: true, data: { id: row.id } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update statement',
    };
  }
}
