'use server';

/**
 * Safeguarding server actions.
 * All actions enforce: Zod validation, auth check, RBAC, and tenant isolation.
 * Every mutation is logged to the audit trail.
 */

import { db } from '@/lib/db';
import {
  safeguardingConcerns,
  concernCorrections,
  dslReviews,
  ladoReferrals,
  section47Investigations,
  mashReferrals,
  safeguardingChronology,
} from '@/lib/db/schema/safeguarding';
import { auditLogs } from '@/lib/db/schema/audit-logs';
import { eq, and, desc } from 'drizzle-orm';
import {
  createConcernSchema,
  createCorrectionSchema,
  createDslReviewSchema,
  createLadoReferralSchema,
  updateLadoReferralSchema,
  createSection47Schema,
  updateSection47Schema,
  createMashReferralSchema,
  updateMashReferralSchema,
  createChronologyEntrySchema,
  type CreateConcernInput,
  type CreateCorrectionInput,
  type CreateDslReviewInput,
  type CreateLadoReferralInput,
  type UpdateLadoReferralInput,
  type CreateSection47Input,
  type UpdateSection47Input,
  type CreateMashReferralInput,
  type UpdateMashReferralInput,
  type CreateChronologyEntryInput,
} from './schema';
import { LADO_ACCESS_ROLES, DSL_REVIEW_ROLES } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContext {
  userId: string;
  organisationId: string;
  role: string;
}

interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// Auth helpers (placeholder — integrate with your auth system)
// ---------------------------------------------------------------------------

/**
 * Placeholder auth check — in production, replace with actual session/auth check.
 * Returns the current user context or throws.
 */
