import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getStaffProfile, updateStaffProfile } from '@/features/staff/actions';
import type { CreateStaffInput } from '@/features/staff/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { StaffForm } from '@/components/staff/staff-form';

interface EditStaffPageProps {
  params: Promise<{ orgSlug: string; staffId: string }>;
}

export async function generateMetadata({
  params,
}: EditStaffPageProps): Promise<Metadata> {
  const { staffId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Edit Staff — Complete Care' };
  }
  const profile = await getStaffProfile(staffId).catch(() => null);
  return {
    title: profile
      ? `Edit ${profile.fullName} — Complete Care`
      : 'Edit Staff — Complete Care',
  };
}

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  const { orgSlug, staffId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/${staffId}/edit`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;

  // Check update permission
  if (!hasPermission(role, 'update', 'staff')) {
    redirect(`/${orgSlug}/staff/${staffId}`);
  }

  const staff = await getStaffProfile(staffId);
  if (!staff) {
    notFound();
  }

  async function handleUpdateStaff(data: CreateStaffInput) {
    'use server';
    const result = await updateStaffProfile(staffId, data);
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
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Edit
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
          Edit {staff.fullName}
        </h1>
        <p className="mt-1 text-sm text-[oklch(0.55_0_0)]">
          Update staff profile details.
        </p>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <StaffForm
          orgSlug={orgSlug}
          defaultValues={{
            firstName: staff.firstName ?? undefined,
            lastName: staff.lastName ?? undefined,
            jobTitle: staff.jobTitle,
            contractType: staff.contractType as 'full_time' | 'part_time' | 'zero_hours' | 'agency' | 'bank',
            weeklyHours: staff.weeklyHours ? Number(staff.weeklyHours) : undefined,
            startDate: staff.startDate ?? undefined,
            endDate: staff.endDate ?? undefined,
            niNumber: staff.niNumber ?? undefined,
            email: staff.email ?? undefined,
            phone: staff.phone ?? undefined,
            emergencyContactName: staff.emergencyContactName ?? undefined,
            emergencyContactPhone: staff.emergencyContactPhone ?? undefined,
            emergencyContactRelation: staff.emergencyContactRelation ?? undefined,
          }}
          onSubmit={handleUpdateStaff}
          mode="edit"
        />
      </div>
    </div>
  );
}
