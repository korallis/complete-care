'use server';

/**
 * Clinical Monitoring Server Actions
 *
 * Fluid intake/output recording, meal recording, and MUST screening.
 * All actions are tenant-scoped and RBAC-protected.
 *
 * RBAC rules:
 * - clinical resource: senior_carer+ can record (create/update), carer can view (read)
 *
 * Flow: Zod validate -> auth -> RBAC -> tenant isolation -> audit log
 */

import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  fluidEntries,
  mealEntries,
  mustAssessments,
  organisations,
  users,
} from '@/lib/db/schema';
import type {
  FluidEntry,
  MealEntry,
  MustAssessment,
} from '@/lib/db/schema/clinical-monitoring';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  recordFluidEntrySchema,
  recordMealEntrySchema,
  createMustAssessmentSchema,
} from './schema';
import type {
  RecordFluidEntryInput,
  RecordMealEntryInput,
  CreateMustAssessmentInput,
} from './schema';
import { scoreMust } from './utils';

// Re-export types for external use
export type {
  RecordFluidEntryInput,
  RecordMealEntryInput,
  CreateMustAssessmentInput,
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
// Record fluid entry
// ---------------------------------------------------------------------------

export async function recordFluidEntry(
  input: RecordFluidEntryInput,
): Promise<ActionResult<FluidEntry>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    const parsed = recordFluidEntrySchema.safeParse(input);
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

    const [entry] = await db
      .insert(fluidEntries)
      .values({
        organisationId: orgId,
        personId: data.personId,
        entryType: data.entryType,
        fluidType: data.fluidType,
        volume: data.volume,
        iddsiLevel: data.iddsiLevel ?? null,
        characteristics: data.characteristics ?? null,
        recordedById: userId,
        recordedByName: user?.name ?? null,
        recordedAt: new Date(data.recordedAt),
      })
      .returning();

    await auditLog(
      'create',
      'fluid_entry',
      entry.id,
      {
        before: null,
        after: {
          entryType: data.entryType,
          fluidType: data.fluidType,
          volume: data.volume,
          personId: data.personId,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/clinical/fluids`);
    }

    return { success: true, data: entry };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[recordFluidEntry] Error:', error);
    return { success: false, error: 'Failed to record fluid entry' };
  }
}

// ---------------------------------------------------------------------------
// List fluid entries for a person (24hr window)
// ---------------------------------------------------------------------------

export type FluidEntryListItem = {
  id: string;
  entryType: string;
  fluidType: string;
  volume: number;
  iddsiLevel: number | null;
  characteristics: string | null;
  recordedByName: string | null;
  recordedAt: Date;
};

export async function listFluidEntries({
  personId,
  date,
}: {
  personId: string;
  date: string;
}): Promise<FluidEntryListItem[]> {
  const { orgId } = await requirePermission('read', 'clinical');

  // Build 24hr window from the given date (midnight to midnight)
  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  const rows = await db
    .select({
      id: fluidEntries.id,
      entryType: fluidEntries.entryType,
      fluidType: fluidEntries.fluidType,
      volume: fluidEntries.volume,
      iddsiLevel: fluidEntries.iddsiLevel,
      characteristics: fluidEntries.characteristics,
      recordedByName: fluidEntries.recordedByName,
      recordedAt: fluidEntries.recordedAt,
    })
    .from(fluidEntries)
    .where(
      and(
        eq(fluidEntries.organisationId, orgId),
        eq(fluidEntries.personId, personId),
        gte(fluidEntries.recordedAt, startOfDay),
        lte(fluidEntries.recordedAt, endOfDay),
      ),
    )
    .orderBy(desc(fluidEntries.recordedAt));

  return rows;
}

// ---------------------------------------------------------------------------
// Get 24hr fluid totals
// ---------------------------------------------------------------------------

export type FluidTotalsResult = {
  totalIntake: number;
  totalOutput: number;
  balance: number;
  lastIntakeAt: Date | null;
};

export async function get24hrFluidTotals({
  personId,
  date,
}: {
  personId: string;
  date: string;
}): Promise<FluidTotalsResult> {
  const { orgId } = await requirePermission('read', 'clinical');

  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  const rows = await db
    .select({
      entryType: fluidEntries.entryType,
      volume: fluidEntries.volume,
      recordedAt: fluidEntries.recordedAt,
    })
    .from(fluidEntries)
    .where(
      and(
        eq(fluidEntries.organisationId, orgId),
        eq(fluidEntries.personId, personId),
        gte(fluidEntries.recordedAt, startOfDay),
        lte(fluidEntries.recordedAt, endOfDay),
      ),
    )
    .orderBy(desc(fluidEntries.recordedAt));

  let totalIntake = 0;
  let totalOutput = 0;
  let lastIntakeAt: Date | null = null;

  for (const row of rows) {
    if (row.entryType === 'intake') {
      totalIntake += row.volume;
      if (!lastIntakeAt || row.recordedAt > lastIntakeAt) {
        lastIntakeAt = row.recordedAt;
      }
    } else if (row.entryType === 'output') {
      totalOutput += row.volume;
    }
  }

  return {
    totalIntake,
    totalOutput,
    balance: totalIntake - totalOutput,
    lastIntakeAt,
  };
}

// ---------------------------------------------------------------------------
// Record meal entry
// ---------------------------------------------------------------------------

export async function recordMealEntry(
  input: RecordMealEntryInput,
): Promise<ActionResult<MealEntry>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    const parsed = recordMealEntrySchema.safeParse(input);
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

    const [entry] = await db
      .insert(mealEntries)
      .values({
        organisationId: orgId,
        personId: data.personId,
        mealType: data.mealType,
        description: data.description,
        portionConsumed: data.portionConsumed,
        recordedById: userId,
        recordedByName: user?.name ?? null,
        recordedAt: new Date(data.recordedAt),
      })
      .returning();

    await auditLog(
      'create',
      'meal_entry',
      entry.id,
      {
        before: null,
        after: {
          mealType: data.mealType,
          portionConsumed: data.portionConsumed,
          personId: data.personId,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/clinical/nutrition`);
    }

    return { success: true, data: entry };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[recordMealEntry] Error:', error);
    return { success: false, error: 'Failed to record meal entry' };
  }
}

