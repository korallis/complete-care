import { encode } from '@auth/core/jwt';
import { and, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { memberships, organisations } from '@/lib/db/schema';
import { normalizeCallbackUrl } from '@/lib/auth/callback-url';
import {
  getAuthSessionCookieName,
  shouldUseSecureAuthCookies,
} from '@/lib/auth/cookie-settings';
import type { Role } from '@/lib/rbac/permissions';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { searchParams } = request.nextUrl;
  const slug = searchParams.get('slug');
  const returnTo = normalizeCallbackUrl(
    searchParams.get('returnTo'),
    '/dashboard',
  );

  if (!slug) {
    return NextResponse.redirect(new URL(returnTo ?? '/dashboard', request.url));
  }

  const allMemberships = await db
    .select({
      orgId: memberships.organisationId,
      orgName: organisations.name,
      orgSlug: organisations.slug,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organisations, eq(memberships.organisationId, organisations.id))
    .where(
      and(
        eq(memberships.userId, session.user.id),
        eq(memberships.status, 'active'),
      ),
    )
    .orderBy(desc(memberships.createdAt));

  const targetMembership = allMemberships.find((item) => item.orgSlug === slug);

  if (!targetMembership) {
    return NextResponse.redirect(new URL(returnTo ?? '/dashboard', request.url));
  }

  const secureCookies = shouldUseSecureAuthCookies(request);
  const cookieName = getAuthSessionCookieName(request);
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    return new NextResponse('AUTH_SECRET is not configured', { status: 500 });
  }

  const sessionToken = await encode({
    token: {
      sub: session.user.id,
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      emailVerified:
        (session.user as { emailVerified?: boolean }).emailVerified ?? false,
      activeOrgId: targetMembership.orgId,
      role: targetMembership.role as Role,
      memberships: allMemberships.map((membership) => ({
        orgId: membership.orgId,
        orgName: membership.orgName,
        orgSlug: membership.orgSlug,
        role: membership.role as Role,
      })),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
    },
    secret,
    salt: cookieName,
    maxAge: SESSION_MAX_AGE,
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  cookieStore.set('session_hint', '1', {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  const destination = returnTo ?? `/${targetMembership.orgSlug}/dashboard`;
  return NextResponse.redirect(new URL(destination, request.url));
}
