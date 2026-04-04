import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import {
  ensureRegisterEntriesForOrganisation,
  listRegisterEntries,
} from '@/features/ofsted/actions';
import { ChildrensRegister } from '@/components/ofsted/childrens-register';
import { db } from '@/lib/db';
import { persons } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export const metadata: Metadata = {
  title: "Children's Register - Complete Care",
};

interface RegisterPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { orgSlug } = await params;

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
    if (!targetMembership) {
      notFound();
    }
    redirect(
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/ofsted/register`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRead = hasPermission(role, 'read', 'ofsted');
  const canManage = hasPermission(role, 'manage', 'ofsted');

  if (!canRead) {
    notFound();
  }

  if (canManage) {
    await ensureRegisterEntriesForOrganisation();
  }

  const entries = await listRegisterEntries();

  // Fetch person names for the register entries
  const personIds = [...new Set(entries.map((e) => e.personId))];
  let personNames: Record<string, string> = {};
  if (personIds.length > 0) {
    const personRows = await db
      .select({ id: persons.id, fullName: persons.fullName })
      .from(persons)
      .where(inArray(persons.id, personIds));
    personNames = Object.fromEntries(
      personRows.map((p) => [p.id, p.fullName]),
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
        <Link
          href={`/${orgSlug}/ofsted`}
          className="hover:text-[oklch(0.35_0.15_160)]"
        >
          Ofsted Compliance
        </Link>
        <span>/</span>
        <span className="text-[oklch(0.35_0_0)]">
          Children&apos;s Register
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[oklch(0.18_0.02_160)]">
            Children&apos;s Register
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            Schedule 4 compliant register of children placed in the home
          </p>
        </div>
        <div className="text-sm text-[oklch(0.55_0_0)]">
          {entries.filter((e) => !e.dischargeDate).length} current residents
          &middot; {entries.length} total entries
        </div>
      </div>

      {/* Register table */}
      <ChildrensRegister
        entries={entries}
        personNames={personNames}
        canManage={canManage}
        orgSlug={orgSlug}
      />
    </div>
  );
}
