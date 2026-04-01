/**
 * Tests for the training matrix schema validation and helper functions.
 *
 * Validates:
 * - createTrainingCourseSchema validation rules
 * - createTrainingRecordSchema validation rules
 * - updateTrainingRecordSchema validation rules
 * - createQualificationSchema validation rules
 * - computeTrainingStatus helper
 * - calculateExpiryDate helper
 * - Constants integrity
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
  createTrainingCourseSchema,
  // updateTrainingCourseSchema is covered via createTrainingCourseSchema.partial()
  createTrainingRecordSchema,
  updateTrainingRecordSchema,
  createQualificationSchema,
  updateQualificationSchema,
  computeTrainingStatus,
  calculateExpiryDate,
  TRAINING_CATEGORIES,
  TRAINING_CATEGORY_LABELS,
  TRAINING_STATUSES,
  TRAINING_STATUS_LABELS,
  QUALIFICATION_STATUSES,
  QUALIFICATION_STATUS_LABELS,
  QUALIFICATION_LEVELS,
} from '@/features/training/schema';

// ---------------------------------------------------------------------------
// createTrainingCourseSchema
// ---------------------------------------------------------------------------

describe('createTrainingCourseSchema', () => {
  const validInput = {
    name: 'Moving and Handling',
    category: 'mandatory' as const,
    requiredForRoles: ['Care Worker', 'Nurse'],
    validityMonths: 12,
  };

  it('accepts a valid complete course input', () => {
    const result = createTrainingCourseSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts minimal input with defaults', () => {
    const result = createTrainingCourseSchema.safeParse({ name: 'Test Course' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('mandatory');
      expect(result.data.requiredForRoles).toEqual([]);
      expect(result.data.isDefault).toBe(false);
    }
  });

  it('rejects when name is empty', () => {
    const result = createTrainingCourseSchema.safeParse({ ...validInput, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name longer than 255 characters', () => {
    const result = createTrainingCourseSchema.safeParse({ ...validInput, name: 'A'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('accepts all valid categories', () => {
    for (const cat of TRAINING_CATEGORIES) {
      const result = createTrainingCourseSchema.safeParse({ ...validInput, category: cat });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid category', () => {
    const result = createTrainingCourseSchema.safeParse({ ...validInput, category: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts null validityMonths', () => {
    const result = createTrainingCourseSchema.safeParse({ ...validInput, validityMonths: null });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createTrainingRecordSchema
// ---------------------------------------------------------------------------

describe('createTrainingRecordSchema', () => {
  const validInput = {
    staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
    courseName: 'Fire Safety',
    completedDate: '2024-06-15',
    expiryDate: '2025-06-15',
    provider: 'Blue Stream Academy',
  };

  it('accepts a valid complete record input', () => {
    const result = createTrainingRecordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts input without optional fields', () => {
    const result = createTrainingRecordSchema.safeParse({
      staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
      courseName: 'Fire Safety',
      completedDate: '2024-06-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when staffProfileId is not a valid UUID', () => {
    const result = createTrainingRecordSchema.safeParse({
      ...validInput,
      staffProfileId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when courseName is empty', () => {
    const result = createTrainingRecordSchema.safeParse({
      ...validInput,
      courseName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid completedDate format', () => {
    const result = createTrainingRecordSchema.safeParse({
      ...validInput,
      completedDate: '15-06-2024',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid expiryDate format', () => {
    const result = createTrainingRecordSchema.safeParse({
      ...validInput,
      expiryDate: '15/06/2025',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null expiryDate', () => {
    const result = createTrainingRecordSchema.safeParse({
      ...validInput,
      expiryDate: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects notes longer than 2000 characters', () => {
    const result = createTrainingRecordSchema.safeParse({
      ...validInput,
      notes: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateTrainingRecordSchema
// ---------------------------------------------------------------------------

describe('updateTrainingRecordSchema', () => {
  it('accepts partial updates', () => {
    const result = updateTrainingRecordSchema.safeParse({ provider: 'New Provider' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateTrainingRecordSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates field constraints on partial', () => {
    const result = updateTrainingRecordSchema.safeParse({ completedDate: 'not-a-date' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createQualificationSchema
// ---------------------------------------------------------------------------

describe('createQualificationSchema', () => {
  const validInput = {
    staffProfileId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Health & Social Care',
    level: 'Level 3 Diploma',
    status: 'working_towards' as const,
    targetDate: '2025-12-31',
  };

  it('accepts a valid qualification input', () => {
    const result = createQualificationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts completed qualification with date', () => {
    const result = createQualificationSchema.safeParse({
      ...validInput,
      status: 'completed',
      completedDate: '2024-06-01',
      targetDate: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects when name is empty', () => {
    const result = createQualificationSchema.safeParse({
      ...validInput,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects when level is empty', () => {
    const result = createQualificationSchema.safeParse({
      ...validInput,
      level: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = createQualificationSchema.safeParse({
      ...validInput,
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid qualification statuses', () => {
    for (const status of QUALIFICATION_STATUSES) {
      const result = createQualificationSchema.safeParse({ ...validInput, status });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// updateQualificationSchema
// ---------------------------------------------------------------------------

describe('updateQualificationSchema', () => {
  it('accepts partial updates', () => {
    const result = updateQualificationSchema.safeParse({ status: 'completed' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateQualificationSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeTrainingStatus
// ---------------------------------------------------------------------------

describe('computeTrainingStatus', () => {
  it('returns "current" when no expiry date', () => {
    expect(computeTrainingStatus(null)).toBe('current');
    expect(computeTrainingStatus(undefined)).toBe('current');
  });

  it('returns "current" for an expiry date > 30 days in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);
    const dateStr = futureDate.toISOString().slice(0, 10);
    expect(computeTrainingStatus(dateStr)).toBe('current');
  });

  it('returns "expiring_soon" for an expiry date within 30 days', () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 15);
    const dateStr = soonDate.toISOString().slice(0, 10);
    expect(computeTrainingStatus(dateStr)).toBe('expiring_soon');
  });

  it('returns "expiring_soon" for an expiry date exactly 30 days from now', () => {
    const exactDate = new Date();
    exactDate.setDate(exactDate.getDate() + 30);
    const dateStr = exactDate.toISOString().slice(0, 10);
    expect(computeTrainingStatus(dateStr)).toBe('expiring_soon');
  });

  it('returns "expired" for an expiry date in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const dateStr = pastDate.toISOString().slice(0, 10);
    expect(computeTrainingStatus(dateStr)).toBe('expired');
  });

  it('returns "expiring_soon" for today (expires today)', () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    expect(computeTrainingStatus(dateStr)).toBe('expiring_soon');
  });
});

// ---------------------------------------------------------------------------
// calculateExpiryDate
// ---------------------------------------------------------------------------

describe('calculateExpiryDate', () => {
  it('returns a date N months after the completed date', () => {
    expect(calculateExpiryDate('2024-01-15', 12)).toBe('2025-01-15');
  });

  it('handles 36-month validity', () => {
    expect(calculateExpiryDate('2024-03-01', 36)).toBe('2027-03-01');
  });

  it('handles year-end dates', () => {
    expect(calculateExpiryDate('2024-12-31', 12)).toBe('2025-12-31');
  });

  it('handles month overflow', () => {
    // January 31 + 1 month = March 2 or 3 (depending on leap year)
    const result = calculateExpiryDate('2024-01-31', 1);
    // Feb 2024 has 29 days (leap year), so March 2
    expect(result).toBe('2024-03-02');
  });
});

// ---------------------------------------------------------------------------
// Constants integrity
// ---------------------------------------------------------------------------

describe('Training constants', () => {
  it('TRAINING_CATEGORIES contains all expected categories', () => {
    expect(TRAINING_CATEGORIES).toEqual([
      'mandatory',
      'clinical',
      'specialist',
      'management',
      'other',
    ]);
  });

  it('TRAINING_CATEGORY_LABELS has labels for all categories', () => {
    for (const cat of TRAINING_CATEGORIES) {
      expect(TRAINING_CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it('TRAINING_STATUSES contains all expected statuses', () => {
    expect(TRAINING_STATUSES).toEqual([
      'current',
      'expiring_soon',
      'expired',
      'not_completed',
    ]);
  });

  it('TRAINING_STATUS_LABELS has labels for all statuses', () => {
    for (const status of TRAINING_STATUSES) {
      expect(TRAINING_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('QUALIFICATION_STATUSES contains both values', () => {
    expect(QUALIFICATION_STATUSES).toEqual(['completed', 'working_towards']);
  });

  it('QUALIFICATION_STATUS_LABELS has labels for all statuses', () => {
    for (const status of QUALIFICATION_STATUSES) {
      expect(QUALIFICATION_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it('QUALIFICATION_LEVELS contains expected diploma levels', () => {
    expect(QUALIFICATION_LEVELS.length).toBeGreaterThanOrEqual(4);
    expect(QUALIFICATION_LEVELS).toContain('Level 3 Diploma');
    expect(QUALIFICATION_LEVELS).toContain('Level 5 Diploma');
  });
});
