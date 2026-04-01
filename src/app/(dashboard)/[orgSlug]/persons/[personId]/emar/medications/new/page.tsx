import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { createMedication } from '@/features/emar/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { MedicationForm } from '@/components/emar/medication-form';

interface NewMedicationPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export const metadata: Metadata = {
  title: 'Prescribe Medication -- Complete Care',
};

export default async function NewMedicationPage({
  params,
}: NewMedicationPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/emar/medications/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'medications');

  if (!canCreate) {
    notFound();
  }

  const person = await getPerson(personId);
  if (!person) notFound();

  return (
    <div>
      {/* Sub-nav */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            Prescribe Medication
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            Add a new medication for {person.fullName}
          </p>
        </div>
        <Link
          href={`/${orgSlug}/persons/${personId}/emar/medications`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Medications
        </Link>
      </div>

      <MedicationForm
        mode="create"
        personId={personId}
        orgSlug={orgSlug}
        onSubmit={createMedication}
      />
    </div>
  );
}
