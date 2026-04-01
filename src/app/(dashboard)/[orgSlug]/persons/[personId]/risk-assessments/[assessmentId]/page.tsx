import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  getRiskAssessment,
  completeRiskAssessment,
  createRiskAssessment,
} from '@/features/risk-assessments/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { TEMPLATE_LABELS, getTemplate } from '@/features/risk-assessments/templates';
import type { RiskAssessmentTemplateId } from '@/features/risk-assessments/templates';
import { RiskAssessmentDetail } from '@/components/risk-assessments/risk-assessment-detail';
import { RiskAssessmentForm } from '@/components/risk-assessments/risk-assessment-form';
import type { Role } from '@/lib/rbac/permissions';

interface RiskAssessmentDetailPageProps {
  params: Promise<{
    orgSlug: string;
    personId: string;
    assessmentId: string;
  }>;
}

export async function generateMetadata({
  params,
}: RiskAssessmentDetailPageProps): Promise<Metadata> {
  const { assessmentId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Risk Assessment — Complete Care' };
  }
  const assessment = await getRiskAssessment(assessmentId).catch(() => null);
  const label = assessment
    ? (TEMPLATE_LABELS[assessment.templateId as RiskAssessmentTemplateId] ??
        assessment.templateId)
    : 'Risk Assessment';
  return { title: `${label} — Complete Care` };
}

export default async function RiskAssessmentDetailPage({
  params,
}: RiskAssessmentDetailPageProps) {
  const { orgSlug, personId, assessmentId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/risk-assessments/${assessmentId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canUpdate = hasPermission(role, 'update', 'assessments');

  const [person, assessment] = await Promise.all([
    getPerson(personId),
    getRiskAssessment(assessmentId),
  ]);

  if (!person || !assessment) notFound();

  const templateLabel =
    TEMPLATE_LABELS[assessment.templateId as RiskAssessmentTemplateId] ??
    assessment.templateId;
  const template = getTemplate(assessment.templateId);

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
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}/risk-assessments`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Risk Assessments
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium truncate max-w-xs"
            aria-current="page"
          >
            {templateLabel}
          </li>
        </ol>
      </nav>

      {/* Draft: show form to complete. Completed: show detail view */}
      {assessment.status === 'draft' && canUpdate && template ? (
        <RiskAssessmentForm
          mode="complete"
          personId={personId}
          orgSlug={orgSlug}
          assessment={assessment}
          template={template}
          onCreate={createRiskAssessment}
          onComplete={completeRiskAssessment}
        />
      ) : (
        <RiskAssessmentDetail
          assessment={assessment}
          orgSlug={orgSlug}
          personId={personId}
          personName={person.fullName}
        />
      )}
    </div>
  );
}
