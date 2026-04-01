/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * - Validates credentials
 * - Checks rate limiting (5 attempts → 15-min lockout)
 * - Returns 429 if account is locked
 * - Returns 401 for invalid credentials (generic message — prevents enumeration)
 * - Returns 200 with session on success, including org context for redirect
 *
 * The actual session cookie is set by the Auth.js credentials provider
 * via the /api/auth/callback/credentials flow. This route is the entry
 * point for the form submission and returns appropriate HTTP status codes.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { and, eq, desc } from 'drizzle-orm';
import { encode } from '@auth/core/jwt';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, loginAttempts, memberships, organisations } from '@/lib/db/schema';
import {
  loginSchema,
  isAccountLocked,
  shouldLockAccount,
  LOCKOUT_DURATION_MS,
} from '@/lib/auth/validation';
import type { Role } from '@/lib/rbac/permissions';

const COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 },
    );
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check rate limiting
  const [attemptRecord] = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.email, normalizedEmail))
    .limit(1);

  if (attemptRecord && isAccountLocked(attemptRecord.lockedUntil)) {
    const lockedUntil = new Date(attemptRecord.lockedUntil!);
    const minutesRemaining = Math.ceil(
      (lockedUntil.getTime() - Date.now()) / (60 * 1000),
    );
    return NextResponse.json(
      {
        error: `Account temporarily locked due to too many failed login attempts. Try again in ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} or reset your password.`,
        lockedUntil: lockedUntil.toISOString(),
      },
      { status: 429 },
    );
  }

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  // Constant-time check: always run bcrypt even if user not found
  const dummyHash =
    '$2b$12$dummy.hash.to.prevent.timing.attacks.xxxxxxxxxxxxxx';
  const passwordToCheck = user?.passwordHash ?? dummyHash;
  const passwordValid = await bcrypt.compare(password, passwordToCheck);

  if (!user || !user.passwordHash || !passwordValid) {
    await recordFailedAttempt(normalizedEmail, attemptRecord ?? null);
    // Fix: Check if this failed attempt just triggered the lockout.
    // Return 429 immediately on the 5th failed attempt (not the 6th).
    const newAttemptCount = (attemptRecord?.attempts ?? 0) + 1;
    if (shouldLockAccount(newAttemptCount)) {
      const lockedUntilTime = new Date(Date.now() + LOCKOUT_DURATION_MS);
      const minutesRemaining = 15;
      return NextResponse.json(
        {
          error: `Account temporarily locked due to too many failed login attempts. Try again in ${minutesRemaining} minutes or reset your password.`,
          lockedUntil: lockedUntilTime.toISOString(),
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 },
    );
  }

  // Successful login — reset attempt counter
  await db
    .delete(loginAttempts)
    .where(eq(loginAttempts.email, normalizedEmail));

  // Fetch all active memberships for org context
  const allMemberships = await db
    .select({
      orgId: memberships.organisationId,
      orgName: organisations.name,
      orgSlug: organisations.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organisations, eq(memberships.organisationId, organisations.id))
    .where(
      and(
        eq(memberships.userId, user.id),
        eq(memberships.status, 'active'),
      ),
    )
    .orderBy(desc(memberships.createdAt));

  const firstMembership = allMemberships[0] ?? null;

  // Create Auth.js JWT session token (include org context)
  const secret = process.env.AUTH_SECRET!;
  const tokenPayload = {
    sub: user.id,
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    activeOrgId: firstMembership?.orgId ?? undefined,
    role: firstMembership?.role as Role | undefined,
    memberships: allMemberships.map((m) => ({
      orgId: m.orgId,
      orgName: m.orgName,
      orgSlug: m.orgSlug,
      role: m.role as Role,
    })),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const sessionToken = await encode({
    token: tokenPayload,
    secret,
    salt: COOKIE_NAME,
    maxAge: SESSION_MAX_AGE,
  });

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });

  // Set long-lived session_hint cookie so middleware can detect session expiry.
  // This cookie outlives the inactivity timeout, allowing the login page to
  // show "your session expired" vs "please log in for the first time."
  cookieStore.set('session_hint', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return NextResponse.json(
    {
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
      // Org redirect context — used by the login form to navigate correctly
      orgSlug: firstMembership?.orgSlug ?? null,
      hasOrg: allMemberships.length > 0,
    },
    { status: 200 },
  );
}

/**
 * Records a failed login attempt, locking the account after MAX_ATTEMPTS.
 */
async function recordFailedAttempt(
  email: string,
  existing: { attempts: number; lockedUntil: Date | null } | null,
): Promise<void> {
  const now = new Date();

  if (!existing) {
    await db.insert(loginAttempts).values({
      email,
      attempts: 1,
      lastAttemptAt: now,
    });
    return;
  }

  const newAttempts = (existing.attempts ?? 0) + 1;
  const lockedUntil = shouldLockAccount(newAttempts)
    ? new Date(now.getTime() + LOCKOUT_DURATION_MS)
    : null;

  await db
    .update(loginAttempts)
    .set({ attempts: newAttempts, lockedUntil, lastAttemptAt: now })
    .where(eq(loginAttempts.email, email));
}
