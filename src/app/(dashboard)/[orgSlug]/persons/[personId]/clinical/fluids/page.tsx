import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listFluidEntries,
  get24hrFluidTotals,
  recordFluidEntry,
} from '@/features/clinical-monitoring/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { FluidChart } from '@/components/clinical/fluid-chart';
import { FluidEntryForm } from '@/components/clinical/fluid-entry-form';
import { FluidAlertBanner } from '@/components/clinical/fluid-alert-banner';

interface FluidsPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({
  params,
}: FluidsPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Fluid Chart -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Fluid Chart -- ${person.fullName} -- Complete Care`
      : 'Fluid Chart -- Complete Care',
  };
}

export default async function FluidsPage({
  params,
  searchParams,
}: FluidsPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/clinical/fluids`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRecord = hasPermission(role, 'create', 'clinical');

  const person = await getPerson(personId);
  if (!person) notFound();

  // Default to today
  const date = dateParam ?? new Date().toISOString().slice(0, 10);

  const [entries, totals] = await Promise.all([
    listFluidEntries({ personId, date }),
    get24hrFluidTotals({ personId, date }),
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            Fluid Chart
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            24hr intake/output monitoring for {person.fullName}
          </p>
        </div>
        <Link
          href={`/${orgSlug}/persons/${personId}/clinical/nutrition`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          Nutrition
        </Link>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Link
          href={`/${orgSlug}/persons/${personId}/clinical/fluids?date=${prevDateStr}`}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          aria-label="Previous day"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
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
          href={`/${orgSlug}/persons/${personId}/clinical/fluids?date=${nextDateStr}`}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          aria-label="Next day"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>

        {!isToday && (
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/fluids`}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Today
          </Link>
        )}
      </div>

      {/* Alerts */}
      {isToday && (
        <div className="mb-4">
          <FluidAlertBanner
            totalIntake={totals.totalIntake}
            lastIntakeAt={totals.lastIntakeAt}
          />
        </div>
      )}

      {/* Main content: chart + form side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FluidChart
            entries={entries}
            totalIntake={totals.totalIntake}
            totalOutput={totals.totalOutput}
            balance={totals.balance}
          />
        </div>
        {canRecord && (
          <div>
            <FluidEntryForm personId={personId} onSubmit={recordFluidEntry} />
          </div>
        )}
      </div>
    </div>
  );
}
