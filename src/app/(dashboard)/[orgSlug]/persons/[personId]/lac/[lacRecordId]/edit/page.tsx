import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { getLacRecord, updateLacRecord } from '@/features/lac/actions';
import { LacRecordForm } from '@/components/lac/lac-record-form';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';

type EditLacRecordPageProps = {
  params: Promise<{
    orgSlug: string;
    personId: string;
    lacRecordId: string;
  }>;
};

export default async function EditLacRecordPage({
  params,
}: EditLacRecordPageProps) {
  const { orgSlug, personId, lacRecordId } = await params;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/lac/${lacRecordId}/edit`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage = hasPermission(role, 'manage', 'ofsted');
  if (!canManage) redirect(`/${orgSlug}/permission-denied`);

  const [person, record] = await Promise.all([
    getPerson(personId),
    getLacRecord(lacRecordId),
  ]);

  if (!person || !record || record.personId !== personId) notFound();

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
          <li
            className="text-[oklch(0.35_0.04_160)] font-medium"
            aria-current="page"
          >
            Edit record
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Edit LAC Record
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Update legal status and key contacts for {person.fullName}
        </p>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <LacRecordForm
          mode="edit"
          record={record}
          personId={personId}
          orgSlug={orgSlug}
          onSubmit={(input) => updateLacRecord(lacRecordId, input)}
        />
      </div>
    </div>
  );
}
