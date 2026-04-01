'use server';

/**
 * Care Plan Server Actions
 *
 * Full CRUD for version-controlled care plans.
 * Includes versioning, approval workflow, review scheduling, and reminders.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq, isNull, lte, gte, isNotNull, not } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  carePlans,
  carePlanVersions,
  organisations,
  users,
  notifications,
} from '@/lib/db/schema';
import type { CarePlan } from '@/lib/db/schema/care-plans';
import type { CarePlanVersion } from '@/lib/db/schema/care-plan-versions';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createCarePlanSchema,
  updateCarePlanSchema,
  calculateNextReviewDate,
} from './schema';
import type { CreateCarePlanInput, UpdateCarePlanInput } from './schema';

// Re-export for external use
export type { CreateCarePlanInput, UpdateCarePlanInput } from './schema';

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
// List care plans for a person
// ---------------------------------------------------------------------------

export type CarePlanListItem = {
  id: string;
  title: string;
  status: string;
  version: number;
  template: string | null;
  reviewFrequency: string | null;
  nextReviewDate: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CarePlanListResult = {
  carePlans: CarePlanListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listCarePlans({
  personId,
  page = 1,
  pageSize = 20,
  status,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
  status?: string;
}): Promise<CarePlanListResult> {
  const { orgId } = await requirePermission('read', 'care_plans');

  const conditions = [
    eq(carePlans.organisationId, orgId),
    eq(carePlans.personId, personId),
    isNull(carePlans.deletedAt),
  ];

  if (status) {
    conditions.push(eq(carePlans.status, status));
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: carePlans.id,
        title: carePlans.title,
        status: carePlans.status,
        version: carePlans.version,
        template: carePlans.template,
        reviewFrequency: carePlans.reviewFrequency,
        nextReviewDate: carePlans.nextReviewDate,
        approvedAt: carePlans.approvedAt,
        createdAt: carePlans.createdAt,
        updatedAt: carePlans.updatedAt,
      })
      .from(carePlans)
      .where(whereClause)
      .orderBy(desc(carePlans.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(carePlans).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    carePlans: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single care plan
// ---------------------------------------------------------------------------

export async function getCarePlan(carePlanId: string): Promise<CarePlan | null> {
  const { orgId } = await requirePermission('read', 'care_plans');

  const [plan] = await db
    .select()
    .from(carePlans)
    .where(
      and(eq(carePlans.id, carePlanId), isNull(carePlans.deletedAt)),
    )
    .limit(1);

  if (!plan) return null;

  assertBelongsToOrg(plan.organisationId, orgId);

  return plan;
}

// ---------------------------------------------------------------------------
// Create care plan
// ---------------------------------------------------------------------------

export async function createCarePlan(
  input: CreateCarePlanInput,
): Promise<ActionResult<CarePlan>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'care_plans');

    const parsed = createCarePlanSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [plan] = await db
      .insert(carePlans)
      .values({
        organisationId: orgId,
        personId: data.personId,
        title: data.title,
        status: 'draft',
        version: 1,
        sections: data.sections,
        template: data.template ?? null,
        reviewFrequency: data.reviewFrequency,
        nextReviewDate: data.nextReviewDate ?? null,
      })
      .returning();

    // Create the initial version snapshot
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await db.insert(carePlanVersions).values({
      carePlanId: plan.id,
      organisationId: orgId,
      versionNumber: 1,
      title: plan.title,
      sections: data.sections,
      status: 'draft',
      createdById: userId,
      createdByName: user?.name ?? null,
    });

    await auditLog('create', 'care_plan', plan.id, {
      before: null,
      after: { title: data.title, personId: data.personId, template: data.template },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/care-plans`);
    }

    return { success: true, data: plan };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createCarePlan] Error:', error);
    return { success: false, error: 'Failed to create care plan' };
  }
}

// ---------------------------------------------------------------------------
// Update care plan (creates a new version)
// ---------------------------------------------------------------------------

export async function updateCarePlan(
  carePlanId: string,
  input: UpdateCarePlanInput,
): Promise<ActionResult<CarePlan>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');

    const parsed = updateCarePlanSchema.safeParse(input);
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
      .from(carePlans)
      .where(and(eq(carePlans.id, carePlanId), isNull(carePlans.deletedAt)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Care plan not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const newVersion = existing.version + 1;

    const updates: Partial<typeof carePlans.$inferInsert> = {
      version: newVersion,
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updates.title = data.title;
    if (data.sections !== undefined) updates.sections = data.sections;
    if (data.reviewFrequency !== undefined) updates.reviewFrequency = data.reviewFrequency;
    if (data.nextReviewDate !== undefined) updates.nextReviewDate = data.nextReviewDate;

    const [updated] = await db
      .update(carePlans)
      .set(updates)
      .where(eq(carePlans.id, carePlanId))
      .returning();

    // Create version snapshot
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await db.insert(carePlanVersions).values({
      carePlanId: carePlanId,
      organisationId: orgId,
      versionNumber: newVersion,
      title: updated.title,
      sections: updated.sections,
      status: updated.status,
      createdById: userId,
      createdByName: user?.name ?? null,
    });

    await auditLog('update', 'care_plan', carePlanId, {
      before: { title: existing.title, version: existing.version },
      after: { title: updated.title, version: newVersion },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/care-plans`);
      revalidatePath(`/${slug}/persons/${existing.personId}/care-plans/${carePlanId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateCarePlan] Error:', error);
    return { success: false, error: 'Failed to update care plan' };
  }
}

// ---------------------------------------------------------------------------
// Submit care plan for review
// ---------------------------------------------------------------------------

export async function submitCarePlanForReview(
  carePlanId: string,
): Promise<ActionResult<CarePlan>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');

    const [existing] = await db
      .select()
      .from(carePlans)
      .where(and(eq(carePlans.id, carePlanId), isNull(carePlans.deletedAt)))
      .limit(1);

    if (!existing) return { success: false, error: 'Care plan not found' };

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'draft') {
      return { success: false, error: 'Only draft care plans can be submitted for review' };
    }

    const [updated] = await db
      .update(carePlans)
      .set({
        status: 'review',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(carePlans.id, carePlanId))
      .returning();

    await auditLog('submit_review', 'care_plan', carePlanId, {
      before: { status: 'draft' },
      after: { status: 'review' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/care-plans/${carePlanId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[submitCarePlanForReview] Error:', error);
    return { success: false, error: 'Failed to submit care plan for review' };
  }
}

// ---------------------------------------------------------------------------
// Approve care plan
// ---------------------------------------------------------------------------

export async function approveCarePlan(
  carePlanId: string,
): Promise<ActionResult<CarePlan>> {
  try {
    const { orgId, userId } = await requirePermission('approve', 'care_plans');

    const [existing] = await db
      .select()
      .from(carePlans)
      .where(and(eq(carePlans.id, carePlanId), isNull(carePlans.deletedAt)))
      .limit(1);

    if (!existing) return { success: false, error: 'Care plan not found' };

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'review') {
      return { success: false, error: 'Only care plans in review can be approved' };
    }

    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const now = new Date();
    const nextReview = existing.reviewFrequency
      ? calculateNextReviewDate(now, existing.reviewFrequency as 'weekly' | 'monthly' | 'quarterly')
      : null;

    const [updated] = await db
      .update(carePlans)
      .set({
        status: 'approved',
        approvedById: userId,
        approvedAt: now,
        authorisedBy: user?.name ?? null,
        nextReviewDate: nextReview,
        updatedAt: now,
      })
      .where(eq(carePlans.id, carePlanId))
      .returning();

    await auditLog('approve', 'care_plan', carePlanId, {
      before: { status: 'review' },
      after: { status: 'approved', approvedBy: user?.name },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/care-plans/${carePlanId}`);
      revalidatePath(`/${slug}/persons/${existing.personId}/care-plans`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[approveCarePlan] Error:', error);
    return { success: false, error: 'Failed to approve care plan' };
  }
}

// ---------------------------------------------------------------------------
// Return care plan to draft (from review)
// ---------------------------------------------------------------------------

export async function returnCarePlanToDraft(
  carePlanId: string,
): Promise<ActionResult<CarePlan>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');

    const [existing] = await db
      .select()
      .from(carePlans)
      .where(and(eq(carePlans.id, carePlanId), isNull(carePlans.deletedAt)))
      .limit(1);

    if (!existing) return { success: false, error: 'Care plan not found' };

    assertBelongsToOrg(existing.organisationId, orgId);

    if (existing.status !== 'review') {
      return { success: false, error: 'Only care plans in review can be returned to draft' };
    }

    const [updated] = await db
      .update(carePlans)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(carePlans.id, carePlanId))
      .returning();

    await auditLog('return_draft', 'care_plan', carePlanId, {
      before: { status: 'review' },
      after: { status: 'draft' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/care-plans/${carePlanId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to return care plan to draft' };
  }
}

// ---------------------------------------------------------------------------
// Archive care plan
// ---------------------------------------------------------------------------

export async function archiveCarePlan(
  carePlanId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'care_plans');

    const [existing] = await db
      .select()
      .from(carePlans)
      .where(and(eq(carePlans.id, carePlanId), isNull(carePlans.deletedAt)))
      .limit(1);

    if (!existing) return { success: false, error: 'Care plan not found' };

    assertBelongsToOrg(existing.organisationId, orgId);

    await db
      .update(carePlans)
      .set({ status: 'archived', deletedAt: new Date() })
      .where(eq(carePlans.id, carePlanId));

    await auditLog('archive', 'care_plan', carePlanId, {
      before: { status: existing.status },
      after: { status: 'archived' },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/care-plans`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to archive care plan' };
  }
}

// ---------------------------------------------------------------------------
// Get version history
// ---------------------------------------------------------------------------

export async function getCarePlanVersions(
  carePlanId: string,
): Promise<CarePlanVersion[]> {
  const { orgId } = await requirePermission('read', 'care_plans');

  // First verify the care plan belongs to this org
  const [plan] = await db
    .select({ organisationId: carePlans.organisationId })
    .from(carePlans)
    .where(eq(carePlans.id, carePlanId))
    .limit(1);

  if (!plan) return [];
  assertBelongsToOrg(plan.organisationId, orgId);

  return db
    .select()
    .from(carePlanVersions)
    .where(
      and(
        eq(carePlanVersions.carePlanId, carePlanId),
        eq(carePlanVersions.organisationId, orgId),
      ),
    )
    .orderBy(desc(carePlanVersions.versionNumber));
}

// ---------------------------------------------------------------------------
// Get a specific version
// ---------------------------------------------------------------------------

export async function getCarePlanVersion(
  carePlanId: string,
  versionNumber: number,
): Promise<CarePlanVersion | null> {
  const { orgId } = await requirePermission('read', 'care_plans');

  // Verify the care plan belongs to this org
  const [plan] = await db
    .select({ organisationId: carePlans.organisationId })
    .from(carePlans)
    .where(eq(carePlans.id, carePlanId))
    .limit(1);

  if (!plan) return null;
  assertBelongsToOrg(plan.organisationId, orgId);

  const [version] = await db
    .select()
    .from(carePlanVersions)
    .where(
      and(
        eq(carePlanVersions.carePlanId, carePlanId),
        eq(carePlanVersions.organisationId, orgId),
        eq(carePlanVersions.versionNumber, versionNumber),
      ),
    )
    .limit(1);

  return version ?? null;
}

// ---------------------------------------------------------------------------
// Check and create review reminders
// ---------------------------------------------------------------------------

/**
 * Lazy notification generation for care plan review reminders.
 *
 * Checks for care plans with upcoming or overdue review dates within the
 * configured window (default 7 days) and creates notifications if not already
 * present. This is called on the care plans list page load.
 *
 * In production this would be triggered by a cron job, but for the MVP it
 * runs on page load as a lightweight background check.
 */
