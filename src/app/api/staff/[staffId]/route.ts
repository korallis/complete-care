/**
 * GET /api/staff/:staffId — Fetch a single staff profile by ID.
 *
 * Tenant isolation: verifies the staff profile belongs to the active org.
 * Returns 404 if the profile doesn't exist OR belongs to a different org.
 */

import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { staffProfiles } from '@/lib/db/schema';
import { assertBelongsToOrg, TenantIsolationError } from '@/lib/tenant';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ staffId: string }> },
) {
  try {
    const { orgId } = await requirePermission('read', 'staff');
    const { staffId } = await params;

    const [profile] = await db
      .select()
      .from(staffProfiles)
      .where(
        and(
          eq(staffProfiles.id, staffId),
          isNull(staffProfiles.deletedAt),
        ),
      )
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // TENANT ISOLATION: verify the record belongs to the active org
    assertBelongsToOrg(profile.organisationId, orgId);

    return NextResponse.json({ data: profile });
  } catch (error) {
    if (error instanceof TenantIsolationError) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('GET /api/staff/:staffId error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
