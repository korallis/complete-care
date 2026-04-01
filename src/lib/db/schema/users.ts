import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Users — platform-level user accounts.
 * Users belong to one or more organisations via memberships.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  /** Bcrypt hash. Null for OAuth-only users. */
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').notNull().default(false),
  /** Profile image URL (from OAuth provider or uploaded) */
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
