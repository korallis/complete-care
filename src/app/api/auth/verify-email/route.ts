/**
 * POST /api/auth/verify-email
 *
 * Verifies a user's email address using a token from the verification email.
 * - Validates token
 * - Returns 400 for invalid tokens
 * - Returns 410 for expired tokens
 * - Marks user's email as verified
 * - Deletes the used token
 * - Returns 200 on success
 *
 * Also handles GET for link-click verification (redirects to /login or /dashboard).
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, emailVerificationTokens } from '@/lib/db/schema';
import { isTokenExpired } from '@/lib/auth/validation';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3200';

/**
 * GET /api/auth/verify-email?token=xxx
 * Handles link clicks from verification emails.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/verify-email?error=missing_token', APP_URL),
    );
  }

  const result = await verifyEmailToken(token);

  if (result.success) {
    // After email verification the user has no org yet, so send them to
    // login with a callback to /onboarding (and a success message).
    return NextResponse.redirect(
      new URL(
        '/login?message=email_verified&callbackUrl=%2Fonboarding',
        APP_URL,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(`/verify-email?error=${encodeURIComponent(result.error ?? 'invalid_token')}`, APP_URL),
  );
}

/**
 * POST /api/auth/verify-email
 * JSON API for programmatic verification.
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { token } = body as { token?: string };

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const result = await verifyEmailToken(token);

  if (result.success) {
    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
  }

  const statusCode = result.expired ? 410 : 400;
  return NextResponse.json({ error: result.error }, { status: statusCode });
}

// ---------------------------------------------------------------------------
// Shared token verification logic
// ---------------------------------------------------------------------------

type VerifyResult =
  | { success: true }
  | { success: false; error: string; expired?: boolean };

async function verifyEmailToken(token: string): Promise<VerifyResult> {
  const [tokenRecord] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);

  if (!tokenRecord) {
    return { success: false, error: 'Invalid verification link. Please request a new one.' };
  }

  if (isTokenExpired(tokenRecord.expiresAt)) {
    return {
      success: false,
      error: 'This verification link has expired. Please request a new one.',
      expired: true,
    };
  }

  // Mark email as verified and delete the token
  await Promise.all([
    db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, tokenRecord.userId)),
    db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token)),
  ]);

  return { success: true };
}
