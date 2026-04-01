/**
 * EMAR utility functions.
 * Pure functions — no side effects, no DB calls.
 * Safe for use in both client and server environments.
 */

import type { FrequencyDetail } from '@/lib/db/schema/medications';

// ---------------------------------------------------------------------------
// Time slot generation
// ---------------------------------------------------------------------------

/**
 * Generates scheduled time slots for a medication on a given date.
 *
 * For regular medications: generates a slot for each time in frequencyDetail.timesOfDay,
 * but only if the date matches any daysOfWeek restriction.
 *
 * For PRN medications: returns an empty array (PRN is as-needed, no fixed slots).
 *
 * For once_only medications: returns the single scheduled time if the date matches.
 *
 * @param frequency - 'regular' | 'prn' | 'once_only'
 * @param frequencyDetail - The scheduling detail JSONB
 * @param date - The date to generate slots for (YYYY-MM-DD)
 * @returns Array of ISO datetime strings for the scheduled times
 */
export function generateTimeSlots(
  frequency: string,
  frequencyDetail: FrequencyDetail,
  date: string,
): string[] {
  if (frequency === 'prn') {
    return [];
  }

  const timesOfDay = frequencyDetail.timesOfDay ?? [];

  if (timesOfDay.length === 0) {
    return [];
  }

  // Check day-of-week restriction
  if (
    frequencyDetail.daysOfWeek &&
    frequencyDetail.daysOfWeek.length > 0
  ) {
    const dayOfWeek = getDayOfWeek(date);
    if (!frequencyDetail.daysOfWeek.includes(dayOfWeek)) {
      return [];
    }
  }

  // Generate ISO timestamps for each time slot on the given date
  return timesOfDay.map((time) => {
    return `${date}T${time}:00.000Z`;
  });
}

/**
 * Returns the lowercase day abbreviation for a date string.
 */
export function getDayOfWeek(
  date: string,
): 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' {
  const d = new Date(date + 'T12:00:00Z'); // Use noon to avoid timezone issues
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  return days[d.getUTCDay()] as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
}

// ---------------------------------------------------------------------------
// Time slot labels
// ---------------------------------------------------------------------------

/**
 * Returns all unique time slots across a list of medications for a given date.
 * Used to build the column headers of the MAR chart.
 */
export function getUniqueTimeSlots(
  medications: Array<{ frequency: string; frequencyDetail: FrequencyDetail }>,
  date: string,
): string[] {
  const allSlots = new Set<string>();

  for (const med of medications) {
    const slots = generateTimeSlots(med.frequency, med.frequencyDetail, date);
    for (const slot of slots) {
      allSlots.add(slot);
    }
  }

  return Array.from(allSlots).sort();
}

/**
 * Formats a time string (HH:mm or ISO) for display.
 */
export function formatTime(timeOrIso: string): string {
  if (timeOrIso.includes('T')) {
    // ISO timestamp — extract time
    const d = new Date(timeOrIso);
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  return timeOrIso;
}

/**
 * Formats a date for display (e.g., "1 Apr 2026").
 */
export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00Z');
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Adherence calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the adherence rate for a set of administrations.
 *
 * Adherence = (given + self_administered) / total scheduled * 100
 *
 * @param administrations - Array of administration records with status
 * @returns Adherence rate as a percentage (0-100), or null if no records
 */
export function calculateAdherenceRate(
  administrations: Array<{ status: string }>,
): number | null {
  if (administrations.length === 0) return null;

  const administered = administrations.filter(
    (a) => a.status === 'given' || a.status === 'self_administered',
  ).length;

  return Math.round((administered / administrations.length) * 100);
}

/**
 * Returns the adherence category based on rate.
 */
export function getAdherenceCategory(
  rate: number | null,
): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
  if (rate === null) return 'unknown';
  if (rate >= 95) return 'excellent';
  if (rate >= 80) return 'good';
  if (rate >= 60) return 'fair';
  return 'poor';
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if administration requires a reason.
 */
export function requiresReason(status: string): boolean {
  return ['refused', 'not_available', 'withheld', 'omitted'].includes(status);
}

/**
 * Returns true if the medication is in an active/administrable state.
 */
export function isMedicationActive(status: string): boolean {
  return status === 'active';
}

/**
 * Colour coding for administration status cells in the MAR chart.
 */
export function getAdministrationStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'given':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'self_administered':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      };
    case 'refused':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
      };
    case 'withheld':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'omitted':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
      };
    case 'not_available':
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-500',
        border: 'border-gray-200',
      };
  }
}

/**
 * Short code for administration status (used in compact MAR chart cells).
 */
export function getAdministrationStatusCode(status: string): string {
  switch (status) {
    case 'given':
      return 'G';
    case 'self_administered':
      return 'SA';
    case 'refused':
      return 'R';
    case 'withheld':
      return 'W';
    case 'omitted':
      return 'O';
    case 'not_available':
      return 'NA';
    default:
      return '?';
  }
}
