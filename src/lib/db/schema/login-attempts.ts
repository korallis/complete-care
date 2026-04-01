import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';

/**
 * Login Attempts — tracks failed login attempts per email address for rate limiting.
 * After 5 failed attempts, the account is locked for 15 minutes.
 * Successful login resets the attempt counter.
 */
export const loginAttempts = pgTable(
  'login_attempts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Email address being tracked (normalised to lowercase) */
    email: text('email').notNull().unique(),
    /** Number of consecutive failed attempts */
    attempts: integer('attempts').notNull().default(0),
    /** Timestamp until which the account is locked. Null if not locked. */
    lockedUntil: timestamp('locked_until'),
    /** Timestamp of the most recent failed attempt */
    lastAttemptAt: timestamp('last_attempt_at').defaultNow().notNull(),
  },
  (t) => [index('login_attempts_email_idx').on(t.email)],
);

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type NewLoginAttempt = typeof loginAttempts.$inferInsert;
