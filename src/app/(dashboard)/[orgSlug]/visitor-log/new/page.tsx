import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { createVisitorLogEntry } from '@/features/keyworker/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { VisitorLogForm } from '@/features/keyworker/components/visitor-log-form';
import type { Role } from '@/lib/rbac/permissions';

export const metadata: Metadata = {
  title: 'Record Visitor — Complete Care',
};

interface NewVisitorPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewVisitorPage({ params }: NewVisitorPageProps) {
  const { orgSlug } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/visitor-log/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'compliance');
  if (!canCreate) redirect(`/${orgSlug}/permission-denied`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link
              href={`/${orgSlug}/visitor-log`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Visitor Log
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            Record visitor
          </li>
        </ol>
      </nav>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Record Visitor
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Log a new visitor to the home
        </p>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <VisitorLogForm
          redirectTo={`/${orgSlug}/visitor-log`}
          onCreate={createVisitorLogEntry}
        />
      </div>
    </div>
  );
}
