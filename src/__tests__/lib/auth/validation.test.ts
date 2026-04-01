/**
 * Auth validation logic tests.
 * Tests password strength rules, token utilities, and rate limiting logic.
 * These tests operate entirely in-memory — no DB or network calls.
 */

import { describe, it, expect } from 'vitest';
import {
  passwordSchema,
  registrationSchema,
  loginSchema,
  isAccountLocked,
  shouldLockAccount,
  generateToken,
  isTokenExpired,
} from '../../../lib/auth/validation';

// ---------------------------------------------------------------------------
// Password schema
// ---------------------------------------------------------------------------

describe('passwordSchema', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Ab1!567');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/8/);
  });

  it('rejects passwords without an uppercase letter', () => {
    const result = passwordSchema.safeParse('abcdef1!');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/uppercase/i);
  });

  it('rejects passwords without a number', () => {
    const result = passwordSchema.safeParse('Abcdefg!');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/number/i);
  });

  it('rejects passwords without a special character', () => {
    const result = passwordSchema.safeParse('Abcdefg1');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/special/i);
  });

  it('accepts a valid strong password', () => {
    const result = passwordSchema.safeParse('Secure1!');
    expect(result.success).toBe(true);
  });

  it('accepts complex passwords', () => {
    const result = passwordSchema.safeParse('MyP@ssw0rd#2024');
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Registration schema
// ---------------------------------------------------------------------------

describe('registrationSchema', () => {
  const validPayload = {
    email: 'test@example.com',
    name: 'Jane Doe',
    password: 'Secure1!',
    confirmPassword: 'Secure1!',
  };

  it('accepts valid registration data', () => {
    const result = registrationSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registrationSchema.safeParse({
      ...validPayload,
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('email');
  });

  it('rejects empty name', () => {
    const result = registrationSchema.safeParse({ ...validPayload, name: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('name');
  });

  it('rejects name that is only whitespace', () => {
    const result = registrationSchema.safeParse({
      ...validPayload,
      name: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = registrationSchema.safeParse({
      ...validPayload,
      confirmPassword: 'DifferentPassword1!',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toMatch(/match/i);
  });

  it('rejects weak password', () => {
    const result = registrationSchema.safeParse({
      ...validPayload,
      password: '123456',
      confirmPassword: '123456',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Login schema
// ---------------------------------------------------------------------------

describe('loginSchema', () => {
  it('accepts valid login credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'anyPassword1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'bad-email',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rate limiting helpers
// ---------------------------------------------------------------------------

describe('isAccountLocked', () => {
  it('returns false when lockedUntil is null', () => {
    expect(isAccountLocked(null)).toBe(false);
  });

  it('returns false when lockedUntil is in the past', () => {
    const past = new Date(Date.now() - 1000);
    expect(isAccountLocked(past)).toBe(false);
  });

  it('returns true when lockedUntil is in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 15);
    expect(isAccountLocked(future)).toBe(true);
  });
});

describe('shouldLockAccount', () => {
  it('returns false for fewer than 5 attempts', () => {
    expect(shouldLockAccount(4)).toBe(false);
  });

  it('returns true at exactly 5 attempts', () => {
    expect(shouldLockAccount(5)).toBe(true);
  });

  it('returns true for more than 5 attempts', () => {
    expect(shouldLockAccount(6)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Token utilities
// ---------------------------------------------------------------------------

describe('generateToken', () => {
  it('generates a non-empty string', () => {
    const token = generateToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('generates unique tokens', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
  });

  it('generates hex-safe string (only hex chars)', () => {
    const token = generateToken();
    expect(token).toMatch(/^[a-f0-9]+$/);
  });
});

describe('isTokenExpired', () => {
  it('returns true for past expiry', () => {
    const past = new Date(Date.now() - 1000);
    expect(isTokenExpired(past)).toBe(true);
  });

  it('returns false for future expiry', () => {
    const future = new Date(Date.now() + 1000 * 60);
    expect(isTokenExpired(future)).toBe(false);
  });
});
