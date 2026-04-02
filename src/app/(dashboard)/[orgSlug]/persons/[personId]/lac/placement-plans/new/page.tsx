/**
 * New Placement Plan Page — creates a placement plan for a child's LAC record.
 * Route: /[orgSlug]/persons/[personId]/lac/placement-plans/new
 */

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import { listLacRecords, createPlacementPlan } from '@/features/lac/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import { PlacementPlanForm } from '@/components/lac/placement-plan-form';
import type { Role } from '@/lib/rbac/permissions';

interface NewPlacementPlanPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
}

export async function generateMetadata({
  params,
}: NewPlacementPlanPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) return { title: 'New Placement Plan — Complete Care' };
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `New Placement Plan — ${person.fullName} — Complete Care`
      : 'New Placement Plan — Complete Care',
  };
}

export default async function NewPlacementPlanPage({
  params,
}: NewPlacementPlanPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/lac/placement-plans/new`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canManage = hasPermission(role, 'manage', 'ofsted');
  if (!canManage) redirect(`/${orgSlug}/permission-denied`);

  const person = await getPerson(personId);
  if (!person) notFound();

  // Get the active LAC record — needed for placement plan creation
  const lacRecords = await listLacRecords(personId);
  const activeLacRecord = lacRecords[0] ?? null;

  if (!activeLacRecord) {
    // No LAC record exists — redirect to create one first
    redirect(`/${orgSlug}/persons/${personId}/lac/new`);
  }

  // Default due date: 5 working days from today
  const today = new Date();
  const dueDate = new Date(today);
  let workingDaysAdded = 0;
  while (workingDaysAdded < 5) {
    dueDate.setDate(dueDate.getDate() + 1);
    const day = dueDate.getDay();
    if (day !== 0 && day !== 6) workingDaysAdded++;
  }
  const dueDateStr = dueDate.toISOString().slice(0, 10);

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
              href={`/${orgSlug}/persons/${personId}/lac/placement-plans`}
              className="hover:text-[oklch(0.35_0.06_160)] transition-colors truncate max-w-xs inline-block"
            >
              {person.fullName} — Placement Plans
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            New plan
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-semibold text-[oklch(0.22_0.04_160)]">
          Create Placement Plan
        </h1>
        <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
          Creating a placement plan for {person.fullName}
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
          <p className="text-sm font-medium text-amber-800">5-Working-Day Deadline</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Under the Children&apos;s Homes (England) Regulations 2015, a placement plan must be
            completed within 5 working days of the child&apos;s admission. The suggested due date
            is {dueDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-6">
        <PlacementPlanForm
          mode="create"
          personId={personId}
          lacRecordId={activeLacRecord.id}
          dueDate={dueDateStr}
          orgSlug={orgSlug}
          onSubmit={createPlacementPlan}
        />
      </div>
    </div>
  );
}
