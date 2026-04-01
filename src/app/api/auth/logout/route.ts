/**
 * POST /api/auth/logout
 *
 * Invalidates the user's session by clearing the Auth.js session cookie.
 * Returns 200 on success.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME =
  process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  // Clear session_hint so the next login is not treated as session expiry
  cookieStore.delete('session_hint');

  return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
}
