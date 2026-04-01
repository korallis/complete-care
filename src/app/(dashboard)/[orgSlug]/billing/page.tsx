import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BillingContent } from '@/components/billing/billing-content';

export const metadata: Metadata = {
  title: 'Billing — Complete Care',
  description: 'Manage your subscription and billing',
};

interface BillingPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { orgSlug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  // Only owners can access the billing page — return 403 for non-owners
  if (session.user.role !== 'owner') {
    redirect(`/${orgSlug}/permission-denied`);
  }

  return <BillingContent />;
}
