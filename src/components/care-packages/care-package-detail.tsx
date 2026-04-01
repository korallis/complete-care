'use client';

/**
 * CarePackageDetail — overview of a care package with visit types and schedule.
 */

import Link from 'next/link';
import type { CarePackage, VisitType } from '@/lib/db/schema/care-packages';
import type { EnvironmentNotes } from '@/lib/db/schema/care-packages';
import { PackageStatusBadge } from './care-package-status-badge';
import { EnvironmentCard } from './environment-card';
import {
  FUNDING_TYPE_LABELS,
  VISIT_TYPE_LABELS,
  VISIT_FREQUENCY_LABELS,
} from '@/features/care-packages/constants';
import type { FundingType, VisitTypePreset, VisitFrequency } from '@/features/care-packages/constants';
import { isPackageReviewOverdue, isPackageReviewDueSoon } from '@/features/care-packages/schema';

type CarePackageDetailProps = {
  carePackage: CarePackage;
  visitTypes: VisitType[];
  orgSlug: string;
  personId: string;
  canEdit: boolean;
  canViewKeySafe: boolean;
};

export function CarePackageDetail({
  carePackage,
  visitTypes,
  orgSlug,
  personId,
  canEdit,
  canViewKeySafe,
}: CarePackageDetailProps) {
  const reviewOverdue = isPackageReviewOverdue(carePackage.reviewDate);
  const reviewDueSoon = isPackageReviewDueSoon(carePackage.reviewDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)]">
            Care Package
          </h2>
          <PackageStatusBadge status={carePackage.status} />
        </div>
        {canEdit && (
          <Link
            href={`/${orgSlug}/persons/${personId}/care-package/edit`}
            className="inline-flex items-center gap-2 rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-3.5 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors"
          >
            Edit package
          </Link>
        )}
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <dt className="text-xs font-medium text-[oklch(0.45_0.03_160)]">Start date</dt>
            <dd className="mt-0.5 text-sm font-medium text-[oklch(0.22_0.04_160)]">
              {carePackage.startDate}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.45_0.03_160)]">End date</dt>
            <dd className="mt-0.5 text-sm font-medium text-[oklch(0.22_0.04_160)]">
              {carePackage.endDate ?? 'Ongoing'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.45_0.03_160)]">Funding</dt>
            <dd className="mt-0.5 text-sm font-medium text-[oklch(0.22_0.04_160)]">
              {FUNDING_TYPE_LABELS[carePackage.fundingType as FundingType] ?? carePackage.fundingType}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[oklch(0.45_0.03_160)]">Weekly hours</dt>
            <dd className="mt-0.5 text-sm font-medium text-[oklch(0.22_0.04_160)]">
              {carePackage.weeklyHours ?? 'Not set'}
            </dd>
          </div>
          <div className="col-span-2 md:col-span-4">
            <dt className="text-xs font-medium text-[oklch(0.45_0.03_160)]">
              Review date
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-[oklch(0.22_0.04_160)]">
              {carePackage.reviewDate ?? 'Not set'}
              {reviewOverdue && (
                <span className="ml-2 text-xs text-red-600 font-semibold">
                  Overdue
                </span>
              )}
              {reviewDueSoon && !reviewOverdue && (
                <span className="ml-2 text-xs text-amber-600 font-semibold">
                  Due soon
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Visit types */}
      <div>
        <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
          Visit types ({visitTypes.length})
        </h3>
        {visitTypes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-6 text-center">
            <p className="text-sm text-[oklch(0.55_0_0)]">
              No visit types configured. Edit the package to add visit types.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visitTypes.map((vt) => {
              const label = VISIT_TYPE_LABELS[vt.name as VisitTypePreset] ?? vt.name;
              const freqLabel = VISIT_FREQUENCY_LABELS[vt.frequency as VisitFrequency] ?? vt.frequency;
              const taskCount = Array.isArray(vt.taskList) ? vt.taskList.length : 0;

              return (
                <div
                  key={vt.id}
                  className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                      {label}
                    </h4>
                    <span className="text-xs text-[oklch(0.55_0_0)]">
                      {vt.duration} mins
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-[oklch(0.55_0_0)]">
                    <p>
                      Window: {vt.timeWindowStart} - {vt.timeWindowEnd}
                    </p>
                    <p>Frequency: {freqLabel}</p>
                    {taskCount > 0 && (
                      <p>{taskCount} task{taskCount !== 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Environment card */}
      <EnvironmentCard
        environmentNotes={(carePackage.environmentNotes ?? {}) as EnvironmentNotes}
        canViewKeySafe={canViewKeySafe}
      />

      {/* Notes */}
      {carePackage.notes && (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
          <h3 className="text-xs font-medium text-[oklch(0.45_0.03_160)] mb-2">
            Notes
          </h3>
          <p className="text-sm text-[oklch(0.22_0.04_160)] whitespace-pre-wrap">
            {carePackage.notes}
          </p>
        </div>
      )}
    </div>
  );
}
