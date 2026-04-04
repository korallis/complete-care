import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your Complete Care account to get started',
};

type RegisterPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthCard
      title="Create your account"
      description="Join Complete Care — the UK's care management platform"
    >
      <RegisterForm callbackUrl={callbackUrl} />
    </AuthCard>
  );
}
