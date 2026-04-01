'use server';

/**
 * Care Notes Server Actions
 *
 * CRUD for structured daily care notes.
 * Notes are immutable once created (regulatory requirement) — no update/delete.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, gte, lte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { careNotes, organisations, users, persons } from '@/lib/db/schema';
import type { CareNote } from '@/lib/db/schema/care-notes';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import { createCareNoteSchema, careNoteFilterSchema } from './schema';
import type { CreateCareNoteInput } from './schema';

// Re-export for external use
export type { CreateCareNoteInput } from './schema';

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
// List care notes (timeline) with filters + pagination
// ---------------------------------------------------------------------------

export type CareNoteListItem = {
  id: string;
  personId: string;
  authorId: string | null;
  authorName: string | null;
  noteType: string;
  shift: string | null;
  content: string;
  mood: string | null;
  personalCare: CareNote['personalCare'];
  nutrition: CareNote['nutrition'];
  mobility: string | null;
  health: string | null;
  handover: string | null;
  createdAt: Date;
};

export type CareNoteListResult = {
  notes: CareNoteListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listCareNotes(
  filters: Record<string, unknown>,
): Promise<CareNoteListResult> {
  const { orgId } = await requirePermission('read', 'notes');

  const parsed = careNoteFilterSchema.safeParse(filters);
  const f = parsed.success ? parsed.data : { page: 1, pageSize: 25 };

  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(careNotes.organisationId, orgId)];

  if (f.personId) {
    conditions.push(eq(careNotes.personId, f.personId));
  }

  if (f.authorId) {
    conditions.push(eq(careNotes.authorId, f.authorId));
  }

  if (f.shift) {
    conditions.push(eq(careNotes.shift, f.shift));
  }

  if (f.noteType) {
    conditions.push(eq(careNotes.noteType, f.noteType));
  }

  if (f.dateFrom) {
    conditions.push(gte(careNotes.createdAt, new Date(f.dateFrom)));
  }

  if (f.dateTo) {
    // Include the entire end date
    const endDate = new Date(f.dateTo);
    endDate.setDate(endDate.getDate() + 1);
    conditions.push(lte(careNotes.createdAt, endDate));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: careNotes.id,
        personId: careNotes.personId,
        authorId: careNotes.authorId,
        authorName: careNotes.authorName,
        noteType: careNotes.noteType,
        shift: careNotes.shift,
        content: careNotes.content,
        mood: careNotes.mood,
        personalCare: careNotes.personalCare,
        nutrition: careNotes.nutrition,
        mobility: careNotes.mobility,
        health: careNotes.health,
        handover: careNotes.handover,
        createdAt: careNotes.createdAt,
      })
      .from(careNotes)
      .where(whereClause)
      .orderBy(desc(careNotes.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(careNotes).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    notes: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single care note
// ---------------------------------------------------------------------------

export async function getCareNote(
  noteId: string,
): Promise<CareNote | null> {
  const { orgId } = await requirePermission('read', 'notes');

  const [note] = await db
    .select()
    .from(careNotes)
    .where(eq(careNotes.id, noteId))
    .limit(1);

  if (!note) return null;

  assertBelongsToOrg(note.organisationId, orgId);

  return note;
}

// ---------------------------------------------------------------------------
// Create care note
// ---------------------------------------------------------------------------

export async function createCareNote(
  input: CreateCareNoteInput,
): Promise<ActionResult<CareNote>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'notes');

    // 1. Validate input
    const parsed = createCareNoteSchema.safeParse(input);
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

    // 3. Get author name for denormalised display
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // 4. Insert the care note
    const [note] = await db
      .insert(careNotes)
      .values({
        organisationId: orgId,
        personId: data.personId,
        authorId: userId,
        authorName: user?.name ?? null,
        noteType: data.noteType ?? 'daily',
        shift: data.shift ?? null,
        content: data.content,
        mood: data.mood ?? null,
        personalCare: data.personalCare ?? null,
        nutrition: data.nutrition ?? null,
        mobility: data.mobility ?? null,
        health: data.health ?? null,
        handover: data.handover ?? null,
      })
      .returning();

    // 5. Audit log
    await auditLog('create', 'care_note', note.id, {
      before: null,
      after: {
        personId: data.personId,
        noteType: data.noteType,
        shift: data.shift,
        mood: data.mood,
      },
    }, { userId, organisationId: orgId });

    // 6. Revalidate
    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/care-notes`);
    }

    return { success: true, data: note };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createCareNote] Error:', error);
    return { success: false, error: 'Failed to create care note' };
  }
}
