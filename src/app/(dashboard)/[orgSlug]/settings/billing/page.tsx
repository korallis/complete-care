/**
 * Billing settings page at /[orgSlug]/settings/billing.
 * Accessible only to organisation owners; non-owners are redirected to permission-denied.
 * This matches the nav item href (/settings/billing) and the RBAC test (VAL-AUTH-017).
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { BillingContent } from '@/components/billing/billing-content';

export const metadata: Metadata = {
  title: 'Billing — Complete Care',
  description: 'Manage your subscription and billing',
};

interface BillingSettingsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function BillingSettingsPage({ params }: BillingSettingsPageProps) {
  const { orgSlug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  // Only owners can access billing — non-owners see access-denied
  if (session.user.role !== 'owner') {
    redirect(`/${orgSlug}/permission-denied`);
  }

  return <BillingContent />;
}
