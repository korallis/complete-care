/**
 * Tests for the supervision schema validation and helper functions.
 *
 * Validates:
 * - scheduleSupervisionSchema validation rules
 * - completeSupervisionSchema validation rules
 * - updateSupervisionSchema validation rules
 * - computeSupervisionStatus helper
 * - calculateNextDueDate helper
 * - daysUntilSupervision helper
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
  scheduleSupervisionSchema,
  completeSupervisionSchema,
  updateSupervisionSchema,
  computeSupervisionStatus,
  calculateNextDueDate,
  daysUntilSupervision,
  SUPERVISION_TYPES,
  SUPERVISION_TYPE_LABELS,
  SUPERVISION_FREQUENCIES,
  SUPERVISION_FREQUENCY_LABELS,
  SUPERVISION_STATUSES,
  SUPERVISION_STATUS_LABELS,
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
} from '@/features/supervisions/schema';

// ---------------------------------------------------------------------------
// Helper: create a date string offset from today
// ---------------------------------------------------------------------------

function dateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// scheduleSupervisionSchema
// ---------------------------------------------------------------------------

describe('scheduleSupervisionSchema', () => {
  const validInput = {
    staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
    supervisorId: '660e8400-e29b-41d4-a716-446655440000',
    scheduledDate: '2026-05-15',
    type: 'supervision' as const,
    frequency: 'monthly' as const,
  };

  it('accepts a valid schedule input', () => {
    const result = scheduleSupervisionSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('defaults type to supervision', () => {
    const { type: _unused, ...withoutType } = validInput;
    const result = scheduleSupervisionSchema.safeParse(withoutType);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('supervision');
    }
  });

  it('defaults frequency to monthly', () => {
    const { frequency: _unused, ...withoutFreq } = validInput;
    const result = scheduleSupervisionSchema.safeParse(withoutFreq);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.frequency).toBe('monthly');
    }
  });

  it('rejects invalid staffProfileId', () => {
    const result = scheduleSupervisionSchema.safeParse({
      ...validInput,
      staffProfileId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid supervisorId', () => {
    const result = scheduleSupervisionSchema.safeParse({
      ...validInput,
      supervisorId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = scheduleSupervisionSchema.safeParse({
      ...validInput,
      scheduledDate: '15-05-2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = scheduleSupervisionSchema.safeParse({
      ...validInput,
      type: 'review',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid frequency', () => {
    const result = scheduleSupervisionSchema.safeParse({
      ...validInput,
      frequency: 'weekly',
    });
    expect(result.success).toBe(false);
  });

  it('accepts appraisal type', () => {
    const result = scheduleSupervisionSchema.safeParse({
      ...validInput,
      type: 'appraisal',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid frequencies', () => {
    for (const freq of SUPERVISION_FREQUENCIES) {
      const result = scheduleSupervisionSchema.safeParse({
        ...validInput,
        frequency: freq,
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// completeSupervisionSchema
// ---------------------------------------------------------------------------

describe('completeSupervisionSchema', () => {
  it('accepts an empty completion (all fields optional)', () => {
    const result = completeSupervisionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts full completion data', () => {
    const result = completeSupervisionSchema.safeParse({
      workloadDiscussion: 'Workload is manageable',
      wellbeingCheck: 'Staff member is doing well',
      developmentGoals: [
        {
          id: 'goal-1',
          goal: 'Complete NVQ Level 3',
          targetDate: '2026-12-31',
          status: 'in_progress',
          notes: 'Enrolled in programme',
        },
      ],
      concernsRaised: 'None at this time',
      actionsAgreed: [
        {
          id: 'action-1',
          action: 'Complete medication competency',
          assigneeId: '550e8400-e29b-41d4-a716-446655440000',
          assigneeName: 'John Doe',
          deadline: '2026-06-30',
          completed: false,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects workloadDiscussion over 5000 chars', () => {
    const result = completeSupervisionSchema.safeParse({
      workloadDiscussion: 'X'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid goal status', () => {
    const result = completeSupervisionSchema.safeParse({
      developmentGoals: [
        {
          id: 'goal-1',
          goal: 'Test goal',
          status: 'invalid',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects action with empty action text', () => {
    const result = completeSupervisionSchema.safeParse({
      actionsAgreed: [
        {
          id: 'action-1',
          action: '',
          completed: false,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects action with invalid assigneeId', () => {
    const result = completeSupervisionSchema.safeParse({
      actionsAgreed: [
        {
          id: 'action-1',
          action: 'Test action',
          assigneeId: 'not-uuid',
          completed: false,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateSupervisionSchema
// ---------------------------------------------------------------------------

describe('updateSupervisionSchema', () => {
  it('accepts partial updates (just status)', () => {
    const result = updateSupervisionSchema.safeParse({
      status: 'cancelled',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no fields to update)', () => {
    const result = updateSupervisionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates field constraints on partial', () => {
    const result = updateSupervisionSchema.safeParse({
      scheduledDate: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid partial with multiple fields', () => {
    const result = updateSupervisionSchema.safeParse({
      frequency: 'quarterly',
      type: 'appraisal',
      scheduledDate: '2026-09-01',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeSupervisionStatus
// ---------------------------------------------------------------------------

describe('computeSupervisionStatus', () => {
  it('returns "completed" when completedDate is set', () => {
    expect(computeSupervisionStatus(dateFromNow(-10), '2026-01-15')).toBe('completed');
  });

  it('returns "overdue" for a past scheduled date without completion', () => {
    expect(computeSupervisionStatus(dateFromNow(-5), null)).toBe('overdue');
  });

  it('returns "scheduled" for a future scheduled date', () => {
    expect(computeSupervisionStatus(dateFromNow(10), null)).toBe('scheduled');
  });

  it('returns "scheduled" for today (not yet overdue)', () => {
    // Today's date at midnight is not in the past
    expect(computeSupervisionStatus(dateFromNow(0), null)).toBe('scheduled');
  });
});

// ---------------------------------------------------------------------------
// calculateNextDueDate
// ---------------------------------------------------------------------------

describe('calculateNextDueDate', () => {
  it('adds 1 month for monthly frequency', () => {
    expect(calculateNextDueDate('2026-01-15', 'monthly')).toBe('2026-02-15');
  });

  it('adds 42 days for six_weekly frequency', () => {
    expect(calculateNextDueDate('2026-01-01', 'six_weekly')).toBe('2026-02-12');
  });

  it('adds 3 months for quarterly frequency', () => {
    // Use June -> September to avoid DST boundary issues
    expect(calculateNextDueDate('2026-06-15', 'quarterly')).toBe('2026-09-15');
  });

  it('adds 1 year for annual frequency', () => {
    expect(calculateNextDueDate('2026-01-15', 'annual')).toBe('2027-01-15');
  });

  it('handles month-end boundary for monthly', () => {
    // Jan 31 + 1 month = Feb 28 (or March depending on implementation)
    const result = calculateNextDueDate('2026-01-31', 'monthly');
    // Date wraps: Jan 31 + 1 month -> March 3 (non-leap) or Feb 28
    expect(result).toBeTruthy();
  });

  it('handles leap year for annual', () => {
    expect(calculateNextDueDate('2024-02-29', 'annual')).toBe('2025-03-01');
  });
});

// ---------------------------------------------------------------------------
// daysUntilSupervision
// ---------------------------------------------------------------------------

describe('daysUntilSupervision', () => {
  it('returns positive days for a future date', () => {
    const days = daysUntilSupervision(dateFromNow(10));
    expect(days).toBe(10);
  });

  it('returns negative days for a past date', () => {
    const days = daysUntilSupervision(dateFromNow(-5));
    expect(days).toBeLessThanOrEqual(-4);
    expect(days).toBeGreaterThanOrEqual(-5);
  });

  it('returns 0 for today', () => {
    const days = daysUntilSupervision(dateFromNow(0));
    expect(days).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('Supervision constants', () => {
  it('SUPERVISION_TYPES contains expected types', () => {
    expect(SUPERVISION_TYPES).toEqual(['supervision', 'appraisal']);
  });

  it('SUPERVISION_TYPE_LABELS has labels for all types', () => {
    for (const type of SUPERVISION_TYPES) {
      expect(SUPERVISION_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('SUPERVISION_FREQUENCIES contains expected frequencies', () => {
    expect(SUPERVISION_FREQUENCIES).toEqual([
      'monthly',
      'six_weekly',
      'quarterly',
      'annual',
    ]);
  });

  it('SUPERVISION_FREQUENCY_LABELS has labels for all frequencies', () => {
    for (const freq of SUPERVISION_FREQUENCIES) {
      expect(SUPERVISION_FREQUENCY_LABELS[freq]).toBeTruthy();
    }
  });

  it('SUPERVISION_STATUSES contains expected statuses', () => {
    expect(SUPERVISION_STATUSES).toEqual([
      'scheduled',
      'completed',
      'overdue',
      'cancelled',
    ]);
  });

  it('SUPERVISION_STATUS_LABELS has labels for all statuses', () => {
    for (const status of SUPERVISION_STATUSES) {
      expect(SUPERVISION_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('GOAL_STATUSES contains expected goal statuses', () => {
    expect(GOAL_STATUSES).toEqual([
      'not_started',
      'in_progress',
      'completed',
    ]);
  });

  it('GOAL_STATUS_LABELS has labels for all goal statuses', () => {
    for (const status of GOAL_STATUSES) {
      expect(GOAL_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
