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
 */

import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

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

  // Inject tenant context headers for API route handlers.
  // Middleware already has the JWT decoded — forwarding via headers
  // avoids a session lookup in every individual route handler.
  if (session?.user?.id) {
    response.headers.set('x-user-id', session.user.id);

    if (session.user.activeOrgId) {
      response.headers.set('x-org-id', session.user.activeOrgId);
    }
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
