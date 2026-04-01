import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { AuthCard } from '@/components/auth/auth-card';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your Complete Care account',
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const { token } = params;

  if (!token) {
    return (
      <AuthCard title="Invalid reset link">
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            This reset link is missing a token. Please request a new password
            reset link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex h-9 items-center justify-center rounded-md bg-[oklch(0.22_0.04_160)] px-6 text-sm font-medium text-white hover:bg-[oklch(0.28_0.05_160)] transition-colors"
          >
            Request reset link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      description="Choose a strong password for your account"
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
