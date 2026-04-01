import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

/**
 * Password Reset Tokens — one-time tokens for password reset flow.
 * Tokens expire after 1 hour. Tokens are marked used after redemption.
 * Stored against email (not userId) to handle edge cases where user email changes.
 */
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Email address for which the reset was requested */
    email: text('email').notNull(),
    /** Secure random token (hex string) */
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    /** Marked true after successful password reset to prevent reuse */
    used: boolean('used').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('password_reset_tokens_email_idx').on(t.email),
    index('password_reset_tokens_token_idx').on(t.token),
  ],
);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
