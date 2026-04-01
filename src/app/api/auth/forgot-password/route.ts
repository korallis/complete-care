/**
 * POST /api/auth/forgot-password
 *
 * Initiates the password reset flow.
 * - Validates email format
 * - Always returns 200 regardless of whether the email exists (prevents enumeration)
 * - If user exists: creates a reset token and sends reset email
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import {
  forgotPasswordSchema,
  generateToken,
  passwordResetTokenExpiry,
} from '@/lib/auth/validation';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Return 200 even on invalid email to prevent enumeration
    return NextResponse.json(
      { message: 'If an account exists with that email, a reset link has been sent.' },
      { status: 200 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  // Check if user exists (do NOT reveal result to caller)
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    // Invalidate any existing unused tokens for this email
    await db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.email, email),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      );

    // Create new reset token
    const token = generateToken();
    const expiresAt = passwordResetTokenExpiry();

    await db.insert(passwordResetTokens).values({ email, token, expiresAt });

    // Send email (non-blocking)
    sendPasswordResetEmail(email, token).catch((err) => {
      console.error('[auth/forgot-password] Failed to send reset email:', err);
    });
  }

  // Always return the same response to prevent enumeration
  return NextResponse.json(
    { message: 'If an account exists with that email, a reset link has been sent.' },
    { status: 200 },
  );
}
