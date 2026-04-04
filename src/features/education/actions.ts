'use server';

/**
 * Education Server Actions
 *
 * CRUD for school records, PEPs, PEP attendees, education attendance,
 * exclusion records, Pupil Premium Plus tracking, and SDQ assessments.
 *
 * All actions are tenant-scoped and RBAC-protected.
 *
 * VAL-EDU-001: School record CRUD
 * VAL-EDU-002: PEP creation & versioning
 * VAL-EDU-003: PEP meeting attendee tracking
 * VAL-EDU-004: Daily education attendance
 * VAL-EDU-005: Exclusion records
 * VAL-EDU-006: Pupil Premium Plus tracking
 * VAL-EDU-007: SDQ scoring & trends
 * VAL-EDU-008: Data integrity & multi-tenancy
 */

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  schoolRecords,
  personalEducationPlans,
  pepAttendees,
  educationAttendance,
  exclusionRecords,
  pupilPremiumPlusRecords,
  sdqAssessments,
  organisations,
} from '@/lib/db/schema';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';

import {
  schoolRecordSchema,
  pepSchema,
  pepAttendeeSchema,
  educationAttendanceSchema,
  exclusionRecordSchema,
  pupilPremiumPlusSchema,
  sdqAssessmentSchema,
} from './schema';

// ---------------------------------------------------------------------------
// Helpers
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
// School Records
// ---------------------------------------------------------------------------

export async function createSchoolRecord(
  personId: string,
  formData: FormData,
): Promise<ActionResult<typeof schoolRecords.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const raw = Object.fromEntries(formData.entries());
    const parsed = schoolRecordSchema.safeParse({
      ...raw,
      ehcpInPlace: raw.ehcpInPlace === 'true',
      isCurrent: raw.isCurrent !== 'false',
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(schoolRecords)
      .values({
        organisationId: orgId,
        personId,
        schoolName: data.schoolName,
        schoolAddress: data.schoolAddress ?? null,
        schoolPhone: data.schoolPhone ?? null,
        yearGroup: data.yearGroup ?? null,
        senStatus: data.senStatus,
        ehcpInPlace: data.ehcpInPlace,
        designatedTeacherName: data.designatedTeacherName ?? null,
        designatedTeacherEmail: data.designatedTeacherEmail || null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        isCurrent: data.isCurrent,
        notes: data.notes ?? null,
      })
      .returning();

    await auditLog('create', 'school_record', row.id, {
      before: null,
      after: { personId, schoolName: data.schoolName },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${personId}/education`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createSchoolRecord] Error:', error);
    return { success: false, error: 'Failed to create school record' };
  }
}

export async function updateSchoolRecord(
  recordId: string,
  formData: FormData,
): Promise<ActionResult<typeof schoolRecords.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'assessments');

    const [existing] = await db
      .select()
      .from(schoolRecords)
      .where(eq(schoolRecords.id, recordId))
      .limit(1);

    if (!existing) return { success: false, error: 'School record not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const raw = Object.fromEntries(formData.entries());
    const parsed = schoolRecordSchema.safeParse({
      ...raw,
      ehcpInPlace: raw.ehcpInPlace === 'true',
      isCurrent: raw.isCurrent !== 'false',
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [updated] = await db
      .update(schoolRecords)
      .set({
        schoolName: data.schoolName,
        schoolAddress: data.schoolAddress ?? null,
        schoolPhone: data.schoolPhone ?? null,
        yearGroup: data.yearGroup ?? null,
        senStatus: data.senStatus,
        ehcpInPlace: data.ehcpInPlace,
        designatedTeacherName: data.designatedTeacherName ?? null,
        designatedTeacherEmail: data.designatedTeacherEmail || null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        isCurrent: data.isCurrent,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(schoolRecords.id, recordId))
      .returning();

    await auditLog('update', 'school_record', recordId, {
      before: { schoolName: existing.schoolName },
      after: { schoolName: updated.schoolName },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/education`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateSchoolRecord] Error:', error);
    return { success: false, error: 'Failed to update school record' };
  }
}

// ---------------------------------------------------------------------------
// Personal Education Plans (PEPs)
// ---------------------------------------------------------------------------

export async function createPep(
  personId: string,
  formData: FormData,
): Promise<ActionResult<typeof personalEducationPlans.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const raw = Object.fromEntries(formData.entries());
    const parsed = pepSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(personalEducationPlans)
      .values({
        organisationId: orgId,
        personId,
        schoolRecordId: data.schoolRecordId,
        academicYear: data.academicYear,
        term: data.term,
        version: 1,
        status: data.status ?? 'draft',
        currentAttainment: data.currentAttainment ?? null,
        targets: data.targets ?? null,
        barriersToLearning: data.barriersToLearning ?? null,
        emotionalWellbeing: data.emotionalWellbeing ?? null,
        attendanceSummary: data.attendanceSummary ?? null,
        extraCurricular: data.extraCurricular ?? null,
        ppPlusAllocation: data.ppPlusAllocation ?? null,
        ppPlusPlannedUse: data.ppPlusPlannedUse ?? null,
        ppPlusActualSpend: data.ppPlusActualSpend ?? null,
        meetingDate: data.meetingDate ? new Date(data.meetingDate) : null,
        meetingNotes: data.meetingNotes ?? null,
        createdById: userId,
      })
      .returning();

    await auditLog('create', 'pep', row.id, {
      before: null,
      after: { personId, academicYear: data.academicYear, term: data.term },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${personId}/education`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createPep] Error:', error);
    return { success: false, error: 'Failed to create PEP' };
  }
}

export async function updatePep(
  pepId: string,
  formData: FormData,
): Promise<ActionResult<typeof personalEducationPlans.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'assessments');

    const [existing] = await db
      .select()
      .from(personalEducationPlans)
      .where(eq(personalEducationPlans.id, pepId))
      .limit(1);

    if (!existing) return { success: false, error: 'PEP not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const raw = Object.fromEntries(formData.entries());
    const parsed = pepSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;
    const newVersion = existing.version + 1;

    const [updated] = await db
      .update(personalEducationPlans)
      .set({
        academicYear: data.academicYear,
        term: data.term,
        version: newVersion,
        status: data.status ?? existing.status,
        currentAttainment: data.currentAttainment ?? null,
        targets: data.targets ?? null,
        barriersToLearning: data.barriersToLearning ?? null,
        emotionalWellbeing: data.emotionalWellbeing ?? null,
        attendanceSummary: data.attendanceSummary ?? null,
        extraCurricular: data.extraCurricular ?? null,
        ppPlusAllocation: data.ppPlusAllocation ?? null,
        ppPlusPlannedUse: data.ppPlusPlannedUse ?? null,
        ppPlusActualSpend: data.ppPlusActualSpend ?? null,
        meetingDate: data.meetingDate ? new Date(data.meetingDate) : null,
        meetingNotes: data.meetingNotes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(personalEducationPlans.id, pepId))
      .returning();

    await auditLog('update', 'pep', pepId, {
      before: { version: existing.version },
      after: { version: newVersion },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/education`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updatePep] Error:', error);
    return { success: false, error: 'Failed to update PEP' };
  }
}

