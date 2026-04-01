import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getPerson } from '@/features/persons/actions';
import {
  listSleepChecks,
  recordSleepCheck,
} from '@/features/bowel-sleep-pain/actions';
import { hasPermission } from '@/lib/rbac/permissions';
import type { Role } from '@/lib/rbac/permissions';
import { SleepCheckForm } from '@/components/bowel-sleep-pain/sleep-check-form';
import { NightSummary } from '@/components/bowel-sleep-pain/night-summary';

interface SleepPageProps {
  params: Promise<{ orgSlug: string; personId: string }>;
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({
  params,
}: SleepPageProps): Promise<Metadata> {
  const { personId } = await params;
  const session = await auth();
  if (!session?.user?.activeOrgId) {
    return { title: 'Sleep Chart -- Complete Care' };
  }
  const person = await getPerson(personId).catch(() => null);
  return {
    title: person
      ? `Sleep Chart -- ${person.fullName} -- Complete Care`
      : 'Sleep Chart -- Complete Care',
  };
}

export default async function SleepPage({
  params,
  searchParams,
}: SleepPageProps) {
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
      `/api/orgs/switch?slug=${orgSlug}&returnTo=/${orgSlug}/persons/${personId}/clinical/sleep`,
    );
  }

  const role = (session.user.role ?? activeMembership.role ?? 'viewer') as Role;
  const canRecord = hasPermission(role, 'create', 'clinical');

  const person = await getPerson(personId);
  if (!person) notFound();

  const date = dateParam ?? new Date().toISOString().slice(0, 10);

  const checks = await listSleepChecks({ personId, date });

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
            Sleep / Rest Chart
          </h2>
          <p className="text-sm text-[oklch(0.55_0_0)]">
            Night-time monitoring for {person.fullName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/bowel`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Bowel
          </Link>
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/pain`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Pain
          </Link>
        </div>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Link
          href={`/${orgSlug}/persons/${personId}/clinical/sleep?date=${prevDateStr}`}
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
          href={`/${orgSlug}/persons/${personId}/clinical/sleep?date=${nextDateStr}`}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-sm text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          aria-label="Next day"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        {!isToday && (
          <Link
            href={`/${orgSlug}/persons/${personId}/clinical/sleep`}
            className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Today
          </Link>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <NightSummary checks={checks} />
        </div>
        {canRecord && (
          <div>
            <SleepCheckForm personId={personId} onSubmit={recordSleepCheck} />
          </div>
        )}
      </div>
    </div>
  );
}
