/**
 * Notifications schema — in-app notification centre.
 *
 * Stores system-generated and action-triggered notifications for users.
 * Notifications are tenant-scoped (organisationId required).
 *
 * Types:
 * - care_plan_review: care plan approaching/overdue review
 * - risk_alert: high/critical risk assessment raised
 * - dbs_expiry: DBS check approaching expiry
 * - training_expiry: training certificate expiring
 * - supervision_due: supervision overdue
 * - invite_accepted: team member accepted invite
 * - general: generic platform notification
 */

import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organisations } from './organisations';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** The user who should receive this notification */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Tenant scope — all notifications belong to an org context */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Notification category for filtering and icon selection */
    type: text('type').notNull().default('general'),
    /** Short title shown in the notification list */
    title: text('title').notNull(),
    /** Optional longer body text */
    body: text('body'),
    /** The type of entity this notification relates to (e.g. 'care_plan', 'staff_profile') */
    entityType: text('entity_type'),
    /** The ID of the related entity for deep-linking */
    entityId: uuid('entity_id'),
    /** URL to navigate to when the notification is clicked */
    actionUrl: text('action_url'),
    /** When the user read/dismissed this notification (null = unread) */
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    /** Fast lookup of all notifications for a user in an org, newest first */
    index('notifications_user_org_idx').on(table.userId, table.organisationId, table.createdAt),
    /** Efficiently count unread notifications */
    index('notifications_user_unread_idx').on(table.userId, table.readAt),
  ],
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
