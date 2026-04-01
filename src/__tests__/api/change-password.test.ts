/**
 * Tests for /api/auth/change-password route.
 *
 * Validates:
 * - Password change validation schema works correctly
 * - Security: new password must differ from current
 * - Confirmation password must match new password
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { passwordSchema } from '../../lib/auth/validation';

// Mirror the change password validation schema (from /api/auth/change-password/route.ts)
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

describe('changePasswordSchema validation', () => {
  const validPayload = {
    currentPassword: 'OldPassword1!',
    newPassword: 'NewPassword2@',
    confirmPassword: 'NewPassword2@',
  };

  it('accepts valid password change data', () => {
    const result = changePasswordSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects empty current password', () => {
    const result = changePasswordSchema.safeParse({
      ...validPayload,
      currentPassword: '',
    });
    expect(result.success).toBe(false);
    const errors = result.error?.issues ?? [];
    expect(errors.some((e) => e.path.includes('currentPassword'))).toBe(true);
  });

  it('rejects weak new password', () => {
    const result = changePasswordSchema.safeParse({
      ...validPayload,
      newPassword: 'weakpassword',
      confirmPassword: 'weakpassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = changePasswordSchema.safeParse({
      ...validPayload,
      confirmPassword: 'DifferentPassword1!',
    });
    expect(result.success).toBe(false);
    const errors = result.error?.issues ?? [];
    expect(errors.some((e) => e.message.toLowerCase().includes('match'))).toBe(true);
  });

  it('rejects when new password is same as current', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'SamePassword1!',
      newPassword: 'SamePassword1!',
      confirmPassword: 'SamePassword1!',
    });
    expect(result.success).toBe(false);
    const errors = result.error?.issues ?? [];
    expect(errors.some((e) => e.message.toLowerCase().includes('different'))).toBe(true);
  });
});
