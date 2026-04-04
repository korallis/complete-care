/**
 * Tests for the DBS tracking schema validation and helper functions.
 *
 * Validates:
 * - createDbsCheckSchema validation rules
 * - updateDbsCheckSchema validation rules
 * - computeDbsStatus helper
 * - calculateDefaultRecheckDate helper
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
  createDbsCheckSchema,
  updateDbsCheckSchema,
  computeDbsStatus,
  calculateDefaultRecheckDate,
  DBS_LEVELS,
  DBS_LEVEL_LABELS,
  DBS_STATUSES,
  DBS_STATUS_LABELS,
} from '@/features/dbs-tracking/schema';

// ---------------------------------------------------------------------------
// createDbsCheckSchema
// ---------------------------------------------------------------------------

describe('createDbsCheckSchema', () => {
  const validInput = {
    staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
    certificateNumber: '001234567890',
    issueDate: '2024-01-15',
    level: 'enhanced' as const,
    updateServiceSubscribed: true,
    recheckDate: '2027-01-15',
  };

  it('accepts a valid complete DBS check input', () => {
    const result = createDbsCheckSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts input with optional fields', () => {
    const result = createDbsCheckSchema.safeParse({
      ...validInput,
      notes: 'Verified original certificate',
      verifiedByName: 'Jane Manager',
    });
    expect(result.success).toBe(true);
  });

  it('defaults updateServiceSubscribed to false', () => {
    const withoutSubscribed = { ...validInput };
    delete withoutSubscribed.updateServiceSubscribed;
    const result = createDbsCheckSchema.safeParse(withoutSubscribed);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.updateServiceSubscribed).toBe(false);
    }
  });

  it('rejects when staffProfileId is not a valid UUID', () => {
    const result = createDbsCheckSchema.safeParse({
      ...validInput,
      staffProfileId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when certificateNumber is empty', () => {
    const result = createDbsCheckSchema.safeParse({
      ...validInput,
      certificateNumber: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe('certificateNumber');
    }
  });

  it('rejects certificateNumber longer than 50 characters', () => {
    const result = createDbsCheckSchema.safeParse({
      ...validInput,
      certificateNumber: 'A'.repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid issueDate format', () => {
    const result = createDbsCheckSchema.safeParse({
      ...validInput,
      issueDate: '15-01-2024',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid recheckDate format', () => {
    const result = createDbsCheckSchema.safeParse({
      ...validInput,
      recheckDate: '15/01/2027',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid DBS levels', () => {
    for (const level of DBS_LEVELS) {
      const result = createDbsCheckSchema.safeParse({
        ...validInput,
        level,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an invalid DBS level', () => {
    const result = createDbsCheckSchema.safeParse({
      ...validInput,
      level: 'super_enhanced',
    });
    expect(result.success).toBe(false);
  });

  it('rejects notes longer than 2000 characters', () => {
    const result = createDbsCheckSchema.safeParse({
      ...validInput,
      notes: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts null for optional notes', () => {
    const result = createDbsCheckSchema.safeParse({
      ...validInput,
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateDbsCheckSchema
// ---------------------------------------------------------------------------

describe('updateDbsCheckSchema', () => {
  it('accepts partial updates (just certificateNumber)', () => {
    const result = updateDbsCheckSchema.safeParse({
      certificateNumber: '001234567891',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no fields to update)', () => {
    const result = updateDbsCheckSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates field constraints on partial', () => {
    const result = updateDbsCheckSchema.safeParse({
      issueDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid level on update', () => {
    const result = updateDbsCheckSchema.safeParse({
      level: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid partial with multiple fields', () => {
    const result = updateDbsCheckSchema.safeParse({
      level: 'enhanced_barred',
      updateServiceSubscribed: true,
      recheckDate: '2028-06-01',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeDbsStatus
// ---------------------------------------------------------------------------

describe('computeDbsStatus', () => {
  it('returns "current" for a recheck date > 30 days in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const dateStr = futureDate.toISOString().slice(0, 10);
    expect(computeDbsStatus(dateStr)).toBe('current');
  });

  it('returns "expiring_soon" for a recheck date within 30 days', () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 15);
    const dateStr = soonDate.toISOString().slice(0, 10);
    expect(computeDbsStatus(dateStr)).toBe('expiring_soon');
  });

  it('returns "expiring_soon" for a recheck date exactly 30 days from now', () => {
    const exactDate = new Date();
    exactDate.setDate(exactDate.getDate() + 30);
    const dateStr = exactDate.toISOString().slice(0, 10);
    expect(computeDbsStatus(dateStr)).toBe('expiring_soon');
  });

  it('returns "expired" for a recheck date in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const dateStr = pastDate.toISOString().slice(0, 10);
    expect(computeDbsStatus(dateStr)).toBe('expired');
  });

  it('returns "expiring_soon" for today (recheck is due today)', () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    expect(computeDbsStatus(dateStr)).toBe('expiring_soon');
  });
});

// ---------------------------------------------------------------------------
// calculateDefaultRecheckDate
// ---------------------------------------------------------------------------

describe('calculateDefaultRecheckDate', () => {
  it('returns a date 3 years after the issue date', () => {
    expect(calculateDefaultRecheckDate('2024-01-15')).toBe('2027-01-15');
  });

  it('handles leap year boundary', () => {
    expect(calculateDefaultRecheckDate('2024-02-29')).toBe('2027-03-01');
  });

  it('handles year-end dates', () => {
    expect(calculateDefaultRecheckDate('2024-12-31')).toBe('2027-12-31');
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('DBS constants', () => {
  it('DBS_LEVELS contains all expected levels', () => {
    expect(DBS_LEVELS).toEqual([
      'basic',
      'standard',
      'enhanced',
      'enhanced_barred',
    ]);
  });

  it('DBS_LEVEL_LABELS has labels for all levels', () => {
    for (const level of DBS_LEVELS) {
      expect(DBS_LEVEL_LABELS[level]).toBeTruthy();
    }
  });

  it('DBS_STATUSES contains all expected statuses', () => {
    expect(DBS_STATUSES).toEqual(['current', 'expiring_soon', 'expired']);
  });

  it('DBS_STATUS_LABELS has labels for all statuses', () => {
    for (const status of DBS_STATUSES) {
      expect(DBS_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
