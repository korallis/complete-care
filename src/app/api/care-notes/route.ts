/**
 * GET /api/care-notes — List care notes scoped to the active organisation.
 *
 * Tenant isolation: always filters by the user's activeOrgId.
 * Returns only care notes belonging to persons in the authenticated user's org.
 *
 * Query params:
 *   - personId: filter by specific person (must belong to active org)
 *   - noteType: 'daily' | 'handover' | 'incident' | 'safeguarding' | 'medical'
 *   - shift:    'morning' | 'afternoon' | 'evening' | 'night' | 'waking_night'
 *   - authorId: filter by author
 *   - dateFrom: ISO date string (YYYY-MM-DD)
 *   - dateTo:   ISO date string (YYYY-MM-DD)
 *   - page:     page number (default: 1)
 *   - limit:    items per page (default: 25, max: 100)
 */

import { NextResponse } from 'next/server';
import { and, eq, desc, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { careNotes, persons } from '@/lib/db/schema';
import { TenantIsolationError } from '@/lib/tenant';
import { requirePermission, UnauthorizedError, UnauthenticatedError } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const { orgId } = await requirePermission('read', 'notes');

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');
    const noteType = searchParams.get('noteType');
    const shift = searchParams.get('shift');
    const authorId = searchParams.get('authorId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
    const offset = (page - 1) * limit;

    const conditions = [
      // TENANT ISOLATION: always scope to the active org
      eq(careNotes.organisationId, orgId),
    ];

    if (personId) {
      // Validate the person belongs to the active org (prevent cross-org enumeration)
      const [personCheck] = await db
        .select({ id: persons.id })
        .from(persons)
        .where(
          and(
            eq(persons.id, personId),
            eq(persons.organisationId, orgId),
          ),
        )
        .limit(1);

      if (!personCheck) {
        return NextResponse.json({ error: 'Person not found' }, { status: 404 });
      }

      conditions.push(eq(careNotes.personId, personId));
    }

    if (noteType) {
      conditions.push(eq(careNotes.noteType, noteType));
    }

    if (shift) {
      conditions.push(eq(careNotes.shift, shift));
    }

    if (authorId) {
      conditions.push(eq(careNotes.authorId, authorId));
    }

    if (dateFrom) {
      conditions.push(gte(careNotes.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(careNotes.createdAt, endDate));
    }

    const rows = await db
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
        shiftPeriod: careNotes.shiftPeriod,
        createdAt: careNotes.createdAt,
      })
      .from(careNotes)
      .where(and(...conditions))
      .orderBy(desc(careNotes.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: rows,
      meta: { page, limit, total: rows.length },
    });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof UnauthorizedError || error instanceof TenantIsolationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof TenantIsolationError ? 404 : 403 },
      );
    }
    console.error('GET /api/care-notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
