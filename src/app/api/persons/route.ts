/**
 * GET /api/persons — List persons scoped to the active organisation.
 *
 * Tenant isolation: always filters by the user's activeOrgId.
 * Returns only persons belonging to the authenticated user's current org.
 *
 * Query params:
 *   - status: 'active' | 'archived' (default: 'active')
 *   - search: partial name search
 *   - page:   page number (default: 1)
 *   - limit:  items per page (default: 25, max: 100)
 */

import { NextResponse } from 'next/server';
import { and, eq, ilike, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { persons } from '@/lib/db/schema';
import { TenantIsolationError } from '@/lib/tenant';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const { orgId } = await requirePermission('read', 'persons');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'active';
    const search = searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
    const offset = (page - 1) * limit;

    const conditions = [
      // TENANT ISOLATION: always scope to the active org
      eq(persons.organisationId, orgId),
      // Exclude soft-deleted records
      isNull(persons.deletedAt),
    ];

    if (status === 'active' || status === 'archived') {
      conditions.push(eq(persons.status, status));
    }

    if (search.trim()) {
      conditions.push(ilike(persons.fullName, `%${search.trim()}%`));
    }

    const rows = await db
      .select({
        id: persons.id,
        fullName: persons.fullName,
        type: persons.type,
        status: persons.status,
        dateOfBirth: persons.dateOfBirth,
        createdAt: persons.createdAt,
        updatedAt: persons.updatedAt,
      })
      .from(persons)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: rows,
      meta: { page, limit, total: rows.length },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof TenantIsolationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error instanceof TenantIsolationError ? 404 : 403 },
      );
    }
    console.error('GET /api/persons error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
