'use server';

/**
 * Notification server actions.
 * 
 * Handles reading, marking as read, and marking all as read.
 * All actions are tenant-scoped to the authenticated user's active org.
 */

import { revalidatePath } from 'next/cache';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetch recent notifications for the current user in the active org.
 * Returns the 20 most recent notifications.
 */
export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return { notifications: [], unreadCount: 0 };
  }

  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.organisationId, session.user.activeOrgId),
      ),
    )
    .orderBy(desc(notifications.createdAt))
    .limit(20);

  const unreadCount = rows.filter((n) => !n.readAt).length;

  return { notifications: rows, unreadCount };
}

/**
 * Get only the unread notification count (lightweight, for badge rendering).
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) return 0;

  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.organisationId, session.user.activeOrgId),
        isNull(notifications.readAt),
      ),
    );

  return rows.length;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return { error: 'Unauthorized' };
  }

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id),
        eq(notifications.organisationId, session.user.activeOrgId),
      ),
    );

  revalidatePath('/');
  return { success: true };
}

/**
 * Mark all notifications as read for the current user in the active org.
 */
export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id || !session.user.activeOrgId) {
    return { error: 'Unauthorized' };
  }

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.organisationId, session.user.activeOrgId),
        isNull(notifications.readAt),
      ),
    );

  revalidatePath('/');
  return { success: true };
}

/**
 * Create a notification (used by system/background jobs, not user-facing).
 * Useful for seeding test data.
 */
export async function createNotification({
  userId,
  organisationId,
  type,
  title,
  body,
  entityType,
  entityId,
  actionUrl,
}: {
  userId: string;
  organisationId: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}) {
  await db.insert(notifications).values({
    userId,
    organisationId,
    type,
    title,
    body,
    entityType,
    entityId,
    actionUrl,
  });
}