// ---------------------------------------------------------------------------
// PEP Attendees
// ---------------------------------------------------------------------------

export async function addPepAttendee(
  formData: FormData,
): Promise<ActionResult<typeof pepAttendees.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const raw = Object.fromEntries(formData.entries());
    const parsed = pepAttendeeSchema.safeParse({
      ...raw,
      attended: raw.attended === 'true',
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    // Verify PEP belongs to org
    const [pep] = await db
      .select({ organisationId: personalEducationPlans.organisationId, personId: personalEducationPlans.personId })
      .from(personalEducationPlans)
      .where(eq(personalEducationPlans.id, data.pepId))
      .limit(1);

    if (!pep) return { success: false, error: 'PEP not found' };
    assertBelongsToOrg(pep.organisationId, orgId);

    const [row] = await db
      .insert(pepAttendees)
      .values({
        organisationId: orgId,
        pepId: data.pepId,
        name: data.name,
        role: data.role,
        email: data.email || null,
        attended: data.attended,
      })
      .returning();

    await auditLog('create', 'pep_attendee', row.id, {
      before: null,
      after: { pepId: data.pepId, name: data.name, role: data.role },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${pep.personId}/education`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[addPepAttendee] Error:', error);
    return { success: false, error: 'Failed to add PEP attendee' };
  }
}

export async function updatePepAttendee(
  attendeeId: string,
  formData: FormData,
): Promise<ActionResult<typeof pepAttendees.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'assessments');

    const [existing] = await db
      .select()
      .from(pepAttendees)
      .where(eq(pepAttendees.id, attendeeId))
      .limit(1);

    if (!existing) return { success: false, error: 'Attendee not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const raw = Object.fromEntries(formData.entries());
    const parsed = pepAttendeeSchema.safeParse({
      ...raw,
      attended: raw.attended === 'true',
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [updated] = await db
      .update(pepAttendees)
      .set({
        name: data.name,
        role: data.role,
        email: data.email || null,
        attended: data.attended,
      })
      .where(eq(pepAttendees.id, attendeeId))
      .returning();

    await auditLog('update', 'pep_attendee', attendeeId, {
      before: { name: existing.name },
      after: { name: updated.name },
    }, { userId, organisationId: orgId });

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updatePepAttendee] Error:', error);
    return { success: false, error: 'Failed to update PEP attendee' };
  }
}

// ---------------------------------------------------------------------------
// Education Attendance
// ---------------------------------------------------------------------------

export async function recordAttendance(
  personId: string,
  formData: FormData,
): Promise<ActionResult<typeof educationAttendance.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const raw = Object.fromEntries(formData.entries());
    const parsed = educationAttendanceSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(educationAttendance)
      .values({
        organisationId: orgId,
        personId,
        schoolRecordId: data.schoolRecordId,
        date: data.date,
        amMark: data.amMark,
        pmMark: data.pmMark,
        notes: data.notes ?? null,
        recordedById: userId,
      })
      .returning();

    await auditLog('create', 'education_attendance', row.id, {
      before: null,
      after: { personId, date: data.date, amMark: data.amMark, pmMark: data.pmMark },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${personId}/education`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[recordAttendance] Error:', error);
    return { success: false, error: 'Failed to record attendance' };
  }
}

// ---------------------------------------------------------------------------
// Exclusion Records
// ---------------------------------------------------------------------------

export async function createExclusionRecord(
  personId: string,
  formData: FormData,
): Promise<ActionResult<typeof exclusionRecords.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const raw = Object.fromEntries(formData.entries());
    const parsed = exclusionRecordSchema.safeParse({
      ...raw,
      appealLodged: raw.appealLodged === 'true',
    });

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(exclusionRecords)
      .values({
        organisationId: orgId,
        personId,
        schoolRecordId: data.schoolRecordId,
        exclusionType: data.exclusionType,
        reason: data.reason,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        durationDays: data.durationDays ?? null,
        notes: data.notes ?? null,
        appealLodged: data.appealLodged,
        appealOutcome: data.appealOutcome ?? null,
        recordedById: userId,
      })
      .returning();

    await auditLog('create', 'exclusion_record', row.id, {
      before: null,
      after: { personId, type: data.exclusionType, reason: data.reason },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${personId}/education`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createExclusionRecord] Error:', error);
    return { success: false, error: 'Failed to create exclusion record' };
  }
}

// ---------------------------------------------------------------------------
// Pupil Premium Plus
// ---------------------------------------------------------------------------

export async function createPupilPremiumPlusRecord(
  personId: string,
  formData: FormData,
): Promise<ActionResult<typeof pupilPremiumPlusRecords.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const raw = Object.fromEntries(formData.entries());
    const parsed = pupilPremiumPlusSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(pupilPremiumPlusRecords)
      .values({
        organisationId: orgId,
        personId,
        academicYear: data.academicYear,
        allocationAmount: data.allocationAmount,
        plannedUse: data.plannedUse,
        category: data.category ?? null,
        actualSpend: data.actualSpend,
        evidenceOfImpact: data.evidenceOfImpact ?? null,
        recordedById: userId,
      })
      .returning();

    await auditLog('create', 'pupil_premium_plus', row.id, {
      before: null,
      after: { personId, academicYear: data.academicYear, allocation: data.allocationAmount },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${personId}/education`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createPupilPremiumPlusRecord] Error:', error);
    return { success: false, error: 'Failed to create Pupil Premium Plus record' };
  }
}

export async function updatePupilPremiumPlusRecord(
  recordId: string,
  formData: FormData,
): Promise<ActionResult<typeof pupilPremiumPlusRecords.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'assessments');

    const [existing] = await db
      .select()
      .from(pupilPremiumPlusRecords)
      .where(eq(pupilPremiumPlusRecords.id, recordId))
      .limit(1);

    if (!existing) return { success: false, error: 'Record not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const raw = Object.fromEntries(formData.entries());
    const parsed = pupilPremiumPlusSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [updated] = await db
      .update(pupilPremiumPlusRecords)
      .set({
        academicYear: data.academicYear,
        allocationAmount: data.allocationAmount,
        plannedUse: data.plannedUse,
        category: data.category ?? null,
        actualSpend: data.actualSpend,
        evidenceOfImpact: data.evidenceOfImpact ?? null,
        updatedAt: new Date(),
      })
      .where(eq(pupilPremiumPlusRecords.id, recordId))
      .returning();

    await auditLog('update', 'pupil_premium_plus', recordId, {
      before: { actualSpend: existing.actualSpend },
      after: { actualSpend: updated.actualSpend },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/education`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updatePupilPremiumPlusRecord] Error:', error);
    return { success: false, error: 'Failed to update Pupil Premium Plus record' };
  }
}

// ---------------------------------------------------------------------------
// SDQ Assessments
// ---------------------------------------------------------------------------

export async function createSdqAssessment(
  personId: string,
  formData: FormData,
): Promise<ActionResult<typeof sdqAssessments.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const raw = Object.fromEntries(formData.entries());
    const parsed = sdqAssessmentSchema.safeParse(raw);

    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(sdqAssessments)
      .values({
        organisationId: orgId,
        personId,
        assessmentDate: data.assessmentDate,
        respondent: data.respondent,
        emotionalScore: data.emotionalScore,
        conductScore: data.conductScore,
        hyperactivityScore: data.hyperactivityScore,
        peerScore: data.peerScore,
        prosocialScore: data.prosocialScore,
        totalDifficulties: data.totalDifficulties,
        impactScore: data.impactScore ?? null,
        notes: data.notes ?? null,
        assessedById: userId,
      })
      .returning();

    await auditLog('create', 'sdq_assessment', row.id, {
      before: null,
      after: { personId, respondent: data.respondent, totalDifficulties: data.totalDifficulties },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${personId}/education`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createSdqAssessment] Error:', error);
    return { success: false, error: 'Failed to create SDQ assessment' };
  }
}
