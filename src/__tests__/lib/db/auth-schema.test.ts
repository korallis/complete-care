/**
 * Auth schema tests — verify structure of new auth-related tables.
 * These tests operate on schema objects in memory — no DB connection required.
 */

import { describe, it, expect } from 'vitest';
import { getTableName } from 'drizzle-orm';
import {
  emailVerificationTokens,
  passwordResetTokens,
  loginAttempts,
} from '../../../lib/db/schema';
import type {
  EmailVerificationToken,
  NewEmailVerificationToken,
  PasswordResetToken,
  NewPasswordResetToken,
  LoginAttempt,
  NewLoginAttempt,
} from '../../../lib/db/schema';

// ---------------------------------------------------------------------------
// emailVerificationTokens
// ---------------------------------------------------------------------------

describe('emailVerificationTokens schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(emailVerificationTokens)).toBe(
      'email_verification_tokens',
    );
  });

  it('defines all required columns', () => {
    const cols = Object.keys(emailVerificationTokens);
    expect(cols).toEqual(
      expect.arrayContaining(['id', 'userId', 'token', 'expiresAt', 'createdAt']),
    );
  });

  it('id column is uuid primary key with default', () => {
    expect(emailVerificationTokens.id.columnType).toBe('PgUUID');
    expect(emailVerificationTokens.id.primary).toBe(true);
    expect(emailVerificationTokens.id.hasDefault).toBe(true);
  });

  it('token column is unique and not null', () => {
    const col = emailVerificationTokens.token;
    expect(col.isUnique).toBe(true);
    expect(col.notNull).toBe(true);
  });

  it('userId column is not null', () => {
    expect(emailVerificationTokens.userId.notNull).toBe(true);
  });

  it('expiresAt column is not null', () => {
    expect(emailVerificationTokens.expiresAt.notNull).toBe(true);
  });

  it('exports EmailVerificationToken type', () => {
    const token: EmailVerificationToken = {
      id: 'uuid',
      userId: 'user-uuid',
      token: 'abc123',
      expiresAt: new Date(),
      createdAt: new Date(),
    };
    expect(token.token).toBe('abc123');

    const newToken: NewEmailVerificationToken = {
      userId: 'user-uuid',
      token: 'def456',
      expiresAt: new Date(),
    };
    expect(newToken.userId).toBe('user-uuid');
  });
});

// ---------------------------------------------------------------------------
// passwordResetTokens
// ---------------------------------------------------------------------------

describe('passwordResetTokens schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(passwordResetTokens)).toBe('password_reset_tokens');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(passwordResetTokens);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'email',
        'token',
        'expiresAt',
        'used',
        'createdAt',
      ]),
    );
  });

  it('token column is unique', () => {
    expect(passwordResetTokens.token.isUnique).toBe(true);
  });

  it('used column defaults to false', () => {
    expect(passwordResetTokens.used.default).toBe(false);
    expect(passwordResetTokens.used.notNull).toBe(true);
  });

  it('email column is not null', () => {
    expect(passwordResetTokens.email.notNull).toBe(true);
  });

  it('exports PasswordResetToken type', () => {
    const token: PasswordResetToken = {
      id: 'uuid',
      email: 'user@example.com',
      token: 'resettoken',
      expiresAt: new Date(),
      used: false,
      createdAt: new Date(),
    };
    expect(token.used).toBe(false);

    const newToken: NewPasswordResetToken = {
      email: 'user@example.com',
      token: 'newtoken',
      expiresAt: new Date(),
    };
    expect(newToken.email).toBe('user@example.com');
  });
});

// ---------------------------------------------------------------------------
// loginAttempts
// ---------------------------------------------------------------------------

describe('loginAttempts schema', () => {
  it('has the correct table name', () => {
    expect(getTableName(loginAttempts)).toBe('login_attempts');
  });

  it('defines all required columns', () => {
    const cols = Object.keys(loginAttempts);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id',
        'email',
        'attempts',
        'lockedUntil',
        'lastAttemptAt',
      ]),
    );
  });

  it('email column is unique and not null', () => {
    expect(loginAttempts.email.notNull).toBe(true);
    expect(loginAttempts.email.isUnique).toBe(true);
  });

  it('attempts column defaults to 0', () => {
    expect(loginAttempts.attempts.default).toBe(0);
    expect(loginAttempts.attempts.notNull).toBe(true);
  });

  it('lockedUntil column is nullable', () => {
    expect(loginAttempts.lockedUntil.notNull).toBeFalsy();
  });

  it('exports LoginAttempt type', () => {
    const attempt: LoginAttempt = {
      id: 'uuid',
      email: 'user@example.com',
      attempts: 3,
      lockedUntil: null,
      lastAttemptAt: new Date(),
    };
    expect(attempt.attempts).toBe(3);

    const newAttempt: NewLoginAttempt = {
      email: 'user@example.com',
    };
    expect(newAttempt.email).toBe('user@example.com');
  });
});
