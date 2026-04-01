/**
 * Compliance RAG Calculation Utilities
 *
 * Pure functions for computing Red/Amber/Green compliance status
 * across all compliance areas (DBS, training, supervision, qualifications).
 *
 * Alert thresholds:
 * - GREEN: all items current, no concerns
 * - AMBER: items expiring within 30 days
 * - RED: items overdue or expired, or within 7 days
 *
 * This file MUST NOT have 'use server' -- it is imported by client components too.
 */

import type { RagColour, ComplianceArea } from './schema';

// ---------------------------------------------------------------------------
// Alert thresholds
// ---------------------------------------------------------------------------

/** Amber alert: 30 days before expiry */
export const AMBER_THRESHOLD_DAYS = 30;

/** Red alert: 7 days before (or past) expiry */
export const RED_THRESHOLD_DAYS = 7;

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Returns the number of days between today and a target date.
 * Negative values mean the date has passed.
 */
export function daysUntil(targetDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns the RAG colour for a date-based compliance item.
 * - RED: expired or within 7 days
 * - AMBER: within 30 days
 * - GREEN: more than 30 days away
 */
export function dateToRag(targetDate: string | null | undefined): RagColour {
  if (!targetDate) return 'grey';

  const days = daysUntil(targetDate);

  if (days < 0) return 'red'; // expired
  if (days <= RED_THRESHOLD_DAYS) return 'red'; // critical
  if (days <= AMBER_THRESHOLD_DAYS) return 'amber'; // approaching
  return 'green'; // current
}

// ---------------------------------------------------------------------------
// Per-area RAG computation
// ---------------------------------------------------------------------------

export type AreaRagStatus = {
  area: ComplianceArea;
  colour: RagColour;
  label: string;
  detail: string;
};

/**
 * Compute DBS compliance RAG from a staff member's latest DBS check.
 */
export function computeDbsRag(latestCheck: {
  recheckDate: string;
  status: string;
} | null): AreaRagStatus {
  if (!latestCheck) {
    return {
      area: 'dbs',
      colour: 'red',
      label: 'DBS',
      detail: 'No DBS check on record',
    };
  }

  const days = daysUntil(latestCheck.recheckDate);

  if (days < 0) {
    return {
      area: 'dbs',
      colour: 'red',
      label: 'DBS',
      detail: `DBS expired ${Math.abs(days)} day(s) ago`,
    };
  }

  if (days <= RED_THRESHOLD_DAYS) {
    return {
      area: 'dbs',
      colour: 'red',
      label: 'DBS',
      detail: `DBS expires in ${days} day(s)`,
    };
  }

  if (days <= AMBER_THRESHOLD_DAYS) {
    return {
      area: 'dbs',
      colour: 'amber',
      label: 'DBS',
      detail: `DBS recheck due in ${days} day(s)`,
    };
  }

  return {
    area: 'dbs',
    colour: 'green',
    label: 'DBS',
    detail: 'DBS current',
  };
}

/**
 * Compute training compliance RAG from training record statuses.
 * RED if any expired/missing mandatory training.
 * AMBER if any expiring soon.
 * GREEN if all current.
 */
export function computeTrainingRag(records: {
  status: string;
  expiryDate: string | null;
}[]): AreaRagStatus {
  if (records.length === 0) {
    return {
      area: 'training',
      colour: 'grey',
      label: 'Training',
      detail: 'No training records',
    };
  }

  const hasExpired = records.some((r) => r.status === 'expired');
  const hasExpiringSoon = records.some((r) => r.status === 'expiring_soon');

  if (hasExpired) {
    const expiredCount = records.filter((r) => r.status === 'expired').length;
    return {
      area: 'training',
      colour: 'red',
      label: 'Training',
      detail: `${expiredCount} training item(s) expired`,
    };
  }

  if (hasExpiringSoon) {
    const expiringCount = records.filter(
      (r) => r.status === 'expiring_soon',
    ).length;
    return {
      area: 'training',
      colour: 'amber',
      label: 'Training',
      detail: `${expiringCount} training item(s) expiring soon`,
    };
  }

  return {
    area: 'training',
    colour: 'green',
    label: 'Training',
    detail: 'All training current',
  };
}

/**
 * Compute supervision compliance RAG.
 * RED if supervision overdue.
 * AMBER if supervision due within 7 days.
 * GREEN if up to date.
 */
export function computeSupervisionRag(latestSupervision: {
  status: string;
  scheduledDate: Date;
  nextDueDate: Date | null;
} | null): AreaRagStatus {
  if (!latestSupervision) {
    return {
      area: 'supervision',
      colour: 'red',
      label: 'Supervision',
      detail: 'No supervision recorded',
    };
  }

  if (latestSupervision.status === 'overdue') {
    return {
      area: 'supervision',
      colour: 'red',
      label: 'Supervision',
      detail: 'Supervision overdue',
    };
  }

  if (latestSupervision.nextDueDate) {
    const nextDueStr = latestSupervision.nextDueDate.toISOString().slice(0, 10);
    const days = daysUntil(nextDueStr);

    if (days < 0) {
      return {
        area: 'supervision',
        colour: 'red',
        label: 'Supervision',
        detail: `Next supervision overdue by ${Math.abs(days)} day(s)`,
      };
    }

    if (days <= RED_THRESHOLD_DAYS) {
      return {
        area: 'supervision',
        colour: 'amber',
        label: 'Supervision',
        detail: `Next supervision due in ${days} day(s)`,
      };
    }
  }

  return {
    area: 'supervision',
    colour: 'green',
    label: 'Supervision',
    detail: 'Supervision up to date',
  };
}

/**
 * Compute qualifications compliance RAG.
 * GREEN if completed.
 * AMBER if working towards with target date approaching.
 * RED if target date has passed without completion.
 * GREY if no qualifications tracked.
 */
export function computeQualificationsRag(qualifications: {
  status: string;
  targetDate: string | null;
}[]): AreaRagStatus {
  if (qualifications.length === 0) {
    return {
      area: 'qualifications',
      colour: 'grey',
      label: 'Qualifications',
      detail: 'No qualifications tracked',
    };
  }

  const workingTowards = qualifications.filter(
    (q) => q.status === 'working_towards',
  );
  const overdueTargets = workingTowards.filter(
    (q) => q.targetDate && daysUntil(q.targetDate) < 0,
  );
  const approachingTargets = workingTowards.filter(
    (q) => q.targetDate && daysUntil(q.targetDate) >= 0 && daysUntil(q.targetDate) <= AMBER_THRESHOLD_DAYS,
  );

  if (overdueTargets.length > 0) {
    return {
      area: 'qualifications',
      colour: 'red',
      label: 'Qualifications',
      detail: `${overdueTargets.length} qualification(s) past target date`,
    };
  }

  if (approachingTargets.length > 0) {
    return {
      area: 'qualifications',
      colour: 'amber',
      label: 'Qualifications',
      detail: `${approachingTargets.length} qualification target(s) approaching`,
    };
  }

  return {
    area: 'qualifications',
    colour: 'green',
    label: 'Qualifications',
    detail: 'Qualifications on track',
  };
}

// ---------------------------------------------------------------------------
// Overall RAG aggregation
// ---------------------------------------------------------------------------

/**
 * Returns the overall RAG colour for a staff member by taking the worst
 * colour across all compliance areas (red > amber > green > grey).
 */
export function aggregateRag(areas: AreaRagStatus[]): RagColour {
  if (areas.some((a) => a.colour === 'red')) return 'red';
  if (areas.some((a) => a.colour === 'amber')) return 'amber';
  if (areas.some((a) => a.colour === 'green')) return 'green';
  return 'grey';
}

// ---------------------------------------------------------------------------
// RAG styling constants
// ---------------------------------------------------------------------------

export const RAG_STYLES = {
  green: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
    label: 'Compliant',
  },
  amber: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
    label: 'Attention',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    dot: 'bg-red-500',
    border: 'border-red-200',
    label: 'Non-Compliant',
  },
  grey: {
    bg: 'bg-gray-50',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
    border: 'border-gray-200',
    label: 'N/A',
  },
} as const;
