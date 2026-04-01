/**
 * Auth.js v5 — Full configuration.
 * Includes Credentials provider with bcrypt password comparison.
 * NOT for use in Edge runtime — use auth.config.ts for middleware.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authConfig } from './auth.config';
import { db } from '@/lib/db';
import { users, loginAttempts } from '@/lib/db/schema';

/** Maximum failed login attempts before lockout */
const MAX_ATTEMPTS = 5;
/** Lockout duration in milliseconds (15 minutes) */
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Check rate limiting — look up login attempts record
        const [attemptRecord] = await db
          .select()
          .from(loginAttempts)
          .where(eq(loginAttempts.email, normalizedEmail))
          .limit(1);

        if (attemptRecord?.lockedUntil) {
          const lockExpiry = new Date(attemptRecord.lockedUntil);
          if (lockExpiry > new Date()) {
            // Still locked — throw to signal lockout
            throw new Error('LOCKED');
          }
        }

        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (!user || !user.passwordHash) {
          // Record failed attempt even for non-existent user (prevent timing attacks)
          await recordFailedAttempt(normalizedEmail);
          return null;
        }

        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
          await recordFailedAttempt(normalizedEmail);
          return null;
        }

        // Successful login — reset attempt counter
        await db
          .delete(loginAttempts)
          .where(eq(loginAttempts.email, normalizedEmail));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, `user` is populated with the return value of `authorize`
      if (user) {
        token.id = user.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.emailVerified = user.emailVerified ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id ?? token.sub) as string;
        // Auth.js's User.emailVerified is Date | null, but we store it as boolean.
        // Cast through unknown to avoid the intersection type error.
        (session.user as unknown as { emailVerified: boolean }).emailVerified =
          (token.emailVerified as boolean) ?? false;
      }
      return session;
    },
  },
});

/**
 * Records a failed login attempt for an email address.
 * Locks the account after MAX_ATTEMPTS consecutive failures.
 */
async function recordFailedAttempt(email: string): Promise<void> {
  const now = new Date();

  const [existing] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, email))
    .limit(1);

  if (!existing) {
    await db.insert(loginAttempts).values({
      email,
      attempts: 1,
      lastAttemptAt: now,
    });
    return;
  }

  const newAttempts = (existing.attempts ?? 0) + 1;
  const shouldLock = newAttempts >= MAX_ATTEMPTS;

  if (shouldLock) {
    const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
    await db
      .update(loginAttempts)
      .set({ attempts: newAttempts, lockedUntil, lastAttemptAt: now })
      .where(eq(loginAttempts.email, email));
  } else {
    await db
      .update(loginAttempts)
      .set({ attempts: newAttempts, lastAttemptAt: now })
      .where(eq(loginAttempts.email, email));
  }
}
