'use server';

import { checkPhotoConsent } from '@/features/consent/manager';
import type { Consent } from '@/features/consent/types';
import { db } from '@/lib/db';
import {
  consentRecords,
  familyPortalSettings,
  familyUpdates,
} from '@/lib/db/schema';
import { users } from '@/lib/db/schema/users';
import { and, desc, eq } from 'drizzle-orm';
import {
  filterUpdatesForFamilyPortal,
  requiresPhotoConsent,
} from '../lib/update-visibility';
import {
  createUpdateSchema,
  reviewUpdateSchema,
  type CreateUpdateInput,
  type ReviewUpdateInput,
} from '../types';

function toConsentRecord(record: {
  id: string;
  personId: string;
  consentType: string;
  status: string;
  grantedDate: string;
  withdrawnDate: string | null;
  givenBy: string;
  relationship: string;
  conditions: string | null;
  reviewDate: string | null;
}): Consent {
  return {
    id: record.id,
    personId: record.personId,
    consentType: record.consentType as Consent['consentType'],
    status: record.status as Consent['status'],
    grantedDate: record.grantedDate,
    withdrawnDate: record.withdrawnDate,
    givenBy: record.givenBy,
    relationship: record.relationship as Consent['relationship'],
    conditions: record.conditions,
    reviewDate: record.reviewDate,
  };
}

/**
 * Create a photo/update to share with family members.
 * Respects organisation-level approval settings.
 */
export async function createUpdate(
  organisationId: string,
  createdBy: string,
  input: CreateUpdateInput,
) {
  const parsed = createUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  if (requiresPhotoConsent(parsed.data)) {
    const consentRows = await db
      .select({
        id: consentRecords.id,
        personId: consentRecords.personId,
        consentType: consentRecords.consentType,
        status: consentRecords.status,
        grantedDate: consentRecords.grantedDate,
        withdrawnDate: consentRecords.withdrawnDate,
        givenBy: consentRecords.givenBy,
        relationship: consentRecords.relationship,
        conditions: consentRecords.conditions,
        reviewDate: consentRecords.reviewDate,
      })
      .from(consentRecords)
      .where(
        and(
          eq(consentRecords.organisationId, organisationId),
          eq(consentRecords.personId, parsed.data.personId),
          eq(consentRecords.consentType, 'photography'),
        ),
      )
      .orderBy(desc(consentRecords.grantedDate));

    const photoEligibility = checkPhotoConsent(
      consentRows.map(toConsentRecord),
      parsed.data.personId,
    );

    if (!photoEligibility.allowed) {
      return { success: false as const, error: photoEligibility.reason };
    }
  }

  const [settings] = await db
    .select()
    .from(familyPortalSettings)
    .where(eq(familyPortalSettings.organisationId, organisationId))
    .limit(1);

  const requiresApproval = settings?.updateApprovalRequired ?? false;
  const status = requiresApproval ? 'pending_approval' : 'published';

  const [update] = await db
    .insert(familyUpdates)
    .values({
      organisationId,
      personId: parsed.data.personId,
      createdBy,
      title: parsed.data.title,
      content: parsed.data.content,
      updateType: parsed.data.updateType,
      mediaUrls: parsed.data.mediaUrls,
      requiresApproval,
      status,
      publishedAt: requiresApproval ? null : new Date(),
    })
    .returning();

  return { success: true as const, data: update };
}

/**
 * Review (approve/reject) a pending update.
 */
export async function reviewUpdate(
  organisationId: string,
  reviewerId: string,
  input: ReviewUpdateInput,
) {
  const parsed = reviewUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const isApproved = parsed.data.action === 'approve';
  const newStatus = isApproved ? 'published' : 'rejected';

  const [updated] = await db
    .update(familyUpdates)
    .set({
      status: newStatus,
      approvedBy: isApproved ? reviewerId : null,
      approvedAt: isApproved ? new Date() : null,
      publishedAt: isApproved ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(familyUpdates.id, parsed.data.updateId),
        eq(familyUpdates.organisationId, organisationId),
        eq(familyUpdates.status, 'pending_approval'),
      ),
    )
    .returning();

  if (!updated) {
    return { success: false as const, error: 'Update not found or already reviewed' };
  }

  return { success: true as const, data: updated };
}

