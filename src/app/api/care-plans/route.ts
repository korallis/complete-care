/**
 * GET /api/care-plans — List care plans scoped to the active organisation.
 *
 * Tenant isolation: always filters by the user's activeOrgId.
 * Returns only care plans belonging to persons in the authenticated user's org.
 *
 * Query params:
 *   - personId: filter by specific person (must belong to active org)
 *   - status:   'draft' | 'active' | 'reviewed' | 'archived'
 *   - page:     page number (default: 1)
 *   - limit:    items per page (default: 25, max: 100)
 */

import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { carePlans } from '@/lib/db/schema';
import { TenantIsolationError } from '@/lib/tenant';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const { orgId } = await requirePermission('read', 'care_plans');

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '25', 10)));
    const offset = (page - 1) * limit;

    const conditions = [
      // TENANT ISOLATION: always scope to the active org
      eq(carePlans.organisationId, orgId),
      // Exclude soft-deleted records
      isNull(carePlans.deletedAt),
    ];

    if (personId) {
      conditions.push(eq(carePlans.personId, personId));
    }

    if (status) {
      conditions.push(eq(carePlans.status, status));
    }

    const rows = await db
      .select({
        id: carePlans.id,
        personId: carePlans.personId,
        title: carePlans.title,
        status: carePlans.status,
        version: carePlans.version,
        nextReviewDate: carePlans.nextReviewDate,
        createdAt: carePlans.createdAt,
        updatedAt: carePlans.updatedAt,
      })
      .from(carePlans)
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
    console.error('GET /api/care-plans error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
