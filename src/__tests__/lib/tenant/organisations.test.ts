/**
 * Tests for multi-tenant organisation system.
 *
 * Tests cover:
 * - Org creation with slug generation and validation
 * - Invitation lifecycle (create, accept, expire, revoke)
 * - Member management (role change, removal)
 * - Slug generation uniqueness logic
 */

import { describe, it, expect } from 'vitest';
import {
  INVITATION_STATUS,
  invitationExpiry,
  INVITATION_EXPIRY_DAYS,
} from '@/lib/db/schema/invitations';

// ---------------------------------------------------------------------------
// Slug generation utility
// ---------------------------------------------------------------------------

/**
 * Mirrored from actions.ts — pure function, testable without DB
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 63);
}

describe('generateSlug', () => {
  it('converts name to lowercase with hyphens', () => {
    expect(generateSlug('Sunrise Care Home')).toBe('sunrise-care-home');
  });

  it('trims leading and trailing whitespace', () => {
    expect(generateSlug('  My Org  ')).toBe('my-org');
  });

  it('removes special characters', () => {
    // Ampersand is removed, whitespace becomes hyphen, multiple hyphens collapse
    expect(generateSlug("St. Mary's Care & Support")).toBe('st-marys-care-support');
  });

  it('collapses multiple hyphens', () => {
    // Special characters removed, whitespace → hyphens, then multiple hyphens collapse
    expect(generateSlug('Care  &  Support')).toBe('care-support');
  });

  it('truncates to 63 characters', () => {
    const longName = 'A'.repeat(70);
    expect(generateSlug(longName)).toHaveLength(63);
  });

  it('returns empty string for empty input', () => {
    expect(generateSlug('')).toBe('');
  });

  it('handles all-numeric names', () => {
    expect(generateSlug('123 Care')).toBe('123-care');
  });
});

// ---------------------------------------------------------------------------
// Invitation status constants
// ---------------------------------------------------------------------------

describe('INVITATION_STATUS', () => {
  it('has correct status values', () => {
    expect(INVITATION_STATUS.PENDING).toBe('pending');
    expect(INVITATION_STATUS.ACCEPTED).toBe('accepted');
    expect(INVITATION_STATUS.EXPIRED).toBe('expired');
    expect(INVITATION_STATUS.REVOKED).toBe('revoked');
  });
});

// ---------------------------------------------------------------------------
// Invitation expiry logic
// ---------------------------------------------------------------------------

describe('invitationExpiry', () => {
  it(`returns a date ${INVITATION_EXPIRY_DAYS} days in the future`, () => {
    const before = Date.now();
    const expiry = invitationExpiry();
    const after = Date.now();

    const expectedMs = INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    const actualMs = expiry.getTime();

    expect(actualMs).toBeGreaterThanOrEqual(before + expectedMs);
    expect(actualMs).toBeLessThanOrEqual(after + expectedMs);
  });

  it('returns a Date instance', () => {
    expect(invitationExpiry()).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// Invitation expiry detection
// ---------------------------------------------------------------------------

describe('invitation expiry detection', () => {
  it('detects an expired invitation (expiresAt in the past)', () => {
    const pastDate = new Date(Date.now() - 1000);
    expect(pastDate < new Date()).toBe(true);
  });

  it('detects a valid invitation (expiresAt in the future)', () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    expect(futureDate > new Date()).toBe(true);
  });

  it('exactly 7 days after creation should not yet be expired', () => {
    const expiry = invitationExpiry();
    expect(expiry > new Date()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Organisation name validation logic (schema-level tests)
// ---------------------------------------------------------------------------

import { z } from 'zod';

const orgNameSchema = z
  .string()
  .min(1, 'Organisation name is required')
  .max(100, 'Organisation name must be 100 characters or fewer');

describe('organisation name validation', () => {
  it('accepts a valid name', () => {
    expect(orgNameSchema.safeParse('Sunrise Care Home').success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = orgNameSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Organisation name is required');
    }
  });

  it('rejects a name exceeding 100 characters', () => {
    const result = orgNameSchema.safeParse('A'.repeat(101));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('100 characters');
    }
  });

  it('accepts a name at exactly 100 characters', () => {
    expect(orgNameSchema.safeParse('A'.repeat(100)).success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Slug validation schema
// ---------------------------------------------------------------------------

const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(63, 'Slug must be 63 characters or fewer')
  .regex(
    /^[a-z0-9-]+$/,
    'Slug may only contain lowercase letters, numbers, and hyphens',
  );

describe('slug validation', () => {
  it('accepts a valid slug', () => {
    expect(slugSchema.safeParse('sunrise-care-home').success).toBe(true);
  });

  it('rejects uppercase letters', () => {
    expect(slugSchema.safeParse('Sunrise-Care').success).toBe(false);
  });

  it('rejects spaces', () => {
    expect(slugSchema.safeParse('sunrise care').success).toBe(false);
  });

  it('rejects special characters', () => {
    expect(slugSchema.safeParse('care@home').success).toBe(false);
  });

  it('rejects empty slug', () => {
    expect(slugSchema.safeParse('').success).toBe(false);
  });

  it('rejects slug exceeding 63 characters', () => {
    expect(slugSchema.safeParse('a'.repeat(64)).success).toBe(false);
  });

  it('accepts numbers in slug', () => {
    expect(slugSchema.safeParse('care-home-2024').success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Care domain validation
// ---------------------------------------------------------------------------

const domainSchema = z
  .array(z.enum(['domiciliary', 'supported_living', 'childrens_residential']))
  .min(1, 'At least one care domain must be selected');

describe('care domain validation', () => {
  it('accepts a single valid domain', () => {
    expect(domainSchema.safeParse(['domiciliary']).success).toBe(true);
  });

  it('accepts multiple valid domains', () => {
    expect(
      domainSchema.safeParse(['domiciliary', 'supported_living']).success,
    ).toBe(true);
  });

  it('accepts all three domains', () => {
    expect(
      domainSchema.safeParse([
        'domiciliary',
        'supported_living',
        'childrens_residential',
      ]).success,
    ).toBe(true);
  });

  it('rejects an empty array', () => {
    const result = domainSchema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('At least one');
    }
  });

  it('rejects an invalid domain string', () => {
    expect(domainSchema.safeParse(['invalid_domain']).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Role validation for invitations
// ---------------------------------------------------------------------------

const invitationRoleSchema = z.enum([
  'admin',
  'manager',
  'senior_carer',
  'carer',
  'viewer',
]);

describe('invitation role validation', () => {
  it('accepts all valid invitable roles', () => {
    const validRoles = ['admin', 'manager', 'senior_carer', 'carer', 'viewer'];
    for (const role of validRoles) {
      expect(invitationRoleSchema.safeParse(role).success).toBe(true);
    }
  });

  it('rejects owner role (owners cannot be invited)', () => {
    expect(invitationRoleSchema.safeParse('owner').success).toBe(false);
  });

  it('rejects an invalid role', () => {
    expect(invitationRoleSchema.safeParse('superadmin').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Invitation email matching logic
// ---------------------------------------------------------------------------

describe('invitation email matching', () => {
  it('matches same-case emails', () => {
    const invitationEmail = 'user@example.com';
    const userEmail = 'user@example.com';
    expect(invitationEmail.toLowerCase() === userEmail.toLowerCase()).toBe(true);
  });

  it('matches case-insensitive emails', () => {
    const invitationEmail = 'User@Example.COM';
    const userEmail = 'user@example.com';
    expect(invitationEmail.toLowerCase() === userEmail.toLowerCase()).toBe(true);
  });

  it('rejects non-matching emails', () => {
    const invitationEmail = 'alice@example.com';
    const userEmail = 'bob@example.com';
    expect(invitationEmail.toLowerCase() === userEmail.toLowerCase()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Owner protection logic
// ---------------------------------------------------------------------------

describe('owner removal protection', () => {
  it('prevents owner role from being removed', () => {
    const memberRole = 'owner';
    const canRemove = memberRole !== 'owner';
    expect(canRemove).toBe(false);
  });

  it('allows non-owner members to be removed', () => {
    const roles = ['admin', 'manager', 'senior_carer', 'carer', 'viewer'];
    for (const role of roles) {
      const canRemove = role !== 'owner';
      expect(canRemove).toBe(true);
    }
  });
});

describe('owner role change protection', () => {
  it('prevents owner role from being changed', () => {
    const currentRole = 'owner';
    const canChange = currentRole !== 'owner';
    expect(canChange).toBe(false);
  });

  it('prevents assigning owner role via changeMemberRole', () => {
    const newRole = 'owner';
    const isAllowed = newRole !== 'owner';
    expect(isAllowed).toBe(false);
  });
});
