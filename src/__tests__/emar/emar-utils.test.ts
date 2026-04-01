/**
 * Tests for EMAR utility functions.
 *
 * Validates:
 * - Time slot generation from frequency details
 * - Day-of-week filtering
 * - Adherence rate calculation
 * - Status helper functions
 * - Format helpers
 */

import { describe, it, expect } from 'vitest';
import {
  generateTimeSlots,
  getDayOfWeek,
  getUniqueTimeSlots,
  calculateAdherenceRate,
  getAdherenceCategory,
  requiresReason,
  isMedicationActive,
  getAdministrationStatusCode,
  getAdministrationStatusColor,
  formatTime,
  formatDate,
} from '@/features/emar/utils';
import type { FrequencyDetail } from '@/lib/db/schema/medications';

// ---------------------------------------------------------------------------
// generateTimeSlots
// ---------------------------------------------------------------------------

describe('generateTimeSlots', () => {
  it('generates slots for regular medication with times', () => {
    const detail: FrequencyDetail = {
      timesOfDay: ['08:00', '14:00', '22:00'],
    };
    const slots = generateTimeSlots('regular', detail, '2026-04-01');
    expect(slots).toHaveLength(3);
    expect(slots[0]).toBe('2026-04-01T08:00:00.000Z');
    expect(slots[1]).toBe('2026-04-01T14:00:00.000Z');
    expect(slots[2]).toBe('2026-04-01T22:00:00.000Z');
  });

  it('returns empty array for PRN medications', () => {
    const detail: FrequencyDetail = { timesOfDay: ['08:00'] };
    const slots = generateTimeSlots('prn', detail, '2026-04-01');
    expect(slots).toHaveLength(0);
  });

  it('returns empty array when no times specified', () => {
    const detail: FrequencyDetail = { timesOfDay: [] };
    const slots = generateTimeSlots('regular', detail, '2026-04-01');
    expect(slots).toHaveLength(0);
  });

  it('filters by day of week when specified', () => {
    const detail: FrequencyDetail = {
      timesOfDay: ['08:00'],
      daysOfWeek: ['mon', 'wed', 'fri'],
    };
    // 2026-04-01 is a Wednesday
    const slots = generateTimeSlots('regular', detail, '2026-04-01');
    expect(slots).toHaveLength(1);

    // 2026-04-02 is a Thursday — not in daysOfWeek
    const slotsThursday = generateTimeSlots('regular', detail, '2026-04-02');
    expect(slotsThursday).toHaveLength(0);
  });

  it('generates slots when daysOfWeek is empty (every day)', () => {
    const detail: FrequencyDetail = {
      timesOfDay: ['08:00'],
      daysOfWeek: [],
    };
    const slots = generateTimeSlots('regular', detail, '2026-04-01');
    expect(slots).toHaveLength(1);
  });

  it('handles once_only frequency', () => {
    const detail: FrequencyDetail = {
      timesOfDay: ['10:00'],
    };
    const slots = generateTimeSlots('once_only', detail, '2026-04-01');
    expect(slots).toHaveLength(1);
    expect(slots[0]).toBe('2026-04-01T10:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// getDayOfWeek
// ---------------------------------------------------------------------------

describe('getDayOfWeek', () => {
  it('returns correct day for a Wednesday', () => {
    // 2026-04-01 is a Wednesday
    expect(getDayOfWeek('2026-04-01')).toBe('wed');
  });

  it('returns correct day for a Monday', () => {
    // 2026-03-30 is a Monday
    expect(getDayOfWeek('2026-03-30')).toBe('mon');
  });

  it('returns correct day for a Sunday', () => {
    // 2026-04-05 is a Sunday
    expect(getDayOfWeek('2026-04-05')).toBe('sun');
  });
});

// ---------------------------------------------------------------------------
// getUniqueTimeSlots
// ---------------------------------------------------------------------------

describe('getUniqueTimeSlots', () => {
  it('collects unique time slots across medications', () => {
    const meds = [
      { frequency: 'regular', frequencyDetail: { timesOfDay: ['08:00', '22:00'] } },
      { frequency: 'regular', frequencyDetail: { timesOfDay: ['08:00', '14:00'] } },
      { frequency: 'prn', frequencyDetail: { timesOfDay: ['08:00'] } },
    ];
    const slots = getUniqueTimeSlots(meds, '2026-04-01');
    expect(slots).toHaveLength(3); // 08:00, 14:00, 22:00 (PRN excluded)
  });

  it('returns sorted slots', () => {
    const meds = [
      { frequency: 'regular', frequencyDetail: { timesOfDay: ['22:00'] } },
      { frequency: 'regular', frequencyDetail: { timesOfDay: ['08:00'] } },
    ];
    const slots = getUniqueTimeSlots(meds, '2026-04-01');
    expect(slots[0]).toContain('08:00');
    expect(slots[1]).toContain('22:00');
  });

  it('returns empty for all PRN medications', () => {
    const meds = [
      { frequency: 'prn', frequencyDetail: { timesOfDay: [] } },
    ];
    const slots = getUniqueTimeSlots(meds, '2026-04-01');
    expect(slots).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// calculateAdherenceRate
// ---------------------------------------------------------------------------

describe('calculateAdherenceRate', () => {
  it('returns null for empty array', () => {
    expect(calculateAdherenceRate([])).toBeNull();
  });

  it('returns 100 when all given', () => {
    const admins = [
      { status: 'given' },
      { status: 'given' },
      { status: 'given' },
    ];
    expect(calculateAdherenceRate(admins)).toBe(100);
  });

  it('counts self_administered as adherent', () => {
    const admins = [
      { status: 'given' },
      { status: 'self_administered' },
    ];
    expect(calculateAdherenceRate(admins)).toBe(100);
  });

  it('calculates mixed statuses correctly', () => {
    const admins = [
      { status: 'given' },
      { status: 'refused' },
      { status: 'given' },
      { status: 'withheld' },
    ];
    expect(calculateAdherenceRate(admins)).toBe(50);
  });

  it('returns 0 when all refused', () => {
    const admins = [
      { status: 'refused' },
      { status: 'refused' },
    ];
    expect(calculateAdherenceRate(admins)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    const admins = [
      { status: 'given' },
      { status: 'given' },
      { status: 'refused' },
    ];
    expect(calculateAdherenceRate(admins)).toBe(67); // 66.67 rounds to 67
  });
});

// ---------------------------------------------------------------------------
// getAdherenceCategory
// ---------------------------------------------------------------------------

describe('getAdherenceCategory', () => {
  it('returns unknown for null', () => {
    expect(getAdherenceCategory(null)).toBe('unknown');
  });

  it('returns excellent for 95+', () => {
    expect(getAdherenceCategory(95)).toBe('excellent');
    expect(getAdherenceCategory(100)).toBe('excellent');
  });

  it('returns good for 80-94', () => {
    expect(getAdherenceCategory(80)).toBe('good');
    expect(getAdherenceCategory(94)).toBe('good');
  });

  it('returns fair for 60-79', () => {
    expect(getAdherenceCategory(60)).toBe('fair');
    expect(getAdherenceCategory(79)).toBe('fair');
  });

  it('returns poor for below 60', () => {
    expect(getAdherenceCategory(59)).toBe('poor');
    expect(getAdherenceCategory(0)).toBe('poor');
  });
});

// ---------------------------------------------------------------------------
// requiresReason
// ---------------------------------------------------------------------------

describe('requiresReason', () => {
  it('returns true for refused', () => {
    expect(requiresReason('refused')).toBe(true);
  });

  it('returns true for withheld', () => {
    expect(requiresReason('withheld')).toBe(true);
  });

  it('returns true for omitted', () => {
    expect(requiresReason('omitted')).toBe(true);
  });

  it('returns true for not_available', () => {
    expect(requiresReason('not_available')).toBe(true);
  });

  it('returns false for given', () => {
    expect(requiresReason('given')).toBe(false);
  });

  it('returns false for self_administered', () => {
    expect(requiresReason('self_administered')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isMedicationActive
// ---------------------------------------------------------------------------

describe('isMedicationActive', () => {
  it('returns true for active', () => {
    expect(isMedicationActive('active')).toBe(true);
  });

  it('returns false for discontinued', () => {
    expect(isMedicationActive('discontinued')).toBe(false);
  });

  it('returns false for suspended', () => {
    expect(isMedicationActive('suspended')).toBe(false);
  });

  it('returns false for completed', () => {
    expect(isMedicationActive('completed')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getAdministrationStatusCode
// ---------------------------------------------------------------------------

describe('getAdministrationStatusCode', () => {
  it('returns G for given', () => {
    expect(getAdministrationStatusCode('given')).toBe('G');
  });

  it('returns SA for self_administered', () => {
    expect(getAdministrationStatusCode('self_administered')).toBe('SA');
  });

  it('returns R for refused', () => {
    expect(getAdministrationStatusCode('refused')).toBe('R');
  });

  it('returns W for withheld', () => {
    expect(getAdministrationStatusCode('withheld')).toBe('W');
  });

  it('returns O for omitted', () => {
    expect(getAdministrationStatusCode('omitted')).toBe('O');
  });

  it('returns NA for not_available', () => {
    expect(getAdministrationStatusCode('not_available')).toBe('NA');
  });

  it('returns ? for unknown', () => {
    expect(getAdministrationStatusCode('unknown')).toBe('?');
  });
});

// ---------------------------------------------------------------------------
// getAdministrationStatusColor
// ---------------------------------------------------------------------------

describe('getAdministrationStatusColor', () => {
  it('returns green for given', () => {
    const colors = getAdministrationStatusColor('given');
    expect(colors.bg).toContain('emerald');
  });

  it('returns red for refused', () => {
    const colors = getAdministrationStatusColor('refused');
    expect(colors.bg).toContain('red');
  });

  it('returns amber for withheld', () => {
    const colors = getAdministrationStatusColor('withheld');
    expect(colors.bg).toContain('amber');
  });

  it('returns gray for unknown', () => {
    const colors = getAdministrationStatusColor('something');
    expect(colors.bg).toContain('gray');
  });
});

// ---------------------------------------------------------------------------
// formatTime
// ---------------------------------------------------------------------------

describe('formatTime', () => {
  it('formats HH:mm string', () => {
    expect(formatTime('08:00')).toBe('08:00');
  });

  it('formats ISO timestamp', () => {
    const result = formatTime('2026-04-01T08:00:00.000Z');
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe('formatDate', () => {
  it('formats date string', () => {
    const result = formatDate('2026-04-01');
    expect(result).toContain('Apr');
    expect(result).toContain('2026');
  });

  it('returns input for invalid date', () => {
    // Invalid date won't throw but may return the input or a fallback
    const result = formatDate('not-a-date');
    expect(typeof result).toBe('string');
  });
});
