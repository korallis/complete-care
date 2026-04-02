/**
 * Working Time Directive (WTD) compliance checks.
 *
 * UK Working Time Regulations 1998:
 * - Maximum 48 hours per week averaged over 17 weeks (we check per week for simplicity)
 * - Minimum 11 consecutive hours rest between shifts
 * - Minimum 24 hours uninterrupted rest in each 7-day period (or 48 hours in 14 days)
 */

import type { Conflict } from './types';

const MAX_WEEKLY_HOURS = 48;
const MIN_REST_BETWEEN_SHIFTS_HOURS = 11;

interface ShiftTiming {
  assignmentId: string;
  date: string; // ISO date
  startTime: string; // HH:MM or HH:MM:SS
  endTime: string; // HH:MM or HH:MM:SS
  isOvernight: boolean;
  paidMinutes: number;
  durationMinutes: number;
}

/**
 * Parse a time string (HH:MM or HH:MM:SS) into total minutes from midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

/**
 * Calculate hours worked in a given week for a staff member.
 */
export function calculateWeeklyHours(shifts: ShiftTiming[]): number {
  return shifts.reduce((total, s) => total + s.durationMinutes / 60, 0);
}

/**
 * Check rest period between two consecutive shifts.
 * Returns the rest hours between shift A's end and shift B's start.
 */
export function calculateRestBetweenShifts(
  shiftA: ShiftTiming,
  shiftB: ShiftTiming,
): number {
  const dateA = new Date(shiftA.date);
  const dateB = new Date(shiftB.date);

  const endMinutesA = parseTimeToMinutes(shiftA.endTime);
  const startMinutesB = parseTimeToMinutes(shiftB.startTime);

  // If shift A is overnight, the end time is on the next day
  const endDateA = shiftA.isOvernight
    ? new Date(dateA.getTime() + 24 * 60 * 60 * 1000)
    : dateA;

  const endTimestampA =
    endDateA.getTime() + endMinutesA * 60 * 1000;
  const startTimestampB =
    dateB.getTime() + startMinutesB * 60 * 1000;

  const restMs = startTimestampB - endTimestampA;
  return restMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Validate WTD compliance for a set of shifts assigned to a single staff member.
 *
 * Returns an array of WTD violations — these are HARD constraints
 * that block rota confirmation.
 */
export function validateWtdCompliance(
  shifts: ShiftTiming[],
  _weekStartDate: string,
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Sort by date then start time
  const sorted = [...shifts].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
  });

  // Check 1: Weekly hours <= 48
  const weeklyHours = calculateWeeklyHours(sorted);
  if (weeklyHours > MAX_WEEKLY_HOURS) {
    conflicts.push({
      type: 'wtd_weekly_hours',
      severity: 'error',
      message: `Weekly hours (${weeklyHours.toFixed(1)}h) exceed the Working Time Directive maximum of ${MAX_WEEKLY_HOURS}h`,
      overridable: false,
      relatedAssignmentIds: sorted.map((s) => s.assignmentId),
    });
  }

  // Check 2: Minimum 11 hours rest between consecutive shifts
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const restHours = calculateRestBetweenShifts(current, next);

    if (restHours >= 0 && restHours < MIN_REST_BETWEEN_SHIFTS_HOURS) {
      conflicts.push({
        type: 'wtd_rest_period',
        severity: 'error',
        message: `Only ${restHours.toFixed(1)}h rest between shifts — minimum ${MIN_REST_BETWEEN_SHIFTS_HOURS}h required by Working Time Directive`,
        overridable: false,
        relatedAssignmentIds: [current.assignmentId, next.assignmentId],
      });
    }
  }

  return conflicts;
}

/**
 * Check for double-booking: two shifts overlapping for the same staff member.
 */
export function detectDoubleBookings(
  shifts: ShiftTiming[],
): Conflict[] {
  const conflicts: Conflict[] = [];

  const sorted = [...shifts].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
  });

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];

      if (shiftsOverlap(a, b)) {
        conflicts.push({
          type: 'double_booking',
          severity: 'warning',
          message: `Double booking: shifts on ${a.date} overlap (${a.startTime}–${a.endTime} and ${b.startTime}–${b.endTime})`,
          overridable: true,
          relatedAssignmentIds: [a.assignmentId, b.assignmentId],
        });
      }
    }
  }

  return conflicts;
}

/**
 * Check whether two shifts overlap in time, accounting for overnight shifts.
 */
function shiftsOverlap(a: ShiftTiming, b: ShiftTiming): boolean {
  const dateA = new Date(a.date).getTime();
  const dateB = new Date(b.date).getTime();

  const aStart = dateA + parseTimeToMinutes(a.startTime) * 60 * 1000;
  const aEnd = a.isOvernight
    ? dateA + 24 * 60 * 60 * 1000 + parseTimeToMinutes(a.endTime) * 60 * 1000
    : dateA + parseTimeToMinutes(a.endTime) * 60 * 1000;

  const bStart = dateB + parseTimeToMinutes(b.startTime) * 60 * 1000;
  const bEnd = b.isOvernight
    ? dateB + 24 * 60 * 60 * 1000 + parseTimeToMinutes(b.endTime) * 60 * 1000
    : dateB + parseTimeToMinutes(b.endTime) * 60 * 1000;

  return aStart < bEnd && bStart < aEnd;
}

/**
 * Check for skills gap: shift requires qualifications the assigned staff doesn't have.
 */
export function detectSkillsGap(
  requiredQualifications: string[],
  staffQualifications: string[],
): Conflict | null {
  const missing = requiredQualifications.filter(
    (q) => !staffQualifications.includes(q),
  );

  if (missing.length === 0) return null;

  return {
    type: 'skills_gap',
    severity: 'warning',
    message: `Staff missing required qualifications: ${missing.join(', ')}`,
    overridable: true,
    missingQualifications: missing,
  };
}

/**
 * Calculate shift duration in minutes from start/end times.
 */
export function calculateDurationMinutes(
  startTime: string,
  endTime: string,
  isOvernight: boolean,
): number {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);

  if (isOvernight || endMin <= startMin) {
    return 24 * 60 - startMin + endMin;
  }
  return endMin - startMin;
}
