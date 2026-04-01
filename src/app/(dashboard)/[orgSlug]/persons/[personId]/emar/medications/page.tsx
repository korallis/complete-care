import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { listMedications } from '@/features/emar/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { MedicationList } from '@/components/emar/medication-list';

interface MedicationsPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ status?: string }>;
}

export async function generateMetadata({
  params,
}: MedicationsPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Medications -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Medications -- ${person.fullName} -- Complete Care`
      : 'Medications -- Complete Care',
  };
}

export default async function MedicationsPage({
  params,
  searchParams,
}: MedicationsPageProps) {
  const { orgSlug, personId } = await params;
  const { status } = await searchParams;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/emar/medications`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'medications');

  const person = await getPerson(personId);
  if (!person) notFound();

  const result = await listMedications({ personId, status: status || undefined });

  return (
    <div>
      {/* Sub-nav */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            Medications
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            All prescribed medications for {person.fullName}
          </p>
        </div>
        <Link
          href={`/${orgSlug}/persons/${personId}/emar`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to MAR Chart
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { label: 'All', value: undefined },
          { label: 'Active', value: 'active' },
          { label: 'Discontinued', value: 'discontinued' },
          { label: 'Suspended', value: 'suspended' },
          { label: 'Completed', value: 'completed' },
        ].map((tab) => {
          const isActive = (status || undefined) === tab.value;
          const href = tab.value
            ? `/${orgSlug}/persons/${personId}/emar/medications?status=${tab.value}`
            : `/${orgSlug}/persons/${personId}/emar/medications`;
          return (
            <Link
              key={tab.label}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[oklch(0.3_0.08_160)] text-white'
                  : 'bg-[oklch(0.97_0.003_160)] text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.94_0.005_160)]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <MedicationList
        medications={result.medications}
        orgSlug={orgSlug}
        personId={personId}
        canCreate={canCreate}
        totalCount={result.totalCount}
      />
    </div>
  );
}
