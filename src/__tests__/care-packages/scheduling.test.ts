/**
 * Tests for the schedule generation engine.
 *
 * Validates:
 * - Daily frequency generates a visit for every day
 * - Weekday frequency skips weekends
 * - Custom patterns with specific days
 * - Week A / Week B alternating patterns
 * - addMinutesToTime helper
 * - getWeekNumber calculation
 * - Empty visit types produce no visits
 * - Visits are sorted by date then time
 */

import { describe, it, expect } from 'vitest';
import {
  generateSchedule,
  getVisitDates,
  shouldVisitOnDate,
  getWeekNumber,
} from '@/features/care-packages/scheduling';
import { addMinutesToTime } from '@/features/care-packages/schema';
import type { VisitType } from '@/lib/db/schema/care-packages';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeVisitType(overrides: Partial<VisitType> = {}): VisitType {
  return {
    id: 'vt-1',
    carePackageId: 'pkg-1',
    organisationId: 'org-1',
    name: 'morning',
    duration: 30,
    timeWindowStart: '07:00',
    timeWindowEnd: '10:00',
    taskList: [],
    frequency: 'daily',
    customPattern: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// addMinutesToTime
// ---------------------------------------------------------------------------

describe('addMinutesToTime', () => {
  it('adds minutes within the same hour', () => {
    expect(addMinutesToTime('07:00', 30)).toBe('07:30');
  });

  it('rolls over to next hour', () => {
    expect(addMinutesToTime('07:45', 30)).toBe('08:15');
  });

  it('handles midnight rollover', () => {
    expect(addMinutesToTime('23:30', 60)).toBe('00:30');
  });

  it('handles zero minutes', () => {
    expect(addMinutesToTime('14:00', 0)).toBe('14:00');
  });

  it('handles large durations', () => {
    expect(addMinutesToTime('06:00', 480)).toBe('14:00');
  });
});

// ---------------------------------------------------------------------------
// getWeekNumber
// ---------------------------------------------------------------------------

describe('getWeekNumber', () => {
  it('returns 0 for the same date', () => {
    expect(getWeekNumber('2026-04-01', '2026-04-01')).toBe(0);
  });

  it('returns 0 for 6 days later (same week)', () => {
    expect(getWeekNumber('2026-04-07', '2026-04-01')).toBe(0);
  });

  it('returns 1 for 7 days later', () => {
    expect(getWeekNumber('2026-04-08', '2026-04-01')).toBe(1);
  });

  it('returns 2 for 14 days later', () => {
    expect(getWeekNumber('2026-04-15', '2026-04-01')).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// shouldVisitOnDate
// ---------------------------------------------------------------------------

describe('shouldVisitOnDate', () => {
  it('daily — always returns true', () => {
    // Monday = 1, Saturday = 6, Sunday = 0
    expect(shouldVisitOnDate('daily', null, 1, '2026-04-06', '2026-04-01')).toBe(true);
    expect(shouldVisitOnDate('daily', null, 6, '2026-04-11', '2026-04-01')).toBe(true);
    expect(shouldVisitOnDate('daily', null, 0, '2026-04-12', '2026-04-01')).toBe(true);
  });

  it('weekdays — true for Mon-Fri, false for Sat/Sun', () => {
    expect(shouldVisitOnDate('weekdays', null, 1, '2026-04-06', '2026-04-01')).toBe(true);
    expect(shouldVisitOnDate('weekdays', null, 5, '2026-04-10', '2026-04-01')).toBe(true);
    expect(shouldVisitOnDate('weekdays', null, 6, '2026-04-11', '2026-04-01')).toBe(false);
    expect(shouldVisitOnDate('weekdays', null, 0, '2026-04-12', '2026-04-01')).toBe(false);
  });

  it('custom — checks specific days', () => {
    const pattern = { daysOfWeek: [1, 3, 5], weekPattern: 'every' as const };
    expect(shouldVisitOnDate('custom', pattern, 1, '2026-04-06', '2026-04-01')).toBe(true);
    expect(shouldVisitOnDate('custom', pattern, 2, '2026-04-07', '2026-04-01')).toBe(false);
    expect(shouldVisitOnDate('custom', pattern, 3, '2026-04-08', '2026-04-01')).toBe(true);
  });

  it('custom week_a — only on Week A dates', () => {
    const pattern = { daysOfWeek: [1, 2, 3, 4, 5], weekPattern: 'week_a' as const };
    // Week 0 (reference week) = Week A → should be true
    expect(shouldVisitOnDate('custom', pattern, 1, '2026-04-01', '2026-04-01')).toBe(true);
    // Week 1 = Week B → should be false
    expect(shouldVisitOnDate('custom', pattern, 1, '2026-04-08', '2026-04-01')).toBe(false);
    // Week 2 = Week A → should be true
    expect(shouldVisitOnDate('custom', pattern, 1, '2026-04-15', '2026-04-01')).toBe(true);
  });

  it('custom week_b — only on Week B dates', () => {
    const pattern = { daysOfWeek: [1, 2, 3, 4, 5], weekPattern: 'week_b' as const };
    // Week 0 = Week A → should be false
    expect(shouldVisitOnDate('custom', pattern, 1, '2026-04-01', '2026-04-01')).toBe(false);
    // Week 1 = Week B → should be true
    expect(shouldVisitOnDate('custom', pattern, 1, '2026-04-08', '2026-04-01')).toBe(true);
  });

  it('returns false for unknown frequency', () => {
    expect(shouldVisitOnDate('unknown', null, 1, '2026-04-06', '2026-04-01')).toBe(false);
  });

  it('custom returns false when customPattern is null', () => {
    expect(shouldVisitOnDate('custom', null, 1, '2026-04-06', '2026-04-01')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getVisitDates
// ---------------------------------------------------------------------------

describe('getVisitDates', () => {
  it('generates daily dates for a week', () => {
    const dates = getVisitDates('daily', null, '2026-04-06', '2026-04-12', '2026-04-01');
    expect(dates).toHaveLength(7);
    expect(dates[0]).toBe('2026-04-06');
    expect(dates[6]).toBe('2026-04-12');
  });

  it('generates weekday dates for a week', () => {
    const dates = getVisitDates('weekdays', null, '2026-04-06', '2026-04-12', '2026-04-01');
    // April 6 (Mon) to April 12 (Sun) — 5 weekdays
    expect(dates).toHaveLength(5);
    expect(dates).not.toContain('2026-04-11'); // Saturday
    expect(dates).not.toContain('2026-04-12'); // Sunday
  });

  it('handles single day range', () => {
    const dates = getVisitDates('daily', null, '2026-04-06', '2026-04-06', '2026-04-01');
    expect(dates).toHaveLength(1);
    expect(dates[0]).toBe('2026-04-06');
  });
});

// ---------------------------------------------------------------------------
// generateSchedule
// ---------------------------------------------------------------------------

describe('generateSchedule', () => {
  it('generates daily visits for one visit type over 3 days', () => {
    const visits = generateSchedule({
      visitTypes: [makeVisitType()],
      personId: 'person-1',
      startDate: '2026-04-06',
      endDate: '2026-04-08',
    });

    expect(visits).toHaveLength(3);
    expect(visits[0].date).toBe('2026-04-06');
    expect(visits[0].scheduledStart).toBe('07:00');
    expect(visits[0].scheduledEnd).toBe('07:30');
    expect(visits[0].personId).toBe('person-1');
    expect(visits[0].carePackageId).toBe('pkg-1');
    expect(visits[0].isAdHoc).toBe(false);
  });

  it('generates visits for multiple visit types', () => {
    const morning = makeVisitType({ id: 'vt-morning', name: 'morning', timeWindowStart: '07:00', duration: 30 });
    const bedtime = makeVisitType({ id: 'vt-bedtime', name: 'bedtime', timeWindowStart: '21:00', duration: 30 });

    const visits = generateSchedule({
      visitTypes: [morning, bedtime],
      personId: 'person-1',
      startDate: '2026-04-06',
      endDate: '2026-04-06',
    });

    expect(visits).toHaveLength(2);
    // Sorted by time
    expect(visits[0].scheduledStart).toBe('07:00');
    expect(visits[1].scheduledStart).toBe('21:00');
  });

  it('returns empty array for no visit types', () => {
    const visits = generateSchedule({
      visitTypes: [],
      personId: 'person-1',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
    });
    expect(visits).toHaveLength(0);
  });

  it('respects weekday frequency', () => {
    const vt = makeVisitType({ frequency: 'weekdays' });

    const visits = generateSchedule({
      visitTypes: [vt],
      personId: 'person-1',
      startDate: '2026-04-06', // Monday
      endDate: '2026-04-12', // Sunday
    });

    // Mon-Fri = 5 visits
    expect(visits).toHaveLength(5);
  });

  it('sorts visits by date then time', () => {
    const morning = makeVisitType({ id: 'vt-1', timeWindowStart: '07:00', duration: 30 });
    const evening = makeVisitType({ id: 'vt-2', timeWindowStart: '19:00', duration: 30 });

    const visits = generateSchedule({
      visitTypes: [evening, morning],
      personId: 'person-1',
      startDate: '2026-04-06',
      endDate: '2026-04-07',
    });

    expect(visits).toHaveLength(4);
    expect(visits[0].date).toBe('2026-04-06');
    expect(visits[0].scheduledStart).toBe('07:00');
    expect(visits[1].date).toBe('2026-04-06');
    expect(visits[1].scheduledStart).toBe('19:00');
    expect(visits[2].date).toBe('2026-04-07');
    expect(visits[2].scheduledStart).toBe('07:00');
  });

  it('handles custom Week A/B patterns', () => {
    const vt = makeVisitType({
      frequency: 'custom',
      customPattern: {
        daysOfWeek: [1, 2, 3, 4, 5],
        weekPattern: 'week_a',
      },
    });

    const visits = generateSchedule({
      visitTypes: [vt],
      personId: 'person-1',
      startDate: '2026-04-01', // Week A
      endDate: '2026-04-14', // Covers Week A + Week B
      weekAStartDate: '2026-04-01',
    });

    // Week A (April 1-7): Wed-Fri = 3 weekdays (Apr 1 Wed, 2 Thu, 3 Fri)
    // Week B (April 8-14): skipped
    // So only the first week's weekdays
    const weekAVisits = visits.filter((v) => v.date < '2026-04-08');
    const weekBVisits = visits.filter((v) => v.date >= '2026-04-08');

    expect(weekAVisits.length).toBeGreaterThan(0);
    expect(weekBVisits).toHaveLength(0);
  });
});
