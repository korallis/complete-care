import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getStaffProfile } from '@/features/staff/actions';
import {
  getSupervision,
  completeSupervision,
  getStaffOptions,
} from '@/features/supervisions/actions';
import type { CompleteSupervisionInput } from '@/features/supervisions/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { CompleteSupervisionFormWrapper } from './form-wrapper';

interface CompleteSupervisionPageProps {
  params: Promise<{ orgSlug: string; staffId: string; supervisionId: string }>;
}

export async function generateMetadata({
  params,
}: CompleteSupervisionPageProps): Promise<Metadata> {
  const { staffId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Complete Supervision — Complete Care' };
  }
  const profile = await getStaffProfile(staffId).catch(() => null);
  return {
    title: profile
      ? `Complete Supervision — ${profile.fullName} — Complete Care`
      : 'Complete Supervision — Complete Care',
  };
}

export default async function CompleteSupervisionPage({
  params,
}: CompleteSupervisionPageProps) {
  const { orgSlug, staffId, supervisionId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/${staffId}/supervision/${supervisionId}/complete`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'staff');

  if (!canEdit) {
    redirect(`/${orgSlug}/staff/${staffId}/supervision`);
  }

  const staff = await getStaffProfile(staffId);
  if (!staff) {
    notFound();
  }

  const supervision = await getSupervision(supervisionId);
  if (!supervision) {
    notFound();
  }

  if (supervision.status === 'completed' || supervision.status === 'cancelled') {
    redirect(`/${orgSlug}/staff/${staffId}/supervision/${supervisionId}`);
  }

  const staffOptions = await getStaffOptions();

  async function handleComplete(
    data: CompleteSupervisionInput,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await completeSupervision(supervisionId, data);
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
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
          <li>
            <Link
              href={`/${orgSlug}/staff/${staffId}`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              {staff.fullName}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li>
            <Link
              href={`/${orgSlug}/staff/${staffId}/supervision`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Supervisions
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Complete
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
          Complete Supervision
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Record the supervision session for{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {staff.fullName}
          </span>
        </p>
      </div>

      {/* Complete form */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <CompleteSupervisionFormWrapper
          supervisionId={supervisionId}
          staffOptions={staffOptions}
          onComplete={handleComplete}
          returnUrl={`/${orgSlug}/staff/${staffId}/supervision`}
        />
      </div>
    </div>
  );
}
