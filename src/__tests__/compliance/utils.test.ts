/**
 * Tests for the compliance RAG calculation utilities.
 *
 * Validates:
 * - daysUntil helper
 * - dateToRag colour computation
 * - computeDbsRag
 * - computeTrainingRag
 * - computeSupervisionRag
 * - computeQualificationsRag
 * - aggregateRag
 * - RAG_STYLES integrity
 */

import { describe, it, expect, vi } from 'vitest';

// Mock DB dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  daysUntil,
  dateToRag,
  computeDbsRag,
  computeTrainingRag,
  computeSupervisionRag,
  computeQualificationsRag,
  aggregateRag,
  RAG_STYLES,
  AMBER_THRESHOLD_DAYS,
  RED_THRESHOLD_DAYS,
} from '@/features/compliance/utils';

// ---------------------------------------------------------------------------
// Helper: produce ISO date strings relative to today
// ---------------------------------------------------------------------------

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// daysUntil
// ---------------------------------------------------------------------------

describe('daysUntil', () => {
  it('returns 0 for today', () => {
    const today = daysFromNow(0);
    expect(daysUntil(today)).toBe(0);
  });

  it('returns positive for future dates', () => {
    const future = daysFromNow(10);
    expect(daysUntil(future)).toBe(10);
  });

  it('returns negative for past dates', () => {
    const past = daysFromNow(-5);
    const result = daysUntil(past);
    // Allow for timezone/rounding: -4 or -5 are both valid
    expect(result).toBeLessThan(0);
    expect(result).toBeGreaterThanOrEqual(-5);
    expect(result).toBeLessThanOrEqual(-4);
  });
});

// ---------------------------------------------------------------------------
// dateToRag
// ---------------------------------------------------------------------------

describe('dateToRag', () => {
  it('returns grey for null/undefined', () => {
    expect(dateToRag(null)).toBe('grey');
    expect(dateToRag(undefined)).toBe('grey');
  });

  it('returns red for expired dates', () => {
    expect(dateToRag(daysFromNow(-1))).toBe('red');
    expect(dateToRag(daysFromNow(-30))).toBe('red');
  });

  it('returns red for dates within RED_THRESHOLD_DAYS', () => {
    expect(dateToRag(daysFromNow(0))).toBe('red');
    expect(dateToRag(daysFromNow(RED_THRESHOLD_DAYS))).toBe('red');
  });

  it('returns amber for dates within AMBER_THRESHOLD_DAYS', () => {
    expect(dateToRag(daysFromNow(RED_THRESHOLD_DAYS + 1))).toBe('amber');
    expect(dateToRag(daysFromNow(15))).toBe('amber');
    expect(dateToRag(daysFromNow(AMBER_THRESHOLD_DAYS))).toBe('amber');
  });

  it('returns green for dates beyond AMBER_THRESHOLD_DAYS', () => {
    expect(dateToRag(daysFromNow(AMBER_THRESHOLD_DAYS + 1))).toBe('green');
    expect(dateToRag(daysFromNow(365))).toBe('green');
  });
});

// ---------------------------------------------------------------------------
// computeDbsRag
// ---------------------------------------------------------------------------

describe('computeDbsRag', () => {
  it('returns red when no DBS check exists', () => {
    const result = computeDbsRag(null);
    expect(result.colour).toBe('red');
    expect(result.area).toBe('dbs');
    expect(result.detail).toContain('No DBS');
  });

  it('returns red for expired DBS', () => {
    const result = computeDbsRag({
      recheckDate: daysFromNow(-10),
      status: 'expired',
    });
    expect(result.colour).toBe('red');
    expect(result.detail).toContain('expired');
  });

  it('returns red for DBS expiring within 7 days', () => {
    const result = computeDbsRag({
      recheckDate: daysFromNow(5),
      status: 'expiring_soon',
    });
    expect(result.colour).toBe('red');
  });

  it('returns amber for DBS recheck within 30 days', () => {
    const result = computeDbsRag({
      recheckDate: daysFromNow(20),
      status: 'expiring_soon',
    });
    expect(result.colour).toBe('amber');
  });

  it('returns green for current DBS', () => {
    const result = computeDbsRag({
      recheckDate: daysFromNow(365),
      status: 'current',
    });
    expect(result.colour).toBe('green');
    expect(result.detail).toBe('DBS current');
  });
});

// ---------------------------------------------------------------------------
// computeTrainingRag
// ---------------------------------------------------------------------------

describe('computeTrainingRag', () => {
  it('returns grey when no training records', () => {
    const result = computeTrainingRag([]);
    expect(result.colour).toBe('grey');
    expect(result.area).toBe('training');
  });

  it('returns red when any training is expired', () => {
    const result = computeTrainingRag([
      { status: 'current', expiryDate: daysFromNow(100) },
      { status: 'expired', expiryDate: daysFromNow(-10) },
    ]);
    expect(result.colour).toBe('red');
    expect(result.detail).toContain('1 training item(s) expired');
  });

  it('returns amber when training expiring soon but none expired', () => {
    const result = computeTrainingRag([
      { status: 'current', expiryDate: daysFromNow(100) },
      { status: 'expiring_soon', expiryDate: daysFromNow(15) },
    ]);
    expect(result.colour).toBe('amber');
    expect(result.detail).toContain('1 training item(s) expiring soon');
  });

  it('returns green when all training current', () => {
    const result = computeTrainingRag([
      { status: 'current', expiryDate: daysFromNow(100) },
      { status: 'current', expiryDate: daysFromNow(200) },
    ]);
    expect(result.colour).toBe('green');
    expect(result.detail).toBe('All training current');
  });
});

