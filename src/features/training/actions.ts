'use server';

/**
 * Training Matrix Server Actions
 *
 * Full CRUD for training courses, records, and qualifications.
 * Includes training matrix computation, gap analysis, and expiry monitoring.
 *
 * Flow: Zod validate -> auth -> RBAC -> tenant isolation -> audit log
 * All actions are tenant-scoped and RBAC-protected.
 *
 * Uses the 'compliance' resource for RBAC (shared with DBS tracking).
 */

import { and, count, desc, eq, lte, gte, isNull, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  trainingCourses,
  trainingRecords,
  qualifications,
  staffProfiles,
  organisations,
} from '@/lib/db/schema';
import type { TrainingCourse } from '@/lib/db/schema/training';
import type { TrainingRecord } from '@/lib/db/schema/training';
import type { Qualification } from '@/lib/db/schema/training';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createTrainingCourseSchema,
  updateTrainingCourseSchema,
  createTrainingRecordSchema,
  updateTrainingRecordSchema,
  createQualificationSchema,
  updateQualificationSchema,
  computeTrainingStatus,
} from './schema';
import type {
  CreateTrainingCourseInput,
  UpdateTrainingCourseInput,
  CreateTrainingRecordInput,
  UpdateTrainingRecordInput,
  CreateQualificationInput,
  UpdateQualificationInput,
} from './schema';
import { DEFAULT_CARE_SECTOR_COURSES } from './constants';
import type { RagColour } from './constants';

