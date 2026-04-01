import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { organisations } from './organisations';

/**
 * Invitations — tracks team member invitations sent from an organisation.
 *
 * States:
 * - pending: invitation sent, awaiting acceptance
 * - accepted: invitee clicked the link and joined the org
 * - expired: invitation was not accepted within 7 days
 * - revoked: owner/admin manually cancelled the invitation
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Email address the invitation was sent to */
    email: text('email').notNull(),
    /** RBAC role the invitee will receive on joining */
    role: text('role').notNull().default('carer'),
    /** Cryptographically secure random token for the invitation URL */
    token: text('token').notNull().unique(),
    /** Invitation lifecycle state */
    status: text('status').notNull().default('pending'),
    /** The user who sent the invitation */
    invitedBy: uuid('invited_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** When the invitation expires (7 days from creation) */
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    // Efficient lookup of all invitations for an organisation
    index('invitations_organisation_id_idx').on(t.organisationId),
    // Prevent duplicate pending invites to the same email in the same org
    unique('invitations_org_email_unique').on(t.organisationId, t.email),
    // Fast token lookup for acceptance flow
    index('invitations_token_idx').on(t.token),
  ],
);

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;

/** Invitation status constants */
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

export type InvitationStatus =
  (typeof INVITATION_STATUS)[keyof typeof INVITATION_STATUS];

/** Invitation expiry: 7 days */
export const INVITATION_EXPIRY_DAYS = 7;

export function invitationExpiry(): Date {
  return new Date(
    Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
}
