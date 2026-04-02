'use server';

import { db } from '@/lib/db';
import {
  referrals,
  referralTransitions,
  matchingAssessments,
  admissionChecklistItems,
} from '@/lib/db/schema/admissions';
import { eq, and, desc } from 'drizzle-orm';
import { requirePermission } from '@/lib/rbac';
import { auditLog } from '@/lib/audit';
import {
  createReferralSchema,
  createMatchingAssessmentSchema,
  recordDecisionSchema,
  updateChecklistItemSchema,
  completeAdmissionSchema,
} from './schema';

/** Records a referral status transition. */
async function recordTransition(params: {
  organisationId: string;
  referralId: string;
  fromStatus: string;
  toStatus: string;
  performedBy: string;
  notes?: string;
}) {
  await db.insert(referralTransitions).values(params);
}

/** Default checklist items created after acceptance. */
const DEFAULT_CHECKLIST_ITEMS = [
  {
    category: 'documentation',
    title: 'Placement plan received',
    description: 'Placement plan from placing authority',
    required: true,
  },
  {
    category: 'documentation',
    title: 'Care plan received',
    description: 'Up-to-date care plan from social worker',
    required: true,
  },
  {
    category: 'documentation',
    title: 'Risk assessment documentation',
    description: 'All risk assessments and management plans',
    required: true,
  },
  {
    category: 'health',
    title: 'Health assessment / medical records',
    description: 'Recent health assessment and GP registration details',
    required: true,
  },
  {
    category: 'health',
    title: 'Medication and MAR chart',
    description: 'Current medications and administration records',
    required: false,
  },
  {
    category: 'education',
    title: 'PEP / education records',
    description: 'Personal education plan and school details',
    required: true,
  },
  {
    category: 'legal',
    title: 'Legal order / section 20 agreement',
    description: 'Copy of court order or voluntary accommodation agreement',
    required: true,
  },
  {
    category: 'legal',
    title: 'Delegated authority document',
    description: 'Signed delegated authority for day-to-day decisions',
    required: true,
  },
  {
    category: 'placement_plan',
    title: 'Emergency contacts confirmed',
    description: 'Full list of emergency contacts and approved visitors',
    required: true,
  },
  {
    category: 'placement_plan',
    title: 'Bedroom allocation confirmed',
    description: 'Room allocated and prepared for the child',
    required: true,
  },
] as const;

// ── Actions ────────────────────────────────────────────────────────────

/**
 * Create a new referral from a placing authority.
 * Status starts at "received".
 */
export async function createReferral(input: unknown) {
  const { userId, orgId: organisationId } = await requirePermission('create', 'persons');

  const data = createReferralSchema.parse(input);

  const [referral] = await db
    .insert(referrals)
    .values({
      organisationId,
      ...data,
      needs: data.needs ?? null,
      behaviours: data.behaviours ?? null,
      medicalInformation: data.medicalInformation ?? null,
      placementHistory: data.placementHistory ?? null,
      teamManagerEmail: data.teamManagerEmail || null,
      createdBy: userId,
    })
    .returning();

  // Record initial transition
  await recordTransition({
    organisationId,
    referralId: referral.id,
    fromStatus: 'none',
    toStatus: 'received',
    performedBy: userId,
  });

  await auditLog('create', 'referral', referral.id, {
    after: data,
  }, { userId, organisationId });

  return { success: true, referral };
}

/**
 * List referrals for the current organisation.
 */
export async function listReferrals(filters?: { status?: string }) {
  const { orgId: organisationId } = await requirePermission('read', 'persons');

  const conditions = [eq(referrals.organisationId, organisationId)];

  if (
    filters?.status &&
    [
      'received',
      'assessment_complete',
      'accepted',
      'declined',
      'admitted',
    ].includes(filters.status)
  ) {
    conditions.push(
      eq(
        referrals.status,
        filters.status as
          | 'received'
          | 'assessment_complete'
          | 'accepted'
          | 'declined'
          | 'admitted',
      ),
    );
  }

  const results = await db
    .select()
    .from(referrals)
    .where(and(...conditions))
    .orderBy(desc(referrals.createdAt));

  return results;
}

