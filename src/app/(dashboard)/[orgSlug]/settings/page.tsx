import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getOrgSettings } from '@/features/organisations/actions';
import { OrgSettingsForm } from '@/components/organisations/org-settings-form';

export const metadata: Metadata = {
  title: 'Organisation Settings — Complete Care',
};

interface OrgSettingsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgSettingsPage({ params }: OrgSettingsPageProps) {
  const { orgSlug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const settings = await getOrgSettings();

  if (!settings || settings.slug !== orgSlug) {
    notFound();
  }

  const canManage =
    session.user.role === 'owner' || session.user.role === 'admin';

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.005_150)]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[oklch(0.15_0.03_160)]">
            Organisation Settings
          </h1>
          <p className="mt-1 text-sm text-[oklch(0.48_0_0)]">
            Manage your organisation&apos;s name, URL slug, and care domains.
          </p>
        </div>

        <div className="rounded-xl border border-[oklch(0.9_0.005_150)] bg-white shadow-sm">
          <OrgSettingsForm
            orgId={settings.id}
            initialName={settings.name}
            initialSlug={settings.slug}
            initialDomains={settings.domains}
            canManage={canManage}
          />
        </div>

        {/* Quick links */}
        <div className="mt-4 flex items-center gap-6">
          <a
            href={`/${orgSlug}/settings/team`}
            className="text-sm text-[oklch(0.35_0.06_160)] hover:text-[oklch(0.25_0.05_160)] font-medium transition-colors"
          >
            Manage team members
          </a>
          <span className="text-[oklch(0.75_0_0)]">·</span>
          <Link
            href={`/${orgSlug}/settings/security`}
            className="text-sm text-[oklch(0.35_0.06_160)] hover:text-[oklch(0.25_0.05_160)] font-medium transition-colors"
          >
            Security &amp; password
          </Link>
        </div>
      </div>
    </div>
  );
}
