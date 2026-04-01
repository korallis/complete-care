/**
 * Tests for the leave schema validation and helper functions.
 *
 * Validates:
 * - requestLeaveSchema validation rules
 * - reviewLeaveSchema validation rules
 * - updateLeaveBalanceSchema validation rules
 * - calculateWorkingDays helper
 * - currentYear helper
 * - Constants exports
 */

import { describe, it, expect, vi } from 'vitest';

// Mock DB dependencies (needed because schema imports may transitively load DB)
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
  requestLeaveSchema,
  reviewLeaveSchema,
  updateLeaveBalanceSchema,
  calculateWorkingDays,
  currentYear,
  LEAVE_TYPES,
  LEAVE_TYPE_LABELS,
  LEAVE_STATUSES,
  LEAVE_STATUS_LABELS,
} from '@/features/leave/schema';

// ---------------------------------------------------------------------------
// requestLeaveSchema
// ---------------------------------------------------------------------------

describe('requestLeaveSchema', () => {
  const validInput = {
    staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
    type: 'annual' as const,
    startDate: '2026-06-01',
    endDate: '2026-06-05',
    totalDays: 5,
    reason: 'Family holiday',
  };

  it('accepts a valid leave request', () => {
    const result = requestLeaveSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts all leave types', () => {
    for (const type of LEAVE_TYPES) {
      const result = requestLeaveSchema.safeParse({ ...validInput, type });
      expect(result.success).toBe(true);
    }
  });

  it('accepts request without reason', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { reason: _reason, ...withoutReason } = validInput;
    const result = requestLeaveSchema.safeParse(withoutReason);
    expect(result.success).toBe(true);
  });

  it('rejects invalid staffProfileId', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      staffProfileId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid leave type', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      type: 'vacation',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid start date format', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      startDate: '01-06-2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid end date format', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      endDate: '05/06/2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects end date before start date', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      startDate: '2026-06-05',
      endDate: '2026-06-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero total days', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      totalDays: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative total days', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      totalDays: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects total days over 365', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      totalDays: 366,
    });
    expect(result.success).toBe(false);
  });

  it('rejects reason over 2000 characters', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      reason: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts same start and end date (single day leave)', () => {
    const result = requestLeaveSchema.safeParse({
      ...validInput,
      startDate: '2026-06-01',
      endDate: '2026-06-01',
      totalDays: 1,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// reviewLeaveSchema
// ---------------------------------------------------------------------------

describe('reviewLeaveSchema', () => {
  it('accepts approved status', () => {
    const result = reviewLeaveSchema.safeParse({ status: 'approved' });
    expect(result.success).toBe(true);
  });

  it('accepts denied status', () => {
    const result = reviewLeaveSchema.safeParse({ status: 'denied' });
    expect(result.success).toBe(true);
  });

  it('accepts review with note', () => {
    const result = reviewLeaveSchema.safeParse({
      status: 'approved',
      reviewNote: 'Enjoy your holiday!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects pending status (not a valid review action)', () => {
    const result = reviewLeaveSchema.safeParse({ status: 'pending' });
    expect(result.success).toBe(false);
  });

  it('rejects cancelled status (not a valid review action)', () => {
    const result = reviewLeaveSchema.safeParse({ status: 'cancelled' });
    expect(result.success).toBe(false);
  });

  it('rejects review note over 1000 characters', () => {
    const result = reviewLeaveSchema.safeParse({
      status: 'denied',
      reviewNote: 'X'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateLeaveBalanceSchema
// ---------------------------------------------------------------------------

describe('updateLeaveBalanceSchema', () => {
  it('accepts valid entitlement', () => {
    const result = updateLeaveBalanceSchema.safeParse({
      annualEntitlement: 28,
    });
    expect(result.success).toBe(true);
  });

  it('accepts zero entitlement', () => {
    const result = updateLeaveBalanceSchema.safeParse({
      annualEntitlement: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative entitlement', () => {
    const result = updateLeaveBalanceSchema.safeParse({
      annualEntitlement: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects entitlement over 365', () => {
    const result = updateLeaveBalanceSchema.safeParse({
      annualEntitlement: 366,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer entitlement', () => {
    const result = updateLeaveBalanceSchema.safeParse({
      annualEntitlement: 28.5,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// calculateWorkingDays
// ---------------------------------------------------------------------------

describe('calculateWorkingDays', () => {
  it('returns 5 for a Monday-Friday week', () => {
    // 2026-06-01 is a Monday, 2026-06-05 is a Friday
    expect(calculateWorkingDays('2026-06-01', '2026-06-05')).toBe(5);
  });

  it('returns 1 for a single weekday', () => {
    // 2026-06-01 is a Monday
    expect(calculateWorkingDays('2026-06-01', '2026-06-01')).toBe(1);
  });

  it('returns 0 for a Saturday-Sunday range', () => {
    // 2026-06-06 is a Saturday, 2026-06-07 is a Sunday
    expect(calculateWorkingDays('2026-06-06', '2026-06-07')).toBe(0);
  });

  it('returns 5 for a full week (Mon-Sun)', () => {
    // 2026-06-01 Mon to 2026-06-07 Sun = 5 working days
    expect(calculateWorkingDays('2026-06-01', '2026-06-07')).toBe(5);
  });

  it('returns 10 for two full weeks', () => {
    // 2026-06-01 Mon to 2026-06-14 Sun = 10 working days
    expect(calculateWorkingDays('2026-06-01', '2026-06-14')).toBe(10);
  });

  it('returns 0 when end is before start', () => {
    expect(calculateWorkingDays('2026-06-05', '2026-06-01')).toBe(0);
  });

  it('handles month boundary correctly', () => {
    // 2026-06-29 Mon to 2026-07-03 Fri = 5 working days
    expect(calculateWorkingDays('2026-06-29', '2026-07-03')).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// currentYear
// ---------------------------------------------------------------------------

describe('currentYear', () => {
  it('returns the current year', () => {
    const year = currentYear();
    expect(year).toBe(new Date().getFullYear());
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('Leave constants', () => {
  it('LEAVE_TYPES contains expected types', () => {
    expect(LEAVE_TYPES).toEqual(['annual', 'sick', 'compassionate', 'unpaid']);
  });

  it('LEAVE_TYPE_LABELS has labels for all types', () => {
    for (const type of LEAVE_TYPES) {
      expect(LEAVE_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('LEAVE_STATUSES contains expected statuses', () => {
    expect(LEAVE_STATUSES).toEqual([
      'pending',
      'approved',
      'denied',
      'cancelled',
    ]);
  });

  it('LEAVE_STATUS_LABELS has labels for all statuses', () => {
    for (const status of LEAVE_STATUSES) {
      expect(LEAVE_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
