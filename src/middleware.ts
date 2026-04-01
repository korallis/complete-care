/**
 * Next.js Middleware — Auth.js route protection.
 * Uses the edge-safe auth config (no DB/bcrypt imports).
 */

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth;

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
