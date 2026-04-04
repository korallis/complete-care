/**
 * Auth.js v5 — Edge-safe configuration.
 * This file MUST NOT import from Drizzle ORM, bcryptjs, or any Node.js-only modules.
 * It is used by Next.js middleware which runs in the Edge runtime.
 */

import type { NextAuthConfig } from 'next-auth';

/** Public routes that do not require authentication */
const publicRoutes = [
  '/',
  '/pricing',
  '/privacy',
  '/terms',
  '/demo',
];

/** Public route prefixes that include dynamic/query-based entry flows */
const publicRoutePrefixes = [
  '/verify-email',
  '/invitations/accept',
  '/invite',
];

/** Auth routes — redirect to dashboard if already logged in */
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/**
 * Routes accessible to authenticated users ONLY (not redirected if logged in).
 * Used for post-auth flows that require an authenticated session.
 */
const authenticatedOnlyRoutes = [
  '/onboarding',
  '/invitations',
  '/new-organisation',
];

/** Prefix for API auth routes — always accessible */
const apiAuthPrefix = '/api/auth';

/** Default redirect after successful login */
const DEFAULT_LOGIN_REDIRECT = '/dashboard';

/**
 * Session inactivity timeout in seconds.
 * Configurable via SESSION_INACTIVITY_TIMEOUT env var (default: 30 minutes).
 */
export const SESSION_INACTIVITY_TIMEOUT =
  parseInt(process.env.SESSION_INACTIVITY_TIMEOUT ?? String(30 * 60), 10);

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      // Read emailVerified from the session user (mapped by jwt/session callbacks)
      const isEmailVerified =
        (auth?.user as unknown as { emailVerified?: boolean })?.emailVerified ??
        false;
      const { pathname } = nextUrl;

      // Always allow API auth routes (Auth.js internals + custom auth routes)
      if (pathname.startsWith(apiAuthPrefix)) return true;

      // -------------------------------------------------------------------
      // Non-auth API routes: return 401 JSON for unauthenticated/invalid JWT.
      // This ensures tampered JWTs and missing tokens get 401 (not 302 redirect).
      // RBAC checks (403) are handled inside each route handler via requirePermission().
      // -------------------------------------------------------------------
      if (pathname.startsWith('/api/')) {
        if (!isLoggedIn) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return true;
      }

      // Always allow public routes and invite/verification entry flows
      if (
        publicRoutes.includes(pathname) ||
        publicRoutePrefixes.some((route) => pathname.startsWith(route))
      ) {
        return true;
      }

      // Auth routes — redirect to dashboard if already logged in
      if (authRoutes.some((route) => pathname.startsWith(route))) {
        if (isLoggedIn) {
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return true;
      }

      // Authenticated-only routes — require login but don't redirect back if already logged in
      // (e.g., /onboarding, /invitations, /new-organisation)
      if (
        authenticatedOnlyRoutes.some((route) => pathname.startsWith(route))
      ) {
        if (!isLoggedIn) {
          const callbackUrl = encodeURIComponent(pathname + nextUrl.search);
          return Response.redirect(
            new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl),
          );
        }
        return true;
      }

      // Dashboard and other protected routes
      if (!isLoggedIn) {
        const callbackUrl = encodeURIComponent(pathname + nextUrl.search);

        // Detect session expiry: if the user has a session_hint cookie but no
        // valid JWT, their session likely expired due to inactivity.
        const sessionHint = request.cookies.get('session_hint');
        const reason = sessionHint ? '&reason=session_expired' : '';

        return Response.redirect(
          new URL(`/login?callbackUrl=${callbackUrl}${reason}`, nextUrl),
        );
      }

      // Redirect unverified users to email verification prompt
      if (
        !isEmailVerified &&
        !publicRoutePrefixes.some((route) => pathname.startsWith(route))
      ) {
        return Response.redirect(new URL('/verify-email', nextUrl));
      }

      return true;
    },
    // Map JWT fields to session.user — edge-safe (no DB imports needed here)
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = user.emailVerified ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = (token.id ?? token.sub) as string;
        (session.user as unknown as { emailVerified: boolean }).emailVerified =
          (token.emailVerified as boolean) ?? false;
        // Pass through org context fields set by the full auth.ts JWT callback
        session.user.activeOrgId = token.activeOrgId as string | undefined;
        session.user.role = token.role as import('@/lib/rbac/permissions').Role | undefined;
      }
      return session;
    },
  },
  providers: [],
  // Session strategy is JWT (no adapter needed)
  session: {
    strategy: 'jwt',
    // Inactivity timeout: session expires after this many seconds of inactivity.
    // With updateAge: 0, the session cookie is refreshed on every request,
    // implementing rolling sessions. If idle for SESSION_INACTIVITY_TIMEOUT seconds,
    // the cookie expires and the user is redirected to login.
    maxAge: SESSION_INACTIVITY_TIMEOUT,
    updateAge: 0, // Refresh JWT on every request (rolling sessions)
  },
} satisfies NextAuthConfig;
