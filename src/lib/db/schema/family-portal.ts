import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  index,
  unique,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { organisations } from './organisations';

/**
 * Family invitations — email-based invitations for family members.
 * A staff member invites a family member to access a specific person's information.
 * The invitation must be approved by staff before access is granted.
 */
export const familyInvitations = pgTable(
  'family_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (resident/client/young person) the family member is being linked to */
    personId: uuid('person_id').notNull(),
    /** Email address of the invited family member */
    email: text('email').notNull(),
    /** Name of the invited family member */
    name: text('name').notNull(),
    /** Relationship to the person: parent | sibling | spouse | child | guardian | other */
    relationship: text('relationship').notNull(),
    /** Invitation status: pending | accepted | expired | revoked */
    status: text('status').notNull().default('pending'),
    /** Unique token for the invitation link */
    token: text('token').notNull().unique(),
    /** Staff member who sent the invitation */
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** When the invitation expires */
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('family_invitations_org_idx').on(t.organisationId),
    index('family_invitations_person_idx').on(t.personId),
    index('family_invitations_email_idx').on(t.email),
    index('family_invitations_token_idx').on(t.token),
  ],
);

/**
 * Family members — approved family member accounts linked to persons.
 * Created after a family member accepts an invitation and is approved by staff.
 */
export const familyMembers = pgTable(
  'family_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The user account for this family member */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** The person this family member is linked to */
    personId: uuid('person_id').notNull(),
    /** Relationship to the person */
    relationship: text('relationship').notNull(),
    /** Approval status: pending_approval | approved | suspended | revoked */
    status: text('status').notNull().default('pending_approval'),
    /** Staff member who approved access */
    approvedBy: uuid('approved_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    unique('family_members_user_person_unique').on(t.userId, t.personId),
    index('family_members_org_idx').on(t.organisationId),
    index('family_members_user_idx').on(t.userId),
    index('family_members_person_idx').on(t.personId),
  ],
);

/**
 * Family messages — secure messaging between family members and care team.
 * Messages can optionally require staff approval before being shared.
 */
export const familyMessages = pgTable(
  'family_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this message thread relates to */
    personId: uuid('person_id').notNull(),
    /** The user who sent the message (family member or staff) */
    senderId: uuid('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Whether the sender is a family member or staff */
    senderType: text('sender_type').notNull(), // 'family' | 'staff'
    /** Message content */
    content: text('content').notNull(),
    /** Whether this message requires approval before being visible */
    requiresApproval: boolean('requires_approval').notNull().default(false),
    /** Approval status: approved | pending | rejected */
    approvalStatus: text('approval_status').notNull().default('approved'),
    /** Staff member who approved/rejected the message */
    reviewedBy: uuid('reviewed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('family_messages_org_idx').on(t.organisationId),
    index('family_messages_person_idx').on(t.personId),
    index('family_messages_sender_idx').on(t.senderId),
    index('family_messages_created_at_idx').on(t.createdAt),
  ],
);

/**
 * Family portal updates — staff-shared photos and updates visible to family.
 * Supports optional approval workflow before publishing.
 */
export const familyUpdates = pgTable(
  'family_updates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this update relates to */
    personId: uuid('person_id').notNull(),
    /** Staff member who created the update */
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Update title */
    title: text('title').notNull(),
    /** Update content/description */
    content: text('content').notNull(),
    /** Type of update: general | photo | milestone | activity */
    updateType: text('update_type').notNull().default('general'),
    /** Photo/media URLs (stored as JSON array) */
    mediaUrls: jsonb('media_urls').$type<string[]>().default([]),
    /** Whether this update requires approval before being visible to family */
    requiresApproval: boolean('requires_approval').notNull().default(false),
    /** Publication status: draft | pending_approval | published | rejected */
    status: text('status').notNull().default('published'),
    /** Staff member who approved the update */
    approvedBy: uuid('approved_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('family_updates_org_idx').on(t.organisationId),
    index('family_updates_person_idx').on(t.personId),
    index('family_updates_status_idx').on(t.status),
    index('family_updates_published_at_idx').on(t.publishedAt),
  ],
);

/**
 * Family portal settings — per-organisation configuration for the family portal.
 * Controls messaging approval requirements, visible sections, etc.
 */
export const familyPortalSettings = pgTable('family_portal_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' })
    .unique(),
  /** Whether family messages require staff approval before being visible */
  messageApprovalRequired: boolean('message_approval_required')
    .notNull()
    .default(false),
  /** Whether photo/update sharing requires approval */
  updateApprovalRequired: boolean('update_approval_required')
    .notNull()
    .default(false),
  /** Which care information sections are visible to family: care_plans | care_notes | medications | appointments */
  visibleSections: jsonb('visible_sections')
    .$type<string[]>()
    .default(['care_plans', 'care_notes', 'medications', 'appointments']),
  /** Invitation expiry duration in hours */
  invitationExpiryHours: text('invitation_expiry_hours')
    .notNull()
    .default('72'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Family notifications — tracks notifications sent to family members.
 */
export const familyNotifications = pgTable(
  'family_notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The family member user receiving the notification */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** The person this notification relates to */
    personId: uuid('person_id').notNull(),
    /** Notification type: message | update | invitation | approval */
    type: text('type').notNull(),
    /** Notification title */
    title: text('title').notNull(),
    /** Notification body */
    body: text('body'),
    /** Reference to the related entity (message, update, etc.) */
    referenceId: uuid('reference_id'),
    /** Whether the notification has been read */
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('family_notifications_org_idx').on(t.organisationId),
    index('family_notifications_user_idx').on(t.userId),
    index('family_notifications_read_idx').on(t.read),
    index('family_notifications_created_at_idx').on(t.createdAt),
  ],
);

// Type exports
export type FamilyInvitation = typeof familyInvitations.$inferSelect;
export type NewFamilyInvitation = typeof familyInvitations.$inferInsert;
export type FamilyMember = typeof familyMembers.$inferSelect;
export type NewFamilyMember = typeof familyMembers.$inferInsert;
export type FamilyMessage = typeof familyMessages.$inferSelect;
export type NewFamilyMessage = typeof familyMessages.$inferInsert;
export type FamilyUpdate = typeof familyUpdates.$inferSelect;
export type NewFamilyUpdate = typeof familyUpdates.$inferInsert;
export type FamilyPortalSettings = typeof familyPortalSettings.$inferSelect;
export type NewFamilyPortalSettings = typeof familyPortalSettings.$inferInsert;
export type FamilyNotification = typeof familyNotifications.$inferSelect;
export type NewFamilyNotification = typeof familyNotifications.$inferInsert;