// Re-export for external use
export type {
  CreateTrainingCourseInput,
  UpdateTrainingCourseInput,
  CreateTrainingRecordInput,
  UpdateTrainingRecordInput,
  CreateQualificationInput,
  UpdateQualificationInput,
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

// ====================================================================
// TRAINING COURSES CRUD
// ====================================================================

// ---------------------------------------------------------------------------
// List training courses
// ---------------------------------------------------------------------------

export type TrainingCourseListItem = {
  id: string;
  name: string;
  category: string;
  requiredForRoles: string[];
  defaultProvider: string | null;
  validityMonths: number | null;
  isDefault: boolean;
  createdAt: Date;
};

export async function listTrainingCourses(): Promise<TrainingCourseListItem[]> {
  const { orgId } = await requirePermission('read', 'compliance');

  const rows = await db
    .select({
      id: trainingCourses.id,
      name: trainingCourses.name,
      category: trainingCourses.category,
      requiredForRoles: trainingCourses.requiredForRoles,
      defaultProvider: trainingCourses.defaultProvider,
      validityMonths: trainingCourses.validityMonths,
      isDefault: trainingCourses.isDefault,
      createdAt: trainingCourses.createdAt,
    })
    .from(trainingCourses)
    .where(eq(trainingCourses.organisationId, orgId))
    .orderBy(trainingCourses.category, trainingCourses.name);

  return rows;
}

// ---------------------------------------------------------------------------
// Seed default courses for an org (if not already seeded)
// ---------------------------------------------------------------------------

export async function seedDefaultCourses(): Promise<void> {
  const { orgId } = await requirePermission('manage', 'compliance');

  // Check if defaults are already seeded
  const [existing] = await db
    .select({ count: count() })
    .from(trainingCourses)
    .where(
      and(
        eq(trainingCourses.organisationId, orgId),
        eq(trainingCourses.isDefault, true),
      ),
    );

  if (existing && existing.count > 0) return;

  // Seed default courses
  await db.insert(trainingCourses).values(
    DEFAULT_CARE_SECTOR_COURSES.map((course) => ({
      organisationId: orgId,
      name: course.name,
      category: course.category,
      requiredForRoles: course.requiredForRoles,
      validityMonths: course.validityMonths,
      isDefault: true,
    })),
  );
}

// ---------------------------------------------------------------------------
// Create training course
// ---------------------------------------------------------------------------

export async function createTrainingCourse(
  input: CreateTrainingCourseInput,
): Promise<ActionResult<TrainingCourse>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = createTrainingCourseSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [course] = await db
      .insert(trainingCourses)
      .values({
        organisationId: orgId,
        name: data.name,
        category: data.category,
        requiredForRoles: data.requiredForRoles,
        defaultProvider: data.defaultProvider ?? null,
        validityMonths: typeof data.validityMonths === 'number' ? data.validityMonths : null,
        isDefault: data.isDefault,
      })
      .returning();

    await auditLog(
      'create',
      'training_course',
      course.id,
      { before: null, after: { name: data.name, category: data.category } },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/training`);
    }

    return { success: true, data: course };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createTrainingCourse] Error:', error);
    return { success: false, error: 'Failed to create training course' };
  }
}

// ---------------------------------------------------------------------------
// Update training course
// ---------------------------------------------------------------------------

export async function updateTrainingCourse(
  courseId: string,
  input: UpdateTrainingCourseInput,
): Promise<ActionResult<TrainingCourse>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = updateTrainingCourseSchema.safeParse(input);
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
      .from(trainingCourses)
      .where(eq(trainingCourses.id, courseId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Training course not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof trainingCourses.$inferInsert> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.category !== undefined) updates.category = data.category;
    if (data.requiredForRoles !== undefined) updates.requiredForRoles = data.requiredForRoles;
    if (data.defaultProvider !== undefined) updates.defaultProvider = data.defaultProvider ?? null;
    if (data.validityMonths !== undefined) {
      updates.validityMonths = typeof data.validityMonths === 'number' ? data.validityMonths : null;
    }
    if (data.isDefault !== undefined) updates.isDefault = data.isDefault;

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(trainingCourses)
      .set(updates)
      .where(eq(trainingCourses.id, courseId))
      .returning();

    await auditLog(
      'update',
      'training_course',
      courseId,
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
      revalidatePath(`/${slug}/staff/training`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateTrainingCourse] Error:', error);
    return { success: false, error: 'Failed to update training course' };
  }
}

// ---------------------------------------------------------------------------
// Delete training course
// ---------------------------------------------------------------------------

export async function deleteTrainingCourse(
  courseId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const [existing] = await db
      .select()
      .from(trainingCourses)
      .where(eq(trainingCourses.id, courseId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Training course not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(trainingCourses).where(eq(trainingCourses.id, courseId));

    await auditLog(
      'delete',
      'training_course',
      courseId,
      { before: { name: existing.name, category: existing.category }, after: null },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/training`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteTrainingCourse] Error:', error);
    return { success: false, error: 'Failed to delete training course' };
  }
}

// ====================================================================
// TRAINING RECORDS CRUD
// ====================================================================

// ---------------------------------------------------------------------------
// List training records for a staff member
// ---------------------------------------------------------------------------

export type TrainingRecordListItem = {
  id: string;
  staffProfileId: string;
  courseId: string | null;
  courseName: string;
  provider: string | null;
  completedDate: string;
  expiryDate: string | null;
  certificateUrl: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
};

export async function listTrainingRecords({
  staffProfileId,
}: {
  staffProfileId: string;
}): Promise<TrainingRecordListItem[]> {
  const { orgId } = await requirePermission('read', 'compliance');

  const rows = await db
    .select({
      id: trainingRecords.id,
      staffProfileId: trainingRecords.staffProfileId,
      courseId: trainingRecords.courseId,
      courseName: trainingRecords.courseName,
      provider: trainingRecords.provider,
      completedDate: trainingRecords.completedDate,
      expiryDate: trainingRecords.expiryDate,
      certificateUrl: trainingRecords.certificateUrl,
      status: trainingRecords.status,
      notes: trainingRecords.notes,
      createdAt: trainingRecords.createdAt,
    })
    .from(trainingRecords)
    .where(
      and(
        eq(trainingRecords.organisationId, orgId),
        eq(trainingRecords.staffProfileId, staffProfileId),
      ),
    )
    .orderBy(desc(trainingRecords.completedDate));

  return rows;
}

