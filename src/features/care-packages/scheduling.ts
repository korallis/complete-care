/**
 * Schedule Generation Engine
 *
 * Expands recurring visit type patterns into individual scheduled visits
 * for a given date range. Supports daily, weekday, and custom patterns
 * (including Week A/B alternating fortnightly templates).
 *
 * This file is a pure logic module — no DB calls, no side effects.
 * Safe for use in tests and both client/server environments.
 */

import type { VisitType } from '@/lib/db/schema/care-packages';
import type { CustomPattern } from '@/lib/db/schema/care-packages';
import { addMinutesToTime } from './schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlannedVisit = {
  visitTypeId: string;
  carePackageId: string;
  personId: string;
  date: string; // YYYY-MM-DD
  scheduledStart: string; // HH:MM
  scheduledEnd: string; // HH:MM
  isAdHoc: false;
};

export type GenerateOptions = {
  /** Visit types to expand */
  visitTypes: VisitType[];
  /** Person ID for the generated visits */
  personId: string;
  /** Start date (inclusive, YYYY-MM-DD) */
  startDate: string;
  /** End date (inclusive, YYYY-MM-DD) */
  endDate: string;
  /**
   * Reference date for Week A/B calculation.
   * Defaults to the care package start date.
   * Week A starts on this date; Week B starts 7 days later, and so on.
   */
  weekAStartDate?: string;
};

// ---------------------------------------------------------------------------
// Core scheduling logic
// ---------------------------------------------------------------------------

/**
 * Generate planned visits for a date range from recurring visit type patterns.
 *
 * For each visit type, iterates each date in the range and checks whether
 * a visit should occur on that date based on the frequency/pattern.
 *
 * @returns Array of PlannedVisit objects ready to insert into scheduled_visits
 */
export function generateSchedule(options: GenerateOptions): PlannedVisit[] {
  const { visitTypes, personId, startDate, endDate, weekAStartDate } = options;
  const visits: PlannedVisit[] = [];

  for (const vt of visitTypes) {
    const dates = getVisitDates(
      vt.frequency,
      vt.customPattern as CustomPattern | null,
      startDate,
      endDate,
      weekAStartDate ?? startDate,
    );

    for (const date of dates) {
      visits.push({
        visitTypeId: vt.id,
        carePackageId: vt.carePackageId,
        personId,
        date,
        scheduledStart: vt.timeWindowStart,
        scheduledEnd: addMinutesToTime(vt.timeWindowStart, vt.duration),
        isAdHoc: false,
      });
    }
  }

  // Sort by date then start time
  visits.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.scheduledStart.localeCompare(b.scheduledStart);
  });

  return visits;
}

// ---------------------------------------------------------------------------
// Date expansion
// ---------------------------------------------------------------------------

/**
 * Returns an array of ISO date strings on which a visit should occur,
 * given the frequency and date range.
 */
export function getVisitDates(
  frequency: string,
  customPattern: CustomPattern | null | undefined,
  startDate: string,
  endDate: string,
  weekAStartDate: string,
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = formatDate(current);
    const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat

    if (shouldVisitOnDate(frequency, customPattern, dayOfWeek, dateStr, weekAStartDate)) {
      dates.push(dateStr);
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Determines whether a visit should occur on a given date.
 */
export function shouldVisitOnDate(
  frequency: string,
  customPattern: CustomPattern | null | undefined,
  dayOfWeek: number,
  date: string,
  weekAStartDate: string,
): boolean {
  switch (frequency) {
    case 'daily':
      return true;

    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case 'custom': {
      if (!customPattern) return false;

      // Check if day of week is included
      if (!customPattern.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }

      // Check week pattern
      if (customPattern.weekPattern === 'every') {
        return true;
      }

      const weekNumber = getWeekNumber(date, weekAStartDate);
      const isWeekA = weekNumber % 2 === 0;

      if (customPattern.weekPattern === 'week_a') return isWeekA;
      if (customPattern.weekPattern === 'week_b') return !isWeekA;

      return false;
    }

    default:
      return false;
  }
}

/**
 * Calculates which week number a date falls in, relative to a reference date.
 * Week 0 is the week containing the reference date.
 */
export function getWeekNumber(date: string, referenceDate: string): number {
  const d = new Date(date);
  const ref = new Date(referenceDate);
  const diffMs = d.getTime() - ref.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
