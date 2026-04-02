import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  calculateWeeklyHours,
  calculateRestBetweenShifts,
  validateWtdCompliance,
  detectDoubleBookings,
  detectSkillsGap,
  calculateDurationMinutes,
} from '../wtd-checks';

describe('parseTimeToMinutes', () => {
  it('parses HH:MM format', () => {
    expect(parseTimeToMinutes('07:00')).toBe(420);
    expect(parseTimeToMinutes('19:30')).toBe(1170);
    expect(parseTimeToMinutes('00:00')).toBe(0);
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });

  it('parses HH:MM:SS format', () => {
    expect(parseTimeToMinutes('07:00:00')).toBe(420);
    expect(parseTimeToMinutes('12:30:00')).toBe(750);
  });
});

describe('calculateDurationMinutes', () => {
  it('calculates daytime shift duration', () => {
    expect(calculateDurationMinutes('07:00', '19:00', false)).toBe(720); // 12h
    expect(calculateDurationMinutes('09:00', '17:00', false)).toBe(480); // 8h
    expect(calculateDurationMinutes('06:00', '14:00', false)).toBe(480); // 8h
  });

  it('calculates overnight shift duration', () => {
    expect(calculateDurationMinutes('19:00', '07:00', true)).toBe(720); // 12h
    expect(calculateDurationMinutes('22:00', '06:00', true)).toBe(480); // 8h
    expect(calculateDurationMinutes('21:00', '09:00', true)).toBe(720); // 12h
  });

  it('handles midnight crossing even without overnight flag', () => {
    // If end < start, it's overnight regardless of flag
    expect(calculateDurationMinutes('22:00', '06:00', false)).toBe(480);
  });
});

describe('calculateWeeklyHours', () => {
  it('sums total hours for a set of shifts', () => {
    const shifts = [
      makeShift('2026-04-06', '07:00', '19:00', false, 720), // 12h
      makeShift('2026-04-07', '07:00', '19:00', false, 720), // 12h
      makeShift('2026-04-08', '07:00', '19:00', false, 720), // 12h
    ];
    expect(calculateWeeklyHours(shifts)).toBe(36);
  });

  it('returns 0 for empty shifts', () => {
    expect(calculateWeeklyHours([])).toBe(0);
  });
});

describe('calculateRestBetweenShifts', () => {
  it('calculates rest between daytime shifts on consecutive days', () => {
    const shiftA = makeShift('2026-04-06', '07:00', '19:00', false, 720);
    const shiftB = makeShift('2026-04-07', '07:00', '19:00', false, 720);
    expect(calculateRestBetweenShifts(shiftA, shiftB)).toBe(12); // 19:00 -> 07:00 = 12h
  });

  it('calculates short rest between late and early shifts', () => {
    const shiftA = makeShift('2026-04-06', '14:00', '22:00', false, 480);
    const shiftB = makeShift('2026-04-07', '06:00', '14:00', false, 480);
    expect(calculateRestBetweenShifts(shiftA, shiftB)).toBe(8); // 22:00 -> 06:00 = 8h
  });

  it('accounts for overnight shifts', () => {
    const shiftA = makeShift('2026-04-06', '19:00', '07:00', true, 720);
    const shiftB = makeShift('2026-04-07', '19:00', '07:00', true, 720);
    // shiftA ends at 07:00 on April 7, shiftB starts at 19:00 on April 7 => 12h rest
    expect(calculateRestBetweenShifts(shiftA, shiftB)).toBe(12);
  });
});