/**
 * Get published updates for a person (family view).
 */
export async function getPublishedUpdates(
  organisationId: string,
  personId: string,
  limit = 20,
  offset = 0,
) {
  const updates = await db
    .select({
      id: familyUpdates.id,
      personId: familyUpdates.personId,
      title: familyUpdates.title,
      content: familyUpdates.content,
      updateType: familyUpdates.updateType,
      mediaUrls: familyUpdates.mediaUrls,
      publishedAt: familyUpdates.publishedAt,
      createdByName: users.name,
    })
    .from(familyUpdates)
    .innerJoin(users, eq(familyUpdates.createdBy, users.id))
    .where(
      and(
        eq(familyUpdates.organisationId, organisationId),
        eq(familyUpdates.personId, personId),
        eq(familyUpdates.status, 'published'),
      ),
    )
    .orderBy(desc(familyUpdates.publishedAt))
    .limit(limit)
    .offset(offset);

  const consentRows = await db
    .select({
      id: consentRecords.id,
      personId: consentRecords.personId,
      consentType: consentRecords.consentType,
      status: consentRecords.status,
      grantedDate: consentRecords.grantedDate,
      withdrawnDate: consentRecords.withdrawnDate,
      givenBy: consentRecords.givenBy,
      relationship: consentRecords.relationship,
      conditions: consentRecords.conditions,
      reviewDate: consentRecords.reviewDate,
    })
    .from(consentRecords)
    .where(
      and(
        eq(consentRecords.organisationId, organisationId),
        eq(consentRecords.personId, personId),
        eq(consentRecords.consentType, 'photography'),
      ),
    )
    .orderBy(desc(consentRecords.grantedDate));

  const photoEligibility = checkPhotoConsent(
    consentRows.map(toConsentRecord),
    personId,
  );

  return {
    success: true as const,
    data: filterUpdatesForFamilyPortal(updates, photoEligibility.allowed),
  };
}

/**
 * Get all updates for a person (staff view — includes pending/rejected).
 */
export async function getAllUpdates(
  organisationId: string,
  personId: string,
  limit = 20,
  offset = 0,
) {
  const updates = await db
    .select({
      id: familyUpdates.id,
      personId: familyUpdates.personId,
      title: familyUpdates.title,
      content: familyUpdates.content,
      updateType: familyUpdates.updateType,
      mediaUrls: familyUpdates.mediaUrls,
      status: familyUpdates.status,
      publishedAt: familyUpdates.publishedAt,
      createdAt: familyUpdates.createdAt,
      createdByName: users.name,
    })
    .from(familyUpdates)
    .innerJoin(users, eq(familyUpdates.createdBy, users.id))
    .where(
      and(
        eq(familyUpdates.organisationId, organisationId),
        eq(familyUpdates.personId, personId),
      ),
    )
    .orderBy(desc(familyUpdates.createdAt))
    .limit(limit)
    .offset(offset);

  return { success: true as const, data: updates };
}

/**
 * Get pending updates for staff review.
 */
export async function getPendingUpdates(organisationId: string) {
  const pending = await db
    .select({
      id: familyUpdates.id,
      personId: familyUpdates.personId,
      title: familyUpdates.title,
      content: familyUpdates.content,
      updateType: familyUpdates.updateType,
      mediaUrls: familyUpdates.mediaUrls,
      createdAt: familyUpdates.createdAt,
      createdByName: users.name,
    })
    .from(familyUpdates)
    .innerJoin(users, eq(familyUpdates.createdBy, users.id))
    .where(
      and(
        eq(familyUpdates.organisationId, organisationId),
        eq(familyUpdates.status, 'pending_approval'),
      ),
    )
    .orderBy(familyUpdates.createdAt);

  return { success: true as const, data: pending };
}
