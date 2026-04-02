'use server';

import { db } from '@/lib/db';
import { familyMembers } from '@/lib/db/schema/family-portal';
import { users } from '@/lib/db/schema/users';
import { eq, and } from 'drizzle-orm';
import {
  approveFamilyMemberSchema,
  type ApproveFamilyMemberInput,
} from '../types';

/**
 * Approve or reject a family member's access request.
 */
export async function reviewFamilyMember(
  organisationId: string,
  reviewerId: string,
  input: ApproveFamilyMemberInput,
) {
  const parsed = approveFamilyMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const newStatus = parsed.data.action === 'approve' ? 'approved' : 'revoked';

  const [updated] = await db
    .update(familyMembers)
    .set({
      status: newStatus,
      approvedBy: parsed.data.action === 'approve' ? reviewerId : null,
      approvedAt: parsed.data.action === 'approve' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(familyMembers.id, parsed.data.familyMemberId),
        eq(familyMembers.organisationId, organisationId),
        eq(familyMembers.status, 'pending_approval'),
      ),
    )
    .returning();

  if (!updated) {
    return {
      success: false as const,
      error: 'Family member not found or not pending approval',
    };
  }

  return { success: true as const, data: updated };
}

/**
 * Suspend an approved family member's access.
 */
export async function suspendFamilyMember(
  organisationId: string,
  familyMemberId: string,
) {
  const [updated] = await db
    .update(familyMembers)
    .set({ status: 'suspended', updatedAt: new Date() })
    .where(
      and(
        eq(familyMembers.id, familyMemberId),
        eq(familyMembers.organisationId, organisationId),
        eq(familyMembers.status, 'approved'),
      ),
    )
    .returning();

  if (!updated) {
    return { success: false as const, error: 'Family member not found or not active' };
  }

  return { success: true as const, data: updated };
}

/**
 * List family members for a person, including user details.
 */
export async function listFamilyMembers(
  organisationId: string,
  personId: string,
) {
  const members = await db
    .select({
      id: familyMembers.id,
      userId: familyMembers.userId,
      personId: familyMembers.personId,
      relationship: familyMembers.relationship,
      status: familyMembers.status,
      approvedAt: familyMembers.approvedAt,
      createdAt: familyMembers.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(familyMembers)
    .innerJoin(users, eq(familyMembers.userId, users.id))
    .where(
      and(
        eq(familyMembers.organisationId, organisationId),
        eq(familyMembers.personId, personId),
      ),
    )
    .orderBy(familyMembers.createdAt);

  return { success: true as const, data: members };
}

/**
 * Get all persons linked to a family member user.
 */
export async function getFamilyMemberPersons(
  organisationId: string,
  userId: string,
) {
  const linkedPersons = await db
    .select()
    .from(familyMembers)
    .where(
      and(
        eq(familyMembers.organisationId, organisationId),
        eq(familyMembers.userId, userId),
        eq(familyMembers.status, 'approved'),
      ),
    );

  return { success: true as const, data: linkedPersons };
}