// ---------------------------------------------------------------------------
// Create training record
// ---------------------------------------------------------------------------

export async function createTrainingRecord(
  input: CreateTrainingRecordInput,
): Promise<ActionResult<TrainingRecord>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'compliance');

    const parsed = createTrainingRecordSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;
    const status = computeTrainingStatus(data.expiryDate);

    const [record] = await db
      .insert(trainingRecords)
      .values({
        organisationId: orgId,
        staffProfileId: data.staffProfileId,
        courseId: data.courseId ?? null,
        courseName: data.courseName,
        provider: data.provider ?? null,
        completedDate: data.completedDate,
        expiryDate: data.expiryDate ?? null,
        certificateUrl: data.certificateUrl ?? null,
        status,
        notes: data.notes ?? null,
      })
      .returning();

    await auditLog(
      'create',
      'training_record',
      record.id,
      {
        before: null,
        after: {
          courseName: data.courseName,
          staffProfileId: data.staffProfileId,
          completedDate: data.completedDate,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${data.staffProfileId}/training`);
      revalidatePath(`/${slug}/staff/training`);
    }

    return { success: true, data: record };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createTrainingRecord] Error:', error);
    return { success: false, error: 'Failed to create training record' };
  }
}

// ---------------------------------------------------------------------------
// Update training record
// ---------------------------------------------------------------------------

export async function updateTrainingRecord(
  recordId: string,
  input: UpdateTrainingRecordInput,
): Promise<ActionResult<TrainingRecord>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = updateTrainingRecordSchema.safeParse(input);
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
      .from(trainingRecords)
      .where(eq(trainingRecords.id, recordId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Training record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof trainingRecords.$inferInsert> = {};

    if (data.courseName !== undefined) updates.courseName = data.courseName;
    if (data.provider !== undefined) updates.provider = data.provider ?? null;
    if (data.completedDate !== undefined) updates.completedDate = data.completedDate;
    if (data.expiryDate !== undefined) updates.expiryDate = data.expiryDate ?? null;
    if (data.certificateUrl !== undefined) updates.certificateUrl = data.certificateUrl ?? null;
    if (data.notes !== undefined) updates.notes = data.notes ?? null;

    // Recompute status if expiry date changed
    const expiryDate = data.expiryDate !== undefined ? data.expiryDate : existing.expiryDate;
    updates.status = computeTrainingStatus(expiryDate);
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(trainingRecords)
      .set(updates)
      .where(eq(trainingRecords.id, recordId))
      .returning();

    await auditLog(
      'update',
      'training_record',
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
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/training`);
      revalidatePath(`/${slug}/staff/training`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateTrainingRecord] Error:', error);
    return { success: false, error: 'Failed to update training record' };
  }
}

// ---------------------------------------------------------------------------
// Delete training record
// ---------------------------------------------------------------------------

