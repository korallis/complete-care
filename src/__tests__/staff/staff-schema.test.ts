/**
 * Tests for the staff schema validation and status transition logic.
 *
 * Validates:
 * - createStaffSchema validation rules
 * - NI number regex
 * - Status transition rules
 * - getValidNextStatuses helper
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
  createStaffSchema,
  updateStaffSchema,
  updateStaffStatusSchema,
  isValidStatusTransition,
  getValidNextStatuses,
} from '@/features/staff/schema';

// ---------------------------------------------------------------------------
// createStaffSchema
// ---------------------------------------------------------------------------

describe('createStaffSchema', () => {
  it('accepts minimal valid staff (firstName, lastName, jobTitle)', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.contractType).toBe('full_time'); // default
    }
  });

  it('accepts a full staff record with all fields', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'Senior Care Worker',
      contractType: 'part_time',
      weeklyHours: 20,
      startDate: '2024-01-15',
      endDate: null,
      niNumber: 'AB 12 34 56 C',
      email: 'john@example.com',
      phone: '07700123456',
      emergencyContactName: 'Mary Doe',
      emergencyContactPhone: '07700654321',
      emergencyContactRelation: 'Spouse',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when firstName is empty', () => {
    const result = createStaffSchema.safeParse({
      firstName: '',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe('firstName');
    }
  });

  it('rejects when lastName is empty', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: '',
      jobTitle: 'Care Worker',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe('lastName');
    }
  });

  it('rejects when jobTitle is empty', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe('jobTitle');
    }
  });

  it('rejects firstName longer than 100 characters', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'A'.repeat(101),
      lastName: 'Smith',
      jobTitle: 'Care Worker',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid contract types', () => {
    for (const ct of ['full_time', 'part_time', 'zero_hours', 'agency', 'bank']) {
      const result = createStaffSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Smith',
        jobTitle: 'Care Worker',
        contractType: ct,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid contract type', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      contractType: 'freelance',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty string for email (transforms to null)', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      email: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeNull();
    }
  });

  it('rejects invalid start date format', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      startDate: '15-01-2024',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null for optional fields', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      weeklyHours: null,
      startDate: null,
      endDate: null,
      niNumber: null,
      email: null,
      phone: null,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// NI number validation
// ---------------------------------------------------------------------------

describe('NI number validation', () => {
  it('accepts valid NI with spaces: AB 12 34 56 C', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      niNumber: 'AB 12 34 56 C',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid NI without spaces: AB123456C', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      niNumber: 'AB123456C',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid NI with dashes: AB-12-34-56-C', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      niNumber: 'AB-12-34-56-C',
    });
    expect(result.success).toBe(true);
  });

  it('accepts lowercase NI: ab123456c', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      niNumber: 'ab123456c',
    });
    expect(result.success).toBe(true);
  });

  it('rejects NI with invalid suffix letter (E)', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      niNumber: 'AB123456E',
    });
    expect(result.success).toBe(false);
  });

  it('rejects NI with too few digits', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      niNumber: 'AB1234C',
    });
    expect(result.success).toBe(false);
  });

  it('rejects entirely numeric NI', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      niNumber: '1234567890',
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty string for NI (optional field)', () => {
    const result = createStaffSchema.safeParse({
      firstName: 'Jane',
      lastName: 'Smith',
      jobTitle: 'Care Worker',
      niNumber: '',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateStaffSchema
// ---------------------------------------------------------------------------

describe('updateStaffSchema', () => {
  it('accepts partial updates (just jobTitle)', () => {
    const result = updateStaffSchema.safeParse({
      jobTitle: 'Team Leader',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no fields to update)', () => {
    const result = updateStaffSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('still validates field constraints on partial', () => {
    const result = updateStaffSchema.safeParse({
      email: 'not-valid',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateStaffStatusSchema
// ---------------------------------------------------------------------------

describe('updateStaffStatusSchema', () => {
  it('accepts valid status', () => {
    const result = updateStaffStatusSchema.safeParse({
      status: 'suspended',
    });
    expect(result.success).toBe(true);
  });

  it('accepts status with reason', () => {
    const result = updateStaffStatusSchema.safeParse({
      status: 'terminated',
      reason: 'End of contract',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateStaffStatusSchema.safeParse({
      status: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('rejects reason longer than 500 chars', () => {
    const result = updateStaffStatusSchema.safeParse({
      status: 'suspended',
      reason: 'X'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Status transition rules
// ---------------------------------------------------------------------------

describe('isValidStatusTransition', () => {
  it('allows active -> suspended', () => {
    expect(isValidStatusTransition('active', 'suspended')).toBe(true);
  });

  it('allows active -> on_leave', () => {
    expect(isValidStatusTransition('active', 'on_leave')).toBe(true);
  });

  it('allows active -> terminated', () => {
    expect(isValidStatusTransition('active', 'terminated')).toBe(true);
  });

  it('allows suspended -> active', () => {
    expect(isValidStatusTransition('suspended', 'active')).toBe(true);
  });

  it('allows suspended -> terminated', () => {
    expect(isValidStatusTransition('suspended', 'terminated')).toBe(true);
  });

  it('allows on_leave -> active', () => {
    expect(isValidStatusTransition('on_leave', 'active')).toBe(true);
  });

  it('allows on_leave -> terminated', () => {
    expect(isValidStatusTransition('on_leave', 'terminated')).toBe(true);
  });

  it('rejects terminated -> any (terminal state)', () => {
    expect(isValidStatusTransition('terminated', 'active')).toBe(false);
    expect(isValidStatusTransition('terminated', 'suspended')).toBe(false);
    expect(isValidStatusTransition('terminated', 'on_leave')).toBe(false);
  });

  it('rejects same-status transition active -> active', () => {
    expect(isValidStatusTransition('active', 'active')).toBe(false);
  });

  it('rejects suspended -> on_leave (must go back to active first)', () => {
    expect(isValidStatusTransition('suspended', 'on_leave')).toBe(false);
  });

  it('returns false for unknown status', () => {
    expect(isValidStatusTransition('unknown', 'active')).toBe(false);
  });
});

describe('getValidNextStatuses', () => {
  it('returns [suspended, on_leave, terminated] for active', () => {
    expect(getValidNextStatuses('active')).toEqual([
      'suspended',
      'on_leave',
      'terminated',
    ]);
  });

  it('returns [active, terminated] for suspended', () => {
    expect(getValidNextStatuses('suspended')).toEqual([
      'active',
      'terminated',
    ]);
  });

  it('returns [active, terminated] for on_leave', () => {
    expect(getValidNextStatuses('on_leave')).toEqual([
      'active',
      'terminated',
    ]);
  });

  it('returns [] for terminated', () => {
    expect(getValidNextStatuses('terminated')).toEqual([]);
  });

  it('returns [] for unknown status', () => {
    expect(getValidNextStatuses('unknown')).toEqual([]);
  });
});
