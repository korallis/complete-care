/**
 * Tests for care package schema, validation, and table definitions.
 *
 * Validates:
 * - care_packages table has required columns
 * - visit_types table has required columns
 * - scheduled_visits table has required columns
 * - Zod validation schemas work correctly
 * - Helper functions (addMinutesToTime, review status)
 */

import { describe, it, expect } from 'vitest';
import { carePackages, visitTypes, scheduledVisits } from '@/lib/db/schema/care-packages';
import {
  createCarePackageSchema,
  updateCarePackageSchema,
  createVisitTypeSchema,
  createScheduledVisitSchema,
  generateScheduleSchema,
  addMinutesToTime,
  isPackageReviewOverdue,
  isPackageReviewDueSoon,
} from '@/features/care-packages/schema';

// ---------------------------------------------------------------------------
// care_packages table schema
// ---------------------------------------------------------------------------

describe('care_packages table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(carePackages);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('personId');
    expect(columns).toContain('status');
    expect(columns).toContain('startDate');
    expect(columns).toContain('endDate');
    expect(columns).toContain('reviewDate');
    expect(columns).toContain('fundingType');
    expect(columns).toContain('commissioners');
    expect(columns).toContain('environmentNotes');
    expect(columns).toContain('weeklyHours');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
    expect(columns).toContain('deletedAt');
  });

  it('has tenant isolation column', () => {
    const columns = Object.keys(carePackages);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// visit_types table schema
// ---------------------------------------------------------------------------

describe('visit_types table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(visitTypes);
    expect(columns).toContain('id');
    expect(columns).toContain('carePackageId');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('name');
    expect(columns).toContain('duration');
    expect(columns).toContain('timeWindowStart');
    expect(columns).toContain('timeWindowEnd');
    expect(columns).toContain('taskList');
    expect(columns).toContain('frequency');
    expect(columns).toContain('customPattern');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });
});

// ---------------------------------------------------------------------------
// scheduled_visits table schema
// ---------------------------------------------------------------------------

describe('scheduled_visits table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(scheduledVisits);
    expect(columns).toContain('id');
    expect(columns).toContain('visitTypeId');
    expect(columns).toContain('carePackageId');
    expect(columns).toContain('personId');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('assignedStaffId');
    expect(columns).toContain('date');
    expect(columns).toContain('scheduledStart');
    expect(columns).toContain('scheduledEnd');
    expect(columns).toContain('status');
    expect(columns).toContain('isAdHoc');
    expect(columns).toContain('notes');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });
});

// ---------------------------------------------------------------------------
// createCarePackageSchema
// ---------------------------------------------------------------------------

