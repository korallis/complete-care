import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  getMarChart,
  listMedicationStaffMembers,
  recordAdministration,
} from '@/features/emar/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { MarChart } from '@/components/emar/mar-chart';
import { PrintMarChart, PrintButton } from '@/components/emar/print-mar-chart';

interface EmarPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({
  params,
}: EmarPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'MAR Chart -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `MAR Chart -- ${person.fullName} -- Complete Care`
      : 'MAR Chart -- Complete Care',
  };
}

export default async function EmarPage({ params, searchParams }: EmarPageProps) {
  const { orgSlug, personId } = await params;
  const { date: dateParam } = await searchParams;

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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/emar`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canAdminister = hasPermission(role, 'create', 'medications');
  const canPrescribe = hasPermission(role, 'update', 'medications');

  const person = await getPerson(personId);
  if (!person) notFound();

  // Default to today
  const date = dateParam ?? new Date().toISOString().slice(0, 10);
  const [data, staffMembers] = await Promise.all([
    getMarChart({ personId, date }),
    listMedicationStaffMembers(),
  ]);

  // Date navigation
  const prevDate = new Date(date + 'T12:00:00Z');
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(date + 'T12:00:00Z');
  nextDate.setDate(nextDate.getDate() + 1);
  const prevDateStr = prevDate.toISOString().slice(0, 10);
  const nextDateStr = nextDate.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            MAR Chart
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            Medication Administration Record for {person.fullName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PrintButton />
          <Link
            href={`/${orgSlug}/persons/${personId}/emar/medications`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            All Medications
          </Link>
          {canPrescribe && (
            <Link
              href={`/${orgSlug}/persons/${personId}/emar/medications/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Prescribe
            </Link>
          )}
        </div>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-center gap-3 mb-6 print:hidden">
        <Link
          href={`/${orgSlug}/persons/${personId}/emar?date=${prevDateStr}`}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          aria-label="Previous day"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <form className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15]"
            aria-label="Select date"
          />
          <button
            type="submit"
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Go
          </button>
        </form>

        <Link
          href={`/${orgSlug}/persons/${personId}/emar?date=${nextDateStr}`}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          aria-label="Next day"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {!isToday && (
          <Link
            href={`/${orgSlug}/persons/${personId}/emar`}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Today
          </Link>
        )}
      </div>

      {/* MAR Chart */}
      <MarChart
        data={data}
        orgSlug={orgSlug}
        personId={personId}
        currentUserId={session.user.id}
        staffMembers={staffMembers}
        canAdminister={canAdminister}
        onRecordAdministration={recordAdministration}
      />

      {/* Print view */}
      <PrintMarChart data={data} personName={person.fullName} />
    </div>
  );
}
