import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { ChangePasswordForm } from '@/components/auth/change-password-form';

export const metadata: Metadata = {
  title: 'Security Settings — Complete Care',
  description: 'Manage your account security and password',
};

interface SecurityPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function SecurityPage({ params }: SecurityPageProps) {
  const { orgSlug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_150)]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/${orgSlug}/settings`}
              className="text-sm text-[oklch(0.48_0_0)] hover:text-[oklch(0.25_0.02_160)] transition-colors"
            >
              ← Settings
            </Link>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
            Security
          </h1>
          <p className="mt-1 text-sm text-[oklch(0.48_0_0)]">
            Manage your account password and security settings.
          </p>
        </div>

        {/* Change password section */}
        <div className="rounded-xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm">
          <div className="px-6 py-5 border-b border-[oklch(0.93_0.005_150)]">
            <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">
              Change password
            </h2>
            <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
              Update your password to keep your account secure. You&apos;ll continue to be logged in after changing your password.
            </p>
          </div>
          <div className="px-6 py-6">
            <ChangePasswordForm />
          </div>
        </div>

        {/* Session info */}
        <div className="mt-6 rounded-xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm">
          <div className="px-6 py-5">
            <h2 className="text-base font-semibold text-[oklch(0.18_0.03_160)]">
              Session security
            </h2>
            <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
              Your session expires automatically after 30 minutes of inactivity for your security.
              You will be asked to sign in again after this period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