// ---------------------------------------------------------------------------
// computeSupervisionRag
// ---------------------------------------------------------------------------

describe('computeSupervisionRag', () => {
  it('returns red when no supervision recorded', () => {
    const result = computeSupervisionRag(null);
    expect(result.colour).toBe('red');
    expect(result.area).toBe('supervision');
    expect(result.detail).toContain('No supervision');
  });

  it('returns red when supervision is overdue', () => {
    const result = computeSupervisionRag({
      status: 'overdue',
      scheduledDate: new Date(),
      nextDueDate: null,
    });
    expect(result.colour).toBe('red');
    expect(result.detail).toBe('Supervision overdue');
  });

  it('returns red when next due date has passed', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const result = computeSupervisionRag({
      status: 'completed',
      scheduledDate: new Date(),
      nextDueDate: pastDate,
    });
    expect(result.colour).toBe('red');
    expect(result.detail).toContain('overdue');
  });

  it('returns amber when next supervision due within 7 days', () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 3);
    const result = computeSupervisionRag({
      status: 'completed',
      scheduledDate: new Date(),
      nextDueDate: soonDate,
    });
    expect(result.colour).toBe('amber');
    expect(result.detail).toContain('due in');
  });

  it('returns green when supervision up to date', () => {
    const result = computeSupervisionRag({
      status: 'completed',
      scheduledDate: new Date(),
      nextDueDate: null,
    });
    expect(result.colour).toBe('green');
    expect(result.detail).toBe('Supervision up to date');
  });
});

// ---------------------------------------------------------------------------
// computeQualificationsRag
// ---------------------------------------------------------------------------

describe('computeQualificationsRag', () => {
  it('returns grey when no qualifications tracked', () => {
    const result = computeQualificationsRag([]);
    expect(result.colour).toBe('grey');
    expect(result.area).toBe('qualifications');
  });

  it('returns red when target date has passed', () => {
    const result = computeQualificationsRag([
      { status: 'working_towards', targetDate: daysFromNow(-10) },
    ]);
    expect(result.colour).toBe('red');
    expect(result.detail).toContain('past target date');
  });

  it('returns amber when target date approaching', () => {
    const result = computeQualificationsRag([
      { status: 'working_towards', targetDate: daysFromNow(15) },
    ]);
    expect(result.colour).toBe('amber');
    expect(result.detail).toContain('approaching');
  });

  it('returns green when all qualifications on track', () => {
    const result = computeQualificationsRag([
      { status: 'completed', targetDate: null },
      { status: 'working_towards', targetDate: daysFromNow(100) },
    ]);
    expect(result.colour).toBe('green');
    expect(result.detail).toBe('Qualifications on track');
  });
});

// ---------------------------------------------------------------------------
// aggregateRag
// ---------------------------------------------------------------------------

describe('aggregateRag', () => {
  it('returns red if any area is red', () => {
    expect(
      aggregateRag([
        { area: 'dbs', colour: 'green', label: 'DBS', detail: '' },
        { area: 'training', colour: 'red', label: 'Training', detail: '' },
        {
          area: 'supervision',
          colour: 'green',
          label: 'Supervision',
          detail: '',
        },
      ]),
    ).toBe('red');
  });

  it('returns amber if worst is amber', () => {
    expect(
      aggregateRag([
        { area: 'dbs', colour: 'green', label: 'DBS', detail: '' },
        { area: 'training', colour: 'amber', label: 'Training', detail: '' },
        {
          area: 'supervision',
          colour: 'green',
          label: 'Supervision',
          detail: '',
        },
      ]),
    ).toBe('amber');
  });

  it('returns green if all are green', () => {
    expect(
      aggregateRag([
        { area: 'dbs', colour: 'green', label: 'DBS', detail: '' },
        { area: 'training', colour: 'green', label: 'Training', detail: '' },
      ]),
    ).toBe('green');
  });

  it('returns grey if all are grey', () => {
    expect(
      aggregateRag([
        { area: 'dbs', colour: 'grey', label: 'DBS', detail: '' },
        { area: 'training', colour: 'grey', label: 'Training', detail: '' },
      ]),
    ).toBe('grey');
  });

  it('returns green when mixed green and grey', () => {
    expect(
      aggregateRag([
        { area: 'dbs', colour: 'green', label: 'DBS', detail: '' },
        { area: 'training', colour: 'grey', label: 'Training', detail: '' },
      ]),
    ).toBe('green');
  });
});

// ---------------------------------------------------------------------------
// Constants integrity
// ---------------------------------------------------------------------------

describe('RAG_STYLES', () => {
  it('has styles for all RAG colours', () => {
    for (const colour of ['green', 'amber', 'red', 'grey'] as const) {
      expect(RAG_STYLES[colour]).toBeDefined();
      expect(RAG_STYLES[colour].bg).toBeTruthy();
      expect(RAG_STYLES[colour].text).toBeTruthy();
      expect(RAG_STYLES[colour].dot).toBeTruthy();
      expect(RAG_STYLES[colour].label).toBeTruthy();
    }
  });
});

describe('Alert thresholds', () => {
  it('AMBER threshold is 30 days', () => {
    expect(AMBER_THRESHOLD_DAYS).toBe(30);
  });

  it('RED threshold is 7 days', () => {
    expect(RED_THRESHOLD_DAYS).toBe(7);
  });
});
