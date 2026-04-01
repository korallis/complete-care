import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { OnboardingWizard } from '@/components/organisations/onboarding-wizard';

export const metadata: Metadata = {
  title: 'Create New Organisation — Complete Care',
  description: 'Create a new organisation and select your care domains.',
};

/**
 * New Organisation page — allows existing users to create an additional organisation.
 * Unlike /onboarding (which blocks users with an existing org), this page
 * is accessible from within the dashboard via the org switcher.
 *
 * Authentication: requires a valid session (dashboard layout handles this).
 */
export default async function NewOrganisationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/new-organisation');
  }

  // Note: This page intentionally does NOT redirect existing org owners away.
  // That is the key difference from /onboarding.

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
          Create a new organisation
        </h1>
        <p className="mt-2 text-sm text-[oklch(0.55_0_0)] max-w-md">
          Set up a separate organisation to manage a different care service or business entity.
        </p>
      </div>

      <div className="w-full max-w-xl">
        <OnboardingWizard userName={session.user.name ?? ''} />
      </div>
    </div>
  );
}
