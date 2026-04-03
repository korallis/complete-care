/**
 * Next.js Middleware — Auth.js route protection + tenant context injection.
 *
 * Uses the edge-safe auth config (no DB/bcrypt imports).
 * Injects the authenticated user's active org ID into request headers
 * so API route handlers can access tenant context without a session lookup.
 *
 * Headers injected (only when user is authenticated with an active org):
 * - `x-org-id`  — the active organisation's UUID
 * - `x-user-id` — the authenticated user's UUID
 *
 * Cookies managed:
 * - `session_hint` — long-lived (7 days) indicator that a session was active.
 *   Used to detect session expiry due to inactivity (vs never logged in).
 *   Set on every authenticated request; cleared on logout.
 */

import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { shouldUseSecureAuthCookies } from '@/lib/auth/cookie-settings';

const { auth } = NextAuth(authConfig);

/** 7-day session hint cookie to detect session expiry */
const SESSION_HINT_MAX_AGE = 7 * 24 * 60 * 60;

// Auth.js v5 middleware callback — req.auth contains the decoded session
export default auth((req) => {
  // req.auth is the session object (null if unauthenticated).
  // Accessing custom session fields requires casting through unknown.
  const session = req.auth as {
    user?: {
      id?: string;
      activeOrgId?: string;
    };
  } | null;

  const response = NextResponse.next();

  if (session?.user?.id) {
    // Inject tenant context headers for API route handlers.
    response.headers.set('x-user-id', session.user.id);
    if (session.user.activeOrgId) {
      response.headers.set('x-org-id', session.user.activeOrgId);
    }

    // Refresh the session_hint cookie on each authenticated request.
    // This cookie outlives the inactivity timeout so we can detect expiry.
    response.cookies.set('session_hint', '1', {
      httpOnly: true,
      secure: shouldUseSecureAuthCookies(req),
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_HINT_MAX_AGE,
    });
  }

  return response;
});

export const config = {
  /*
   * Match all paths except:
   * - _next/static (Next.js static files)
   * - _next/image (Next.js image optimization)
   * - favicon.ico
   * - Static file extensions
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