export async function deleteTrainingRecord(
  recordId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const [existing] = await db
      .select()
      .from(trainingRecords)
      .where(eq(trainingRecords.id, recordId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Training record not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(trainingRecords).where(eq(trainingRecords.id, recordId));

    await auditLog(
      'delete',
      'training_record',
      recordId,
      {
        before: {
          courseName: existing.courseName,
          staffProfileId: existing.staffProfileId,
        },
        after: null,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/training`);
      revalidatePath(`/${slug}/staff/training`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteTrainingRecord] Error:', error);
    return { success: false, error: 'Failed to delete training record' };
  }
}

// ====================================================================
// QUALIFICATIONS CRUD
// ====================================================================

// ---------------------------------------------------------------------------
// List qualifications for a staff member
// ---------------------------------------------------------------------------

export type QualificationListItem = {
  id: string;
  staffProfileId: string;
  name: string;
  level: string;
  status: string;
  completedDate: string | null;
  targetDate: string | null;
  notes: string | null;
  createdAt: Date;
};

export async function listQualifications({
  staffProfileId,
}: {
  staffProfileId: string;
}): Promise<QualificationListItem[]> {
  const { orgId } = await requirePermission('read', 'compliance');

  const rows = await db
    .select({
      id: qualifications.id,
      staffProfileId: qualifications.staffProfileId,
      name: qualifications.name,
      level: qualifications.level,
      status: qualifications.status,
      completedDate: qualifications.completedDate,
      targetDate: qualifications.targetDate,
      notes: qualifications.notes,
      createdAt: qualifications.createdAt,
    })
    .from(qualifications)
    .where(
      and(
        eq(qualifications.organisationId, orgId),
        eq(qualifications.staffProfileId, staffProfileId),
      ),
    )
    .orderBy(desc(qualifications.createdAt));

  return rows;
}

// ---------------------------------------------------------------------------
// Create qualification
// ---------------------------------------------------------------------------

export async function createQualification(
  input: CreateQualificationInput,
): Promise<ActionResult<Qualification>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'compliance');

    const parsed = createQualificationSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [qualification] = await db
      .insert(qualifications)
      .values({
        organisationId: orgId,
        staffProfileId: data.staffProfileId,
        name: data.name,
        level: data.level,
        status: data.status,
        completedDate: data.completedDate ?? null,
        targetDate: data.targetDate ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    await auditLog(
      'create',
      'qualification',
      qualification.id,
      {
        before: null,
        after: { name: data.name, level: data.level, status: data.status },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${data.staffProfileId}/training`);
    }

    return { success: true, data: qualification };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createQualification] Error:', error);
    return { success: false, error: 'Failed to create qualification' };
  }
}

// ---------------------------------------------------------------------------
// Update qualification
// ---------------------------------------------------------------------------

export async function updateQualification(
  qualificationId: string,
  input: UpdateQualificationInput,
): Promise<ActionResult<Qualification>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const parsed = updateQualificationSchema.safeParse(input);
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
      .from(qualifications)
      .where(eq(qualifications.id, qualificationId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Qualification not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof qualifications.$inferInsert> = {};

    if (data.name !== undefined) updates.name = data.name;
    if (data.level !== undefined) updates.level = data.level;
    if (data.status !== undefined) updates.status = data.status;
    if (data.completedDate !== undefined) updates.completedDate = data.completedDate ?? null;
    if (data.targetDate !== undefined) updates.targetDate = data.targetDate ?? null;
    if (data.notes !== undefined) updates.notes = data.notes ?? null;

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(qualifications)
      .set(updates)
      .where(eq(qualifications.id, qualificationId))
      .returning();

    await auditLog(
      'update',
      'qualification',
      qualificationId,
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
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/training`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateQualification] Error:', error);
    return { success: false, error: 'Failed to update qualification' };
  }
}

// ---------------------------------------------------------------------------
// Delete qualification
// ---------------------------------------------------------------------------

export async function deleteQualification(
  qualificationId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('manage', 'compliance');

    const [existing] = await db
      .select()
      .from(qualifications)
      .where(eq(qualifications.id, qualificationId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Qualification not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(qualifications).where(eq(qualifications.id, qualificationId));

    await auditLog(
      'delete',
      'qualification',
      qualificationId,
      {
        before: { name: existing.name, level: existing.level },
        after: null,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff/${existing.staffProfileId}/training`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteQualification] Error:', error);
    return { success: false, error: 'Failed to delete qualification' };
  }
}

// ====================================================================
// TRAINING MATRIX & GAP ANALYSIS
// ====================================================================

// ---------------------------------------------------------------------------
// Training Matrix — org-wide RAG grid
// ---------------------------------------------------------------------------

export type TrainingMatrixCell = {
  courseId: string;
  staffProfileId: string;
  status: RagColour;
  recordId?: string;
  completedDate?: string;
  expiryDate?: string | null;
};

