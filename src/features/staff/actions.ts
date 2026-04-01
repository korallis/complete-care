'use server';

/**
 * Staff Profile Server Actions
 *
 * Full CRUD for staff employment records within an organisation.
 * Includes status management with transition validation and employment history.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { staffProfiles, organisations } from '@/lib/db/schema';
import type { StaffProfile, EmploymentHistoryEntry } from '@/lib/db/schema/staff-profiles';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  isValidStatusTransition,
} from './schema';
import type {
  CreateStaffInput,
  UpdateStaffInput,
  UpdateStaffStatusInput,
  StaffStatus,
} from './schema';

// Re-export for external use
export type { CreateStaffInput, UpdateStaffInput, UpdateStaffStatusInput } from './schema';

// ---------------------------------------------------------------------------
// Helper: get org slug for revalidation
// ---------------------------------------------------------------------------

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

// ---------------------------------------------------------------------------
// List staff profiles
// ---------------------------------------------------------------------------

export type StaffListItem = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  jobTitle: string;
  contractType: string;
  status: string;
  startDate: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
};

export type StaffListResult = {
  staff: StaffListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listStaff({
  page = 1,
  pageSize = 25,
  search = '',
  status = 'active',
  contractType,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: StaffStatus | 'all';
  contractType?: string;
} = {}): Promise<StaffListResult> {
  const { orgId } = await requirePermission('read', 'staff');

  const conditions = [
    eq(staffProfiles.organisationId, orgId),
    isNull(staffProfiles.deletedAt),
  ];

  if (status !== 'all') {
    conditions.push(eq(staffProfiles.status, status));
  }

  if (contractType) {
    conditions.push(eq(staffProfiles.contractType, contractType));
  }

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(staffProfiles.fullName, term),
        ilike(staffProfiles.jobTitle, term),
        ilike(staffProfiles.email, term),
      )!,
    );
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: staffProfiles.id,
        fullName: staffProfiles.fullName,
        firstName: staffProfiles.firstName,
        lastName: staffProfiles.lastName,
        jobTitle: staffProfiles.jobTitle,
        contractType: staffProfiles.contractType,
        status: staffProfiles.status,
        startDate: staffProfiles.startDate,
        email: staffProfiles.email,
        phone: staffProfiles.phone,
        createdAt: staffProfiles.createdAt,
      })
      .from(staffProfiles)
      .where(whereClause)
      .orderBy(desc(staffProfiles.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(staffProfiles).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    staff: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single staff profile
// ---------------------------------------------------------------------------

export async function getStaffProfile(
  staffId: string,
): Promise<StaffProfile | null> {
  const { orgId } = await requirePermission('read', 'staff');

  const [profile] = await db
    .select()
    .from(staffProfiles)
    .where(and(eq(staffProfiles.id, staffId), isNull(staffProfiles.deletedAt)))
    .limit(1);

  if (!profile) return null;

  assertBelongsToOrg(profile.organisationId, orgId);

  return profile;
}

// ---------------------------------------------------------------------------
// Create staff profile
// ---------------------------------------------------------------------------

export async function createStaffProfile(
  input: CreateStaffInput,
): Promise<ActionResult<StaffProfile>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'staff');

    const parsed = createStaffSchema.safeParse(input);
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

    const [profile] = await db
      .insert(staffProfiles)
      .values({
        organisationId: orgId,
        fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        jobTitle: data.jobTitle,
        contractType: data.contractType ?? 'full_time',
        weeklyHours: data.weeklyHours != null ? String(data.weeklyHours) : null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        niNumber: data.niNumber || null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        emergencyContactName: data.emergencyContactName ?? null,
        emergencyContactPhone: data.emergencyContactPhone ?? null,
        emergencyContactRelation: data.emergencyContactRelation ?? null,
        userId: data.userId ?? null,
        status: 'active',
        employmentHistory: [],
      })
      .returning();

    await auditLog(
      'create',
      'staff_profile',
      profile.id,
      { before: null, after: { fullName, jobTitle: data.jobTitle } },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff`);
    }

    return { success: true, data: profile };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createStaffProfile] Error:', error);
    return { success: false, error: 'Failed to create staff profile' };
  }
}

// ---------------------------------------------------------------------------
// Update staff profile
// ---------------------------------------------------------------------------

export async function updateStaffProfile(
  staffId: string,
  input: UpdateStaffInput,
): Promise<ActionResult<StaffProfile>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'staff');

    const parsed = updateStaffSchema.safeParse(input);
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
      .from(staffProfiles)
      .where(
        and(eq(staffProfiles.id, staffId), isNull(staffProfiles.deletedAt)),
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Staff profile not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof staffProfiles.$inferInsert> = {};

    if (data.firstName !== undefined) updates.firstName = data.firstName;
    if (data.lastName !== undefined) updates.lastName = data.lastName;
    if (data.jobTitle !== undefined) updates.jobTitle = data.jobTitle;
    if (data.contractType !== undefined) updates.contractType = data.contractType;
    if (data.weeklyHours !== undefined) {
      updates.weeklyHours = data.weeklyHours != null ? String(data.weeklyHours) : null;
    }
    if (data.startDate !== undefined) updates.startDate = data.startDate;
    if (data.endDate !== undefined) updates.endDate = data.endDate;
    if (data.niNumber !== undefined) updates.niNumber = data.niNumber || null;
    if (data.email !== undefined) updates.email = data.email;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.emergencyContactName !== undefined)
      updates.emergencyContactName = data.emergencyContactName;
    if (data.emergencyContactPhone !== undefined)
      updates.emergencyContactPhone = data.emergencyContactPhone;
    if (data.emergencyContactRelation !== undefined)
      updates.emergencyContactRelation = data.emergencyContactRelation;
    if (data.userId !== undefined) updates.userId = data.userId;

    // Recompute fullName if first/last name changed
    const newFirst = data.firstName ?? existing.firstName;
    const newLast = data.lastName ?? existing.lastName;
    if (data.firstName !== undefined || data.lastName !== undefined) {
      updates.fullName = `${newFirst ?? ''} ${newLast ?? ''}`.trim();
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(staffProfiles)
      .set(updates)
      .where(eq(staffProfiles.id, staffId))
      .returning();

    await auditLog(
      'update',
      'staff_profile',
      staffId,
      {
        before: {
          ...Object.fromEntries(
            Object.keys(updates).map((k) => [
              k,
              existing[k as keyof typeof existing],
            ]),
          ),
        },
        after: updates,
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff`);
      revalidatePath(`/${slug}/staff/${staffId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateStaffProfile] Error:', error);
    return { success: false, error: 'Failed to update staff profile' };
  }
}

// ---------------------------------------------------------------------------
// Update staff status
// ---------------------------------------------------------------------------

export async function updateStaffStatus(
  staffId: string,
  input: UpdateStaffStatusInput,
): Promise<ActionResult<StaffProfile>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'staff');

    const parsed = updateStaffStatusSchema.safeParse(input);
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
      .from(staffProfiles)
      .where(
        and(eq(staffProfiles.id, staffId), isNull(staffProfiles.deletedAt)),
      )
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Staff profile not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const { status: newStatus, reason } = parsed.data;

    // Validate status transition
    if (!isValidStatusTransition(existing.status, newStatus)) {
      return {
        success: false,
        error: `Cannot transition from '${existing.status}' to '${newStatus}'`,
      };
    }

    const now = new Date();
    const updates: Partial<typeof staffProfiles.$inferInsert> = {
      status: newStatus,
      updatedAt: now,
    };

    // If terminating, record employment history entry and set end date
    if (newStatus === 'terminated') {
      const historyEntry: EmploymentHistoryEntry = {
        id: `eh-${Date.now()}`,
        jobTitle: existing.jobTitle,
        startDate: existing.startDate ?? existing.createdAt.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
        contractType: existing.contractType,
        weeklyHours: existing.weeklyHours ? Number(existing.weeklyHours) : null,
        notes: reason ?? null,
      };

      updates.employmentHistory = [
        ...existing.employmentHistory,
        historyEntry,
      ];
      updates.endDate = now.toISOString().slice(0, 10);
    }

    const [updated] = await db
      .update(staffProfiles)
      .set(updates)
      .where(eq(staffProfiles.id, staffId))
      .returning();

    await auditLog(
      'status_change',
      'staff_profile',
      staffId,
      {
        before: { status: existing.status },
        after: { status: newStatus, reason },
      },
      { userId, organisationId: orgId },
    );

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/staff`);
      revalidatePath(`/${slug}/staff/${staffId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateStaffStatus] Error:', error);
    return { success: false, error: 'Failed to update staff status' };
  }
}
