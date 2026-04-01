import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your Complete Care account to get started',
};

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Join Complete Care — the UK's care management platform"
    >
      <RegisterForm />
    </AuthCard>
  );
}
