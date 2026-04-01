/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * - Validates credentials
 * - Checks rate limiting (5 attempts → 15-min lockout)
 * - Returns 429 if account is locked
 * - Returns 401 for invalid credentials (generic message — prevents enumeration)
 * - Returns 200 with session on success
 *
 * The actual session cookie is set by the Auth.js credentials provider
 * via the /api/auth/callback/credentials flow. This route is the entry
 * point for the form submission and returns appropriate HTTP status codes.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { encode } from '@auth/core/jwt';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, loginAttempts } from '@/lib/db/schema';
import {
  loginSchema,
  isAccountLocked,
  shouldLockAccount,
  LOCKOUT_DURATION_MS,
} from '@/lib/auth/validation';

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
    return NextResponse.json(
      { error: 'Invalid email or password' },
      { status: 401 },
    );
  }

  // Successful login — reset attempt counter
  await db
    .delete(loginAttempts)
    .where(eq(loginAttempts.email, normalizedEmail));

  // Create Auth.js JWT session token
  const secret = process.env.AUTH_SECRET!;
  const tokenPayload = {
    sub: user.id,
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
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

  return NextResponse.json(
    {
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
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
