import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { OnboardingWizard } from '@/components/organisations/onboarding-wizard';

export const metadata: Metadata = {
  title: 'Set up your organisation — Complete Care',
  description:
    'Create your organisation and select your care domains to get started.',
};

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/onboarding');
  }

  // If the user already has an active org, redirect to dashboard
  if (session.user.activeOrgId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[oklch(0.985_0.005_150)]">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, oklch(0.2 0 0) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />
      {/* Gradient orbs */}
      <div
        className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'oklch(0.72 0.12 160)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
        style={{ background: 'oklch(0.65 0.08 220)' }}
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="relative z-10 mb-8 text-center">
        <div className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[oklch(0.22_0.04_160)] flex items-center justify-center shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <span className="text-[oklch(0.18_0.03_160)] font-semibold text-lg tracking-tight">
            Complete Care
          </span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-xl px-4 pb-12">
        <OnboardingWizard userName={session.user.name ?? ''} />
      </div>
    </div>
  );
}
