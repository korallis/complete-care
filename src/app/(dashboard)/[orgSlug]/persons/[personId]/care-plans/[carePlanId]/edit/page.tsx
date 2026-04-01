import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { getCarePlan, updateCarePlan } from '@/features/care-plans/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { CarePlanForm } from '@/components/care-plans/care-plan-form';
import type { Role } from '@/lib/rbac/permissions';

interface EditCarePlanPageProps {
  params: Promise<{ orgSlug: string; personId: string; carePlanId: string }>;
}

export async function generateMetadata({
  params,
}: EditCarePlanPageProps): Promise<Metadata> {
  const { carePlanId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Edit Care Plan — Complete Care' };
  }
  const plan = await getCarePlan(carePlanId).catch(() => null);
  return {
    title: plan ? `Edit ${plan.title} — Complete Care` : 'Edit Care Plan — Complete Care',
  };
}

export default async function EditCarePlanPage({ params }: EditCarePlanPageProps) {
  const { orgSlug, personId, carePlanId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/care-plans/${carePlanId}/edit`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canEdit = hasPermission(role, 'update', 'care_plans');

  if (!canEdit) {
    redirect(`/${orgSlug}/permission-denied`);
  }

  const [person, carePlan] = await Promise.all([
    getPerson(personId),
    getCarePlan(carePlanId),
  ]);

  if (!person || !carePlan) notFound();

  async function handleUpdate(data: Parameters<typeof updateCarePlan>[1]) {
    'use server';
    return updateCarePlan(carePlanId, data);
  }

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
          <li>
            <Link
              href={`/${orgSlug}/persons/${personId}/care-plans/${carePlanId}`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {carePlan.title}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            Edit
          </li>
        </ol>
      </nav>

      {/* Version notice */}
      <div className="mb-6 rounded-xl border border-[oklch(0.88_0.01_160)] bg-[oklch(0.97_0.005_160)] px-5 py-3">
        <p className="text-sm text-[oklch(0.45_0.05_160)]">
          <span className="font-semibold">Saving creates a new version.</span>{' '}
          The current version (v{carePlan.version}) will be preserved in history.
        </p>
      </div>

      <CarePlanForm
        mode="edit"
        carePlan={carePlan}
        personId={personId}
        orgSlug={orgSlug}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
