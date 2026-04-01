/**
 * POST /api/auth/change-password
 *
 * Allows an authenticated user to change their password.
 * - Validates current password before allowing change
 * - Validates new password meets complexity requirements
 * - Updates password hash in database
 * - Requires active session (401 if not authenticated)
 *
 * Body: { currentPassword: string; newPassword: string; confirmPassword: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { passwordSchema } from '@/lib/auth/validation';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.reduce<Record<string, string>>(
      (acc, issue) => {
        const field = issue.path.join('.');
        if (!acc[field]) {
          acc[field] = issue.message;
        }
        return acc;
      },
      {},
    );
    return NextResponse.json(
      { error: 'Validation failed', errors },
      { status: 422 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  // Fetch user with password hash
  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user || !user.passwordHash) {
    // OAuth-only users don't have a password
    return NextResponse.json(
      { error: 'Password change is not available for accounts linked via Google sign-in. Please use the Google account settings to change your password.' },
      { status: 400 },
    );
  }

  // Verify current password
  const currentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentPasswordValid) {
    return NextResponse.json(
      { error: 'Current password is incorrect', errors: { currentPassword: 'Incorrect password' } },
      { status: 401 },
    );
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Update password
  await db
    .update(users)
    .set({ passwordHash: newPasswordHash })
    .where(eq(users.id, user.id));

  return NextResponse.json(
    { message: 'Password changed successfully. Please sign in with your new password.' },
    { status: 200 },
  );
}
