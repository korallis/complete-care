/**
 * GET /api/care-plans/:planId — Fetch a single care plan by ID.
 *
 * Tenant isolation: verifies the care plan belongs to the active org.
 * Returns 404 if the care plan doesn't exist OR belongs to a different org.
 */

import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { carePlans } from '@/lib/db/schema';
import { assertBelongsToOrg, TenantIsolationError } from '@/lib/tenant';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  try {
    const { orgId } = await requirePermission('read', 'care_plans');
    const { planId } = await params;

    const [plan] = await db
      .select()
      .from(carePlans)
      .where(
        and(
          eq(carePlans.id, planId),
          isNull(carePlans.deletedAt),
        ),
      )
      .limit(1);

    if (!plan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // TENANT ISOLATION: verify the record belongs to the active org
    assertBelongsToOrg(plan.organisationId, orgId);

    return NextResponse.json({ data: plan });
  } catch (error) {
    if (error instanceof TenantIsolationError) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('GET /api/care-plans/:planId error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
