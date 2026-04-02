import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { createRestraint } from '@/features/keyworker/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { RestraintForm } from '@/features/keyworker/components/restraint-form';
import type { Role } from '@/lib/rbac/permissions';

interface NewRestraintPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: NewRestraintPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) return { title: 'Record Restraint — Complete Care' };
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Record Restraint — ${person.fullName} — Complete Care`
      : 'Record Restraint — Complete Care',
  };
}

export default async function NewRestraintPage({ params }: NewRestraintPageProps) {
  const { orgSlug, personId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const memberships = session.user.memberships ?? [];
  const activeMembership = memberships.find(
    (m) => m.orgId === session.user.activeOrgId,
  );

  if (!activeMembership || activeMembership.orgSlug !== orgSlug) {
    const targetMembership = memberships.find((m) => m.orgSlug === orgSlug);
    if (!targetMembership) notFound();
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/keyworker/restraints/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'incidents');
  if (!canCreate) redirect(`/${orgSlug}/permission-denied`);

  const person = await getPerson(personId);
  if (!person) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
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
              href={`/${orgSlug}/persons/${personId}/keyworker`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {person.fullName}
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            Record restraint
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Record Physical Intervention
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Recording a restraint for {person.fullName}. A debrief with the child and staff is required.
        </p>
      </div>

      {/* Regulatory notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <svg
          className="mt-0.5 h-5 w-5 text-amber-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-amber-800">Mandatory debrief required</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Under the Children&apos;s Homes (England) Regulations 2015, a debrief with the child and all
            involved staff is required following any physical intervention. This must be completed as
            soon as practicable.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <RestraintForm
          personId={personId}
          orgSlug={orgSlug}
          onCreate={createRestraint}
        />
      </div>
    </div>
  );
}
