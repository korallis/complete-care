import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getChildChronology } from '@/features/safeguarding/actions';
import { ChronologyTimeline } from '@/features/safeguarding/components/chronology-timeline';
import { getPerson } from '@/features/persons/actions';
import type { SafeguardingChronologyEntry } from '@/lib/db/schema/safeguarding';

export const metadata: Metadata = {
  title: 'Safeguarding Chronology — Complete Care',
};

interface ChronologyPageProps {
  params: Promise<{ orgSlug: string; childId: string }>;
}

export default async function ChronologyPage({ params }: ChronologyPageProps) {
  const { orgSlug, childId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.activeOrgId) redirect('/onboarding');

  const [chronologyResult, person] = await Promise.all([
    getChildChronology(childId),
    getPerson(childId).catch(() => null),
  ]);

  if (!person) notFound();

  const entries = chronologyResult.success
    ? (chronologyResult.data as SafeguardingChronologyEntry[])
    : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-[oklch(0.55_0_0)]">
          <li>
            <Link href={`/${orgSlug}/safeguarding`} className="hover:text-[oklch(0.35_0.06_160)] transition-colors">
              Safeguarding
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.75_0_0)]">/</li>
          <li className="text-[oklch(0.35_0.04_160)] font-medium" aria-current="page">
            Chronology — {person.fullName}
          </li>
        </ol>
      </nav>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">
          Safeguarding Chronology
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-generated chronology for {person.fullName}. Aggregates all safeguarding
          concerns, referrals, incidents, and missing episodes in chronological order.
        </p>
      </div>

      <ChronologyTimeline
        childName={person.fullName}
        entries={entries}
        canAddManualEntry={false}
      />
    </div>
  );
}