export type TrainingMatrixRow = {
  staffId: string;
  staffName: string;
  jobTitle: string;
  cells: TrainingMatrixCell[];
};

export type TrainingMatrixData = {
  courses: Array<{ id: string; name: string; category: string }>;
  rows: TrainingMatrixRow[];
  summary: {
    totalStaff: number;
    totalCourses: number;
    compliant: number;
    expiringSoon: number;
    gaps: number;
  };
};

export async function getTrainingMatrix(): Promise<TrainingMatrixData> {
  const { orgId } = await requirePermission('read', 'compliance');

  // Fetch all required courses for the org
  const courses = await db
    .select({
      id: trainingCourses.id,
      name: trainingCourses.name,
      category: trainingCourses.category,
      requiredForRoles: trainingCourses.requiredForRoles,
      validityMonths: trainingCourses.validityMonths,
    })
    .from(trainingCourses)
    .where(eq(trainingCourses.organisationId, orgId))
    .orderBy(trainingCourses.category, trainingCourses.name);

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

  if (staff.length === 0 || courses.length === 0) {
    return {
      courses: courses.map((c) => ({ id: c.id, name: c.name, category: c.category })),
      rows: [],
      summary: { totalStaff: 0, totalCourses: courses.length, compliant: 0, expiringSoon: 0, gaps: 0 },
    };
  }

  // Fetch all training records for all active staff
  const staffIds = staff.map((s) => s.id);
  const allRecords = await db
    .select({
      id: trainingRecords.id,
      staffProfileId: trainingRecords.staffProfileId,
      courseId: trainingRecords.courseId,
      completedDate: trainingRecords.completedDate,
      expiryDate: trainingRecords.expiryDate,
    })
    .from(trainingRecords)
    .where(
      and(
        eq(trainingRecords.organisationId, orgId),
        inArray(trainingRecords.staffProfileId, staffIds),
      ),
    );

  // Build lookup: staffId+courseId -> best record (most recent)
  const recordLookup = new Map<string, typeof allRecords[0]>();
  for (const rec of allRecords) {
    if (!rec.courseId) continue;
    const key = `${rec.staffProfileId}:${rec.courseId}`;
    const existing = recordLookup.get(key);
    if (!existing || rec.completedDate > existing.completedDate) {
      recordLookup.set(key, rec);
    }
  }

  // Build matrix rows
  let compliant = 0;
  let expiringSoon = 0;
  let gaps = 0;

  const rows: TrainingMatrixRow[] = staff.map((s) => {
    const cells: TrainingMatrixCell[] = courses.map((course) => {
      // Check if course is required for this staff member's role
      const isRequired = course.requiredForRoles.length === 0 ||
        course.requiredForRoles.includes(s.jobTitle);

      if (!isRequired) {
        return {
          courseId: course.id,
          staffProfileId: s.id,
          status: 'grey' as RagColour,
        };
      }

      const key = `${s.id}:${course.id}`;
      const record = recordLookup.get(key);

      if (!record) {
        gaps++;
        return {
          courseId: course.id,
          staffProfileId: s.id,
          status: 'red' as RagColour,
        };
      }

      const trainingStatus = computeTrainingStatus(record.expiryDate);

      let ragColour: RagColour;
      if (trainingStatus === 'expired') {
        ragColour = 'red';
        gaps++;
      } else if (trainingStatus === 'expiring_soon') {
        ragColour = 'amber';
        expiringSoon++;
      } else {
        ragColour = 'green';
        compliant++;
      }

      return {
        courseId: course.id,
        staffProfileId: s.id,
        status: ragColour,
        recordId: record.id,
        completedDate: record.completedDate,
        expiryDate: record.expiryDate,
      };
    });

    return {
      staffId: s.id,
      staffName: s.fullName,
      jobTitle: s.jobTitle,
      cells,
    };
  });

  return {
    courses: courses.map((c) => ({ id: c.id, name: c.name, category: c.category })),
    rows,
    summary: {
      totalStaff: staff.length,
      totalCourses: courses.length,
      compliant,
      expiringSoon,
      gaps,
    },
  };
}

