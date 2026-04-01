/**
 * Auth.js v5 — Full configuration.
 * Includes Credentials provider with bcrypt password comparison,
 * and Google OAuth provider with user creation/linking.
 * NOT for use in Edge runtime — use auth.config.ts for middleware.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { and, eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authConfig } from './auth.config';
import { db } from '@/lib/db';
import { users, loginAttempts, memberships } from '@/lib/db/schema';
import { findOrCreateOAuthUser } from '@/lib/auth/oauth';
import type { Role } from '@/lib/rbac/permissions';

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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
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
    async jwt({ token, user, account, trigger }) {
      // -----------------------------------------------------------------------
      // Google OAuth sign-in — look up or create our DB user
      // -----------------------------------------------------------------------
      if (account?.provider === 'google' && user?.email) {
        const { userId } = await findOrCreateOAuthUser({
          email: user.email,
          name: user.name ?? 'Unknown',
          image: user.image ?? null,
        });
        token.id = userId; // Our DB user id, not the Google sub
        token.email = user.email;
        token.name = user.name ?? token.name;
        token.emailVerified = true; // Google verifies email ownership

        // Fetch the user's first active membership for org context
        const firstMembership = await getFirstActiveMembership(userId);
        if (firstMembership) {
          token.activeOrgId = firstMembership.organisationId;
          token.role = firstMembership.role as Role;
        }
        return token;
      }

      // -----------------------------------------------------------------------
      // Credentials sign-in — `user` is the return value of `authorize`
      // -----------------------------------------------------------------------
      if (user) {
        token.id = user.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
        token.emailVerified = user.emailVerified ?? false;

        // Fetch the user's first active membership for org context
        if (user.id) {
          const firstMembership = await getFirstActiveMembership(user.id);
          if (firstMembership) {
            token.activeOrgId = firstMembership.organisationId;
            token.role = firstMembership.role as Role;
          }
        }
        return token;
      }

      // -----------------------------------------------------------------------
      // Session update (trigger === 'update') — re-fetch role from DB.
      // Called when session.update() is invoked client-side after a role change
      // (e.g., owner promotes a member; the new role is reflected on next request).
      // -----------------------------------------------------------------------
      if (trigger === 'update') {
        const userId = token.id as string | undefined;
        const activeOrgId = token.activeOrgId as string | undefined;

        if (userId && activeOrgId) {
          // Re-fetch role for the current org
          const [membership] = await db
            .select({
              role: memberships.role,
              organisationId: memberships.organisationId,
            })
            .from(memberships)
            .where(
              and(
                eq(memberships.userId, userId),
                eq(memberships.organisationId, activeOrgId),
                eq(memberships.status, 'active'),
              ),
            )
            .limit(1);

          if (membership) {
            token.role = membership.role as Role;
          }
        } else if (userId) {
          // No active org yet — fetch first membership
          const firstMembership = await getFirstActiveMembership(userId);
          if (firstMembership) {
            token.activeOrgId = firstMembership.organisationId;
            token.role = firstMembership.role as Role;
          }
        }
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
        // Org context — set by JWT callback on sign-in or trigger='update'
        session.user.activeOrgId = token.activeOrgId as string | undefined;
        session.user.role = token.role as Role | undefined;
      }
      return session;
    },
  },
});

/**
 * Fetches the user's first active organisation membership.
 * Used during sign-in to populate the JWT with org context.
 * Returns the most recently created active membership, or null if none.
 */
async function getFirstActiveMembership(userId: string): Promise<{
  organisationId: string;
  role: string;
} | null> {
  const [membership] = await db
    .select({
      organisationId: memberships.organisationId,
      role: memberships.role,
    })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.status, 'active'),
      ),
    )
    .orderBy(desc(memberships.createdAt))
    .limit(1);

  return membership ?? null;
}

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
