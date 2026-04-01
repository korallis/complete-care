/**
 * Care Plan utility functions.
 * Pure functions — no side effects, no DB calls.
 * Safe for use in both client and server environments.
 */

import type { CarePlanSection } from '@/lib/db/schema/care-plans';
import type { CarePlanVersion } from '@/lib/db/schema/care-plan-versions';
import type { CarePlan } from '@/lib/db/schema/care-plans';

// ---------------------------------------------------------------------------
// Diff types
// ---------------------------------------------------------------------------

export type DiffOperation = 'unchanged' | 'added' | 'removed';

export type DiffLine = {
  type: DiffOperation;
  text: string;
};

export type SectionDiff = {
  sectionId: string;
  sectionTitle: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  diffLines: DiffLine[];
};

export type CarePlanDiff = {
  titleChanged: boolean;
  oldTitle: string;
  newTitle: string;
  sectionDiffs: SectionDiff[];
  addedSections: string[];
  removedSections: string[];
  modifiedSections: string[];
};

// ---------------------------------------------------------------------------
// Simple diff algorithm (line-level)
// ---------------------------------------------------------------------------

/**
 * Computes a simple line-level diff between two text strings.
 * Returns an array of DiffLine objects indicating added, removed, or unchanged lines.
 */
export function diffText(oldText: string, newText: string): DiffLine[] {
  const oldLines = (oldText || '').split('\n');
  const newLines = (newText || '').split('\n');

  // Use Myers diff algorithm (simplified: LCS-based)
  const lcs = computeLCS(oldLines, newLines);

  const result: DiffLine[] = [];
  let oldIdx = 0;
  let newIdx = 0;
  let lcsIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (
      lcsIdx < lcs.length &&
      oldIdx < oldLines.length &&
      newIdx < newLines.length &&
      oldLines[oldIdx] === lcs[lcsIdx] &&
      newLines[newIdx] === lcs[lcsIdx]
    ) {
      // Common line (unchanged)
      result.push({ type: 'unchanged', text: oldLines[oldIdx] });
      oldIdx++;
      newIdx++;
      lcsIdx++;
    } else if (newIdx < newLines.length && (lcsIdx >= lcs.length || newLines[newIdx] !== lcs[lcsIdx])) {
      // Added in new
      result.push({ type: 'added', text: newLines[newIdx] });
      newIdx++;
    } else if (oldIdx < oldLines.length) {
      // Removed from old
      result.push({ type: 'removed', text: oldLines[oldIdx] });
      oldIdx++;
    }
  }

  return result;
}

/**
 * Computes the Longest Common Subsequence of two string arrays.
 */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;

  // Build DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to get LCS
  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}

// ---------------------------------------------------------------------------
// Care plan diff
// ---------------------------------------------------------------------------

/**
 * Computes the diff between two care plan versions.
 */
export function computeCarePlanDiff(
  oldVersion: { title: string; sections: CarePlanSection[] },
  newVersion: { title: string; sections: CarePlanSection[] },
): CarePlanDiff {
  const titleChanged = oldVersion.title !== newVersion.title;

  // Map old sections by type for comparison
  const oldByType = new Map(oldVersion.sections.map((s) => [s.type, s]));
  const newByType = new Map(newVersion.sections.map((s) => [s.type, s]));

  const allTypes = new Set([
    ...oldVersion.sections.map((s) => s.type),
    ...newVersion.sections.map((s) => s.type),
  ]);

  const sectionDiffs: SectionDiff[] = [];
  const addedSections: string[] = [];
  const removedSections: string[] = [];
  const modifiedSections: string[] = [];

  for (const type of allTypes) {
    const oldSection = oldByType.get(type);
    const newSection = newByType.get(type);

    if (!oldSection && newSection) {
      // Section added
      addedSections.push(newSection.title);
      sectionDiffs.push({
        sectionId: newSection.id,
        sectionTitle: newSection.title,
        changeType: 'added',
        diffLines: (newSection.content || '').split('\n').map((line) => ({
          type: 'added',
          text: line,
        })),
      });
    } else if (oldSection && !newSection) {
      // Section removed
      removedSections.push(oldSection.title);
      sectionDiffs.push({
        sectionId: oldSection.id,
        sectionTitle: oldSection.title,
        changeType: 'removed',
        diffLines: (oldSection.content || '').split('\n').map((line) => ({
          type: 'removed',
          text: line,
        })),
      });
    } else if (oldSection && newSection) {
      // Section possibly modified
      const contentChanged = oldSection.content !== newSection.content;
      const titleChanged = oldSection.title !== newSection.title;

      if (contentChanged || titleChanged) {
        modifiedSections.push(newSection.title);
        sectionDiffs.push({
          sectionId: newSection.id,
          sectionTitle: newSection.title,
          changeType: 'modified',
          diffLines: diffText(oldSection.content || '', newSection.content || ''),
        });
      } else {
        sectionDiffs.push({
          sectionId: newSection.id,
          sectionTitle: newSection.title,
          changeType: 'unchanged',
          diffLines: (newSection.content || '').split('\n').map((line) => ({
            type: 'unchanged',
            text: line,
          })),
        });
      }
    }
  }

  return {
    titleChanged,
    oldTitle: oldVersion.title,
    newTitle: newVersion.title,
    sectionDiffs,
    addedSections,
    removedSections,
    modifiedSections,
  };
}

// ---------------------------------------------------------------------------
// Version display helpers
// ---------------------------------------------------------------------------

/** Format a version for display (e.g., "v3") */
export function formatVersion(versionNumber: number): string {
  return `v${versionNumber}`;
}

/**
 * Builds the "current state" object from a care plan for version comparison.
 */
export function carePlanToVersionSnapshot(
  plan: Pick<CarePlan, 'title' | 'sections'>,
): { title: string; sections: CarePlanSection[] } {
  return {
    title: plan.title,
    sections: (plan.sections ?? []) as CarePlanSection[],
  };
}

/**
 * Builds the version snapshot object from a carePlanVersion row.
 */
export function carePlanVersionToSnapshot(
  version: Pick<CarePlanVersion, 'title' | 'sections'>,
): { title: string; sections: CarePlanSection[] } {
  return {
    title: version.title,
    sections: (version.sections ?? []) as CarePlanSection[],
  };
}

// ---------------------------------------------------------------------------
// Review status helpers
// ---------------------------------------------------------------------------

/** Human-readable labels for review frequency options */
export const REVIEW_FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

/** Human-readable labels for approval status */
export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'In Review',
  approved: 'Approved',
  archived: 'Archived',
};

/** Returns the colour variant for a care plan status */
export function getStatusVariant(
  status: string,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'approved':
      return 'default';
    case 'review':
      return 'secondary';
    case 'draft':
      return 'outline';
    case 'archived':
      return 'secondary';
    default:
      return 'outline';
  }
}
