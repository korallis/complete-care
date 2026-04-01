import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getStaffProfile } from '@/features/staff/actions';
import { getSupervision, getStaffOptions } from '@/features/supervisions/actions';
import { SupervisionDetail } from '@/components/supervisions/supervision-detail';

interface SupervisionDetailPageProps {
  params: Promise<{ orgSlug: string; staffId: string; supervisionId: string }>;
}

export async function generateMetadata({
  params,
}: SupervisionDetailPageProps): Promise<Metadata> {
  const { staffId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Supervision Detail — Complete Care' };
  }
  const profile = await getStaffProfile(staffId).catch(() => null);
  return {
    title: profile
      ? `Supervision — ${profile.fullName} — Complete Care`
      : 'Supervision Detail — Complete Care',
  };
}

export default async function SupervisionDetailPage({
  params,
}: SupervisionDetailPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/${staffId}/supervision/${supervisionId}`,
    );
  }

  const staff = await getStaffProfile(staffId);
  if (!staff) {
    notFound();
  }

  const supervision = await getSupervision(supervisionId);
  if (!supervision) {
    notFound();
  }

  // Get supervisor name
  const staffOptions = await getStaffOptions();
  const supervisor = staffOptions.find((s) => s.id === supervision.supervisorId);

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
            Detail
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
          Supervision Record
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          {supervision.type === 'appraisal' ? 'Appraisal' : 'Supervision'} session for{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {staff.fullName}
          </span>
        </p>
      </div>

      {/* Supervision detail */}
      <SupervisionDetail
        supervision={supervision}
        staffName={staff.fullName}
        supervisorName={supervisor?.fullName ?? 'Unknown'}
      />
    </div>
  );
}
