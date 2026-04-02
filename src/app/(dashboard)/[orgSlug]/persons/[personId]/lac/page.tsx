/**
 * LAC Overview Page — displays the child's LAC record, status change history,
 * and quick navigation to placement plans.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { listLacRecords, listStatusChanges } from '@/features/lac/actions';
import { LacRecordDetail } from '@/components/lac/lac-record-detail';
import { StatusChangeHistory } from '@/components/lac/status-change-history';
import { hasPermission } from '@/lib/rbac';
import { requirePermission } from '@/lib/rbac';
import { db } from '@/lib/db';
import { persons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Props = {
  params: Promise<{ orgSlug: string; personId: string }>;
};

export default async function LacOverviewPage({ params }: Props) {
  const { orgSlug, personId } = await params;

  const { role } = await requirePermission('read', 'ofsted');

  // Fetch person name
  const [person] = await db
    .select({ fullName: persons.fullName })
    .from(persons)
    .where(eq(persons.id, personId))
    .limit(1);

  if (!person) notFound();

  const records = await listLacRecords(personId);
  const canManage = hasPermission(role, 'manage', 'ofsted');

  // Get the most recent (active) LAC record
  const activeRecord = records[0] ?? null;

  // Get status change history for the active record
  const statusChanges = activeRecord
    ? await listStatusChanges(activeRecord.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[oklch(0.22_0.04_160)]">
            LAC Documentation
          </h1>
          <p className="text-sm text-[oklch(0.55_0_0)] mt-0.5">
            Looked After Children documentation for {person.fullName}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/${orgSlug}/persons/${personId}/lac/placement-plans`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            Placement plans
          </Link>
          {canManage && !activeRecord && (
            <Link
              href={`/${orgSlug}/persons/${personId}/lac/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New LAC record
            </Link>
          )}
        </div>
      </div>

      {/* Active LAC record */}
      {activeRecord ? (
        <>
          <LacRecordDetail
            record={activeRecord}
            personName={person.fullName}
            orgSlug={orgSlug}
            personId={personId}
            canEdit={canManage}
          />
          <StatusChangeHistory changes={statusChanges} />
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.94_0.015_160)]">
            <svg
              className="h-6 w-6 text-[oklch(0.45_0.07_160)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[oklch(0.22_0.04_160)] mb-1">
            No LAC record
          </h3>
          <p className="text-sm text-[oklch(0.55_0_0)] mb-5">
            No LAC documentation has been created for this child yet.
          </p>
          {canManage && (
            <Link
              href={`/${orgSlug}/persons/${personId}/lac/new`}
              className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              Create LAC record
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