export async function checkAndCreateReviewReminders(
  userId: string,
): Promise<void> {
  try {
    const { orgId } = await requirePermission('read', 'care_plans');

    const today = new Date();
    const reminderWindowEnd = new Date(today);
    reminderWindowEnd.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().slice(0, 10);
    const windowEndStr = reminderWindowEnd.toISOString().slice(0, 10);

    // Find care plans due for review or overdue (not archived)
    const duePlans = await db
      .select({
        id: carePlans.id,
        title: carePlans.title,
        personId: carePlans.personId,
        nextReviewDate: carePlans.nextReviewDate,
      })
      .from(carePlans)
      .where(
        and(
          eq(carePlans.organisationId, orgId),
          isNull(carePlans.deletedAt),
          not(eq(carePlans.status, 'archived')),
          isNotNull(carePlans.nextReviewDate),
          lte(carePlans.nextReviewDate, windowEndStr),
        ),
      )
      .limit(20);

    if (duePlans.length === 0) return;

    // Check which care plans already have notifications (avoid duplicates)
    // We use a simple check: if a notification for this care plan was created
    // within the last 24 hours, skip it
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    for (const plan of duePlans) {
      if (!plan.nextReviewDate) continue;

      const isOverdue = plan.nextReviewDate < todayStr;
      const notificationType = isOverdue
        ? 'care_plan_review_overdue'
        : 'care_plan_review';

      // Check if notification already exists for this care plan
      const [existingNotif] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.organisationId, orgId),
            eq(notifications.entityId, plan.id),
            eq(notifications.type, notificationType),
            gte(notifications.createdAt, yesterday),
          ),
        )
        .limit(1);

      if (existingNotif) continue;

      // Create notification
      await db.insert(notifications).values({
        userId,
        organisationId: orgId,
        type: notificationType,
        title: isOverdue
          ? `Care plan review overdue: ${plan.title}`
          : `Care plan review due soon: ${plan.title}`,
        body: isOverdue
          ? `The care plan "${plan.title}" was due for review on ${plan.nextReviewDate} and has not been reviewed.`
          : `The care plan "${plan.title}" is due for review on ${plan.nextReviewDate}.`,
        entityType: 'care_plan',
        entityId: plan.id,
      });
    }
  } catch (error) {
    // Don't block page load on notification errors
    console.error('[checkAndCreateReviewReminders] Error:', error);
  }
}