describe('createCarePackageSchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    startDate: '2026-04-01',
    fundingType: 'private' as const,
  };

  it('validates a valid input', () => {
    const result = createCarePackageSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects missing personId', () => {
    const result = createCarePackageSchema.safeParse({
      startDate: '2026-04-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createCarePackageSchema.safeParse({
      ...validInput,
      startDate: '04/01/2026',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = createCarePackageSchema.safeParse({
      ...validInput,
      endDate: '2026-12-31',
      reviewDate: '2026-07-01',
      weeklyHours: '10.5',
      notes: 'Some notes',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null endDate', () => {
    const result = createCarePackageSchema.safeParse({
      ...validInput,
      endDate: null,
    });
    expect(result.success).toBe(true);
  });

  it('validates funding type enum', () => {
    const result = createCarePackageSchema.safeParse({
      ...validInput,
      fundingType: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });

  it('defaults status to active', () => {
    const result = createCarePackageSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active');
    }
  });
});

// ---------------------------------------------------------------------------
// updateCarePackageSchema
// ---------------------------------------------------------------------------

describe('updateCarePackageSchema', () => {
  it('validates partial update', () => {
    const result = updateCarePackageSchema.safeParse({
      status: 'suspended',
    });
    expect(result.success).toBe(true);
  });

  it('validates empty update', () => {
    const result = updateCarePackageSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateCarePackageSchema.safeParse({
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createVisitTypeSchema
// ---------------------------------------------------------------------------

describe('createVisitTypeSchema', () => {
  const validInput = {
    carePackageId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'morning',
    duration: 30,
    timeWindowStart: '07:00',
    timeWindowEnd: '10:00',
  };

  it('validates a valid input', () => {
    const result = createVisitTypeSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects duration less than 5 minutes', () => {
    const result = createVisitTypeSchema.safeParse({
      ...validInput,
      duration: 3,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const result = createVisitTypeSchema.safeParse({
      ...validInput,
      timeWindowStart: '7:00',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid 24h time', () => {
    const result = createVisitTypeSchema.safeParse({
      ...validInput,
      timeWindowStart: '23:59',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid 24h time', () => {
    const result = createVisitTypeSchema.safeParse({
      ...validInput,
      timeWindowStart: '25:00',
    });
    expect(result.success).toBe(false);
  });

  it('accepts task list', () => {
    const result = createVisitTypeSchema.safeParse({
      ...validInput,
      taskList: [
        { id: 't1', description: 'Check medication', required: true, order: 0 },
        { id: 't2', description: 'Prepare breakfast', required: false, order: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects task with empty description', () => {
    const result = createVisitTypeSchema.safeParse({
      ...validInput,
      taskList: [
        { id: 't1', description: '', required: true, order: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('defaults frequency to daily', () => {
    const result = createVisitTypeSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.frequency).toBe('daily');
    }
  });
});

// ---------------------------------------------------------------------------
// createScheduledVisitSchema
// ---------------------------------------------------------------------------

describe('createScheduledVisitSchema', () => {
  it('validates a valid ad-hoc visit', () => {
    const result = createScheduledVisitSchema.safeParse({
      carePackageId: '550e8400-e29b-41d4-a716-446655440000',
      personId: '550e8400-e29b-41d4-a716-446655440001',
      date: '2026-04-15',
      scheduledStart: '14:00',
      scheduledEnd: '15:00',
      isAdHoc: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid date', () => {
    const result = createScheduledVisitSchema.safeParse({
      carePackageId: '550e8400-e29b-41d4-a716-446655440000',
      personId: '550e8400-e29b-41d4-a716-446655440001',
      date: 'not-a-date',
      scheduledStart: '14:00',
      scheduledEnd: '15:00',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// generateScheduleSchema
// ---------------------------------------------------------------------------

describe('generateScheduleSchema', () => {
  it('validates a valid input', () => {
    const result = generateScheduleSchema.safeParse({
      carePackageId: '550e8400-e29b-41d4-a716-446655440000',
      startDate: '2026-04-06',
      endDate: '2026-04-12',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing dates', () => {
    const result = generateScheduleSchema.safeParse({
      carePackageId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// addMinutesToTime
// ---------------------------------------------------------------------------

describe('addMinutesToTime', () => {
  it('adds minutes correctly', () => {
    expect(addMinutesToTime('07:00', 30)).toBe('07:30');
    expect(addMinutesToTime('23:45', 30)).toBe('00:15');
    expect(addMinutesToTime('12:00', 0)).toBe('12:00');
  });
});

// ---------------------------------------------------------------------------
// Review status helpers
// ---------------------------------------------------------------------------

describe('isPackageReviewOverdue', () => {
  it('returns true for past date', () => {
    expect(isPackageReviewOverdue('2020-01-01')).toBe(true);
  });

  it('returns false for future date', () => {
    expect(isPackageReviewOverdue('2099-12-31')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPackageReviewOverdue(null)).toBe(false);
  });
});

describe('isPackageReviewDueSoon', () => {
  it('returns true for date within 14 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    expect(isPackageReviewDueSoon(soon.toISOString().slice(0, 10))).toBe(true);
  });

  it('returns false for far future date', () => {
    expect(isPackageReviewDueSoon('2099-12-31')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPackageReviewDueSoon(null)).toBe(false);
  });
});