/**
 * Get a single referral by ID with related data.
 */
export async function getReferral(id: string) {
  const { orgId: organisationId } = await requirePermission('read', 'persons');

  const [referral] = await db
    .select()
    .from(referrals)
    .where(and(eq(referrals.id, id), eq(referrals.organisationId, organisationId)));

  if (!referral) throw new Error('Referral not found');

  const transitions = await db
    .select()
    .from(referralTransitions)
    .where(
      and(
        eq(referralTransitions.referralId, id),
        eq(referralTransitions.organisationId, organisationId),
      ),
    )
    .orderBy(desc(referralTransitions.createdAt));

  const assessments = await db
    .select()
    .from(matchingAssessments)
    .where(
      and(
        eq(matchingAssessments.referralId, id),
        eq(matchingAssessments.organisationId, organisationId),
      ),
    )
    .orderBy(desc(matchingAssessments.createdAt));

  const checklist = await db
    .select()
    .from(admissionChecklistItems)
    .where(
      and(
        eq(admissionChecklistItems.referralId, id),
        eq(admissionChecklistItems.organisationId, organisationId),
      ),
    );

  return { referral, transitions, assessments, checklist };
}

/**
 * Create a matching / impact risk assessment for a referral.
 * Transitions referral to "assessment_complete".
 */
export async function createMatchingAssessment(input: unknown) {
  const { userId, orgId: organisationId } = await requirePermission('create', 'assessments');

  const data = createMatchingAssessmentSchema.parse(input);

  // Verify referral exists and belongs to org
  const [referral] = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.id, data.referralId),
        eq(referrals.organisationId, organisationId),
      ),
    );

  if (!referral) throw new Error('Referral not found');
  if (referral.status !== 'received') {
    throw new Error(
      'Referral must be in "received" status to create an assessment',
    );
  }

  const [assessment] = await db
    .insert(matchingAssessments)
    .values({
      organisationId,
      referralId: data.referralId,
      riskToExisting: data.riskToExisting ?? null,
      riskToRating: data.riskToRating ?? null,
      riskFromExisting: data.riskFromExisting ?? null,
      riskFromRating: data.riskFromRating ?? null,
      compatibilityFactors: data.compatibilityFactors ?? null,
      currentOccupancy: data.currentOccupancy ?? null,
      maxCapacity: data.maxCapacity ?? null,
      bedsAvailable: data.bedsAvailable ?? null,
      capacityNotes: data.capacityNotes ?? null,
      overallRiskRating: data.overallRiskRating,
      recommendation: data.recommendation,
      recommendationRationale: data.recommendationRationale,
      conditions: data.conditions ?? null,
      assessedBy: userId,
    })
    .returning();

  // Transition referral to assessment_complete
  await db
    .update(referrals)
    .set({ status: 'assessment_complete', updatedAt: new Date() })
    .where(
      and(
        eq(referrals.id, data.referralId),
        eq(referrals.organisationId, organisationId),
      ),
    );

  await recordTransition({
    organisationId,
    referralId: data.referralId,
    fromStatus: 'received',
    toStatus: 'assessment_complete',
    performedBy: userId,
    notes: `Risk rating: ${data.overallRiskRating}, Recommendation: ${data.recommendation}`,
  });

  await auditLog('create', 'matching_assessment', assessment.id, {
    after: data,
  }, { userId, organisationId });

  return { success: true, assessment };
}

/**
 * Record an acceptance/decline decision for a referral.
 * Transitions to "accepted" or "declined". Creates checklist on acceptance.
 */
