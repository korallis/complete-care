'use server';

/**
 * Bowel, Sleep & Pain Server Actions
 *
 * CRUD operations for bowel records, sleep checks, and pain assessments.
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
  bowelRecords,
  sleepChecks,
  painAssessments,
  organisations,
  users,
} from '@/lib/db/schema';
import type { BowelRecord } from '@/lib/db/schema/bowel-sleep-pain';
import type { SleepCheck } from '@/lib/db/schema/bowel-sleep-pain';
import type { PainAssessment } from '@/lib/db/schema/bowel-sleep-pain';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  recordBowelEntrySchema,
  recordSleepCheckSchema,
  createPainAssessmentSchema,
} from './schema';
import type {
  RecordBowelEntryInput,
  RecordSleepCheckInput,
  CreatePainAssessmentInput,
} from './schema';
import { scoreAbbey, scorePainad } from './scoring';
import type { AbbeyScores, PainadScores } from './scoring';

// Re-export types for external use
export type {
  RecordBowelEntryInput,
  RecordSleepCheckInput,
  CreatePainAssessmentInput,
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
// Record bowel entry
// ---------------------------------------------------------------------------

export async function recordBowelEntry(
  input: RecordBowelEntryInput,
): Promise<ActionResult<BowelRecord>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    const parsed = recordBowelEntrySchema.safeParse(input);
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
      .insert(bowelRecords)
      .values({
        organisationId: orgId,
        personId: data.personId,
        bristolType: data.bristolType,
        colour: data.colour,
        bloodPresent: data.bloodPresent,
        mucusPresent: data.mucusPresent,
        laxativeGiven: data.laxativeGiven,
        laxativeName: data.laxativeName ?? null,
        notes: data.notes ?? null,
        recordedById: userId,
        recordedByName: user?.name ?? null,
        recordedAt: new Date(data.recordedAt),
      })
      .returning();

    await auditLog(
      'create',
      'bowel_record',
      entry.id,
      {
        before: null,
        after: {
          bristolType: data.bristolType,
          colour: data.colour,
          bloodPresent: data.bloodPresent,
          personId: data.personId,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/clinical/bowel`);
    }

    return { success: true, data: entry };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[recordBowelEntry] Error:', error);
    return { success: false, error: 'Failed to record bowel entry' };
  }
}

// ---------------------------------------------------------------------------
// List bowel entries for a person (date window)
// ---------------------------------------------------------------------------

export type BowelRecordListItem = {
  id: string;
  bristolType: number;
  colour: string;
  bloodPresent: boolean;
  mucusPresent: boolean;
  laxativeGiven: boolean;
  laxativeName: string | null;
  notes: string | null;
  recordedByName: string | null;
  recordedAt: Date;
};

export async function listBowelRecords({
  personId,
  date,
}: {
  personId: string;
  date: string;
}): Promise<BowelRecordListItem[]> {
  const { orgId } = await requirePermission('read', 'clinical');

  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  const rows = await db
    .select({
      id: bowelRecords.id,
      bristolType: bowelRecords.bristolType,
      colour: bowelRecords.colour,
      bloodPresent: bowelRecords.bloodPresent,
      mucusPresent: bowelRecords.mucusPresent,
      laxativeGiven: bowelRecords.laxativeGiven,
      laxativeName: bowelRecords.laxativeName,
      notes: bowelRecords.notes,
      recordedByName: bowelRecords.recordedByName,
      recordedAt: bowelRecords.recordedAt,
    })
    .from(bowelRecords)
    .where(
      and(
        eq(bowelRecords.organisationId, orgId),
        eq(bowelRecords.personId, personId),
        gte(bowelRecords.recordedAt, startOfDay),
        lte(bowelRecords.recordedAt, endOfDay),
      ),
    )
    .orderBy(desc(bowelRecords.recordedAt));

  return rows;
}

// ---------------------------------------------------------------------------
// Get last bowel movement date (for constipation detection)
// ---------------------------------------------------------------------------

export async function getLastBowelMovement({
  personId,
}: {
  personId: string;
}): Promise<Date | null> {
  const { orgId } = await requirePermission('read', 'clinical');

  const [row] = await db
    .select({ recordedAt: bowelRecords.recordedAt })
    .from(bowelRecords)
    .where(
      and(
        eq(bowelRecords.organisationId, orgId),
        eq(bowelRecords.personId, personId),
      ),
    )
    .orderBy(desc(bowelRecords.recordedAt))
    .limit(1);

  return row?.recordedAt ?? null;
}

// ---------------------------------------------------------------------------
// Get 24hr Bristol types (for diarrhoea detection)
// ---------------------------------------------------------------------------

export async function get24hrBristolTypes({
  personId,
  date,
}: {
  personId: string;
  date: string;
}): Promise<number[]> {
  const { orgId } = await requirePermission('read', 'clinical');

  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  const rows = await db
    .select({ bristolType: bowelRecords.bristolType })
    .from(bowelRecords)
    .where(
      and(
        eq(bowelRecords.organisationId, orgId),
        eq(bowelRecords.personId, personId),
        gte(bowelRecords.recordedAt, startOfDay),
        lte(bowelRecords.recordedAt, endOfDay),
      ),
    );

  return rows.map((r) => r.bristolType);
}

// ---------------------------------------------------------------------------
// Record sleep check
// ---------------------------------------------------------------------------

export async function recordSleepCheck(
  input: RecordSleepCheckInput,
): Promise<ActionResult<SleepCheck>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    const parsed = recordSleepCheckSchema.safeParse(input);
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
      .insert(sleepChecks)
      .values({
        organisationId: orgId,
        personId: data.personId,
        checkTime: new Date(data.checkTime),
        status: data.status,
        position: data.position,
        repositioned: data.repositioned,
        nightWandering: data.nightWandering,
        bedRails: data.bedRails,
        callBellChecked: data.callBellChecked,
        notes: data.notes ?? null,
        recordedById: userId,
        recordedByName: user?.name ?? null,
      })
      .returning();

    await auditLog(
      'create',
      'sleep_check',
      entry.id,
      {
        before: null,
        after: {
          status: data.status,
          position: data.position,
          nightWandering: data.nightWandering,
          personId: data.personId,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/clinical/sleep`);
    }

    return { success: true, data: entry };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[recordSleepCheck] Error:', error);
    return { success: false, error: 'Failed to record sleep check' };
  }
}

// ---------------------------------------------------------------------------
// List sleep checks for a night (8pm-8am window)
// ---------------------------------------------------------------------------

export type SleepCheckListItem = {
  id: string;
  checkTime: Date;
  status: string;
  position: string;
  repositioned: boolean;
  nightWandering: boolean;
  bedRails: string;
  callBellChecked: boolean;
  notes: string | null;
  recordedByName: string | null;
};

export async function listSleepChecks({
  personId,
  date,
}: {
  personId: string;
  date: string;
}): Promise<SleepCheckListItem[]> {
  const { orgId } = await requirePermission('read', 'clinical');

  // Night window: 8pm previous day to 8am current day
  const nightStart = new Date(date + 'T20:00:00.000Z');
  nightStart.setDate(nightStart.getDate() - 1);
  const nightEnd = new Date(date + 'T08:00:00.000Z');

  const rows = await db
    .select({
      id: sleepChecks.id,
      checkTime: sleepChecks.checkTime,
      status: sleepChecks.status,
      position: sleepChecks.position,
      repositioned: sleepChecks.repositioned,
      nightWandering: sleepChecks.nightWandering,
      bedRails: sleepChecks.bedRails,
      callBellChecked: sleepChecks.callBellChecked,
      notes: sleepChecks.notes,
      recordedByName: sleepChecks.recordedByName,
    })
    .from(sleepChecks)
    .where(
      and(
        eq(sleepChecks.organisationId, orgId),
        eq(sleepChecks.personId, personId),
        gte(sleepChecks.checkTime, nightStart),
        lte(sleepChecks.checkTime, nightEnd),
      ),
    )
    .orderBy(sleepChecks.checkTime);

  return rows;
}

// ---------------------------------------------------------------------------
// Create pain assessment
// ---------------------------------------------------------------------------

export async function createPainAssessment(
  input: CreatePainAssessmentInput,
): Promise<ActionResult<PainAssessment>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'clinical');

    const parsed = createPainAssessmentSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Calculate total score based on tool
    let totalScore: number;
    if (data.toolUsed === 'nrs') {
      totalScore = data.nrsScore!;
    } else if (data.toolUsed === 'abbey') {
      const result = scoreAbbey(data.abbeyScores! as AbbeyScores);
      totalScore = result.totalScore;
    } else {
      const result = scorePainad(data.painadScores! as PainadScores);
      totalScore = result.totalScore;
    }

    // Get user name for denormalisation
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [assessment] = await db
      .insert(painAssessments)
      .values({
        organisationId: orgId,
        personId: data.personId,
        toolUsed: data.toolUsed,
        nrsScore: data.nrsScore ?? null,
        location: data.location ?? null,
        painType: data.painType ?? null,
        abbeyScores: data.abbeyScores ?? null,
        painadScores: data.painadScores ?? null,
        totalScore,
        notes: data.notes ?? null,
        recordedById: userId,
        recordedByName: user?.name ?? null,
        recordedAt: new Date(data.recordedAt),
      })
      .returning();

    await auditLog(
      'create',
      'pain_assessment',
      assessment.id,
      {
        before: null,
        after: {
          toolUsed: data.toolUsed,
          totalScore,
          personId: data.personId,
        },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/clinical/pain`);
    }

    return { success: true, data: assessment };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createPainAssessment] Error:', error);
    return { success: false, error: 'Failed to create pain assessment' };
  }
}

// ---------------------------------------------------------------------------
// List pain assessments for a person (paginated)
// ---------------------------------------------------------------------------

export type PainAssessmentListItem = {
  id: string;
  toolUsed: string;
  nrsScore: number | null;
  location: string | null;
  painType: string | null;
  totalScore: number;
  notes: string | null;
  recordedByName: string | null;
  recordedAt: Date;
};

export type PainAssessmentListResult = {
  assessments: PainAssessmentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listPainAssessments({
  personId,
  page = 1,
  pageSize = 20,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
}): Promise<PainAssessmentListResult> {
  const { orgId } = await requirePermission('read', 'clinical');

  const whereClause = and(
    eq(painAssessments.organisationId, orgId),
    eq(painAssessments.personId, personId),
  );
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: painAssessments.id,
        toolUsed: painAssessments.toolUsed,
        nrsScore: painAssessments.nrsScore,
        location: painAssessments.location,
        painType: painAssessments.painType,
        totalScore: painAssessments.totalScore,
        notes: painAssessments.notes,
        recordedByName: painAssessments.recordedByName,
        recordedAt: painAssessments.recordedAt,
      })
      .from(painAssessments)
      .where(whereClause)
      .orderBy(desc(painAssessments.recordedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(painAssessments).where(whereClause),
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

// ---------------------------------------------------------------------------
// Get pain trend data for charting
// ---------------------------------------------------------------------------

export type PainTrendPoint = {
  recordedAt: Date;
  toolUsed: string;
  totalScore: number;
};

export async function getPainTrends({
  personId,
  days = 30,
}: {
  personId: string;
  days?: number;
}): Promise<PainTrendPoint[]> {
  const { orgId } = await requirePermission('read', 'clinical');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await db
    .select({
      recordedAt: painAssessments.recordedAt,
      toolUsed: painAssessments.toolUsed,
      totalScore: painAssessments.totalScore,
    })
    .from(painAssessments)
    .where(
      and(
        eq(painAssessments.organisationId, orgId),
        eq(painAssessments.personId, personId),
        gte(painAssessments.recordedAt, startDate),
      ),
    )
    .orderBy(painAssessments.recordedAt);

  return rows;
}
