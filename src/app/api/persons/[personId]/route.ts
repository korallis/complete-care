/**
 * GET /api/persons/:personId — Fetch a single person by ID.
 * PUT /api/persons/:personId — Update a person record (requires update:persons permission).
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
import { requirePermission, UnauthorizedError, UnauthenticatedError } from '@/lib/rbac';
import { updatePersonSchema } from '@/features/persons/schema';
import { auditLog } from '@/lib/audit';
import type { EmergencyContact } from '@/lib/db/schema/persons';

// ---------------------------------------------------------------------------
// GET /api/persons/:personId
// ---------------------------------------------------------------------------

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
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('GET /api/persons/:personId error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/persons/:personId
// ---------------------------------------------------------------------------

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ personId: string }> },
) {
  try {
    // Requires update permission on persons — 403 for carer/viewer/unauthorized
    const { orgId, userId } = await requirePermission('update', 'persons');
    const { personId } = await params;

    // Parse and validate the request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = updatePersonSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          acc[issue.path.join('.')] = issue.message;
          return acc;
        },
        {},
      );
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 422 });
    }

    // Fetch the existing person to verify ownership
    const [existing] = await db
      .select()
      .from(persons)
      .where(
        and(
          eq(persons.id, personId),
          isNull(persons.deletedAt),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // TENANT ISOLATION
    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof persons.$inferInsert> = {};

    if (data.firstName !== undefined) updates.firstName = data.firstName;
    if (data.lastName !== undefined) updates.lastName = data.lastName;
    if (data.preferredName !== undefined) updates.preferredName = data.preferredName;
    if (data.type !== undefined) updates.type = data.type;
    if (data.status !== undefined) updates.status = data.status;
    if (data.dateOfBirth !== undefined) updates.dateOfBirth = data.dateOfBirth;
    if (data.gender !== undefined) updates.gender = data.gender;
    if (data.ethnicity !== undefined) updates.ethnicity = data.ethnicity;
    if (data.religion !== undefined) updates.religion = data.religion;
    if (data.firstLanguage !== undefined) updates.firstLanguage = data.firstLanguage;
    if (data.nhsNumber !== undefined) updates.nhsNumber = data.nhsNumber;
    if (data.gpName !== undefined) updates.gpName = data.gpName;
    if (data.gpPractice !== undefined) updates.gpPractice = data.gpPractice;
    if (data.allergies !== undefined) updates.allergies = data.allergies;
    if (data.medicalConditions !== undefined) updates.medicalConditions = data.medicalConditions;
    if (data.contactPhone !== undefined) updates.contactPhone = data.contactPhone;
    if (data.contactEmail !== undefined) updates.contactEmail = data.contactEmail;
    if (data.address !== undefined) updates.address = data.address;
    if (data.emergencyContacts !== undefined) updates.emergencyContacts = data.emergencyContacts as EmergencyContact[];
    if (data.photoUrl !== undefined) updates.photoUrl = data.photoUrl;

    // Recompute fullName if first/last name changed
    const newFirst = data.firstName ?? existing.firstName;
    const newLast = data.lastName ?? existing.lastName;
    if (data.firstName !== undefined || data.lastName !== undefined) {
      updates.fullName = `${newFirst ?? ''} ${newLast ?? ''}`.trim();
    }

    updates.updatedAt = new Date();

    // Apply updates
    const [updated] = await db
      .update(persons)
      .set(updates)
      .where(eq(persons.id, personId))
      .returning();

    // Audit log
    await auditLog(
      'update',
      'person',
      personId,
      { before: Object.fromEntries(Object.keys(updates).map((k) => [k, existing[k as keyof typeof existing]])), after: updates },
      { userId, organisationId: orgId },
    );

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof TenantIsolationError) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Insufficient permissions', message: error.message },
        { status: 403 },
      );
    }
    console.error('PUT /api/persons/:personId error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
