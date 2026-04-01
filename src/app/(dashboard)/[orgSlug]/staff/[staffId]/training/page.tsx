import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getStaffProfile } from '@/features/staff/actions';
import {
  listTrainingRecords,
  listQualifications,
  listTrainingCourses,
  createTrainingRecord,
  updateTrainingRecord,
  deleteTrainingRecord,
  createQualification,
  updateQualification,
  deleteQualification,
} from '@/features/training/actions';
import type {
  CreateTrainingRecordInput,
  UpdateTrainingRecordInput,
  CreateQualificationInput,
  UpdateQualificationInput,
} from '@/features/training/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { TrainingRecordList } from '@/components/training/training-record-list';
import { QualificationList } from '@/components/training/qualification-form';

interface StaffTrainingPageProps {
  params: Promise<{ orgSlug: string; staffId: string }>;
}

export async function generateMetadata({
  params,
}: StaffTrainingPageProps): Promise<Metadata> {
  const { staffId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Training — Complete Care' };
  }
  const profile = await getStaffProfile(staffId).catch(() => null);
  return {
    title: profile
      ? `Training — ${profile.fullName} — Complete Care`
      : 'Training — Complete Care',
  };
}

export default async function StaffTrainingPage({
  params,
}: StaffTrainingPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/${staffId}/training`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'manage', 'compliance');
  const canCreate = hasPermission(role, 'create', 'compliance');

  const staff = await getStaffProfile(staffId);
  if (!staff) {
    notFound();
  }

  // Fetch training data in parallel
  const [records, quals, courses] = await Promise.all([
    listTrainingRecords({ staffProfileId: staffId }),
    listQualifications({ staffProfileId: staffId }),
    listTrainingCourses(),
  ]);

  // Server action wrappers
  async function handleCreateRecord(
    data: CreateTrainingRecordInput,
  ): Promise<{ success: boolean; error?: string; field?: string }> {
    'use server';
    const result = await createTrainingRecord(data);
    if (result.success) return { success: true };
    return { success: false, error: result.error, field: ('field' in result ? result.field : undefined) };
  }

  async function handleUpdateRecord(
    id: string,
    data: UpdateTrainingRecordInput,
  ): Promise<{ success: boolean; error?: string; field?: string }> {
    'use server';
    const result = await updateTrainingRecord(id, data);
    if (result.success) return { success: true };
    return { success: false, error: result.error, field: ('field' in result ? result.field : undefined) };
  }

  async function handleDeleteRecord(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await deleteTrainingRecord(id);
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  }

  async function handleCreateQual(
    data: CreateQualificationInput,
  ): Promise<{ success: boolean; error?: string; field?: string }> {
    'use server';
    const result = await createQualification(data);
    if (result.success) return { success: true };
    return { success: false, error: result.error, field: ('field' in result ? result.field : undefined) };
  }

  async function handleUpdateQual(
    id: string,
    data: UpdateQualificationInput,
  ): Promise<{ success: boolean; error?: string; field?: string }> {
    'use server';
    const result = await updateQualification(id, data);
    if (result.success) return { success: true };
    return { success: false, error: result.error, field: ('field' in result ? result.field : undefined) };
  }

  async function handleDeleteQual(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await deleteQualification(id);
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
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Training
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
          Training & Qualifications
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Training records and qualifications for{' '}
          <span className="font-medium text-[oklch(0.35_0.04_160)]">
            {staff.fullName}
          </span>
        </p>
      </div>

      {/* Training Records section */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-[oklch(0.18_0.02_160)] mb-4">
          Training Records
        </h2>
        <TrainingRecordList
          staffProfileId={staffId}
          staffName={staff.fullName}
          records={records}
          courses={courses.map((c) => ({
            id: c.id,
            name: c.name,
            defaultProvider: c.defaultProvider,
            validityMonths: c.validityMonths,
          }))}
          canEdit={canCreate || canEdit}
          onCreate={handleCreateRecord}
          onUpdate={handleUpdateRecord}
          onDelete={handleDeleteRecord}
        />
      </section>

      {/* Qualifications section */}
      <section>
        <h2 className="text-lg font-semibold text-[oklch(0.18_0.02_160)] mb-4">
          Qualifications
        </h2>
        <QualificationList
          staffProfileId={staffId}
          staffName={staff.fullName}
          qualifications={quals}
          canEdit={canCreate || canEdit}
          onCreate={handleCreateQual}
          onUpdate={handleUpdateQual}
          onDelete={handleDeleteQual}
        />
      </section>
    </div>
  );
}