describe('validateWtdCompliance', () => {
  it('returns no conflicts for compliant schedule', () => {
    const shifts = [
      makeShift('2026-04-06', '07:00', '19:00', false, 720), // 12h Mon
      makeShift('2026-04-07', '07:00', '19:00', false, 720), // 12h Tue
      makeShift('2026-04-08', '07:00', '19:00', false, 720), // 12h Wed
    ];
    const conflicts = validateWtdCompliance(shifts, '2026-04-06');
    expect(conflicts).toEqual([]);
  });

  it('flags weekly hours exceeding 48', () => {
    const shifts = [
      makeShift('2026-04-06', '07:00', '19:00', false, 720), // 12h
      makeShift('2026-04-07', '07:00', '19:00', false, 720), // 12h
      makeShift('2026-04-08', '07:00', '19:00', false, 720), // 12h
      makeShift('2026-04-09', '07:00', '19:00', false, 720), // 12h = 48h
      makeShift('2026-04-10', '07:00', '13:00', false, 360), // +6h = 54h
    ];
    const conflicts = validateWtdCompliance(shifts, '2026-04-06');
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].type).toBe('wtd_weekly_hours');
    expect(conflicts[0].severity).toBe('error');
    expect(conflicts[0].overridable).toBe(false);
  });

  it('flags insufficient rest between shifts', () => {
    const shifts = [
      makeShift('2026-04-06', '14:00', '22:00', false, 480), // ends 22:00
      makeShift('2026-04-07', '06:00', '14:00', false, 480), // starts 06:00 = 8h rest
    ];
    const conflicts = validateWtdCompliance(shifts, '2026-04-06');
    const restConflict = conflicts.find((c) => c.type === 'wtd_rest_period');
    expect(restConflict).toBeDefined();
    expect(restConflict!.severity).toBe('error');
    expect(restConflict!.overridable).toBe(false);
  });

  it('does not flag 11+ hours rest', () => {
    const shifts = [
      makeShift('2026-04-06', '07:00', '19:00', false, 720), // ends 19:00
      makeShift('2026-04-07', '07:00', '19:00', false, 720), // starts 07:00 = 12h rest
    ];
    const conflicts = validateWtdCompliance(shifts, '2026-04-06');
    const restConflict = conflicts.find((c) => c.type === 'wtd_rest_period');
    expect(restConflict).toBeUndefined();
  });
});

describe('detectDoubleBookings', () => {
  it('detects overlapping shifts on the same day', () => {
    const shifts = [
      makeShift('2026-04-06', '07:00', '15:00', false, 480),
      makeShift('2026-04-06', '14:00', '22:00', false, 480),
    ];
    const conflicts = detectDoubleBookings(shifts);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('double_booking');
    expect(conflicts[0].overridable).toBe(true);
  });

  it('does not flag non-overlapping shifts', () => {
    const shifts = [
      makeShift('2026-04-06', '07:00', '15:00', false, 480),
      makeShift('2026-04-06', '15:00', '23:00', false, 480),
    ];
    const conflicts = detectDoubleBookings(shifts);
    expect(conflicts).toEqual([]);
  });

  it('detects overnight shift overlapping with next day shift', () => {
    const shifts = [
      makeShift('2026-04-06', '19:00', '07:00', true, 720),
      makeShift('2026-04-07', '06:00', '14:00', false, 480),
    ];
    const conflicts = detectDoubleBookings(shifts);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].type).toBe('double_booking');
  });

  it('returns no conflicts for empty list', () => {
    expect(detectDoubleBookings([])).toEqual([]);
  });
});

describe('detectSkillsGap', () => {
  it('returns null when staff has all required qualifications', () => {
    const result = detectSkillsGap(
      ['medication', 'first-aid'],
      ['medication', 'first-aid', 'manual-handling'],
    );
    expect(result).toBeNull();
  });

  it('detects missing qualifications', () => {
    const result = detectSkillsGap(
      ['medication', 'first-aid', 'peg-feeding'],
      ['medication'],
    );
    expect(result).not.toBeNull();
    expect(result!.type).toBe('skills_gap');
    expect(result!.overridable).toBe(true);
    expect(result!.missingQualifications).toEqual(['first-aid', 'peg-feeding']);
  });

  it('returns null for empty required qualifications', () => {
    expect(detectSkillsGap([], ['medication'])).toBeNull();
  });
});

// Test helper
function makeShift(
  date: string,
  startTime: string,
  endTime: string,
  isOvernight: boolean,
  durationMinutes: number,
) {
  return {
    assignmentId: `test-${date}-${startTime}`,
    date,
    startTime,
    endTime,
    isOvernight,
    paidMinutes: durationMinutes,
    durationMinutes,
  };
}