export async function recordDecision(input: unknown) {
  const { userId, orgId: organisationId } = await requirePermission('update', 'persons');

  const data = recordDecisionSchema.parse(input);

  const [referral] = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.id, data.referralId),
        eq(referrals.organisationId, organisationId),
      ),
    );

  if (!referral) throw new Error('Referral not found');
  if (referral.status !== 'assessment_complete') {
    throw new Error(
      'Referral must be in "assessment_complete" status to record a decision',
    );
  }

  const now = new Date();

  await db
    .update(referrals)
    .set({
      status: data.decision,
      decisionBy: userId,
      decisionAt: now,
      decisionReason: data.reason,
      acceptanceConditions: data.acceptanceConditions ?? null,
      updatedAt: now,
    })
    .where(
      and(
        eq(referrals.id, data.referralId),
        eq(referrals.organisationId, organisationId),
      ),
    );

  await recordTransition({
    organisationId,
    referralId: data.referralId,
    fromStatus: 'assessment_complete',
    toStatus: data.decision,
    performedBy: userId,
    notes: data.reason,
  });

  // If accepted, create default checklist items
  if (data.decision === 'accepted') {
    await db.insert(admissionChecklistItems).values(
      DEFAULT_CHECKLIST_ITEMS.map((item) => ({
        organisationId,
        referralId: data.referralId,
        category: item.category,
        title: item.title,
        description: item.description,
        required: item.required,
      })),
    );
  }

  await auditLog('update', 'referral', data.referralId, {
    before: { status: 'assessment_complete' },
    after: { status: data.decision, reason: data.reason },
  }, { userId, organisationId });

  return { success: true };
}

/**
 * Update a checklist item (mark complete/incomplete).
 */
export async function updateChecklistItem(input: unknown) {
  const { userId, orgId: organisationId } = await requirePermission('update', 'persons');

  const data = updateChecklistItemSchema.parse(input);

  const [item] = await db
    .select()
    .from(admissionChecklistItems)
    .where(
      and(
        eq(admissionChecklistItems.id, data.id),
        eq(admissionChecklistItems.organisationId, organisationId),
      ),
    );

  if (!item) throw new Error('Checklist item not found');

  await db
    .update(admissionChecklistItems)
    .set({
      completed: data.completed,
      completedBy: data.completed ? userId : null,
      completedAt: data.completed ? new Date() : null,
      notes: data.notes ?? item.notes,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(admissionChecklistItems.id, data.id),
        eq(admissionChecklistItems.organisationId, organisationId),
      ),
    );

  await auditLog('update', 'admission_checklist_item', data.id, {
    before: { completed: item.completed },
    after: { completed: data.completed },
  }, { userId, organisationId });

  return { success: true };
}

/**
 * Complete admission — transitions referral from "accepted" to "admitted".
 * All required checklist items must be completed first.
 */
export async function completeAdmission(input: unknown) {
  const { userId, orgId: organisationId } = await requirePermission('update', 'persons');

  const data = completeAdmissionSchema.parse(input);

  const [referral] = await db
    .select()
    .from(referrals)
    .where(
      and(
        eq(referrals.id, data.referralId),
        eq(referrals.organisationId, organisationId),
      ),
    );

  if (!referral) throw new Error('Referral not found');
  if (referral.status !== 'accepted') {
    throw new Error(
      'Referral must be in "accepted" status to complete admission',
    );
  }

  // Verify all required checklist items are complete
  const checklistItems = await db
    .select()
    .from(admissionChecklistItems)
    .where(
      and(
        eq(admissionChecklistItems.referralId, data.referralId),
        eq(admissionChecklistItems.organisationId, organisationId),
      ),
    );

  const incompleteRequired = checklistItems.filter(
    (item) => item.required && !item.completed,
  );

  if (incompleteRequired.length > 0) {
    return {
      success: false,
      error: `${incompleteRequired.length} required checklist item(s) are incomplete`,
      incompleteItems: incompleteRequired.map((i) => i.title),
    };
  }

  const now = new Date();

  await db
    .update(referrals)
    .set({
      status: 'admitted',
      admittedAt: now,
      admittedBy: userId,
      updatedAt: now,
    })
    .where(
      and(
        eq(referrals.id, data.referralId),
        eq(referrals.organisationId, organisationId),
      ),
    );

  await recordTransition({
    organisationId,
    referralId: data.referralId,
    fromStatus: 'accepted',
    toStatus: 'admitted',
    performedBy: userId,
  });

  await auditLog('update', 'referral', data.referralId, {
    before: { status: 'accepted' },
    after: { status: 'admitted' },
  }, { userId, organisationId });

  return { success: true };
}
