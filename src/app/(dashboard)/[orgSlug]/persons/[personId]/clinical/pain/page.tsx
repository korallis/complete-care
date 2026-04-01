import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listPainAssessments,
  getPainTrends,
  createPainAssessment,
} from '@/features/bowel-sleep-pain/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { PainAssessmentForm } from '@/components/bowel-sleep-pain/pain-assessment-form';
import { PainTrendChart } from '@/components/bowel-sleep-pain/pain-trend-chart';

interface PainPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: PainPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Pain Assessment -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Pain Assessment -- ${person.fullName} -- Complete Care`
      : 'Pain Assessment -- Complete Care',
  };
}

export default async function PainPage({
  params,
  searchParams,
}: PainPageProps) {
  const { orgSlug, personId } = await params;
  const { page: pageParam } = await searchParams;

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
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/clinical/pain`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRecord = hasPermission(role, 'create', 'clinical');

  const person = await getPerson(personId);
  if (!person) notFound();

  const page = pageParam ? parseInt(pageParam, 10) : 1;

  const [assessmentsResult, trendData] = await Promise.all([
    listPainAssessments({ personId, page, pageSize: 10 }),
    getPainTrends({ personId, days: 30 }),
  ]);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            Pain Assessment
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            NRS, Abbey, and PAINAD pain monitoring for {person.fullName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/bowel`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Bowel
          </Link>
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/sleep`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Sleep
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PainTrendChart
            assessments={assessmentsResult.assessments}
            trendData={trendData}
          />

          {/* Pagination */}
          {assessmentsResult.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {page > 1 && (
                <Link
                  href={`/${orgSlug}/persons/${personId}/clinical/pain?page=${page - 1}`}
                  className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                >
                  Previous
                </Link>
              )}
              <span className="text-xs text-[oklch(0.55_0_0)]">
                Page {assessmentsResult.page} of {assessmentsResult.totalPages}
              </span>
              {page < assessmentsResult.totalPages && (
                <Link
                  href={`/${orgSlug}/persons/${personId}/clinical/pain?page=${page + 1}`}
                  className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
        {canRecord && (
          <div>
            <PainAssessmentForm
              personId={personId}
              onSubmit={createPainAssessment}
            />
          </div>
        )}
      </div>
    </div>
  );
}
