import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { PlacementPlanForm } from '@/components/lac/placement-plan-form';
import { getPlacementPlan, updatePlacementPlan } from '@/features/lac/actions';
import { getPerson } from '@/features/persons/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';

type EditPlacementPlanPageProps = {
  params: Promise<{ orgSlug: string; personId: string; planId: string }>;
};

export default async function EditPlacementPlanPage({
  params,
: EditPlacementPlanPageProps) {
  const { orgSlug, personId, planId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (membership) => membership.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find(
      (membership) => membership.orgSlug === orgSlug,
    );
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/lac/placement-plans/${planId}/edit`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage = hasPermission(role, 'manage', 'ofsted');
  if (!canManage) redirect(`/${orgSlug}/permission-denied`);

  const [person, plan] = await Promise.all([
    getPerson(personId),
    getPlacementPlan(planId),
  ]);

  if (!person || !plan || plan.personId !== personId) notFound();

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}/lac/placement-plans/${planId}`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors"
            >
              Placement plan
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">
            /
          </li>
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Edit plan
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Edit Placement Plan
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Update placement arrangements for {person.fullName}
        </p>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <PlacementPlanForm
          mode="edit"
          plan={plan}
          personId={personId}
          orgSlug={orgSlug}
          onSubmit={(input) => updatePlacementPlan(planId, input)}
        />
      </div>
    </div>
  );
}
