/**
 * Conflict Detection Engine -- Pure Logic Module
 *
 * Detects scheduling conflicts: double-bookings, travel time violations,
 * and staff availability issues.
 *
 * No DB calls, no side effects -- safe for use in tests, client, and server.
 */

import {
  MIN_TRAVEL_TIME_MINUTES,
  type ConflictType,
} from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VisitSlot = {
  id: string;
  date: string;
  scheduledStart: string; // HH:MM
  scheduledEnd: string; // HH:MM
  assignedStaffId: string | null;
  personId: string;
  status: string;
};

export type StaffAvailability = {
  staffId: string;
  /** Days the staff member is unavailable (ISO date strings) */
  unavailableDates: string[];
};

export type Conflict = {
  type: ConflictType;
  visitId: string;
  /** The other visit or entity involved in the conflict */
  conflictsWith: string;
  /** Human-readable description */
  message: string;
};

// ---------------------------------------------------------------------------
// Time helpers
// ---------------------------------------------------------------------------

/** Convert HH:MM to minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Check if two time ranges overlap */
export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

/** Calculate gap in minutes between end of visit A and start of visit B */
export function getGapMinutes(endTime: string, startTime: string): number {
  return timeToMinutes(startTime) - timeToMinutes(endTime);
}

// ---------------------------------------------------------------------------
// Core detection functions
// ---------------------------------------------------------------------------

/**
 * Detect double-booking conflicts for a specific staff member on a date.
 *
 * A double-booking occurs when a staff member has two overlapping visits
 * on the same date.
 */
export function detectDoubleBookings(visits: VisitSlot[]): Conflict[] {
  const conflicts: Conflict[] = [];

  // Group by staff+date
  const byStaffDate = new Map<string, VisitSlot[]>();
  for (const v of visits) {
    if (!v.assignedStaffId || v.status === 'cancelled') continue;
    const key = `${v.assignedStaffId}:${v.date}`;
    const existing = byStaffDate.get(key) ?? [];
    existing.push(v);
    byStaffDate.set(key, existing);
  }

  for (const [, staffVisits] of byStaffDate) {
    if (staffVisits.length < 2) continue;

    // Sort by start time
    const sorted = [...staffVisits].sort((a, b) =>
      a.scheduledStart.localeCompare(b.scheduledStart),
    );

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];

        if (
          timesOverlap(
            a.scheduledStart,
            a.scheduledEnd,
            b.scheduledStart,
            b.scheduledEnd,
          )
        ) {
          conflicts.push({
            type: 'double_booking',
            visitId: b.id,
            conflictsWith: a.id,
            message: `Staff double-booked: visit at ${b.scheduledStart} overlaps with visit at ${a.scheduledStart}-${a.scheduledEnd}`,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Detect travel time violations for a specific staff member on a date.
 *
 * A violation occurs when the gap between consecutive visits for the same
 * staff member is less than MIN_TRAVEL_TIME_MINUTES and the visits are
 * for different clients (implying travel is needed).
 */
export function detectTravelTimeViolations(
  visits: VisitSlot[],
  minTravelMinutes: number = MIN_TRAVEL_TIME_MINUTES,
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Group by staff+date
  const byStaffDate = new Map<string, VisitSlot[]>();
  for (const v of visits) {
    if (!v.assignedStaffId || v.status === 'cancelled') continue;
    const key = `${v.assignedStaffId}:${v.date}`;
    const existing = byStaffDate.get(key) ?? [];
    existing.push(v);
    byStaffDate.set(key, existing);
  }

  for (const [, staffVisits] of byStaffDate) {
    if (staffVisits.length < 2) continue;

    const sorted = [...staffVisits].sort((a, b) =>
      a.scheduledStart.localeCompare(b.scheduledStart),
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];

      // Only flag travel time if visits are for different clients
      if (current.personId === next.personId) continue;

      const gap = getGapMinutes(current.scheduledEnd, next.scheduledStart);

      if (gap >= 0 && gap < minTravelMinutes) {
        conflicts.push({
          type: 'travel_time',
          visitId: next.id,
          conflictsWith: current.id,
          message: `Only ${gap} min gap between visits (minimum ${minTravelMinutes} min for travel)`,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detect availability conflicts -- visits assigned to staff who are
 * marked as unavailable on that date.
 */
export function detectAvailabilityConflicts(
  visits: VisitSlot[],
  staffAvailability: StaffAvailability[],
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Build lookup: staffId -> set of unavailable dates
  const unavailableMap = new Map<string, Set<string>>();
  for (const sa of staffAvailability) {
    unavailableMap.set(sa.staffId, new Set(sa.unavailableDates));
  }

  for (const visit of visits) {
    if (!visit.assignedStaffId || visit.status === 'cancelled') continue;

    const unavailableDates = unavailableMap.get(visit.assignedStaffId);
    if (unavailableDates?.has(visit.date)) {
      conflicts.push({
        type: 'availability',
        visitId: visit.id,
        conflictsWith: visit.assignedStaffId,
        message: `Staff member is marked unavailable on ${visit.date}`,
      });
    }
  }

  return conflicts;
}

// ---------------------------------------------------------------------------
// Combined detection
// ---------------------------------------------------------------------------

/**
 * Run all conflict detectors and return a combined list of conflicts.
 */
export function detectAllConflicts(
  visits: VisitSlot[],
  staffAvailability: StaffAvailability[] = [],
  minTravelMinutes: number = MIN_TRAVEL_TIME_MINUTES,
): Conflict[] {
  return [
    ...detectDoubleBookings(visits),
    ...detectTravelTimeViolations(visits, minTravelMinutes),
    ...detectAvailabilityConflicts(visits, staffAvailability),
  ];
}

/**
 * Check if assigning a specific staff member to a visit would create conflicts.
 *
 * Returns conflicts that would arise if the visit were assigned to the
 * given staff member. Useful for drag-and-drop validation.
 */
export function checkAssignmentConflicts(
  targetVisit: VisitSlot,
  staffId: string,
  existingVisits: VisitSlot[],
  staffAvailability: StaffAvailability[] = [],
  minTravelMinutes: number = MIN_TRAVEL_TIME_MINUTES,
): Conflict[] {
  // Create a hypothetical visit with the staff assigned
  const hypothetical: VisitSlot = {
    ...targetVisit,
    assignedStaffId: staffId,
  };

  // Include only same-date visits for this staff member plus the hypothetical
  const sameDateVisits = existingVisits.filter(
    (v) =>
      v.assignedStaffId === staffId &&
      v.date === targetVisit.date &&
      v.id !== targetVisit.id &&
      v.status !== 'cancelled',
  );

  const allVisits = [...sameDateVisits, hypothetical];

  return detectAllConflicts(allVisits, staffAvailability, minTravelMinutes);
}
