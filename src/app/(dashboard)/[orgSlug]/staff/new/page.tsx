import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { createStaffProfile } from '@/features/staff/actions';
import type { CreateStaffInput } from '@/features/staff/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { StaffForm } from '@/components/staff/staff-form';

export const metadata: Metadata = {
  title: 'Add Staff Member — Complete Care',
};

interface NewStaffPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function NewStaffPage({ params }: NewStaffPageProps) {
  const { orgSlug } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (!session.user.activeOrgId) {
    redirect('/onboarding');
  }

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) {
      notFound();
    }
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;

  // Check create permission
  if (!hasPermission(role, 'create', 'staff')) {
    redirect(`/${orgSlug}/staff`);
  }

  async function handleCreateStaff(data: CreateStaffInput) {
    'use server';
    const result = await createStaffProfile(data);
    if (result.success) {
      return { success: true, staffId: result.data.id };
    }
    return { success: false, error: result.error };
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link
              href={`/${orgSlug}/staff`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Staff
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Add staff member
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
          Add staff member
        </h1>
        <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
          Create a new staff profile for {activeMembership.orgName}.
        </p>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <StaffForm orgSlug={orgSlug} onSubmit={handleCreateStaff} mode="create" />
      </div>
    </div>
  );
}
