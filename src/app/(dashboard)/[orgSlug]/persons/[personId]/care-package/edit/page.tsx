import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listCarePackages,
  getCarePackage,
  createCarePackage,
  updateCarePackage,
  createVisitType,
} from '@/features/care-packages/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { CarePackageForm } from '@/components/care-packages/care-package-form';
import { VisitTypeForm } from '@/components/care-packages/visit-type-form';
import type { CreateCarePackageInput, UpdateCarePackageInput, CreateVisitTypeInput } from '@/features/care-packages/schema';
import { VISIT_TYPE_LABELS } from '@/features/care-packages/constants';
import type { VisitTypePreset } from '@/features/care-packages/constants';

interface EditCarePackagePageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: EditCarePackagePageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Edit Care Package -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Edit Care Package -- ${person.fullName} -- Complete Care`
      : 'Edit Care Package -- Complete Care',
  };
}

export default async function EditCarePackagePage({
  params,
}: EditCarePackagePageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/care-package/edit`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'care_plans');
  const canUpdate = hasPermission(role, 'update', 'care_plans');

  if (!canCreate && !canUpdate) {
    notFound();
  }

  const person = await getPerson(personId);
  if (!person) notFound();

  // Check if active package exists
  const result = await listCarePackages(personId);
  const activePkg = result.packages.find((p) => p.status === 'active');
  const existing = activePkg ? await getCarePackage(activePkg.id) : null;

  const isEdit = !!existing;

  // Server actions bound to this context
  async function handleCreate(data: CreateCarePackageInput) {
    'use server';
    return createCarePackage(data);
  }

  async function handleUpdate(data: UpdateCarePackageInput) {
    'use server';
    if (!existing) return { success: false as const, error: 'No care package to update' };
    return updateCarePackage(existing.id, data);
  }

  async function handleCreateVisitType(data: CreateVisitTypeInput) {
    'use server';
    return createVisitType(data);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
          {isEdit ? 'Edit care package' : 'Create care package'}
        </h2>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          {isEdit
            ? 'Update the care package details, visit types, and environment information.'
            : 'Set up a new domiciliary care package for this client.'}
        </p>
      </div>

      {isEdit ? (
        <CarePackageForm
          mode="edit"
          carePackage={existing!}
          onSubmit={handleUpdate}
          orgSlug={orgSlug}
          personId={personId}
        />
      ) : (
        <CarePackageForm
          mode="create"
          personId={personId}
          onSubmit={handleCreate}
          orgSlug={orgSlug}
        />
      )}

      {/* Visit types section (only for existing packages) */}
      {isEdit && existing && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
            Visit types ({existing.visitTypesList.length})
          </h3>

          {/* Existing visit types */}
          {existing.visitTypesList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {existing.visitTypesList.map((vt) => {
                const label = VISIT_TYPE_LABELS[vt.name as VisitTypePreset] ?? vt.name;
                return (
                  <div
                    key={vt.id}
                    className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                        {label}
                      </h4>
                      <span className="text-xs text-[oklch(0.55_0_0)]">{vt.duration} mins</span>
                    </div>
                    <p className="text-xs text-[oklch(0.55_0_0)] mt-1">
                      {vt.timeWindowStart} - {vt.timeWindowEnd} | {vt.frequency}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add visit type form */}
          <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
            <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-4">
              Add visit type
            </h4>
            <VisitTypeForm
              carePackageId={existing.id}
              onSubmit={handleCreateVisitType}
              onCancel={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
