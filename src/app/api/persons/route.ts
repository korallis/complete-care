/**
 * GET /api/persons — List persons scoped to the active organisation.
 * POST /api/persons — Create a new person record.
 *
 * Tenant isolation: always filters by the user's activeOrgId.
 * Returns only persons belonging to the authenticated user's current org.
 *
 * GET Query params:
 *   - status: 'active' | 'archived' (default: 'active')
 *   - search: partial name/NHS number search
 *   - type:   'resident' | 'client' | 'young_person'
 *   - page:   page number (default: 1)
 *   - limit:  items per page (default: 25, max: 100)
 */

import { NextResponse } from 'next/server';
import { and, count, eq, ilike, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { persons } from '@/lib/db/schema';
import { TenantIsolationError } from '@/lib/tenant';
import { requirePermission, UnauthorizedError, UnauthenticatedError } from '@/lib/rbac';
import { createPersonSchema } from '@/features/persons/schema';
import { auditLog } from '@/lib/audit';
import type { EmergencyContact } from '@/lib/db/schema/persons';

export async function GET(request: Request) {
  try {
    const { orgId } = await requirePermission('read', 'persons');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'active';
    const search = searchParams.get('search') ?? '';
    const type = searchParams.get('type') ?? '';
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

    if (type === 'resident' || type === 'client' || type === 'young_person') {
      conditions.push(eq(persons.type, type));
    }

    if (search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(persons.fullName, term),
          ilike(persons.nhsNumber, term),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: persons.id,
          fullName: persons.fullName,
          firstName: persons.firstName,
          lastName: persons.lastName,
          preferredName: persons.preferredName,
          type: persons.type,
          status: persons.status,
          dateOfBirth: persons.dateOfBirth,
          nhsNumber: persons.nhsNumber,
          photoUrl: persons.photoUrl,
          allergies: persons.allergies,
          createdAt: persons.createdAt,
          updatedAt: persons.updatedAt,
        })
        .from(persons)
        .where(whereClause)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(persons).where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      data: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
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
    console.error('GET /api/persons error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { orgId, userId } = await requirePermission('create', 'persons');

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = createPersonSchema.safeParse(body);
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

    const data = parsed.data;
    const fullName = `${data.firstName} ${data.lastName}`.trim();

    const [person] = await db
      .insert(persons)
      .values({
        organisationId: orgId,
        fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        preferredName: data.preferredName ?? null,
        type: data.type,
        status: 'active',
        dateOfBirth: data.dateOfBirth ?? null,
        gender: data.gender ?? null,
        ethnicity: data.ethnicity ?? null,
        religion: data.religion ?? null,
        firstLanguage: data.firstLanguage ?? null,
        nhsNumber: data.nhsNumber ?? null,
        gpName: data.gpName ?? null,
        gpPractice: data.gpPractice ?? null,
        allergies: data.allergies ?? [],
        medicalConditions: data.medicalConditions ?? [],
        contactPhone: data.contactPhone ?? null,
        contactEmail: data.contactEmail ?? null,
        address: data.address ?? null,
        emergencyContacts: (data.emergencyContacts ?? []) as EmergencyContact[],
        photoUrl: data.photoUrl ?? null,
      })
      .returning();

    await auditLog(
      'create',
      'person',
      person.id,
      { before: null, after: { fullName, type: data.type } },
      { userId, organisationId: orgId },
    );

    return NextResponse.json({ data: person }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('POST /api/persons error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
