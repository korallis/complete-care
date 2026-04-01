/**
 * GET /api/staff — List staff profiles scoped to the active organisation.
 *
 * Tenant isolation: always filters by the user's activeOrgId.
 * Returns only staff records belonging to the authenticated user's current org.
 *
 * Query params:
 *   - status: 'active' | 'inactive' (default: 'active')
 *   - search: partial name search
 *   - page:   page number (default: 1)
 *   - limit:  items per page (default: 25, max: 100)
 */

import { NextResponse } from 'next/server';
import { and, eq, ilike, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { staffProfiles } from '@/lib/db/schema';
import { TenantIsolationError } from '@/lib/tenant';
import { requirePermission, UnauthorizedError, UnauthenticatedError } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const { orgId } = await requirePermission('read', 'staff');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'active';
    const search = searchParams.get('search') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
    const offset = (page - 1) * limit;

    const conditions = [
      // TENANT ISOLATION: always scope to the active org
      eq(staffProfiles.organisationId, orgId),
      // Exclude soft-deleted records
      isNull(staffProfiles.deletedAt),
    ];

    if (status === 'active' || status === 'inactive') {
      conditions.push(eq(staffProfiles.status, status));
    }

    if (search.trim()) {
      conditions.push(ilike(staffProfiles.fullName, `%${search.trim()}%`));
    }

    const rows = await db
      .select({
        id: staffProfiles.id,
        fullName: staffProfiles.fullName,
        jobTitle: staffProfiles.jobTitle,
        contractType: staffProfiles.contractType,
        status: staffProfiles.status,
        startDate: staffProfiles.startDate,
        createdAt: staffProfiles.createdAt,
        updatedAt: staffProfiles.updatedAt,
      })
      .from(staffProfiles)
      .where(and(...conditions))
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
    console.error('GET /api/staff error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
