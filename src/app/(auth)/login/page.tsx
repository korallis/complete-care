import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Complete Care account',
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const { callbackUrl, message } = params;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your Complete Care account"
    >
      {message === 'email_verified' && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Email verified! You can now sign in.
        </div>
      )}
      <LoginForm callbackUrl={callbackUrl} />
    </AuthCard>
  );
}
