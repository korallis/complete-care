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
];

/** Auth routes — redirect to dashboard if already logged in */
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/** Prefix for API auth routes — always accessible */
const apiAuthPrefix = '/api/auth';

/** Default redirect after successful login */
const DEFAULT_LOGIN_REDIRECT = '/dashboard';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      // Read emailVerified from the session user (mapped by jwt/session callbacks)
      const isEmailVerified =
        (auth?.user as unknown as { emailVerified?: boolean })?.emailVerified ??
        false;
      const { pathname } = nextUrl;

      // Always allow API auth routes (Auth.js internals + custom auth routes)
      if (pathname.startsWith(apiAuthPrefix)) return true;

      // Always allow public routes
      if (publicRoutes.includes(pathname)) return true;

      // Auth routes — redirect to dashboard if already logged in
      if (authRoutes.some((route) => pathname.startsWith(route))) {
        if (isLoggedIn) {
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }
        return true;
      }

      // Allow verify-email page for logged-in unverified users
      if (pathname.startsWith('/verify-email')) {
        return true;
      }

      // Dashboard and other protected routes
      if (!isLoggedIn) {
        const callbackUrl = encodeURIComponent(pathname + nextUrl.search);
        return Response.redirect(
          new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl),
        );
      }

      // Redirect unverified users to email verification prompt
      if (!isEmailVerified && !pathname.startsWith('/verify-email')) {
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
      }
      return session;
    },
  },
  providers: [],
  // Session strategy is JWT (no adapter needed)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
} satisfies NextAuthConfig;