// ---------------------------------------------------------------------------
// List meal entries for a person (daily)
// ---------------------------------------------------------------------------

export type MealEntryListItem = {
  id: string;
  mealType: string;
  description: string;
  portionConsumed: string;
  recordedByName: string | null;
  recordedAt: Date;
};

export async function listMealEntries({
  personId,
  date,
}: {
  personId: string;
  date: string;
}): Promise<MealEntryListItem[]> {
  const { orgId } = await requirePermission('read', 'clinical');

  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  const rows = await db
    .select({
      id: mealEntries.id,
      mealType: mealEntries.mealType,
      description: mealEntries.description,
      portionConsumed: mealEntries.portionConsumed,
      recordedByName: mealEntries.recordedByName,
      recordedAt: mealEntries.recordedAt,
    })
    .from(mealEntries)
    .where(
      and(
        eq(mealEntries.organisationId, orgId),
        eq(mealEntries.personId, personId),
        gte(mealEntries.recordedAt, startOfDay),
        lte(mealEntries.recordedAt, endOfDay),
      ),
    )
    .orderBy(desc(mealEntries.recordedAt));

  return rows;
}

// ---------------------------------------------------------------------------
// Create MUST assessment
// ---------------------------------------------------------------------------

export async function createMustAssessment(
  input: CreateMustAssessmentInput,
): Promise<ActionResult<MustAssessment>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    const parsed = createMustAssessmentSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Calculate MUST score
    const { totalScore, riskCategory, carePathway } = scoreMust(
      data.bmiScore,
      data.weightLossScore,
      data.acuteDiseaseScore,
    );

    // Get user name for denormalisation
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [assessment] = await db
      .insert(mustAssessments)
      .values({
        organisationId: orgId,
        personId: data.personId,
        bmiScore: data.bmiScore,
        weightLossScore: data.weightLossScore,
        acuteDiseaseScore: data.acuteDiseaseScore,
        totalScore,
        riskCategory,
        carePathway,
        assessedById: userId,
        assessedByName: user?.name ?? null,
        notes: data.notes ?? null,
      })
      .returning();

    await auditLog(
      'create',
      'must_assessment',
      assessment.id,
      {
        before: null,
        after: {
          totalScore,
          riskCategory,
          carePathway,
          personId: data.personId,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/clinical/nutrition`);
    }

    return { success: true, data: assessment };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createMustAssessment] Error:', error);
    return { success: false, error: 'Failed to create MUST assessment' };
  }
}

// ---------------------------------------------------------------------------
// Get MUST assessment history
// ---------------------------------------------------------------------------

export type MustAssessmentListItem = {
  id: string;
  bmiScore: number;
  weightLossScore: number;
  acuteDiseaseScore: number;
  totalScore: number;
  riskCategory: string;
  carePathway: string;
  assessedByName: string | null;
  notes: string | null;
  createdAt: Date;
};

export type MustAssessmentListResult = {
  assessments: MustAssessmentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getMustHistory({
  personId,
  page = 1,
  pageSize = 20,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
}): Promise<MustAssessmentListResult> {
  const { orgId } = await requirePermission('read', 'clinical');

  const whereClause = and(
    eq(mustAssessments.organisationId, orgId),
    eq(mustAssessments.personId, personId),
  );
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: mustAssessments.id,
        bmiScore: mustAssessments.bmiScore,
        weightLossScore: mustAssessments.weightLossScore,
        acuteDiseaseScore: mustAssessments.acuteDiseaseScore,
        totalScore: mustAssessments.totalScore,
        riskCategory: mustAssessments.riskCategory,
        carePathway: mustAssessments.carePathway,
        assessedByName: mustAssessments.assessedByName,
        notes: mustAssessments.notes,
        createdAt: mustAssessments.createdAt,
      })
      .from(mustAssessments)
      .where(whereClause)
      .orderBy(desc(mustAssessments.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(mustAssessments).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    assessments: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}
