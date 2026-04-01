/**
 * Tests for the persons schema and domain-aware terminology.
 *
 * Validates:
 * - createPersonSchema validation rules
 * - getPersonTerminology returns correct labels per domain
 * - getDefaultPersonType returns correct type per domain
 * - calculateAge and formatNhsNumber utility functions
 */

import { describe, it, expect, vi } from 'vitest';

// Mock DB dependencies - tests focus on pure logic, no DB calls needed
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

import { createPersonSchema } from '@/features/persons/schema';
import { getPersonTerminology, getDefaultPersonType } from '@/features/persons/utils';
import { calculateAge, formatNhsNumber, getInitials } from '@/features/persons/utils';

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe('createPersonSchema', () => {
  it('accepts a minimal valid person (firstName, lastName only)', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('resident'); // default
      expect(result.data.allergies).toEqual([]);
      expect(result.data.emergencyContacts).toEqual([]);
    }
  });

  it('accepts a full person record with all fields', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Bob',
      lastName: 'Jones',
      preferredName: 'Bobby',
      type: 'client',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      ethnicity: 'White — British',
      religion: 'None',
      firstLanguage: 'English',
      nhsNumber: '1234567890',
      gpName: 'Dr. Smith',
      gpPractice: 'City Medical',
      allergies: ['Penicillin', 'Latex'],
      medicalConditions: ['Diabetes type 2'],
      contactPhone: '07700123456',
      contactEmail: 'bob@example.com',
      address: '123 High Street, London',
      emergencyContacts: [
        {
          id: 'ec-1',
          name: 'Jane Jones',
          relationship: 'Wife',
          phone: '07700654321',
          priority: 1,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects when firstName is empty', () => {
    const result = createPersonSchema.safeParse({
      firstName: '',
      lastName: 'Smith',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe('firstName');
    }
  });

  it('rejects when lastName is empty', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Alice',
      lastName: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe('lastName');
    }
  });

  it('rejects firstName longer than 100 characters', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'A'.repeat(101),
      lastName: 'Smith',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date of birth format', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
      dateOfBirth: '15-01-1990', // wrong format
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe('dateOfBirth');
    }
  });

  it('accepts null dateOfBirth', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
      dateOfBirth: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid NHS number (with letters)', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
      nhsNumber: 'ABCDE12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path[0]).toBe('nhsNumber');
    }
  });

  it('accepts valid NHS number with spaces', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
      nhsNumber: '123 456 7890',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type enum', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
      type: 'unknown_type',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid type values', () => {
    for (const type of ['resident', 'client', 'young_person']) {
      const result = createPersonSchema.safeParse({
        firstName: 'Alice',
        lastName: 'Smith',
        type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid contact email', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
      contactEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null for optional contact fields', () => {
    const result = createPersonSchema.safeParse({
      firstName: 'Alice',
      lastName: 'Smith',
      contactPhone: null,
      contactEmail: null,
      address: null,
      nhsNumber: null,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Domain-aware terminology
// ---------------------------------------------------------------------------

describe('getPersonTerminology', () => {
  it('returns Client for domiciliary care', () => {
    const t = getPersonTerminology(['domiciliary']);
    expect(t.singular).toBe('Client');
    expect(t.plural).toBe('Clients');
    expect(t.singularLower).toBe('client');
    expect(t.pluralLower).toBe('clients');
  });

  it('returns Young Person for childrens_residential', () => {
    const t = getPersonTerminology(['childrens_residential']);
    expect(t.singular).toBe('Young Person');
    expect(t.plural).toBe('Young People');
  });

  it('childrens_residential takes priority over domiciliary', () => {
    const t = getPersonTerminology(['domiciliary', 'childrens_residential']);
    expect(t.singular).toBe('Young Person');
  });

  it('returns Person for supported_living', () => {
    const t = getPersonTerminology(['supported_living']);
    expect(t.singular).toBe('Person');
    expect(t.plural).toBe('People');
  });

  it('returns Person as default for empty domains', () => {
    const t = getPersonTerminology([]);
    expect(t.singular).toBe('Person');
  });
});

// ---------------------------------------------------------------------------
// Default person type
// ---------------------------------------------------------------------------

describe('getDefaultPersonType', () => {
  it('returns young_person for childrens_residential', () => {
    expect(getDefaultPersonType(['childrens_residential'])).toBe('young_person');
  });

  it('returns client for domiciliary', () => {
    expect(getDefaultPersonType(['domiciliary'])).toBe('client');
  });

  it('returns resident for supported_living', () => {
    expect(getDefaultPersonType(['supported_living'])).toBe('resident');
  });

  it('returns resident as default for empty domains', () => {
    expect(getDefaultPersonType([])).toBe('resident');
  });

  it('prioritises childrens_residential over domiciliary', () => {
    expect(getDefaultPersonType(['domiciliary', 'childrens_residential'])).toBe('young_person');
  });
});

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

describe('calculateAge', () => {
  it('returns null for null/undefined input', () => {
    expect(calculateAge(null)).toBeNull();
    expect(calculateAge(undefined)).toBeNull();
  });

  it('returns null for invalid date', () => {
    expect(calculateAge('not-a-date')).toBeNull();
  });

  it('calculates age correctly', () => {
    // Use a fixed date for testing — 40 years ago today
    const today = new Date();
    const dob = new Date(today.getFullYear() - 40, today.getMonth(), today.getDate());
    const dobStr = dob.toISOString().split('T')[0]!;
    expect(calculateAge(dobStr)).toBe(40);
  });

  it('does not count birthday if not yet occurred this year', () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const dob = new Date(today.getFullYear() - 30, nextMonth.getMonth(), nextMonth.getDate());
    const dobStr = dob.toISOString().split('T')[0]!;
    expect(calculateAge(dobStr)).toBe(29);
  });
});

describe('formatNhsNumber', () => {
  it('returns — for null/undefined', () => {
    expect(formatNhsNumber(null)).toBe('—');
    expect(formatNhsNumber(undefined)).toBe('—');
  });

  it('formats a 10-digit number with spaces', () => {
    expect(formatNhsNumber('1234567890')).toBe('123 456 7890');
  });

  it('formats a number that already has spaces', () => {
    expect(formatNhsNumber('123 456 7890')).toBe('123 456 7890');
  });

  it('returns raw value for non-10-digit numbers', () => {
    expect(formatNhsNumber('12345')).toBe('12345');
  });
});

describe('getInitials', () => {
  it('returns first letter for single word', () => {
    expect(getInitials('Alice')).toBe('A');
  });

  it('returns first and last letter for multi-word name', () => {
    expect(getInitials('Alice Smith')).toBe('AS');
  });

  it('returns first and last initials for three-word name', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MW');
  });

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('handles multiple spaces', () => {
    expect(getInitials('  Alice   Smith  ')).toBe('AS');
  });
});
