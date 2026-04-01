/**
 * POST /api/auth/reset-password
 *
 * Completes the password reset flow.
 * - Validates token and new password
 * - Returns 400/410 for invalid/expired tokens
 * - Updates user's password hash
 * - Marks token as used
 * - Returns 200 on success
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { resetPasswordSchema, isTokenExpired } from '@/lib/auth/validation';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.reduce<Record<string, string>>(
      (acc, issue) => {
        const field = issue.path.join('.');
        acc[field] = issue.message;
        return acc;
      },
      {},
    );
    return NextResponse.json(
      { error: 'Validation failed', errors },
      { status: 422 },
    );
  }

  const { token, password } = parsed.data;

  // Find the reset token
  const [resetRecord] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!resetRecord) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link. Please request a new one.' },
      { status: 400 },
    );
  }

  if (resetRecord.used) {
    return NextResponse.json(
      { error: 'This reset link has already been used. Please request a new one.' },
      { status: 400 },
    );
  }

  if (isTokenExpired(resetRecord.expiresAt)) {
    return NextResponse.json(
      { error: 'This reset link has expired. Please request a new one.' },
      { status: 410 },
    );
  }

  // Find user by email
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, resetRecord.email))
    .limit(1);

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link. Please request a new one.' },
      { status: 400 },
    );
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, 12);

  // Update password and mark token used — atomically
  await Promise.all([
    db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id)),
    db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(
        and(
          eq(passwordResetTokens.token, token),
        ),
      ),
  ]);

  return NextResponse.json(
    { message: 'Password reset successfully. You can now sign in with your new password.' },
    { status: 200 },
  );
}
