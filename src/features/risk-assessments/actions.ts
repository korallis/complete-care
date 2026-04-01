'use server';

/**
 * Risk Assessment Server Actions
 *
 * CRUD for scored risk assessments with template-driven questions.
 * All actions are tenant-scoped and RBAC-protected.
 *
 * Flow: Zod validate -> auth -> RBAC -> tenant isolation -> audit log
 */

import { and, count, desc, eq, isNotNull, lte, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  riskAssessments,
  organisations,
  users,
  notifications,
} from '@/lib/db/schema';
import type { RiskAssessment } from '@/lib/db/schema/risk-assessments';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createRiskAssessmentSchema,
  completeRiskAssessmentSchema,
  calculateNextReviewDate,
} from './schema';
import type {
  CreateRiskAssessmentInput,
  CompleteRiskAssessmentInput,
} from './schema';
import { calculateAssessmentResult } from './scoring';
import { getTemplate, TEMPLATE_LABELS } from './templates';
import { isHighRiskAlert, getNotificationType } from './alerts';
import type { RiskLevel } from '@/lib/db/schema/risk-assessments';

// Re-export for external use
export type { CreateRiskAssessmentInput, CompleteRiskAssessmentInput } from './schema';

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
// List risk assessments for a person
// ---------------------------------------------------------------------------

