import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { createChildrensVoiceEntry } from '@/features/keyworker/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { ChildrenVoiceForm } from '@/features/keyworker/components/children-voice-form';
import type { Role } from '@/lib/rbac/permissions';

interface NewVoicePageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: NewVoicePageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) return { title: 'Record Wishes — Complete Care' };
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Record Wishes — ${person.fullName} — Complete Care`
      : 'Record Wishes — Complete Care',
  };
}

export default async function NewVoicePage({ params }: NewVoicePageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/keyworker/voice/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canCreate = hasPermission(role, 'create', 'care_plans');
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
            Record wishes
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Record Child&apos;s Wishes &amp; Feelings
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Capture {person.fullName}&apos;s views, wishes, and feelings in their own words
        </p>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <ChildrenVoiceForm
          personId={personId}
          orgSlug={orgSlug}
          onCreate={createChildrensVoiceEntry}
        />
      </div>
    </div>
  );
}
