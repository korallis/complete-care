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
import { users, loginAttempts, memberships, organisations } from '@/lib/db/schema';
import { findOrCreateOAuthUser } from '@/lib/auth/oauth';
import type { Role } from '@/lib/rbac/permissions';
import type { SessionMembership } from '@/types/auth';

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
    async jwt({ token, user, account, trigger, session: sessionData }) {
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

        // Fetch all memberships for org switcher
        const allMemberships = await getAllActiveMemberships(userId);
        token.memberships = allMemberships;
        if (allMemberships.length > 0) {
          token.activeOrgId = allMemberships[0].orgId;
          token.role = allMemberships[0].role;
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

        // Fetch all memberships for org switcher
        if (user.id) {
          const allMemberships = await getAllActiveMemberships(user.id);
          token.memberships = allMemberships;
          if (allMemberships.length > 0) {
            token.activeOrgId = allMemberships[0].orgId;
            token.role = allMemberships[0].role;
          }
        }
        return token;
      }

      // -----------------------------------------------------------------------
      // Session update (trigger === 'update') — handle org switching or role refresh.
      // Called when session.update({ activeOrgId }) is invoked client-side.
      // -----------------------------------------------------------------------
      if (trigger === 'update') {
        const userId = token.id as string | undefined;
        if (!userId) return token;

        // Org switch: client passes a new activeOrgId
        const newActiveOrgId = (sessionData as { activeOrgId?: string })?.activeOrgId;
        if (newActiveOrgId) {
          // Verify the user actually belongs to the target org
          const [membership] = await db
            .select({ role: memberships.role })
            .from(memberships)
            .where(
              and(
                eq(memberships.userId, userId),
                eq(memberships.organisationId, newActiveOrgId),
                eq(memberships.status, 'active'),
              ),
            )
            .limit(1);

          if (membership) {
            token.activeOrgId = newActiveOrgId;
            token.role = membership.role as Role;
          }
        } else {
          // Role refresh for current org
          const activeOrgId = token.activeOrgId as string | undefined;
          if (activeOrgId) {
            const [membership] = await db
              .select({ role: memberships.role })
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
          }
        }

        // Always refresh the memberships list so org switcher stays current
        const allMemberships = await getAllActiveMemberships(userId);
        token.memberships = allMemberships;

        // If no active org was set yet, pick the first available
        if (!token.activeOrgId && allMemberships.length > 0) {
          token.activeOrgId = allMemberships[0].orgId;
          token.role = allMemberships[0].role;
        }
      } else {
        // -----------------------------------------------------------------------
        // Default path — normal page load with session.updateAge: 0
        //
        // Auth.js is configured with updateAge: 0, so the JWT callback runs on
        // every request. This gives us a chance to pick up role changes made by
        // admins without requiring the affected user to log out and back in.
        // -----------------------------------------------------------------------
        const userId = token.id as string | undefined;
        const activeOrgId = token.activeOrgId as string | undefined;
        if (userId && activeOrgId) {
          // Re-read current role from DB to pick up mid-session role changes.
          // Uses the memberships table index on (userId, organisationId, status).
          const [membership] = await db
            .select({ role: memberships.role })
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

          // Refresh the full memberships list to pick up org name changes
          // (e.g. after updateOrgSettings) and new orgs created by this user.
          const allMemberships = await getAllActiveMemberships(userId);
          token.memberships = allMemberships;

          // Sync orgName in memberships reflects any org name changes
          const updatedMembership = allMemberships.find((m) => m.orgId === activeOrgId);
          if (updatedMembership) {
            token.role = updatedMembership.role as Role;
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
        // All memberships for org switcher UI
        session.user.memberships = token.memberships as SessionMembership[] | undefined;
      }
      return session;
    },
  },
});

/**
 * Fetches all active memberships for a user, joined with organisation details.
 * Used to populate the JWT with org context and the org switcher UI.
 */
async function getAllActiveMemberships(
  userId: string,
): Promise<SessionMembership[]> {
  const rows = await db
    .select({
      orgId: memberships.organisationId,
      orgName: organisations.name,
      orgSlug: organisations.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organisations, eq(memberships.organisationId, organisations.id))
    .where(
      and(eq(memberships.userId, userId), eq(memberships.status, 'active')),
    )
    .orderBy(desc(memberships.createdAt));

  return rows.map((r) => ({
    orgId: r.orgId,
    orgName: r.orgName,
    orgSlug: r.orgSlug,
    role: r.role as Role,
  }));
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
