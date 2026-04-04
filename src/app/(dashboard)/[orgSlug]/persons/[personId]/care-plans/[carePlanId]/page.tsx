import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  getCarePlan,
  getCarePlanVersion,
  submitCarePlanForReview,
  approveCarePlan,
  returnCarePlanToDraft,
} from '@/features/care-plans/actions';
import {
  getStandardsWithCounts,
  listLinkedStandardsForRecord,
  syncRecordStandardLinks,
} from '@/features/ofsted/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { CarePlanDetail } from '@/components/care-plans/care-plan-detail';
import type { Role } from '@/lib/rbac/permissions';
import type { CarePlanSection } from '@/lib/db/schema/care-plans';

interface CarePlanDetailPageProps {
  params: Promise<{ orgSlug: string; personId: string; carePlanId: string }>;
  searchParams: Promise<{ version?: string }>;
}

export async function generateMetadata({
  params,
}: CarePlanDetailPageProps): Promise<Metadata> {
  const { carePlanId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Care Plan — Complete Care' };
  }
  const plan = await getCarePlan(carePlanId).catch(() => null);
  return {
    title: plan ? `${plan.title} — Complete Care` : 'Care Plan — Complete Care',
  };
}

export default async function CarePlanDetailPage({
  params,
  searchParams,
}: CarePlanDetailPageProps) {
  const { orgSlug, personId, carePlanId } = await params;
  const { version: versionParam } = await searchParams;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/care-plans/${carePlanId}`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'care_plans');
  const canApprove = hasPermission(role, 'approve', 'care_plans');
  const canReadOfsted = hasPermission(role, 'read', 'ofsted');
  const canManageOfsted = hasPermission(role, 'manage', 'ofsted');

  const [person, carePlan, standardOptions, linkedStandards] = await Promise.all([
    getPerson(personId),
    getCarePlan(carePlanId),
    canReadOfsted ? getStandardsWithCounts() : Promise.resolve([]),
    canReadOfsted
      ? listLinkedStandardsForRecord('care_plan', carePlanId)
      : Promise.resolve([]),
  ]);

  if (!person || !carePlan) notFound();

  const resolvedCarePlan = carePlan;

  // If a specific version is requested, show that version's content
  let displayPlan = resolvedCarePlan;
  let isHistoricalVersion = false;

  if (versionParam) {
    const versionNumber = parseInt(versionParam, 10);
    if (!isNaN(versionNumber) && versionNumber !== carePlan.version) {
      const historicalVersion = await getCarePlanVersion(carePlanId, versionNumber);
      if (historicalVersion) {
        // Create a "display" plan that shows the historical version's content
        displayPlan = {
          ...carePlan,
          title: historicalVersion.title,
          sections: historicalVersion.sections as CarePlanSection[],
          version: historicalVersion.versionNumber,
          status: historicalVersion.status,
        };
        isHistoricalVersion = true;
      }
    }
  }

  async function handleSubmitForReview() {
    'use server';
    const result = await submitCarePlanForReview(carePlanId);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  async function handleApprove() {
    'use server';
    const result = await approveCarePlan(carePlanId);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  async function handleReturnToDraft() {
    'use server';
    const result = await returnCarePlanToDraft(carePlanId);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  async function handleSaveLinkedStandards(standardIds: string[]) {
    'use server';
    const result = await syncRecordStandardLinks({
      evidenceType: 'care_plan',
      evidenceId: carePlanId,
      recordTitle: `care plan "${resolvedCarePlan.title}"`,
      standardIds,
    });

    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

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
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {person.fullName}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}/care-plans`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Care Plans
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium truncate max-w-xs"
            aria-current="page"
          >
            {carePlan.title}
          </li>
        </ol>
      </nav>

      {/* Historical version banner */}
      {isHistoricalVersion && (
        <div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 flex items-center justify-between gap-4"
          role="alert"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-800">
              You are viewing version <span className="font-semibold">v{displayPlan.version}</span> (historical).
              This is a read-only view.
            </p>
          </div>
          <Link
            href={`/${orgSlug}/persons/${personId}/care-plans/${carePlanId}`}
            className="text-xs font-medium text-amber-700 hover:text-amber-900 underline flex-shrink-0"
          >
            View current version
          </Link>
        </div>
      )}

      <CarePlanDetail
        carePlan={displayPlan}
        orgSlug={orgSlug}
        personId={personId}
        personName={person.fullName}
        canEdit={canEdit && !isHistoricalVersion}
        canApprove={canApprove && !isHistoricalVersion}
        canManageOfsted={canManageOfsted && !isHistoricalVersion}
        qualityStandards={standardOptions.map((row) => ({
          id: row.id,
          name: row.standardName,
          regulationNumber: row.regulationNumber,
        }))}
        linkedStandards={linkedStandards}
        onSubmitForReview={handleSubmitForReview}
        onApprove={handleApprove}
        onReturnToDraft={handleReturnToDraft}
        onSaveLinkedStandards={handleSaveLinkedStandards}
      />
    </div>
  );
}
