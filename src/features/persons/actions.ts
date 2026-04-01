'use server';

/**
 * Person Management Server Actions
 *
 * Full CRUD for care recipients (residents / clients / young people).
 * All actions are tenant-scoped and RBAC-protected.
 *
 * Domain-aware terminology:
 * - domiciliary care: "Client"
 * - supported living: "Person Supported"
 * - children's residential: "Young Person"
 */

import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { persons, organisations } from '@/lib/db/schema';
import type { EmergencyContact } from '@/lib/db/schema/persons';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import type { Person } from '@/lib/db/schema/persons';
import { createPersonSchema, updatePersonSchema } from './schema';
import type { CreatePersonInput, UpdatePersonInput } from './schema';

// Re-export types for external use
export type { CreatePersonInput, UpdatePersonInput } from './schema';

// Domain-aware terminology lives in ./utils.ts (pure functions)
// Import directly from there instead of through this server actions file.

// ---------------------------------------------------------------------------
// List persons
// ---------------------------------------------------------------------------

export type PersonListItem = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  type: string;
  status: string;
  dateOfBirth: string | null;
  photoUrl: string | null;
  nhsNumber: string | null;
  allergies: string[];
  createdAt: Date;
};

export type PersonListResult = {
  persons: PersonListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listPersons({
  page = 1,
  pageSize = 25,
  search = '',
  status = 'active',
  type,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'active' | 'archived' | 'all';
  type?: 'resident' | 'client' | 'young_person';
} = {}): Promise<PersonListResult> {
  const { orgId } = await requirePermission('read', 'persons');

  const conditions = [
    eq(persons.organisationId, orgId),
    isNull(persons.deletedAt),
  ];

  if (status !== 'all') {
    conditions.push(eq(persons.status, status));
  }

  if (type) {
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
  const offset = (page - 1) * pageSize;

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
        photoUrl: persons.photoUrl,
        nhsNumber: persons.nhsNumber,
        allergies: persons.allergies,
        createdAt: persons.createdAt,
      })
      .from(persons)
      .where(whereClause)
      .orderBy(desc(persons.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(persons).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    persons: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single person
// ---------------------------------------------------------------------------

export async function getPerson(personId: string): Promise<Person | null> {
  const { orgId } = await requirePermission('read', 'persons');

  const [person] = await db
    .select()
    .from(persons)
    .where(and(eq(persons.id, personId), isNull(persons.deletedAt)))
    .limit(1);

  if (!person) return null;

  assertBelongsToOrg(person.organisationId, orgId);

  return person;
}

// ---------------------------------------------------------------------------
// Create person
// ---------------------------------------------------------------------------

export async function createPerson(
  input: CreatePersonInput,
): Promise<ActionResult<Person>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'persons');

    const parsed = createPersonSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
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

    await auditLog('create', 'person', person.id, { before: null, after: { fullName, type: data.type } }, { userId, organisationId: orgId });

    // Revalidate list page
    const memberships = await db
      .select({ slug: organisations.slug })
      .from(organisations)
      .where(eq(organisations.id, orgId))
      .limit(1);

    if (memberships[0]) {
      revalidatePath(`/${memberships[0].slug}/persons`);
    }

    return { success: true, data: person };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createPerson] Error:', error);
    return { success: false, error: 'Failed to create person record' };
  }
}

// ---------------------------------------------------------------------------
// Update person
// ---------------------------------------------------------------------------

export async function updatePerson(
  personId: string,
  input: UpdatePersonInput,
): Promise<ActionResult<Person>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'persons');

    const parsed = updatePersonSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(persons)
      .where(and(eq(persons.id, personId), isNull(persons.deletedAt)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Person not found' };
    }

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

    const [updated] = await db
      .update(persons)
      .set(updates)
      .where(eq(persons.id, personId))
      .returning();

    await auditLog(
      'update',
      'person',
      personId,
      { before: { ...Object.fromEntries(Object.keys(updates).map((k) => [k, existing[k as keyof typeof existing]])) }, after: updates },
      { userId, organisationId: orgId },
    );

    const memberships = await db
      .select({ slug: organisations.slug })
      .from(organisations)
      .where(eq(organisations.id, orgId))
      .limit(1);

    if (memberships[0]) {
      revalidatePath(`/${memberships[0].slug}/persons`);
      revalidatePath(`/${memberships[0].slug}/persons/${personId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updatePerson] Error:', error);
    return { success: false, error: 'Failed to update person record' };
  }
}

// ---------------------------------------------------------------------------
// Archive person
// ---------------------------------------------------------------------------

export async function archivePerson(
  personId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'persons');

    const [existing] = await db
      .select()
      .from(persons)
      .where(and(eq(persons.id, personId), isNull(persons.deletedAt)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Person not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status === 'archived') {
      return { success: false, error: 'Person is already archived' };
    }

    await db
      .update(persons)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(persons.id, personId));

    await auditLog(
      'archive',
      'person',
      personId,
      { before: { status: 'active' }, after: { status: 'archived' } },
      { userId, organisationId: orgId },
    );

    const memberships = await db
      .select({ slug: organisations.slug })
      .from(organisations)
      .where(eq(organisations.id, orgId))
      .limit(1);

    if (memberships[0]) {
      revalidatePath(`/${memberships[0].slug}/persons`);
      revalidatePath(`/${memberships[0].slug}/persons/${personId}`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[archivePerson] Error:', error);
    return { success: false, error: 'Failed to archive person record' };
  }
}

// ---------------------------------------------------------------------------
// Restore (unarchive) person
// ---------------------------------------------------------------------------

export async function restorePerson(
  personId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'persons');

    const [existing] = await db
      .select()
      .from(persons)
      .where(and(eq(persons.id, personId), isNull(persons.deletedAt)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Person not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db
      .update(persons)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(persons.id, personId));

    await auditLog(
      'restore',
      'person',
      personId,
      { before: { status: 'archived' }, after: { status: 'active' } },
      { userId, organisationId: orgId },
    );

    const memberships = await db
      .select({ slug: organisations.slug })
      .from(organisations)
      .where(eq(organisations.id, orgId))
      .limit(1);

    if (memberships[0]) {
      revalidatePath(`/${memberships[0].slug}/persons`);
      revalidatePath(`/${memberships[0].slug}/persons/${personId}`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[restorePerson] Error:', error);
    return { success: false, error: 'Failed to restore person record' };
  }
}
