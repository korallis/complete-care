import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { AuthCard } from '@/components/auth/auth-card';
import { normalizeCallbackUrl } from '@/lib/auth/callback-url';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address to access Complete Care',
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string; error?: string; callbackUrl?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const { token, error } = params;
  const callbackUrl = normalizeCallbackUrl(params.callbackUrl);

  // If a token is present in the URL, the GET /api/auth/verify-email handler
  // would have already redirected. This page renders the waiting state.

  if (error) {
    const isExpired =
      error.toLowerCase().includes('expired');

    return (
      <AuthCard title="Verification failed">
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {isExpired
                ? 'This verification link has expired. Please request a new one.'
                : 'This verification link is invalid or has already been used.'}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-[oklch(0.22_0.04_160)] px-6 text-sm font-medium text-white hover:bg-[oklch(0.28_0.05_160)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Create new account
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  if (token) {
    const refreshTarget = callbackUrl
      ? `/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
      : `/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    // Token present but not yet processed — redirect to API handler
    return (
      <AuthCard title="Verifying your email">
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle2 className="w-6 h-6 text-blue-600" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            Verifying your email address…
          </p>
          <meta httpEquiv="refresh" content={`0;url=${refreshTarget}`} />
        </div>
      </AuthCard>
    );
  }

  // Default state: email sent, waiting for verification
  return (
    <AuthCard title="Check your email">
      <div className="space-y-4 text-center py-2">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6 text-blue-600" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to your email address. Click the link to
            activate your account.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            The link expires in 24 hours. Check your spam folder if you
            don&apos;t see it.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </AuthCard>
  );
}
