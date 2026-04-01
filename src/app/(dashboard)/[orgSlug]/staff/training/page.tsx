import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import {
  getTrainingMatrix,
  getGapAnalysis,
  listTrainingCourses,
  seedDefaultCourses,
  createTrainingCourse,
  updateTrainingCourse,
  deleteTrainingCourse,
} from '@/features/training/actions';
import type {
  CreateTrainingCourseInput,
  UpdateTrainingCourseInput,
} from '@/features/training/schema';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { TrainingMatrix } from '@/components/training/training-matrix';
import { TrainingGapList } from '@/components/training/training-gap-list';
import { CourseManagement } from '@/components/training/course-management';

export const metadata: Metadata = {
  title: 'Training Matrix — Complete Care',
};

interface TrainingMatrixPageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function TrainingMatrixPage({
  params,
  searchParams,
}: TrainingMatrixPageProps) {
  const { orgSlug } = await params;
  const { tab = 'matrix' } = await searchParams;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/staff/training`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage = hasPermission(role, 'manage', 'compliance');

  // Fetch data based on active tab
  const [matrix, gapAnalysis, courses] = await Promise.all([
    getTrainingMatrix(),
    getGapAnalysis(),
    listTrainingCourses(),
  ]);

  // Server action wrappers
  async function handleSeedDefaults(): Promise<void> {
    'use server';
    await seedDefaultCourses();
  }

  async function handleCreateCourse(
    data: CreateTrainingCourseInput,
  ): Promise<{ success: boolean; error?: string; field?: string }> {
    'use server';
    const result = await createTrainingCourse(data);
    if (result.success) return { success: true };
    return { success: false, error: result.error, field: ('field' in result ? result.field : undefined) };
  }

  async function handleUpdateCourse(
    id: string,
    data: UpdateTrainingCourseInput,
  ): Promise<{ success: boolean; error?: string; field?: string }> {
    'use server';
    const result = await updateTrainingCourse(id, data);
    if (result.success) return { success: true };
    return { success: false, error: result.error, field: ('field' in result ? result.field : undefined) };
  }

  async function handleDeleteCourse(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    'use server';
    const result = await deleteTrainingCourse(id);
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  }

  const tabs = [
    { id: 'matrix', label: 'Training Matrix' },
    { id: 'gaps', label: 'Gap Analysis' },
    { id: 'courses', label: 'Course Catalogue' },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
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
            Training Matrix
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[oklch(0.18_0.02_160)]">
          Training Matrix
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Organisation-wide training compliance overview, gap analysis, and course management.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[oklch(0.92_0.005_160)] mb-6">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/${orgSlug}/staff/training?tab=${t.id}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              tab === t.id
                ? 'border-[oklch(0.35_0.06_160)] text-[oklch(0.22_0.04_160)]'
                : 'border-transparent text-[oklch(0.55_0_0)] hover:text-[oklch(0.35_0.04_160)] hover:border-[oklch(0.8_0.01_160)]'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'matrix' && (
        <TrainingMatrix data={matrix} orgSlug={orgSlug} />
      )}

      {tab === 'gaps' && (
        <TrainingGapList gaps={gapAnalysis} orgSlug={orgSlug} />
      )}

      {tab === 'courses' && (
        <CourseManagement
          courses={courses}
          canManage={canManage}
          onSeedDefaults={handleSeedDefaults}
          onCreate={handleCreateCourse}
          onUpdate={handleUpdateCourse}
          onDelete={handleDeleteCourse}
        />
      )}
    </div>
  );
}