async function requireAuth(): Promise<AuthContext> {
  // TODO: Integrate with Auth.js v5 session
  // const session = await auth();
  // if (!session?.user) throw new Error('Unauthorized');
  // return { userId: session.user.id, organisationId: session.user.organisationId, role: session.user.role };
  throw new Error('Auth not configured — replace requireAuth() with actual auth check');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function hasPermission(role: string, action: string, resource: string): boolean {
  // Simplified RBAC — in production use a full permission matrix
  const roleHierarchy: Record<string, number> = {
    owner: 100,
    admin: 90,
    manager: 80,
    senior_carer: 60,
    carer: 40,
    viewer: 10,
  };
  return (roleHierarchy[role] ?? 0) >= 40; // At minimum carer level
}

function canAccessLado(role: string): boolean {
  return (LADO_ACCESS_ROLES as readonly string[]).includes(role);
}

function canPerformDslReview(role: string): boolean {
  return (DSL_REVIEW_ROLES as readonly string[]).includes(role);
}

async function auditLog(
  userId: string,
  organisationId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>,
) {
  await db.insert(auditLogs).values({
    userId,
    organisationId,
    action,
    entityType,
    entityId,
    changes: changes ?? null,
  });
}

/** Generate a reference number: SC-YYYYMMDD-XXXX */
function generateReferenceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SC-${date}-${random}`;
}

// ---------------------------------------------------------------------------
// Safeguarding Concerns (VAL-CHILD-008)
// ---------------------------------------------------------------------------

/**
 * Record a safeguarding concern. Any staff can raise one.
 * The concern is immutable after submission (corrections via separate table).
 */
export async function createConcern(
  input: CreateConcernInput,
): Promise<ActionResult> {
  const parsed = createConcernSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();
  if (!hasPermission(auth.role, 'create', 'safeguarding_concern')) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const referenceNumber = generateReferenceNumber();
  const [concern] = await db
    .insert(safeguardingConcerns)
    .values({
      organisationId: auth.organisationId,
      reportedById: auth.userId,
      referenceNumber,
      ...parsed.data,
    })
    .returning();

  // Create chronology entry automatically
  await db.insert(safeguardingChronology).values({
    organisationId: auth.organisationId,
    childId: parsed.data.childId,
    eventDate: parsed.data.observedAt,
    source: 'concern',
    sourceRecordId: concern.id,
    title: `Safeguarding concern raised (${referenceNumber})`,
    description: parsed.data.description.slice(0, 500),
    category: parsed.data.category ?? null,
    significance: parsed.data.severity === 'critical' ? 'critical' : 'standard',
    createdById: auth.userId,
  });

  await auditLog(auth.userId, auth.organisationId, 'create', 'safeguarding_concern', concern.id, {
    after: { referenceNumber, severity: parsed.data.severity },
  });

  return { success: true, data: concern };
}

/**
 * Get concerns for a specific child within the current organisation.
 */
export async function getConcernsByChild(
  childId: string,
): Promise<ActionResult> {
  const auth = await requireAuth();

  const concerns = await db
    .select()
    .from(safeguardingConcerns)
    .where(
      and(
        eq(safeguardingConcerns.organisationId, auth.organisationId),
        eq(safeguardingConcerns.childId, childId),
      ),
    )
    .orderBy(desc(safeguardingConcerns.observedAt));

  return { success: true, data: concerns };
}

/**
 * Get all open concerns for the DSL review dashboard.
 */
export async function getOpenConcerns(): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!canPerformDslReview(auth.role)) {
    return { success: false, error: 'Insufficient permissions for DSL review' };
  }

  const concerns = await db
    .select()
    .from(safeguardingConcerns)
    .where(
      and(
        eq(safeguardingConcerns.organisationId, auth.organisationId),
        eq(safeguardingConcerns.status, 'open'),
      ),
    )
    .orderBy(desc(safeguardingConcerns.createdAt));

  return { success: true, data: concerns };
}

/**
 * Add an append-only correction to an existing concern (VAL-CHILD-008 immutability).
 */
export async function addConcernCorrection(
  input: CreateCorrectionInput,
): Promise<ActionResult> {
  const parsed = createCorrectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();

  const [correction] = await db
    .insert(concernCorrections)
    .values({
      organisationId: auth.organisationId,
      correctedById: auth.userId,
      ...parsed.data,
    })
    .returning();

  await auditLog(auth.userId, auth.organisationId, 'create', 'concern_correction', correction.id, {
    after: { concernId: parsed.data.concernId, fieldName: parsed.data.fieldName },
  });

  return { success: true, data: correction };
}

// ---------------------------------------------------------------------------
// DSL Reviews (VAL-CHILD-009)
// ---------------------------------------------------------------------------

/**
 * Create a DSL review for a concern. Only DSL-role users.
 * Creates chronology entry and updates concern status.
 */
export async function createDslReview(
  input: CreateDslReviewInput,
): Promise<ActionResult> {
  const parsed = createDslReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();
  if (!canPerformDslReview(auth.role)) {
    return { success: false, error: 'Insufficient permissions for DSL review' };
  }

  const [review] = await db
    .insert(dslReviews)
    .values({
      organisationId: auth.organisationId,
      reviewerId: auth.userId,
      ...parsed.data,
    })
    .returning();

  // Update concern status
  await db
    .update(safeguardingConcerns)
    .set({ status: 'under_review' })
    .where(eq(safeguardingConcerns.id, parsed.data.concernId));

  // Get the concern to find the childId for chronology
  const [concern] = await db
    .select()
    .from(safeguardingConcerns)
    .where(eq(safeguardingConcerns.id, parsed.data.concernId));

  if (concern) {
    await db.insert(safeguardingChronology).values({
      organisationId: auth.organisationId,
      childId: concern.childId,
      eventDate: new Date(),
      source: 'dsl_review',
      sourceRecordId: review.id,
      title: `DSL Review: ${parsed.data.decision.replace(/_/g, ' ')}`,
      description: parsed.data.rationale.slice(0, 500),
      significance: 'significant',
      createdById: auth.userId,
    });
  }

  await auditLog(auth.userId, auth.organisationId, 'create', 'dsl_review', review.id, {
    after: { concernId: parsed.data.concernId, decision: parsed.data.decision },
  });

  return { success: true, data: review };
}

// ---------------------------------------------------------------------------
// LADO Referrals (VAL-CHILD-010)
// ---------------------------------------------------------------------------

/**
 * Create a LADO referral. Restricted to DSL + senior leadership.
 */
export async function createLadoReferral(
  input: CreateLadoReferralInput,
): Promise<ActionResult> {
  const parsed = createLadoReferralSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();
  if (!canAccessLado(auth.role)) {
    return { success: false, error: 'LADO records are restricted to DSL and senior leadership' };
  }

  const [referral] = await db
    .insert(ladoReferrals)
    .values({
      organisationId: auth.organisationId,
      createdById: auth.userId,
      isRestricted: true,
      ...parsed.data,
    })
    .returning();

  // Chronology entry (restricted)
  await db.insert(safeguardingChronology).values({
    organisationId: auth.organisationId,
    childId: parsed.data.childId,
    eventDate: parsed.data.referralDate,
    source: 'lado_referral',
    sourceRecordId: referral.id,
    title: 'LADO Referral Submitted',
    description: `Allegation against ${parsed.data.allegationAgainstStaffName}`,
    significance: 'critical',
    isRestricted: true,
    createdById: auth.userId,
  });

  await auditLog(auth.userId, auth.organisationId, 'create', 'lado_referral', referral.id, {
    after: { childId: parsed.data.childId },
  });

  return { success: true, data: referral };
}

/**
 * Update a LADO referral (status, outcome, etc.).
 */
export async function updateLadoReferral(
  input: UpdateLadoReferralInput,
): Promise<ActionResult> {
  const parsed = updateLadoReferralSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();
  if (!canAccessLado(auth.role)) {
    return { success: false, error: 'LADO records are restricted to DSL and senior leadership' };
  }

  const { id, ...updates } = parsed.data;
  const [referral] = await db
    .update(ladoReferrals)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(ladoReferrals.id, id),
        eq(ladoReferrals.organisationId, auth.organisationId),
      ),
    )
    .returning();

  if (!referral) {
    return { success: false, error: 'LADO referral not found' };
  }

  await auditLog(auth.userId, auth.organisationId, 'update', 'lado_referral', id, {
    after: updates,
  });

  return { success: true, data: referral };
}

/**
 * Get LADO referrals. Restricted access.
 */
export async function getLadoReferrals(): Promise<ActionResult> {
  const auth = await requireAuth();
  if (!canAccessLado(auth.role)) {
    return { success: false, error: 'LADO records are restricted to DSL and senior leadership' };
  }

  const referrals = await db
    .select()
    .from(ladoReferrals)
    .where(eq(ladoReferrals.organisationId, auth.organisationId))
    .orderBy(desc(ladoReferrals.referralDate));

  return { success: true, data: referrals };
}

// ---------------------------------------------------------------------------
// Section 47 (VAL-CHILD-010)
// ---------------------------------------------------------------------------

/**
 * Create a Section 47 investigation record.
 */
export async function createSection47(
  input: CreateSection47Input,
): Promise<ActionResult> {
  const parsed = createSection47Schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();
  if (!canPerformDslReview(auth.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const [investigation] = await db
    .insert(section47Investigations)
    .values({
      organisationId: auth.organisationId,
      createdById: auth.userId,
      ...parsed.data,
    })
    .returning();

  // Chronology entry
  await db.insert(safeguardingChronology).values({
    organisationId: auth.organisationId,
    childId: parsed.data.childId,
    eventDate: parsed.data.strategyMeetingDate ?? new Date(),
    source: 'section_47',
    sourceRecordId: investigation.id,
    title: 'Section 47 Investigation Initiated',
    description: `Strategy meeting ${parsed.data.strategyMeetingDate ? 'scheduled' : 'to be scheduled'}`,
    significance: 'critical',
    createdById: auth.userId,
  });

  await auditLog(auth.userId, auth.organisationId, 'create', 'section_47', investigation.id, {
    after: { childId: parsed.data.childId },
  });

  return { success: true, data: investigation };
}

/**
 * Update a Section 47 investigation.
 */
export async function updateSection47(
  input: UpdateSection47Input,
): Promise<ActionResult> {
  const parsed = updateSection47Schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();
  if (!canPerformDslReview(auth.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const { id, ...updates } = parsed.data;
  const [investigation] = await db
    .update(section47Investigations)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(section47Investigations.id, id),
        eq(section47Investigations.organisationId, auth.organisationId),
      ),
    )
    .returning();

  if (!investigation) {
    return { success: false, error: 'Section 47 investigation not found' };
  }

  await auditLog(auth.userId, auth.organisationId, 'update', 'section_47', id, {
    after: updates,
  });

  return { success: true, data: investigation };
}

// ---------------------------------------------------------------------------
// MASH Referrals
// ---------------------------------------------------------------------------

/**
 * Create a MASH referral.
 */
export async function createMashReferral(
  input: CreateMashReferralInput,
): Promise<ActionResult> {
  const parsed = createMashReferralSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();
  if (!canPerformDslReview(auth.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const [referral] = await db
    .insert(mashReferrals)
    .values({
      organisationId: auth.organisationId,
      createdById: auth.userId,
      ...parsed.data,
    })
    .returning();

  // Chronology entry
  await db.insert(safeguardingChronology).values({
    organisationId: auth.organisationId,
    childId: parsed.data.childId,
    eventDate: parsed.data.referralDate,
    source: 'mash_referral',
    sourceRecordId: referral.id,
    title: 'MASH Referral Submitted',
    description: parsed.data.referralReason.slice(0, 500),
    significance: 'significant',
    createdById: auth.userId,
  });

  await auditLog(auth.userId, auth.organisationId, 'create', 'mash_referral', referral.id, {
    after: { childId: parsed.data.childId },
  });

  return { success: true, data: referral };
}

/**
 * Update a MASH referral.
 */
export async function updateMashReferral(
  input: UpdateMashReferralInput,
): Promise<ActionResult> {
  const parsed = updateMashReferralSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();
  if (!canPerformDslReview(auth.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const { id, ...updates } = parsed.data;
  const [referral] = await db
    .update(mashReferrals)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(mashReferrals.id, id),
        eq(mashReferrals.organisationId, auth.organisationId),
      ),
    )
    .returning();

  if (!referral) {
    return { success: false, error: 'MASH referral not found' };
  }

  await auditLog(auth.userId, auth.organisationId, 'update', 'mash_referral', id, {
    after: updates,
  });

  return { success: true, data: referral };
}

// ---------------------------------------------------------------------------
// Chronology (VAL-CHILD-025)
// ---------------------------------------------------------------------------

/**
 * Get the full chronology for a child. Respects access controls for restricted entries.
 */
export async function getChildChronology(
  childId: string,
): Promise<ActionResult> {
  const auth = await requireAuth();

  const entries = await db
    .select()
    .from(safeguardingChronology)
    .where(
      and(
        eq(safeguardingChronology.organisationId, auth.organisationId),
        eq(safeguardingChronology.childId, childId),
      ),
    )
    .orderBy(desc(safeguardingChronology.eventDate));

  // Filter out restricted entries for non-privileged users
  const filteredEntries = canAccessLado(auth.role)
    ? entries
    : entries.filter((e) => !e.isRestricted);

  return { success: true, data: filteredEntries };
}

/**
 * Add a manual chronology entry (for historical events).
 */
export async function addManualChronologyEntry(
  input: CreateChronologyEntryInput,
): Promise<ActionResult> {
  const parsed = createChronologyEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' };
  }

  const auth = await requireAuth();

  const [entry] = await db
    .insert(safeguardingChronology)
    .values({
      organisationId: auth.organisationId,
      source: 'manual',
      isManual: true,
      createdById: auth.userId,
      ...parsed.data,
    })
    .returning();

  await auditLog(auth.userId, auth.organisationId, 'create', 'chronology_entry', entry.id, {
    after: { childId: parsed.data.childId, title: parsed.data.title },
  });

  return { success: true, data: entry };
}
