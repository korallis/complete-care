/**
 * POST /api/auth/register
 *
 * Creates a new user account.
 * - Validates input (email, name, password strength, confirm password)
 * - Returns 422 on validation failure
 * - Returns 409 if email already registered
 * - Creates user with hashed password
 * - Sends email verification token
 * - Returns 201 on success
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, emailVerificationTokens } from '@/lib/db/schema';
import {
  registrationSchema,
  generateToken,
  emailVerificationTokenExpiry,
} from '@/lib/auth/validation';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Validate input
  const parsed = registrationSchema.safeParse(body);
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

  const { email, name, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check for duplicate email
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    // Return 409 but with a generic message to avoid enumeration
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 },
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      name: name.trim(),
      passwordHash,
      emailVerified: false,
    })
    .returning({ id: users.id, email: users.email });

  if (!newUser) {
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 },
    );
  }

  // Create email verification token
  const token = generateToken();
  const expiresAt = emailVerificationTokenExpiry();

  await db.insert(emailVerificationTokens).values({
    userId: newUser.id,
    token,
    expiresAt,
  });

  // Send verification email (non-blocking — don't fail registration if email fails)
  sendVerificationEmail(newUser.email, token).catch((err) => {
    console.error('[auth/register] Failed to send verification email:', err);
  });

  return NextResponse.json(
    {
      message: 'Account created. Please check your email to verify your account.',
      userId: newUser.id,
    },
    { status: 201 },
  );
}
