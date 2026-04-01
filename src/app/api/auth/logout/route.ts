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

  return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
}
