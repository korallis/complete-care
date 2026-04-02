import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPlacementPlan } from '@/features/lac/actions';
import { getPerson } from '@/features/persons/actions';
import { PlacementPlanDetail } from '@/components/lac/placement-plan-detail';
import { hasPermission, requirePermission } from '@/lib/rbac';

type PlacementPlanPageProps = {
  params: Promise<{ orgSlug: string; personId: string; planId: string }>;
};

export default async function PlacementPlanPage({
  params,
}: PlacementPlanPageProps) {
  const { orgSlug, personId, planId } = await params;

  const { role } = await requirePermission('read', 'ofsted');

  const [person, plan] = await Promise.all([
    getPerson(personId),
    getPlacementPlan(planId),
  ]);

  if (!person || !plan || plan.personId !== personId) notFound();

  const canEdit = hasPermission(role, 'manage', 'ofsted');

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}/lac`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              {person.fullName} — LAC
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}/lac/placement-plans`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Placement plans
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Plan detail
          </li>
        </ol>
      </nav>

      <PlacementPlanDetail
        plan={plan}
        orgSlug={orgSlug}
        personId={personId}
        canEdit={canEdit}
      />
    </div>
  );
}
