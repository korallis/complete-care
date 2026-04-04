import { describe, expect, it } from 'vitest';
import {
  buildPostVerificationLoginPath,
  buildVerifyEmailPath,
  normalizeCallbackUrl,
} from '@/lib/auth/callback-url';

describe('callback URL helpers', () => {
  it('accepts internal relative callback paths', () => {
    expect(normalizeCallbackUrl('/invitations/accept?token=abc')).toBe(
      '/invitations/accept?token=abc',
    );
  });

  it('rejects external and protocol-relative callback URLs', () => {
    expect(normalizeCallbackUrl('https://evil.test')).toBeUndefined();
    expect(normalizeCallbackUrl('//evil.test')).toBeUndefined();
  });

  it('builds verify-email paths with encoded callback URLs', () => {
    expect(buildVerifyEmailPath('/invite')).toBe(
      '/verify-email?callbackUrl=%2Finvite',
    );
  });

  it('defaults post-verification login to onboarding', () => {
    expect(buildPostVerificationLoginPath()).toBe(
      '/login?message=email_verified&callbackUrl=%2Fonboarding',
    );
  });

  it('preserves safe callback URLs after verification', () => {
    expect(
      buildPostVerificationLoginPath('/invitations/accept?token=test-token'),
    ).toBe(
      '/login?message=email_verified&callbackUrl=%2Finvitations%2Faccept%3Ftoken%3Dtest-token',
    );
  });
});
