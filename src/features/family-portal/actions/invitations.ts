'use server';

import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { familyInvitations, familyMembers } from '@/lib/db/schema/family-portal';
import { eq, and } from 'drizzle-orm';
import {
  createInvitationSchema,
  type CreateInvitationInput,
} from '../types';

/**
 * Create a family member invitation.
 * Staff invites a family member via email to access a specific person's portal.
 */
export async function createInvitation(
  organisationId: string,
  invitedBy: string,
  input: CreateInvitationInput,
) {
  const parsed = createInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  const [invitation] = await db
    .insert(familyInvitations)
    .values({
      organisationId,
      personId: parsed.data.personId,
      email: parsed.data.email,
      name: parsed.data.name,
      relationship: parsed.data.relationship,
      token,
      invitedBy,
      expiresAt,
    })
    .returning();

  return { success: true as const, data: invitation };
}

/**
 * Accept an invitation by token. Creates a pending family member record.
 */
export async function acceptInvitation(token: string, userId: string) {
  const [invitation] = await db
    .select()
    .from(familyInvitations)
    .where(
      and(
        eq(familyInvitations.token, token),
        eq(familyInvitations.status, 'pending'),
      ),
    )
    .limit(1);

  if (!invitation) {
    return { success: false as const, error: 'Invitation not found or already used' };
  }

  if (new Date() > invitation.expiresAt) {
    await db
      .update(familyInvitations)
      .set({ status: 'expired' })
      .where(eq(familyInvitations.id, invitation.id));
    return { success: false as const, error: 'Invitation has expired' };
  }

  // Mark invitation as accepted
  await db
    .update(familyInvitations)
    .set({ status: 'accepted' })
    .where(eq(familyInvitations.id, invitation.id));

  // Create family member record (pending approval)
  const [familyMember] = await db
    .insert(familyMembers)
    .values({
      organisationId: invitation.organisationId,
      userId,
      personId: invitation.personId,
      relationship: invitation.relationship,
      status: 'pending_approval',
    })
    .returning();

  return { success: true as const, data: familyMember };
}

/**
 * Revoke a pending invitation.
 */
export async function revokeInvitation(
  organisationId: string,
  invitationId: string,
) {
  const [updated] = await db
    .update(familyInvitations)
    .set({ status: 'revoked' })
    .where(
      and(
        eq(familyInvitations.id, invitationId),
        eq(familyInvitations.organisationId, organisationId),
        eq(familyInvitations.status, 'pending'),
      ),
    )
    .returning();

  if (!updated) {
    return { success: false as const, error: 'Invitation not found or already processed' };
  }

  return { success: true as const, data: updated };
}

/**
 * List invitations for a person.
 */
export async function listInvitations(
  organisationId: string,
  personId: string,
) {
  const invitations = await db
    .select()
    .from(familyInvitations)
    .where(
      and(
        eq(familyInvitations.organisationId, organisationId),
        eq(familyInvitations.personId, personId),
      ),
    )
    .orderBy(familyInvitations.createdAt);

  return { success: true as const, data: invitations };
}
