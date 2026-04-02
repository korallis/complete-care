'use server';

import { db } from '@/lib/db';
import {
  familyMessages,
  familyPortalSettings,
  familyNotifications,
} from '@/lib/db/schema/family-portal';
import { users } from '@/lib/db/schema/users';
import { eq, and, desc } from 'drizzle-orm';
import {
  sendMessageSchema,
  reviewMessageSchema,
  type SendMessageInput,
  type ReviewMessageInput,
} from '../types';

/**
 * Send a message in the family portal.
 * If the organisation has message approval enabled, family messages default to pending.
 */
export async function sendMessage(
  organisationId: string,
  senderId: string,
  senderType: 'family' | 'staff',
  input: SendMessageInput,
) {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  // Check if approval is required for this org
  let requiresApproval = false;
  if (senderType === 'family') {
    const [settings] = await db
      .select()
      .from(familyPortalSettings)
      .where(eq(familyPortalSettings.organisationId, organisationId))
      .limit(1);

    requiresApproval = settings?.messageApprovalRequired ?? false;
  }

  const [message] = await db
    .insert(familyMessages)
    .values({
      organisationId,
      personId: parsed.data.personId,
      senderId,
      senderType,
      content: parsed.data.content,
      requiresApproval,
      approvalStatus: requiresApproval ? 'pending' : 'approved',
    })
    .returning();

  return { success: true as const, data: message };
}

/**
 * Review (approve/reject) a pending message.
 */
export async function reviewMessage(
  organisationId: string,
  reviewerId: string,
  input: ReviewMessageInput,
) {
  const parsed = reviewMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors };
  }

  const newStatus = parsed.data.action === 'approve' ? 'approved' : 'rejected';

  const [updated] = await db
    .update(familyMessages)
    .set({
      approvalStatus: newStatus,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(
      and(
        eq(familyMessages.id, parsed.data.messageId),
        eq(familyMessages.organisationId, organisationId),
        eq(familyMessages.approvalStatus, 'pending'),
      ),
    )
    .returning();

  if (!updated) {
    return { success: false as const, error: 'Message not found or already reviewed' };
  }

  return { success: true as const, data: updated };
}

/**
 * Get message history for a person, visible to the requesting user.
 * Family members only see approved messages. Staff see all messages.
 */
export async function getMessages(
  organisationId: string,
  personId: string,
  viewerType: 'family' | 'staff',
  limit = 50,
  offset = 0,
) {
  // Build base query with sender user info
  const allMessages = await db
    .select({
      id: familyMessages.id,
      personId: familyMessages.personId,
      senderId: familyMessages.senderId,
      senderType: familyMessages.senderType,
      content: familyMessages.content,
      approvalStatus: familyMessages.approvalStatus,
      createdAt: familyMessages.createdAt,
      senderName: users.name,
    })
    .from(familyMessages)
    .innerJoin(users, eq(familyMessages.senderId, users.id))
    .where(
      and(
        eq(familyMessages.organisationId, organisationId),
        eq(familyMessages.personId, personId),
        // Family members only see approved messages
        ...(viewerType === 'family'
          ? [eq(familyMessages.approvalStatus, 'approved')]
          : []),
      ),
    )
    .orderBy(desc(familyMessages.createdAt))
    .limit(limit)
    .offset(offset);

  return { success: true as const, data: allMessages };
}

/**
 * Get pending messages for staff review.
 */
export async function getPendingMessages(organisationId: string) {
  const pending = await db
    .select({
      id: familyMessages.id,
      personId: familyMessages.personId,
      senderId: familyMessages.senderId,
      senderType: familyMessages.senderType,
      content: familyMessages.content,
      createdAt: familyMessages.createdAt,
      senderName: users.name,
    })
    .from(familyMessages)
    .innerJoin(users, eq(familyMessages.senderId, users.id))
    .where(
      and(
        eq(familyMessages.organisationId, organisationId),
        eq(familyMessages.approvalStatus, 'pending'),
      ),
    )
    .orderBy(familyMessages.createdAt);

  return { success: true as const, data: pending };
}

/**
 * Create a notification for a family member.
 */
export async function createFamilyNotification(
  organisationId: string,
  userId: string,
  personId: string,
  type: string,
  title: string,
  body?: string,
  referenceId?: string,
) {
  const [notification] = await db
    .insert(familyNotifications)
    .values({
      organisationId,
      userId,
      personId,
      type,
      title,
      body: body ?? null,
      referenceId: referenceId ?? null,
    })
    .returning();

  return { success: true as const, data: notification };
}
