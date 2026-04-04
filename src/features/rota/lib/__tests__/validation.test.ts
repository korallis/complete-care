import { describe, it, expect } from 'vitest';
import {
  createShiftPatternSchema,
  rotaPeriodSchema,
  assignStaffSchema,
  conflictOverrideSchema,
} from '../validation';

describe('createShiftPatternSchema', () => {
  const validData = {
    name: 'Day Shift 12hr',
    careDomain: 'supported_living' as const,
    shiftType: 'standard' as const,
    startTime: '07:00',
    endTime: '19:00',
    isOvernight: false,
    breakMinutes: 30,
    payRateMultiplier: '1.00',
    colour: '#3B82F6',
    minimumStaff: 2,
    requiredQualifications: ['medication'],
  };

  it('accepts valid shift pattern data', () => {
    const result = createShiftPatternSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createShiftPatternSchema.safeParse({
      ...validData,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid care domain', () => {
    const result = createShiftPatternSchema.safeParse({
      ...validData,
      careDomain: 'invalid_domain',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const result = createShiftPatternSchema.safeParse({
      ...validData,
      startTime: '7am',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid shift types', () => {
    for (const shiftType of ['standard', 'sleep_in', 'waking_night', 'on_call']) {
      const result = createShiftPatternSchema.safeParse({
        ...validData,
        shiftType,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid care domains', () => {
    for (const careDomain of [
      'domiciliary_care',
      'supported_living',
      'complex_care',
      'childrens_home',
    ]) {
      const result = createShiftPatternSchema.safeParse({
        ...validData,
        careDomain,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid hex colour', () => {
    const result = createShiftPatternSchema.safeParse({
      ...validData,
      colour: 'red',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid rota patterns', () => {
    for (const rotaPattern of ['2on2off', '4on4off', '5on2off', 'custom']) {
      const result = createShiftPatternSchema.safeParse({
        ...validData,
        rotaPattern,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts null rota pattern', () => {
    const result = createShiftPatternSchema.safeParse({
      ...validData,
      rotaPattern: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative break minutes', () => {
    const result = createShiftPatternSchema.safeParse({
      ...validData,
      breakMinutes: -10,
    });
    expect(result.success).toBe(false);
  });

  it('applies defaults for optional fields', () => {
    const minimal = {
      name: 'Minimal Shift',
      careDomain: 'supported_living',
      startTime: '07:00',
      endTime: '19:00',
    };
    const result = createShiftPatternSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.shiftType).toBe('standard');
      expect(result.data.breakMinutes).toBe(0);
      expect(result.data.payRateMultiplier).toBe('1.00');
      expect(result.data.colour).toBe('#3B82F6');
      expect(result.data.minimumStaff).toBe(1);
    }
  });
});

describe('rotaPeriodSchema', () => {
  it('accepts valid rota period', () => {
    const result = rotaPeriodSchema.safeParse({
      name: 'Week 14 2026',
      periodType: 'week',
      startDate: '2026-04-06T00:00:00.000Z',
      endDate: '2026-04-12T23:59:59.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = rotaPeriodSchema.safeParse({
      name: '',
      periodType: 'week',
      startDate: '2026-04-06T00:00:00.000Z',
      endDate: '2026-04-12T23:59:59.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid period type', () => {
    const result = rotaPeriodSchema.safeParse({
      name: 'Week 14',
      periodType: 'monthly',
      startDate: '2026-04-06T00:00:00.000Z',
      endDate: '2026-04-12T23:59:59.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('assignStaffSchema', () => {
  it('accepts valid UUIDs', () => {
    const result = assignStaffSchema.safeParse({
      shiftAssignmentId: '550e8400-e29b-41d4-a716-446655440000',
      staffId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID strings', () => {
    const result = assignStaffSchema.safeParse({
      shiftAssignmentId: 'not-a-uuid',
      staffId: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(false);
  });
});

describe('conflictOverrideSchema', () => {
  it('accepts valid override with sufficient reason', () => {
    const result = conflictOverrideSchema.safeParse({
      shiftAssignmentId: '550e8400-e29b-41d4-a716-446655440000',
      conflictType: 'double_booking',
      overrideReason: 'Staff confirmed availability for both shifts with manager approval',
    });
    expect(result.success).toBe(true);
  });

  it('rejects override reason shorter than 10 characters', () => {
    const result = conflictOverrideSchema.safeParse({
      shiftAssignmentId: '550e8400-e29b-41d4-a716-446655440000',
      conflictType: 'double_booking',
      overrideReason: 'OK',
    });
    expect(result.success).toBe(false);
  });

  it('accepts skills_gap conflict type', () => {
    const result = conflictOverrideSchema.safeParse({
      shiftAssignmentId: '550e8400-e29b-41d4-a716-446655440000',
      conflictType: 'skills_gap',
      overrideReason: 'Staff completing qualification next week, supervised by qualified colleague',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid conflict type', () => {
    const result = conflictOverrideSchema.safeParse({
      shiftAssignmentId: '550e8400-e29b-41d4-a716-446655440000',
      conflictType: 'wtd_weekly_hours',
      overrideReason: 'This should not be allowed',
    });
    expect(result.success).toBe(false);
  });
});
