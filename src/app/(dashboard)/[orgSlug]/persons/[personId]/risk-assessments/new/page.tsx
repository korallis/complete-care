import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  createRiskAssessment,
  completeRiskAssessment,
} from '@/features/risk-assessments/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { RiskAssessmentForm } from '@/components/risk-assessments/risk-assessment-form';
import type { Role } from '@/lib/rbac/permissions';

interface NewRiskAssessmentPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: NewRiskAssessmentPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'New Risk Assessment — Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `New Risk Assessment — ${person.fullName} — Complete Care`
      : 'New Risk Assessment — Complete Care',
  };
}

export default async function NewRiskAssessmentPage({
  params,
}: NewRiskAssessmentPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/risk-assessments/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'assessments');

  if (!canCreate) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  const person = await getPerson(personId);
  if (!person) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            New
          </li>
        </ol>
      </nav>

      <RiskAssessmentForm
        mode="new"
        personId={personId}
        orgSlug={orgSlug}
        onCreate={createRiskAssessment}
        onComplete={completeRiskAssessment}
      />
    </div>
  );
}