// ---------------------------------------------------------------------------
// Gap Analysis — missing/expired training per staff member
// ---------------------------------------------------------------------------

export type TrainingGap = {
  courseId: string;
  courseName: string;
  category: string;
  status: 'missing' | 'expired';
  expiryDate?: string | null;
  lastCompleted?: string;
};

export type StaffTrainingGaps = {
  staffId: string;
  staffName: string;
  jobTitle: string;
  gaps: TrainingGap[];
  totalRequired: number;
  totalCompliant: number;
  compliancePercentage: number;
};

export async function getGapAnalysis(): Promise<StaffTrainingGaps[]> {
  // Permission check — orgId not used directly because getTrainingMatrix() handles tenant scoping
  await requirePermission('read', 'compliance');

  // Reuse matrix data
  const matrix = await getTrainingMatrix();

  const gapAnalysis: StaffTrainingGaps[] = matrix.rows.map((row) => {
    const requiredCells = row.cells.filter((c) => c.status !== 'grey');
    const gapCells = row.cells.filter((c) => c.status === 'red');
    const compliantCells = requiredCells.filter((c) => c.status === 'green' || c.status === 'amber');

    const gaps: TrainingGap[] = gapCells.map((cell) => {
      const course = matrix.courses.find((c) => c.id === cell.courseId);
      return {
        courseId: cell.courseId,
        courseName: course?.name ?? 'Unknown',
        category: course?.category ?? 'other',
        status: cell.expiryDate ? 'expired' : 'missing',
        expiryDate: cell.expiryDate,
        lastCompleted: cell.completedDate,
      };
    });

    const totalRequired = requiredCells.length;
    const totalCompliant = compliantCells.length;

    return {
      staffId: row.staffId,
      staffName: row.staffName,
      jobTitle: row.jobTitle,
      gaps,
      totalRequired,
      totalCompliant,
      compliancePercentage: totalRequired > 0
        ? Math.round((totalCompliant / totalRequired) * 100)
        : 100,
    };
  });

  // Sort by compliance percentage ascending (worst first)
  return gapAnalysis.sort((a, b) => a.compliancePercentage - b.compliancePercentage);
}

// ---------------------------------------------------------------------------
// Expiring training — compliance dashboard query
// ---------------------------------------------------------------------------

export type ExpiringTraining = {
  id: string;
  staffProfileId: string;
  staffName: string;
  courseName: string;
  expiryDate: string;
  status: string;
};

export async function getExpiringTraining({
  withinDays = 30,
}: {
  withinDays?: number;
} = {}): Promise<ExpiringTraining[]> {
  const { orgId } = await requirePermission('read', 'compliance');

  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + withinDays);

  const todayStr = today.toISOString().slice(0, 10);
  const futureDateStr = futureDate.toISOString().slice(0, 10);

  const rows = await db
    .select({
      id: trainingRecords.id,
      staffProfileId: trainingRecords.staffProfileId,
      staffName: staffProfiles.fullName,
      courseName: trainingRecords.courseName,
      expiryDate: trainingRecords.expiryDate,
      status: trainingRecords.status,
    })
    .from(trainingRecords)
    .innerJoin(staffProfiles, eq(trainingRecords.staffProfileId, staffProfiles.id))
    .where(
      and(
        eq(trainingRecords.organisationId, orgId),
        gte(trainingRecords.expiryDate, todayStr),
        lte(trainingRecords.expiryDate, futureDateStr),
      ),
    )
    .orderBy(trainingRecords.expiryDate)
    .limit(100);

  return rows.map((r) => ({
    id: r.id,
    staffProfileId: r.staffProfileId,
    staffName: r.staffName,
    courseName: r.courseName,
    expiryDate: r.expiryDate!,
    status: r.status,
  }));
}
