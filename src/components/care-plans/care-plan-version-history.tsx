'use client';

/**
 * CarePlanVersionHistory — shows the list of all versions for a care plan.
 * Allows viewing any past version or initiating a comparison.
 */

import { useState } from 'react';
import Link from 'next/link';
import type { CarePlanVersion } from '@/lib/db/schema/care-plan-versions';
import { CarePlanStatusBadge } from './care-plan-status-badge';
import { formatVersion } from '@/features/care-plans/utils';

type CarePlanVersionHistoryProps = {
  versions: CarePlanVersion[];
  currentVersion: number;
  orgSlug: string;
  personId: string;
  carePlanId: string;
};

export function CarePlanVersionHistory({
  versions,
  currentVersion,
  orgSlug,
  personId,
  carePlanId,
}: CarePlanVersionHistoryProps) {
  const [selectedForCompare, setSelectedForCompare] = useState<Set<number>>(new Set());

  function toggleCompareSelection(versionNumber: number) {
    setSelectedForCompare((prev) => {
      const next = new Set(prev);
      if (next.has(versionNumber)) {
        next.delete(versionNumber);
      } else if (next.size < 2) {
        next.add(versionNumber);
      }
      return next;
    });
  }

  const compareHref =
    selectedForCompare.size === 2
      ? `/${orgSlug}/persons/${personId}/care-plans/${carePlanId}/compare?v1=${Math.min(...selectedForCompare)}&v2=${Math.max(...selectedForCompare)}`
      : null;

  if (versions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">No version history available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compare action */}
      {versions.length >= 2 && (
        <div className="flex items-center justify-between rounded-xl border border-[oklch(0.88_0.01_160)] bg-[oklch(0.97_0.005_160)] px-5 py-3">
          <p className="text-sm text-[oklch(0.45_0.05_160)]">
            {selectedForCompare.size === 0 && 'Select two versions to compare'}
            {selectedForCompare.size === 1 && 'Select one more version to compare'}
            {selectedForCompare.size === 2 && `Comparing ${formatVersion(Math.min(...selectedForCompare))} and ${formatVersion(Math.max(...selectedForCompare))}`}
          </p>
          {compareHref && (
            <Link
              href={compareHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[oklch(0.3_0.08_160)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[oklch(0.25_0.08_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Compare versions
            </Link>
          )}
        </div>
      )}

      {/* Version list */}
      <ul className="space-y-3" role="list" aria-label="Version history">
        {versions.map((version) => {
          const isCurrent = version.versionNumber === currentVersion;
          const isSelected = selectedForCompare.has(version.versionNumber);

          return (
            <li key={version.id}>
              <div className={`rounded-xl border bg-white overflow-hidden transition-all ${
                isSelected
                  ? 'border-[oklch(0.5_0.1_160)] shadow-sm ring-1 ring-[oklch(0.5_0.1_160)/0.3]'
                  : 'border-[oklch(0.91_0.005_160)]'
              }`}>
                <div className="flex items-center gap-4 p-5">
                  {/* Version number */}
                  <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                    isCurrent
                      ? 'bg-[oklch(0.3_0.08_160)] text-white'
                      : 'bg-[oklch(0.93_0.003_160)] text-[oklch(0.45_0.04_160)]'
                  }`}>
                    {formatVersion(version.versionNumber)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">
                        {version.title}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center rounded-full border border-[oklch(0.8_0.08_160)] bg-[oklch(0.95_0.02_160)] px-2 py-0.5 text-[10px] font-semibold text-[oklch(0.3_0.08_160)]">
                          Current
                        </span>
                      )}
                      <CarePlanStatusBadge status={version.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[oklch(0.55_0_0)]">
                      <span>
                        {new Date(version.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {version.createdByName && (
                        <span>by <span className="font-medium text-[oklch(0.35_0.04_160)]">{version.createdByName}</span></span>
                      )}
                      <span>
                        {version.sections?.length ?? 0} section{(version.sections?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Compare checkbox */}
                    {versions.length >= 2 && (
                      <button
                        type="button"
                        onClick={() => toggleCompareSelection(version.versionNumber)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2 ${
                          isSelected
                            ? 'border-[oklch(0.5_0.1_160)] bg-[oklch(0.3_0.08_160)] text-white'
                            : selectedForCompare.size >= 2
                            ? 'border-[oklch(0.88_0_0)] bg-[oklch(0.95_0_0)] text-[oklch(0.6_0_0)] cursor-not-allowed'
                            : 'border-[oklch(0.88_0.005_160)] bg-white text-[oklch(0.45_0.04_160)] hover:border-[oklch(0.6_0.06_160)]'
                        }`}
                        disabled={!isSelected && selectedForCompare.size >= 2}
                        aria-pressed={isSelected}
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} version ${version.versionNumber} for comparison`}
                      >
                        Compare
                      </button>
                    )}

                    {/* View version (for non-current) */}
                    {!isCurrent && (
                      <Link
                        href={`/${orgSlug}/persons/${personId}/care-plans/${carePlanId}?version=${version.versionNumber}`}
                        className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-2.5 py-1.5 text-xs font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
