import type { NextRequest } from 'next/server';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function shouldUseSecureAuthCookies(request: NextRequest): boolean {
  return request.nextUrl.protocol === 'https:' && !LOCAL_HOSTS.has(request.nextUrl.hostname);
}

export function getAuthSessionCookieName(request: NextRequest): string {
  return shouldUseSecureAuthCookies(request)
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';
}
