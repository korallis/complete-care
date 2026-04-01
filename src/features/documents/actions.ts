'use server';

/**
 * Documents & Body Map Server Actions
 *
 * CRUD for document management and body map entries.
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  documents,
  bodyMapEntries,
  organisations,
  users,
  persons,
} from '@/lib/db/schema';
import type { Document } from '@/lib/db/schema/documents';
import type { BodyMapEntry } from '@/lib/db/schema/documents';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  documentFilterSchema,
  createBodyMapEntrySchema,
  bodyMapFilterSchema,
} from './schema';
import type {
  UploadDocumentInput,
  UpdateDocumentInput,
  CreateBodyMapEntryInput,
} from './schema';

// Re-export types for external use
export type { UploadDocumentInput, UpdateDocumentInput, CreateBodyMapEntryInput } from './schema';

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

// ============================================================================
// DOCUMENTS
// ============================================================================

// ---------------------------------------------------------------------------
// List documents with filters + pagination
// ---------------------------------------------------------------------------

export type DocumentListItem = {
  id: string;
  personId: string | null;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  category: string;
  version: number;
  retentionPolicy: string;
  storageUrl: string;
  uploadedById: string | null;
  uploadedByName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentListResult = {
  documents: DocumentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listDocuments(
  filters: Record<string, unknown>,
): Promise<DocumentListResult> {
  const { orgId } = await requirePermission('read', 'documents');

  const parsed = documentFilterSchema.safeParse(filters);
  const f = parsed.success ? parsed.data : { page: 1, pageSize: 25 };

  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(documents.organisationId, orgId),
    isNull(documents.deletedAt),
  ];

  if (f.personId) {
    conditions.push(eq(documents.personId, f.personId));
  }

  if (f.category) {
    conditions.push(eq(documents.category, f.category));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: documents.id,
        personId: documents.personId,
        name: documents.name,
        fileName: documents.fileName,
        fileType: documents.fileType,
        fileSize: documents.fileSize,
        category: documents.category,
        version: documents.version,
        retentionPolicy: documents.retentionPolicy,
        storageUrl: documents.storageUrl,
        uploadedById: documents.uploadedById,
        uploadedByName: documents.uploadedByName,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(whereClause)
      .orderBy(desc(documents.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(documents).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    documents: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single document
// ---------------------------------------------------------------------------

export async function getDocument(documentId: string): Promise<Document | null> {
  const { orgId } = await requirePermission('read', 'documents');

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), isNull(documents.deletedAt)))
    .limit(1);

  if (!doc) return null;

  assertBelongsToOrg(doc.organisationId, orgId);

  return doc;
}

// ---------------------------------------------------------------------------
// Upload (create) document
// ---------------------------------------------------------------------------

export async function uploadDocument(
  input: UploadDocumentInput,
): Promise<ActionResult<Document>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'documents');

    // 1. Validate input
    const parsed = uploadDocumentSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // 2. Verify person belongs to this org (tenant isolation)
    const [person] = await db
      .select({ id: persons.id })
      .from(persons)
      .where(
        and(
          eq(persons.id, data.personId),
          eq(persons.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!person) {
      return { success: false, error: 'Person not found' };
    }

    // 3. Get uploader name for denormalised display
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // 4. Insert the document
    const [doc] = await db
      .insert(documents)
      .values({
        organisationId: orgId,
        personId: data.personId,
        uploadedById: userId,
        uploadedByName: user?.name ?? null,
        name: data.name,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize ?? null,
        category: data.category ?? 'other',
        version: 1,
        retentionPolicy: data.retentionPolicy ?? 'standard',
        storageUrl: data.storageUrl,
        storageKey: data.storageKey ?? null,
      })
      .returning();

    // 5. Audit log
    await auditLog('create', 'document', doc.id, {
      before: null,
      after: {
        personId: data.personId,
        name: data.name,
        category: data.category,
        fileName: data.fileName,
      },
    }, { userId, organisationId: orgId });

    // 6. Revalidate
    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/documents`);
    }

    return { success: true, data: doc };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[uploadDocument] Error:', error);
    return { success: false, error: 'Failed to upload document' };
  }
}

// ---------------------------------------------------------------------------
// Update document metadata
// ---------------------------------------------------------------------------

export async function updateDocument(
  documentId: string,
  input: UpdateDocumentInput,
): Promise<ActionResult<Document>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'documents');

    const parsed = updateDocumentSchema.safeParse(input);
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
      .from(documents)
      .where(and(eq(documents.id, documentId), isNull(documents.deletedAt)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Document not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof documents.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updates.name = data.name;
    if (data.category !== undefined) updates.category = data.category;
    if (data.retentionPolicy !== undefined) updates.retentionPolicy = data.retentionPolicy;

    const [updated] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, documentId))
      .returning();

    await auditLog('update', 'document', documentId, {
      before: { name: existing.name, category: existing.category },
      after: { name: updated.name, category: updated.category },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/documents`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateDocument] Error:', error);
    return { success: false, error: 'Failed to update document' };
  }
}

// ---------------------------------------------------------------------------
// Delete document (soft delete)
// ---------------------------------------------------------------------------

export async function deleteDocument(
  documentId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('delete', 'documents');

    const [existing] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), isNull(documents.deletedAt)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Document not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db
      .update(documents)
      .set({ deletedAt: new Date() })
      .where(eq(documents.id, documentId));

    await auditLog('delete', 'document', documentId, {
      before: { name: existing.name, category: existing.category },
      after: null,
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/documents`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteDocument] Error:', error);
    return { success: false, error: 'Failed to delete document' };
  }
}

// ============================================================================
// BODY MAP ENTRIES
// ============================================================================

// ---------------------------------------------------------------------------
// List body map entries with filters
// ---------------------------------------------------------------------------

export type BodyMapEntryListItem = {
  id: string;
  personId: string;
  bodyRegion: string;
  side: string;
  xPercent: number;
  yPercent: number;
  entryType: string;
  description: string;
  dateObserved: string;
  linkedIncidentId: string | null;
  createdById: string | null;
  createdByName: string | null;
  createdAt: Date;
};

export type BodyMapEntryListResult = {
  entries: BodyMapEntryListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listBodyMapEntries(
  filters: Record<string, unknown>,
): Promise<BodyMapEntryListResult> {
  const { orgId } = await requirePermission('read', 'documents');

  const parsed = bodyMapFilterSchema.safeParse(filters);
  const f = parsed.success ? parsed.data : { page: 1, pageSize: 50 };

  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 50;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(bodyMapEntries.organisationId, orgId)];

  if (f.personId) {
    conditions.push(eq(bodyMapEntries.personId, f.personId));
  }

  if (f.entryType) {
    conditions.push(eq(bodyMapEntries.entryType, f.entryType));
  }

  if (f.side) {
    conditions.push(eq(bodyMapEntries.side, f.side));
  }

  if (f.dateFrom) {
    conditions.push(gte(bodyMapEntries.dateObserved, f.dateFrom));
  }

  if (f.dateTo) {
    conditions.push(lte(bodyMapEntries.dateObserved, f.dateTo));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: bodyMapEntries.id,
        personId: bodyMapEntries.personId,
        bodyRegion: bodyMapEntries.bodyRegion,
        side: bodyMapEntries.side,
        xPercent: bodyMapEntries.xPercent,
        yPercent: bodyMapEntries.yPercent,
        entryType: bodyMapEntries.entryType,
        description: bodyMapEntries.description,
        dateObserved: bodyMapEntries.dateObserved,
        linkedIncidentId: bodyMapEntries.linkedIncidentId,
        createdById: bodyMapEntries.createdById,
        createdByName: bodyMapEntries.createdByName,
        createdAt: bodyMapEntries.createdAt,
      })
      .from(bodyMapEntries)
      .where(whereClause)
      .orderBy(desc(bodyMapEntries.dateObserved))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(bodyMapEntries).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    entries: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Create body map entry
// ---------------------------------------------------------------------------

export async function createBodyMapEntry(
  input: CreateBodyMapEntryInput,
): Promise<ActionResult<BodyMapEntry>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'documents');

    // 1. Validate input
    const parsed = createBodyMapEntrySchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // 2. Verify person belongs to this org (tenant isolation)
    const [person] = await db
      .select({ id: persons.id })
      .from(persons)
      .where(
        and(
          eq(persons.id, data.personId),
          eq(persons.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!person) {
      return { success: false, error: 'Person not found' };
    }

    // 3. Get creator name for denormalised display
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // 4. Insert the body map entry
    const [entry] = await db
      .insert(bodyMapEntries)
      .values({
        organisationId: orgId,
        personId: data.personId,
        bodyRegion: data.bodyRegion,
        side: data.side ?? 'front',
        xPercent: data.xPercent,
        yPercent: data.yPercent,
        entryType: data.entryType ?? 'mark',
        description: data.description,
        dateObserved: data.dateObserved,
        linkedIncidentId: data.linkedIncidentId ?? null,
        createdById: userId,
        createdByName: user?.name ?? null,
      })
      .returning();

    // 5. Audit log
    await auditLog('create', 'body_map_entry', entry.id, {
      before: null,
      after: {
        personId: data.personId,
        bodyRegion: data.bodyRegion,
        entryType: data.entryType,
        side: data.side,
        dateObserved: data.dateObserved,
      },
    }, { userId, organisationId: orgId });

    // 6. Revalidate
    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/body-map`);
    }

    return { success: true, data: entry };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createBodyMapEntry] Error:', error);
    return { success: false, error: 'Failed to create body map entry' };
  }
}

// ---------------------------------------------------------------------------
// Delete body map entry
// ---------------------------------------------------------------------------

export async function deleteBodyMapEntry(
  entryId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('delete', 'documents');

    const [existing] = await db
      .select()
      .from(bodyMapEntries)
      .where(eq(bodyMapEntries.id, entryId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Body map entry not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(bodyMapEntries).where(eq(bodyMapEntries.id, entryId));

    await auditLog('delete', 'body_map_entry', entryId, {
      before: {
        bodyRegion: existing.bodyRegion,
        entryType: existing.entryType,
        description: existing.description,
      },
      after: null,
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/body-map`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteBodyMapEntry] Error:', error);
    return { success: false, error: 'Failed to delete body map entry' };
  }
}
