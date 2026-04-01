/**
 * Auth validation schemas and utility functions.
 * Pure functions — no side effects, no DB calls, suitable for both server and Edge.
 */

import { z } from 'zod';
import { randomBytes } from 'crypto';

// ---------------------------------------------------------------------------
// Password schema
// ---------------------------------------------------------------------------

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must include at least one special character',
  );

// ---------------------------------------------------------------------------
// Registration schema
// ---------------------------------------------------------------------------

export const registrationSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    name: z
      .string()
      .min(1, 'Name is required')
      .refine((v) => v.trim().length > 0, 'Name cannot be only whitespace'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: 'You must accept the Terms of Service and Privacy Policy to continue',
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

// ---------------------------------------------------------------------------
// Login schema
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Forgot password schema
// ---------------------------------------------------------------------------

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// ---------------------------------------------------------------------------
// Reset password schema
// ---------------------------------------------------------------------------

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ---------------------------------------------------------------------------
// Rate limiting helpers
// ---------------------------------------------------------------------------

/** Maximum number of failed login attempts before lockout */
export const MAX_LOGIN_ATTEMPTS = 5;

/** Lockout duration in milliseconds (15 minutes) */
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

/**
 * Returns true if the account is currently locked (lockedUntil is in the future).
 */
export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return lockedUntil > new Date();
}

/**
 * Returns true if the given number of failed attempts should trigger a lockout.
 */
export function shouldLockAccount(attempts: number): boolean {
  return attempts >= MAX_LOGIN_ATTEMPTS;
}

// ---------------------------------------------------------------------------
// Token utilities
// ---------------------------------------------------------------------------

/**
 * Generates a cryptographically secure random hex token.
 * Default length: 32 bytes = 64 hex chars.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Returns the expiry date for an email verification token (24 hours from now).
 */
export function emailVerificationTokenExpiry(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

/**
 * Returns the expiry date for a password reset token (1 hour from now).
 */
export function passwordResetTokenExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000);
}

/**
 * Returns true if the token has expired (expiresAt is in the past).
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}
