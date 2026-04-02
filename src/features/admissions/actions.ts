'use server';

import { db } from '@/lib/db';
import {
  referrals,
  referralTransitions,
  matchingAssessments,
  admissionChecklistItems,
} from '@/lib/db/schema/admissions';
import { auditLogs } from '@/lib/db/schema/audit-logs';
import { eq, and, desc } from 'drizzle-orm';
import {
  createReferralSchema,
  createMatchingAssessmentSchema,
  recordDecisionSchema,
  updateChecklistItemSchema,
  completeAdmissionSchema,
} from './schema';

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Stub auth helper — returns the current user and org context.
 * Replace with real Auth.js session lookup once auth module is wired up.
 */
async function requireAuth() {
  // TODO: Replace with real auth once m1-auth is implemented.
  // For now, return a placeholder that allows typecheck/lint to pass.
  return {
    userId: '00000000-0000-0000-0000-000000000000',
    organisationId: '00000000-0000-0000-0000-000000000000',
    role: 'manager' as const,
  };
}

/**
 * Asserts the caller has at least one of the allowed roles.
 */
function assertRole(
  role: string,
  allowed: readonly string[],
): asserts role is string {
  if (!allowed.includes(role)) {
    throw new Error('Forbidden: insufficient role');
  }
}

/** Records an audit log entry. */
async function audit(params: {
  userId: string;
  organisationId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: unknown;
}) {
  await db.insert(auditLogs).values({
    userId: params.userId,
    organisationId: params.organisationId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    changes: params.changes ?? null,
  });
}

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
  const { userId, organisationId, role } = await requireAuth();
  assertRole(role, ['owner', 'admin', 'manager', 'senior_carer']);

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

  await audit({
    userId,
    organisationId,
    action: 'create',
    entityType: 'referral',
    entityId: referral.id,
    changes: { after: data },
  });

  return { success: true, referral };
}

/**
 * List referrals for the current organisation.
 */
export async function listReferrals(filters?: { status?: string }) {
  const { organisationId } = await requireAuth();

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
  const { organisationId } = await requireAuth();

  const [referral] = await db
    .select()
    .from(referrals)
    .where(and(eq(referrals.id, id), eq(referrals.organisationId, organisationId)));

  if (!referral) throw new Error('Referral not found');

  const transitions = await db
    .select()
    .from(referralTransitions)
    .where(eq(referralTransitions.referralId, id))
    .orderBy(desc(referralTransitions.createdAt));

  const assessments = await db
    .select()
    .from(matchingAssessments)
    .where(eq(matchingAssessments.referralId, id))
    .orderBy(desc(matchingAssessments.createdAt));

  const checklist = await db
    .select()
    .from(admissionChecklistItems)
    .where(eq(admissionChecklistItems.referralId, id));

  return { referral, transitions, assessments, checklist };
}

/**
 * Create a matching / impact risk assessment for a referral.
 * Transitions referral to "assessment_complete".
 */
export async function createMatchingAssessment(input: unknown) {
  const { userId, organisationId, role } = await requireAuth();
  assertRole(role, ['owner', 'admin', 'manager']);

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
    .where(eq(referrals.id, data.referralId));

  await recordTransition({
    organisationId,
    referralId: data.referralId,
    fromStatus: 'received',
    toStatus: 'assessment_complete',
    performedBy: userId,
    notes: `Risk rating: ${data.overallRiskRating}, Recommendation: ${data.recommendation}`,
  });

  await audit({
    userId,
    organisationId,
    action: 'create',
    entityType: 'matching_assessment',
    entityId: assessment.id,
    changes: { after: data },
  });

  return { success: true, assessment };
}

/**
 * Record an acceptance/decline decision for a referral.
 * Transitions to "accepted" or "declined". Creates checklist on acceptance.
 */
export async function recordDecision(input: unknown) {
  const { userId, organisationId, role } = await requireAuth();
  assertRole(role, ['owner', 'admin', 'manager']);

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
    .where(eq(referrals.id, data.referralId));

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

  await audit({
    userId,
    organisationId,
    action: 'update',
    entityType: 'referral',
    entityId: data.referralId,
    changes: {
      before: { status: 'assessment_complete' },
      after: { status: data.decision, reason: data.reason },
    },
  });

  return { success: true };
}

/**
 * Update a checklist item (mark complete/incomplete).
 */
export async function updateChecklistItem(input: unknown) {
  const { userId, organisationId, role } = await requireAuth();
  assertRole(role, ['owner', 'admin', 'manager', 'senior_carer']);

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
    .where(eq(admissionChecklistItems.id, data.id));

  await audit({
    userId,
    organisationId,
    action: 'update',
    entityType: 'admission_checklist_item',
    entityId: data.id,
    changes: {
      before: { completed: item.completed },
      after: { completed: data.completed },
    },
  });

  return { success: true };
}

/**
 * Complete admission — transitions referral from "accepted" to "admitted".
 * All required checklist items must be completed first.
 */
export async function completeAdmission(input: unknown) {
  const { userId, organisationId, role } = await requireAuth();
  assertRole(role, ['owner', 'admin', 'manager']);

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
    .where(eq(referrals.id, data.referralId));

  await recordTransition({
    organisationId,
    referralId: data.referralId,
    fromStatus: 'accepted',
    toStatus: 'admitted',
    performedBy: userId,
  });

  await audit({
    userId,
    organisationId,
    action: 'update',
    entityType: 'referral',
    entityId: data.referralId,
    changes: {
      before: { status: 'accepted' },
      after: { status: 'admitted' },
    },
  });

  return { success: true };
}