export type RiskAssessmentListItem = {
  id: string;
  templateId: string;
  riskLevel: string;
  totalScore: number;
  status: string;
  version: number;
  completedByName: string | null;
  completedAt: Date | null;
  reviewDate: string | null;
  reviewFrequency: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RiskAssessmentListResult = {
  assessments: RiskAssessmentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listRiskAssessments({
  personId,
  page = 1,
  pageSize = 20,
  templateId,
}: {
  personId: string;
  page?: number;
  pageSize?: number;
  templateId?: string;
}): Promise<RiskAssessmentListResult> {
  const { orgId } = await requirePermission('read', 'assessments');

  const conditions = [
    eq(riskAssessments.organisationId, orgId),
    eq(riskAssessments.personId, personId),
  ];

  if (templateId) {
    conditions.push(eq(riskAssessments.templateId, templateId));
  }

  const whereClause = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: riskAssessments.id,
        templateId: riskAssessments.templateId,
        riskLevel: riskAssessments.riskLevel,
        totalScore: riskAssessments.totalScore,
        status: riskAssessments.status,
        version: riskAssessments.version,
        completedByName: riskAssessments.completedByName,
        completedAt: riskAssessments.completedAt,
        reviewDate: riskAssessments.reviewDate,
        reviewFrequency: riskAssessments.reviewFrequency,
        createdAt: riskAssessments.createdAt,
        updatedAt: riskAssessments.updatedAt,
      })
      .from(riskAssessments)
      .where(whereClause)
      .orderBy(desc(riskAssessments.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(riskAssessments).where(whereClause),
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return {
    assessments: rows,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single risk assessment
// ---------------------------------------------------------------------------

export async function getRiskAssessment(
  assessmentId: string,
): Promise<RiskAssessment | null> {
  const { orgId } = await requirePermission('read', 'assessments');

  const [assessment] = await db
    .select()
    .from(riskAssessments)
    .where(eq(riskAssessments.id, assessmentId))
    .limit(1);

  if (!assessment) return null;

  assertBelongsToOrg(assessment.organisationId, orgId);

  return assessment;
}

// ---------------------------------------------------------------------------
// Create risk assessment (draft)
// ---------------------------------------------------------------------------

export async function createRiskAssessment(
  input: CreateRiskAssessmentInput,
): Promise<ActionResult<RiskAssessment>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'assessments');

    const parsed = createRiskAssessmentSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Check template exists
    const template = getTemplate(data.templateId);
    if (!template) {
      return { success: false, error: 'Invalid assessment template' };
    }

    // Determine version number (count existing for same person + template)
    const [existing] = await db
      .select({ count: count() })
      .from(riskAssessments)
      .where(
        and(
          eq(riskAssessments.organisationId, orgId),
          eq(riskAssessments.personId, data.personId),
          eq(riskAssessments.templateId, data.templateId),
        ),
      );

    const version = (existing?.count ?? 0) + 1;

    const reviewDate = calculateNextReviewDate(
      new Date(),
      data.reviewFrequency,
    );

    const [assessment] = await db
      .insert(riskAssessments)
      .values({
        organisationId: orgId,
        personId: data.personId,
        templateId: data.templateId,
        status: 'draft',
        version,
        reviewFrequency: data.reviewFrequency,
        reviewDate,
      })
      .returning();

    await auditLog('create', 'risk_assessment', assessment.id, {
      before: null,
      after: {
        templateId: data.templateId,
        personId: data.personId,
        version,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${data.personId}/risk-assessments`);
    }

    return { success: true, data: assessment };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createRiskAssessment] Error:', error);
    return { success: false, error: 'Failed to create risk assessment' };
  }
}

// ---------------------------------------------------------------------------
// Complete risk assessment (submit scores)
// ---------------------------------------------------------------------------

export async function completeRiskAssessment(
  assessmentId: string,
  input: CompleteRiskAssessmentInput,
): Promise<ActionResult<RiskAssessment>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'assessments');

    const parsed = completeRiskAssessmentSchema.safeParse(input);
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
      .from(riskAssessments)
      .where(eq(riskAssessments.id, assessmentId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Risk assessment not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;

    // Calculate score and risk level
    const { totalScore, riskLevel } = calculateAssessmentResult(
      data.scores,
      existing.templateId,
    );

    // Get user name for denormalisation
    const [user] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const now = new Date();
    const reviewDate = data.reviewDate ?? calculateNextReviewDate(
      now,
      (existing.reviewFrequency as 'weekly' | 'monthly' | 'quarterly') ?? 'monthly',
    );

    const [updated] = await db
      .update(riskAssessments)
      .set({
        scores: data.scores,
        totalScore,
        riskLevel,
        status: 'completed',
        completedById: userId,
        completedByName: user?.name ?? null,
        completedAt: now,
        reviewDate,
        notes: data.notes ?? null,
        updatedAt: now,
      })
      .where(eq(riskAssessments.id, assessmentId))
      .returning();

    await auditLog('complete', 'risk_assessment', assessmentId, {
      before: { status: 'draft' },
      after: { status: 'completed', riskLevel, totalScore },
    }, { userId, organisationId: orgId });

    // If high/critical risk, create notification for managers
    if (isHighRiskAlert(riskLevel as RiskLevel)) {
      await createHighRiskNotification(
        orgId,
        userId,
        updated,
      );
    }

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/persons/${existing.personId}/risk-assessments`);
      revalidatePath(`/${slug}/persons/${existing.personId}/risk-assessments/${assessmentId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[completeRiskAssessment] Error:', error);
    return { success: false, error: 'Failed to complete risk assessment' };
  }
}

// ---------------------------------------------------------------------------
// High-risk notification (red alert to managers)
// ---------------------------------------------------------------------------

async function createHighRiskNotification(
  orgId: string,
  completedByUserId: string,
  assessment: RiskAssessment,
): Promise<void> {
  try {
    const templateLabel =
      TEMPLATE_LABELS[assessment.templateId as keyof typeof TEMPLATE_LABELS] ??
      assessment.templateId;

    const notificationType = getNotificationType('red');

    // Notify the user who completed the assessment
    await db.insert(notifications).values({
      userId: completedByUserId,
      organisationId: orgId,
      type: notificationType,
      title: `High risk alert: ${templateLabel}`,
      body: `${templateLabel} assessment scored ${assessment.riskLevel} risk (score: ${assessment.totalScore}). Immediate review and care plan update recommended.`,
      entityType: 'risk_assessment',
      entityId: assessment.id,
    });
  } catch (error) {
    // Don't block the main operation on notification errors
    console.error('[createHighRiskNotification] Error:', error);
  }
}

// ---------------------------------------------------------------------------
// Check and create overdue review notifications (amber alerts)
// ---------------------------------------------------------------------------

/**
 * Lazy notification generation for overdue risk assessment reviews.
 * Called on page load (MVP approach; production would use cron).
 */
export async function checkAndCreateReviewReminders(
  userId: string,
  personId: string,
): Promise<void> {
  try {
    const { orgId } = await requirePermission('read', 'assessments');

    const today = new Date();
    const reminderWindowEnd = new Date(today);
    reminderWindowEnd.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().slice(0, 10);
    const windowEndStr = reminderWindowEnd.toISOString().slice(0, 10);

    // Find assessments due for review or overdue
    const dueAssessments = await db
      .select({
        id: riskAssessments.id,
        templateId: riskAssessments.templateId,
        reviewDate: riskAssessments.reviewDate,
        riskLevel: riskAssessments.riskLevel,
      })
      .from(riskAssessments)
      .where(
        and(
          eq(riskAssessments.organisationId, orgId),
          eq(riskAssessments.personId, personId),
          eq(riskAssessments.status, 'completed'),
          isNotNull(riskAssessments.reviewDate),
          lte(riskAssessments.reviewDate, windowEndStr),
        ),
      )
      .limit(20);

    if (dueAssessments.length === 0) return;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    for (const assessment of dueAssessments) {
      if (!assessment.reviewDate) continue;

      const isOverdue = assessment.reviewDate < todayStr;
      const notificationType = isOverdue
        ? 'risk_alert_overdue'
        : 'risk_alert_review';

      const templateLabel =
        TEMPLATE_LABELS[assessment.templateId as keyof typeof TEMPLATE_LABELS] ??
        assessment.templateId;

      // Check if notification already exists (avoid duplicates)
      const [existingNotif] = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.organisationId, orgId),
            eq(notifications.entityId, assessment.id),
            eq(notifications.type, notificationType),
            gte(notifications.createdAt, yesterday),
          ),
        )
        .limit(1);

      if (existingNotif) continue;

      await db.insert(notifications).values({
        userId,
        organisationId: orgId,
        type: notificationType,
        title: isOverdue
          ? `Review overdue: ${templateLabel}`
          : `Review due soon: ${templateLabel}`,
        body: isOverdue
          ? `The ${templateLabel} assessment review was due on ${assessment.reviewDate} and has not been completed.`
          : `The ${templateLabel} assessment is due for review on ${assessment.reviewDate}.`,
        entityType: 'risk_assessment',
        entityId: assessment.id,
      });
    }
  } catch (error) {
    console.error('[checkAndCreateReviewReminders] Error:', error);
  }
}
