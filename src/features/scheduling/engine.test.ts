import { describe, it, expect } from 'vitest';
import { generateSchedule, rankCandidatesForGap, calculateSlotDuration } from './engine';
import type { SchedulableStaff, ScheduleSlot } from './types';

const makeStaff = (overrides: Partial<SchedulableStaff> = {}): SchedulableStaff => ({
  id: 'staff-1',
  name: 'Alice Smith',
  qualifications: ['NVQ Level 3', 'Manual Handling'],
  maxWeeklyHours: 40,
  scheduledHours: 0,
  hourlyRate: 12,
  availability: [
    { dayOfWeek: 'monday', startTime: '07:00', endTime: '19:00', type: 'available' },
    { dayOfWeek: 'tuesday', startTime: '07:00', endTime: '19:00', type: 'preferred' },
  ],
  baseLocation: 'site-a',
  ...overrides,
});

const makeSlot = (overrides: Partial<ScheduleSlot> = {}): ScheduleSlot => ({
  id: 'slot-1',
  shiftDate: '2026-04-06',
  dayOfWeek: 'monday',
  startTime: '08:00',
  endTime: '16:00',
  requiredQualifications: ['NVQ Level 3'],
  locationId: 'site-a',
  minStaff: 1,
  ...overrides,
});

describe('calculateSlotDuration', () => {
  it('calculates standard shift duration', () => {
    expect(calculateSlotDuration('08:00', '16:00')).toBe(8);
  });

  it('calculates overnight shift duration', () => {
    expect(calculateSlotDuration('22:00', '06:00')).toBe(8);
  });

  it('handles partial hours', () => {
    expect(calculateSlotDuration('08:00', '12:30')).toBe(4.5);
  });
});

describe('generateSchedule', () => {
  it('assigns eligible staff to slots', () => {
    const staff = [makeStaff()];
    const slots = [makeSlot()];

    const result = generateSchedule(staff, slots);

    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].staffId).toBe('staff-1');
    expect(result.assignments[0].status).toBe('assigned');
    expect(result.summary.filledSlots).toBe(1);
    expect(result.summary.unfilledSlots).toBe(0);
  });

  it('marks slots as unfilled when no eligible staff', () => {
    const staff = [makeStaff({ qualifications: [] })]; // missing required qual
    const slots = [makeSlot({ requiredQualifications: ['Medication Administration'] })];

    const result = generateSchedule(staff, slots);

    expect(result.assignments[0].status).toBe('unfilled');
    expect(result.assignments[0].staffId).toBeNull();
    expect(result.summary.unfilledSlots).toBe(1);
  });

  it('respects maximum weekly hours', () => {
    const staff = [makeStaff({ maxWeeklyHours: 40, scheduledHours: 38 })];
    const slots = [makeSlot()]; // 8 hour shift, only 2 hours remaining

    const result = generateSchedule(staff, slots);

    expect(result.assignments[0].status).toBe('unfilled');
  });

  it('picks the best-scoring staff when multiple are eligible', () => {
    const staff = [
      makeStaff({ id: 'staff-1', name: 'Alice', hourlyRate: 25, baseLocation: 'site-b' }),
      makeStaff({ id: 'staff-2', name: 'Bob', hourlyRate: 12, baseLocation: 'site-a' }),
    ];
    const slots = [makeSlot({ locationId: 'site-a' })];

    const result = generateSchedule(staff, slots);

    // Bob should be preferred: lower cost + same location
    expect(result.assignments[0].staffId).toBe('staff-2');
  });

  it('respects availability constraints', () => {
    const staff = [
      makeStaff({
        availability: [
          { dayOfWeek: 'wednesday', startTime: '08:00', endTime: '16:00', type: 'available' },
        ],
      }),
    ];
    const slots = [makeSlot({ dayOfWeek: 'monday' })]; // staff not available Monday

    const result = generateSchedule(staff, slots);
    expect(result.assignments[0].status).toBe('unfilled');
  });

  it('fills multiple staff requirements per slot', () => {
    const staff = [
      makeStaff({ id: 'staff-1', name: 'Alice' }),
      makeStaff({ id: 'staff-2', name: 'Bob' }),
    ];
    const slots = [makeSlot({ minStaff: 2 })];

    const result = generateSchedule(staff, slots);

    expect(result.assignments).toHaveLength(2);
    const assigned = result.assignments.filter((a) => a.status === 'assigned');
    expect(assigned).toHaveLength(2);
  });

  it('tracks hours across multiple assignments', () => {
    const staff = [makeStaff({ maxWeeklyHours: 16, scheduledHours: 0 })];
    const slots = [
      makeSlot({ id: 'slot-1', startTime: '08:00', endTime: '16:00' }), // 8h
      makeSlot({ id: 'slot-2', startTime: '08:00', endTime: '16:00', dayOfWeek: 'monday' }), // 8h
      makeSlot({ id: 'slot-3', startTime: '08:00', endTime: '16:00', dayOfWeek: 'monday' }), // 8h — over limit
    ];

    const result = generateSchedule(staff, slots);

    const filled = result.assignments.filter((a) => a.status === 'assigned');
    const unfilled = result.assignments.filter((a) => a.status === 'unfilled');
    expect(filled).toHaveLength(2);
    expect(unfilled).toHaveLength(1);
  });

  it('produces a scored trade-off summary', () => {
    const staff = [makeStaff()];
    const slots = [makeSlot()];

    const result = generateSchedule(staff, slots);

    expect(result.summary.overallScore).toBeGreaterThan(0);
    expect(result.summary.tradeOffs).toHaveLength(4);
    expect(result.summary.tradeOffs.map((t) => t.constraint)).toEqual(
      expect.arrayContaining(['geography', 'cost', 'hoursRemaining', 'preference']),
    );
  });
});

describe('rankCandidatesForGap', () => {
  it('ranks candidates by suitability score', () => {
    const staff = [
      makeStaff({ id: 'staff-1', name: 'Alice', hourlyRate: 25 }),
      makeStaff({ id: 'staff-2', name: 'Bob', hourlyRate: 10 }),
    ];
    const slot = makeSlot();

    const candidates = rankCandidatesForGap(staff, slot);

    expect(candidates).toHaveLength(2);
    // Bob should rank higher (lower cost)
    expect(candidates[0].staffId).toBe('staff-2');
    expect(candidates[0].suitabilityScore).toBeGreaterThan(candidates[1].suitabilityScore);
  });

  it('provides breakdown reasons for each candidate', () => {
    const staff = [makeStaff()];
    const slot = makeSlot();

    const candidates = rankCandidatesForGap(staff, slot);

    expect(candidates[0].reasons).toHaveLength(4);
    const factors = candidates[0].reasons.map((r) => r.factor);
    expect(factors).toEqual(['skills', 'availability', 'hours_remaining', 'cost']);
  });

  it('excludes ineligible staff', () => {
    const staff = [
      makeStaff({ id: 'staff-1', qualifications: [] }), // missing quals
      makeStaff({ id: 'staff-2' }),
    ];
    const slot = makeSlot({ requiredQualifications: ['NVQ Level 3'] });

    const candidates = rankCandidatesForGap(staff, slot);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].staffId).toBe('staff-2');
  });

  it('returns empty array when no eligible candidates', () => {
    const staff = [makeStaff({ maxWeeklyHours: 0 })];
    const slot = makeSlot();

    const candidates = rankCandidatesForGap(staff, slot);
    expect(candidates).toHaveLength(0);
  });
});
