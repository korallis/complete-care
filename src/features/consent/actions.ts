'use server';

/**
 * Consent Server Actions
 *
 * CRUD for consent records and photos with consent verification.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { consentRecords, photos, organisations } from '@/lib/db/schema';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';

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
// Validation schemas
// ---------------------------------------------------------------------------

const createConsentRecordSchema = z.object({
  personId: z.string().uuid(),
  consentType: z.string().min(1),
  status: z.enum(['granted', 'withdrawn']).default('granted'),
  grantedDate: z.string().min(1),
  withdrawnDate: z.string().optional(),
  givenBy: z.string().min(1),
  relationship: z.string().default('self'),
  conditions: z.string().optional(),
  reviewDate: z.string().optional(),
});

const createPhotoSchema = z.object({
  personId: z.string().uuid(),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().optional(),
  takenDate: z.string().optional(),
  consentVerified: z.boolean().default(false),
  consentRecordId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Consent Records
// ---------------------------------------------------------------------------

export async function listConsentRecords({
  personId,
  page = 1,
  pageSize = 20,
  consentType,
  status,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
  consentType?: string;
  status?: string;
}) {
  const { orgId } = await requirePermission('read', 'persons');

  const conditions = [
    eq(consentRecords.organisationId, orgId),
    eq(consentRecords.personId, personId),
  ];
  if (consentType) conditions.push(eq(consentRecords.consentType, consentType));
  if (status) conditions.push(eq(consentRecords.status, status));

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(consentRecords)
      .where(whereClause)
      .orderBy(desc(consentRecords.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(consentRecords).where(whereClause),
  ]);

  return {
    records: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function getConsentRecord(id: string) {
  const { orgId } = await requirePermission('read', 'persons');

  const [row] = await db
    .select()
    .from(consentRecords)
    .where(eq(consentRecords.id, id))
    .limit(1);

  if (!row) return null;
  assertBelongsToOrg(row.organisationId, orgId);
  return row;
}

export async function createConsentRecord(
  input: z.infer<typeof createConsentRecordSchema>,
): Promise<ActionResult<typeof consentRecords.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'persons');

    const parsed = createConsentRecordSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(consentRecords)
      .values({
        organisationId: orgId,
        personId: data.personId,
        consentType: data.consentType,
        status: data.status,
        grantedDate: data.grantedDate,
        withdrawnDate: data.withdrawnDate ?? null,
        givenBy: data.givenBy,
        relationship: data.relationship,
        conditions: data.conditions ?? null,
        recordedBy: userId,
        reviewDate: data.reviewDate ?? null,
      })
      .returning();

    await auditLog('create', 'consent_record', row.id, {
      before: null,
      after: { personId: data.personId, type: data.consentType, status: data.status },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/consent`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createConsentRecord] Error:', error);
    return { success: false, error: 'Failed to create consent record' };
  }
}

export async function updateConsentRecord(
  id: string,
  input: Partial<z.infer<typeof createConsentRecordSchema>>,
): Promise<ActionResult<typeof consentRecords.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'persons');

    const [existing] = await db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Consent record not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    const updates: Partial<typeof consentRecords.$inferInsert> = { updatedAt: new Date() };
    if (input.consentType !== undefined) updates.consentType = input.consentType;
    if (input.status !== undefined) updates.status = input.status;
    if (input.grantedDate !== undefined) updates.grantedDate = input.grantedDate;
    if (input.withdrawnDate !== undefined) updates.withdrawnDate = input.withdrawnDate ?? null;
    if (input.givenBy !== undefined) updates.givenBy = input.givenBy;
    if (input.relationship !== undefined) updates.relationship = input.relationship;
    if (input.conditions !== undefined) updates.conditions = input.conditions ?? null;
    if (input.reviewDate !== undefined) updates.reviewDate = input.reviewDate ?? null;

    const [updated] = await db
      .update(consentRecords)
      .set(updates)
      .where(eq(consentRecords.id, id))
      .returning();

    await auditLog('update', 'consent_record', id, {
      before: { status: existing.status },
      after: { status: updated.status },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/consent`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[updateConsentRecord] Error:', error);
    return { success: false, error: 'Failed to update consent record' };
  }
}

export async function withdrawConsent(
  id: string,
  withdrawnDate: string,
): Promise<ActionResult<typeof consentRecords.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'persons');

    const [existing] = await db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Consent record not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status === 'withdrawn') {
      return { success: false, error: 'Consent is already withdrawn' };
    }

    const [updated] = await db
      .update(consentRecords)
      .set({
        status: 'withdrawn',
        withdrawnDate,
        updatedAt: new Date(),
      })
      .where(eq(consentRecords.id, id))
      .returning();

    await auditLog('withdraw', 'consent_record', id, {
      before: { status: 'granted' },
      after: { status: 'withdrawn', withdrawnDate },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/consent`);

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to withdraw consent' };
  }
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export async function listPhotos({
  personId,
  page = 1,
  pageSize = 20,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
}) {
  const { orgId } = await requirePermission('read', 'persons');

  const conditions = [
    eq(photos.organisationId, orgId),
    eq(photos.personId, personId),
  ];
  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(photos)
      .where(whereClause)
      .orderBy(desc(photos.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(photos).where(whereClause),
  ]);

  return {
    photos: rows,
    totalCount: countResult[0]?.count ?? 0,
    page,
    pageSize,
  };
}

export async function createPhoto(
  input: z.infer<typeof createPhotoSchema>,
): Promise<ActionResult<typeof photos.$inferSelect>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'persons');

    const parsed = createPhotoSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
    }

    const data = parsed.data;

    const [row] = await db
      .insert(photos)
      .values({
        organisationId: orgId,
        personId: data.personId,
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl ?? null,
        caption: data.caption ?? null,
        takenDate: data.takenDate ?? null,
        uploadedBy: userId,
        consentVerified: data.consentVerified,
        consentRecordId: data.consentRecordId ?? null,
        tags: data.tags ?? [],
      })
      .returning();

    await auditLog('create', 'photo', row.id, {
      before: null,
      after: { personId: data.personId, consentVerified: data.consentVerified },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${data.personId}/photos`);

    return { success: true, data: row };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    console.error('[createPhoto] Error:', error);
    return { success: false, error: 'Failed to create photo' };
  }
}

export async function deletePhoto(id: string): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('delete', 'persons');

    const [existing] = await db
      .select()
      .from(photos)
      .where(eq(photos.id, id))
      .limit(1);

    if (!existing) return { success: false, error: 'Photo not found' };
    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(photos).where(eq(photos.id, id));

    await auditLog('delete', 'photo', id, {
      before: { personId: existing.personId },
      after: null,
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) revalidatePath(`/${slug}/persons/${existing.personId}/photos`);

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to delete photo' };
  }
}
