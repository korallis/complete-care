'use client';

/**
 * CarePlanVersionCompare — side-by-side diff view comparing two care plan versions.
 */

import type { CarePlanVersion } from '@/lib/db/schema/care-plan-versions';
import type { CarePlan } from '@/lib/db/schema/care-plans';
import {
  computeCarePlanDiff,
  carePlanVersionToSnapshot,
  carePlanToVersionSnapshot,
  formatVersion,
} from '@/features/care-plans/utils';
import type { DiffLine, SectionDiff } from '@/features/care-plans/utils';
import { CarePlanStatusBadge } from './care-plan-status-badge';

// ---------------------------------------------------------------------------
// Diff line display
// ---------------------------------------------------------------------------

function DiffLineDisplay({ line }: { line: DiffLine }) {
  if (line.type === 'added') {
    return (
      <div className="flex gap-2 bg-green-50 px-2 py-0.5 rounded">
        <span className="select-none text-green-600 font-mono text-xs w-3 flex-shrink-0" aria-hidden="true">+</span>
        <span className="text-xs text-green-800 font-mono whitespace-pre-wrap">{line.text || ' '}</span>
      </div>
    );
  }

  if (line.type === 'removed') {
    return (
      <div className="flex gap-2 bg-red-50 px-2 py-0.5 rounded">
        <span className="select-none text-red-500 font-mono text-xs w-3 flex-shrink-0" aria-hidden="true">-</span>
        <span className="text-xs text-red-800 font-mono whitespace-pre-wrap line-through">{line.text || ' '}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 px-2 py-0.5">
      <span className="select-none text-[oklch(0.75_0_0)] font-mono text-xs w-3 flex-shrink-0" aria-hidden="true"> </span>
      <span className="text-xs text-[oklch(0.45_0_0)] font-mono whitespace-pre-wrap">{line.text || ' '}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section diff display
// ---------------------------------------------------------------------------

function SectionDiffDisplay({ diff }: { diff: SectionDiff }) {
  const changeTypeColors = {
    added: 'border-green-200 bg-green-50/30',
    removed: 'border-red-200 bg-red-50/30',
    modified: 'border-amber-200 bg-amber-50/30',
    unchanged: 'border-[oklch(0.91_0.005_160)] bg-white',
  };

  const changeTypeBadge = {
    added: (
      <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">Added</span>
    ),
    removed: (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">Removed</span>
    ),
    modified: (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Modified</span>
    ),
    unchanged: null,
  };

  // Only show unchanged sections if they have content
  if (diff.changeType === 'unchanged' && diff.diffLines.every((l) => !l.text)) {
    return null;
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${changeTypeColors[diff.changeType]}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-inherit">
        <h4 className="text-sm font-semibold text-[oklch(0.22_0.04_160)]">{diff.sectionTitle}</h4>
        {changeTypeBadge[diff.changeType]}
      </div>
      {diff.changeType !== 'unchanged' && (
        <div className="p-3 space-y-0.5">
          {diff.diffLines.map((line, i) => (
            <DiffLineDisplay key={i} line={line} />
          ))}
          {diff.diffLines.length === 0 && (
            <p className="text-xs text-[oklch(0.65_0_0)] italic px-2">No content changes</p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type VersionInfo = {
  versionNumber: number;
  createdAt: Date;
  createdByName: string | null;
  status: string;
};

type CarePlanVersionCompareProps = {
  oldVersion: CarePlanVersion | null;
  newVersion: CarePlanVersion | null;
  currentPlan?: CarePlan;
  v1Number: number;
  v2Number: number;
};

export function CarePlanVersionCompare({
  oldVersion,
  newVersion,
  currentPlan,
  v1Number,
  v2Number,
}: CarePlanVersionCompareProps) {
  // Build snapshots for comparison
  const oldSnapshot = oldVersion
    ? carePlanVersionToSnapshot(oldVersion)
    : null;
  const newSnapshot = newVersion
    ? carePlanVersionToSnapshot(newVersion)
    : currentPlan
    ? carePlanToVersionSnapshot(currentPlan)
    : null;

  if (!oldSnapshot || !newSnapshot) {
    return (
      <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-12 text-center">
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Could not load versions for comparison.
        </p>
      </div>
    );
  }

  const diff = computeCarePlanDiff(oldSnapshot, newSnapshot);

  const oldInfo: VersionInfo = oldVersion
    ? {
        versionNumber: oldVersion.versionNumber,
        createdAt: new Date(oldVersion.createdAt),
        createdByName: oldVersion.createdByName,
        status: oldVersion.status,
      }
    : { versionNumber: v1Number, createdAt: new Date(), createdByName: null, status: 'unknown' };

  const newInfo: VersionInfo = newVersion
    ? {
        versionNumber: newVersion.versionNumber,
        createdAt: new Date(newVersion.createdAt),
        createdByName: newVersion.createdByName,
        status: newVersion.status,
      }
    : currentPlan
    ? {
        versionNumber: currentPlan.version,
        createdAt: new Date(currentPlan.updatedAt),
        createdByName: null,
        status: currentPlan.status,
      }
    : { versionNumber: v2Number, createdAt: new Date(), createdByName: null, status: 'unknown' };

  const hasChanges =
    diff.titleChanged ||
    diff.addedSections.length > 0 ||
    diff.removedSections.length > 0 ||
    diff.modifiedSections.length > 0;

  return (
    <div className="space-y-6">
      {/* Version headers */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { info: oldInfo, label: 'Older version' },
          { info: newInfo, label: 'Newer version' },
        ].map(({ info, label }) => (
          <div
            key={info.versionNumber}
            className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4"
          >
            <div className="text-xs font-medium text-[oklch(0.55_0_0)] mb-1">{label}</div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[oklch(0.22_0.04_160)] font-mono">
                {formatVersion(info.versionNumber)}
              </span>
              <CarePlanStatusBadge status={info.status} />
            </div>
            <div className="mt-1 text-xs text-[oklch(0.55_0_0)]">
              {info.createdAt.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {info.createdByName && ` · ${info.createdByName}`}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {!hasChanges ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
          <span className="font-semibold">No differences found.</span> These two versions are identical.
        </div>
      ) : (
        <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-4">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-3">
            Changes summary
          </h3>
          <ul className="space-y-1.5 text-sm">
            {diff.titleChanged && (
              <li className="flex items-center gap-2 text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" aria-hidden="true" />
                Title changed: &quot;{diff.oldTitle}&quot; → &quot;{diff.newTitle}&quot;
              </li>
            )}
            {diff.addedSections.map((s) => (
              <li key={s} className="flex items-center gap-2 text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" aria-hidden="true" />
                Section added: {s}
              </li>
            ))}
            {diff.removedSections.map((s) => (
              <li key={s} className="flex items-center gap-2 text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" aria-hidden="true" />
                Section removed: {s}
              </li>
            ))}
            {diff.modifiedSections.map((s) => (
              <li key={s} className="flex items-center gap-2 text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" aria-hidden="true" />
                Section modified: {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed diffs */}
      {hasChanges && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
            Detailed changes
          </h3>
          {diff.sectionDiffs
            .filter((d) => d.changeType !== 'unchanged')
            .map((sectionDiff) => (
              <SectionDiffDisplay key={sectionDiff.sectionId} diff={sectionDiff} />
            ))}
        </div>
      )}
    </div>
  );
}
