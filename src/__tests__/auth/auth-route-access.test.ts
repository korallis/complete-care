import { describe, expect, it } from 'vitest';
import { authConfig } from '@/auth.config';

const authorized = authConfig.callbacks?.authorized;

function runAuthorized(
  path: string,
  {
    auth = null,
    sessionHint = false,
  }: {
    auth?: { user?: { id?: string; emailVerified?: boolean } } | null;
    sessionHint?: boolean;
  } = {},
) {
  if (!authorized) {
    throw new Error('Missing authConfig authorized callback');
  }

  return authorized({
    auth,
    request: {
      nextUrl: new URL(`http://localhost:3200${path}`),
      cookies: {
        get(name: string) {
          if (name === 'session_hint' && sessionHint) {
            return { name, value: '1' };
          }
          return undefined;
        },
      },
    },
  } as never);
}

function expectRedirect(result: boolean | Response, location: string) {
  expect(result).toBeInstanceOf(Response);
  expect((result as Response).headers.get('location')).toBe(location);
}

describe('auth route access', () => {
  it('allows logged-out users to open the family invite landing page', () => {
    expect(runAuthorized('/invite')).toBe(true);
  });

  it('allows logged-out users to open invitation acceptance links', () => {
    expect(runAuthorized('/invitations/accept?token=test-token')).toBe(true);
  });

  it('keeps onboarding protected for logged-out users', async () => {
    const result = await runAuthorized('/onboarding');

    expectRedirect(result, 'http://localhost:3200/login?callbackUrl=%2Fonboarding');
  });

  it('preserves the session-expired hint on protected routes', async () => {
    const result = await runAuthorized('/redesign-admin-workspace/dashboard', {
      sessionHint: true,
    });

    expectRedirect(
      result,
      'http://localhost:3200/login?callbackUrl=%2Fredesign-admin-workspace%2Fdashboard&reason=session_expired',
    );
  });
});
