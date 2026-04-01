import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listRiskAssessments,
  checkAndCreateReviewReminders,
} from '@/features/risk-assessments/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { RiskAssessmentList } from '@/components/risk-assessments/risk-assessment-list';
import { RiskAlertBanner } from '@/components/risk-assessments/risk-alert-banner';
import { getAlertsForAssessments } from '@/features/risk-assessments/alerts';
import { TEMPLATE_LABELS } from '@/features/risk-assessments/templates';
import type { RiskAssessmentTemplateId } from '@/features/risk-assessments/templates';
import type { Role } from '@/lib/rbac/permissions';

interface RiskAssessmentsPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: RiskAssessmentsPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Risk Assessments — Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Risk Assessments — ${person.fullName} — Complete Care`
      : 'Risk Assessments — Complete Care',
  };
}

export default async function RiskAssessmentsPage({
  params,
}: RiskAssessmentsPageProps) {
  const { orgSlug, personId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/risk-assessments`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'assessments');

  const person = await getPerson(personId);
  if (!person) notFound();

  // Lazy reminder generation
  void checkAndCreateReviewReminders(session.user.id, personId);

  const result = await listRiskAssessments({ personId });

  // Compute alerts for the assessment list
  const alertAssessments = result.assessments.map((a) => ({
    ...a,
    personId,
    reviewDate: a.reviewDate ?? null,
    templateName:
      TEMPLATE_LABELS[a.templateId as RiskAssessmentTemplateId] ?? a.templateId,
  }));
  const alerts = getAlertsForAssessments(alertAssessments);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link
              href={`/${orgSlug}/persons`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Persons
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {person.fullName}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Risk Assessments
          </li>
        </ol>
      </nav>

      {/* Alert banners */}
      {alerts.length > 0 && (
        <RiskAlertBanner alerts={alerts} className="mb-6" />
      )}

      <RiskAssessmentList
        assessments={result.assessments}
        orgSlug={orgSlug}
        personId={personId}
        canCreate={canCreate}
        totalCount={result.totalCount}
      />
    </div>
  );
}
