export function normalizeCallbackUrl(
  callbackUrl?: string | null,
  fallback?: string,
): string | undefined {
  const value = callbackUrl?.trim();

  if (!value) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;

  return value;
}

export function buildVerifyEmailPath(callbackUrl?: string | null): string {
  const safeCallbackUrl = normalizeCallbackUrl(callbackUrl);

  if (!safeCallbackUrl) return '/verify-email';

  return `/verify-email?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;
}

export function buildPostVerificationLoginPath(
  callbackUrl?: string | null,
): string {
  const destination = normalizeCallbackUrl(callbackUrl, '/onboarding');

  return `/login?message=email_verified&callbackUrl=${encodeURIComponent(destination ?? '/onboarding')}`;
}
