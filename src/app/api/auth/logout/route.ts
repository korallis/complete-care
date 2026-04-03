/**
 * POST /api/auth/logout
 *
 * Invalidates the user's session by clearing the Auth.js session cookie.
 * Returns 200 on success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuthSessionCookieName, shouldUseSecureAuthCookies } from '@/lib/auth/cookie-settings';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const cookieName = getAuthSessionCookieName(request);
  const secureCookies = shouldUseSecureAuthCookies(request);

  cookieStore.set(cookieName, '', {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  });
  // Clear session_hint so the next login is not treated as session expiry
  cookieStore.set('session_hint', '', {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  });

  return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
}
