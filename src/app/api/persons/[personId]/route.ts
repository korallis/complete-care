/**
 * GET /api/persons/:personId — Fetch a single person by ID.
 *
 * Tenant isolation: verifies the person belongs to the active org.
 * Returns 404 if the person doesn't exist OR belongs to a different org.
 * (Using 404 rather than 403 prevents cross-tenant ID enumeration.)
 */

import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { persons } from '@/lib/db/schema';
import { assertBelongsToOrg, TenantIsolationError } from '@/lib/tenant';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ personId: string }> },
) {
  try {
    const { orgId } = await requirePermission('read', 'persons');
    const { personId } = await params;

    const [person] = await db
      .select()
      .from(persons)
      .where(
        and(
          eq(persons.id, personId),
          isNull(persons.deletedAt),
        ),
      )
      .limit(1);

    if (!person) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // TENANT ISOLATION: verify the record belongs to the active org
    assertBelongsToOrg(person.organisationId, orgId);

    return NextResponse.json({ data: person });
  } catch (error) {
    if (error instanceof TenantIsolationError) {
      // Return 404 to prevent cross-tenant ID enumeration
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('GET /api/persons/:personId error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
