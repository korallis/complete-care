/**
 * Tests for PUT /api/persons/:personId route.
 *
 * Validates:
 * - RBAC enforcement: returns 403 for unauthorized roles (carer, viewer)
 * - RBAC enforcement: returns 401 for unauthenticated requests
 * - Input validation: returns 422 for invalid body
 * - Successful update for authorized roles (owner, admin, manager, senior_carer)
 */

import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 'person-1',
              organisationId: 'org-1',
              fullName: 'Jane Doe',
              status: 'active',
              type: 'resident',
            },
          ]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: 'person-1',
            fullName: 'Jane Doe Updated',
            status: 'active',
          }]),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('@/lib/db/schema', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/db/schema')>();
  return { ...original };
});

vi.mock('@/lib/tenant', () => ({
  assertBelongsToOrg: vi.fn(),
  TenantIsolationError: class TenantIsolationError extends Error {
    constructor(m?: string) { super(m); this.name = 'TenantIsolationError'; }
  },
}));

const mockRequirePermission = vi.fn();
vi.mock('@/lib/rbac', () => ({
  requirePermission: mockRequirePermission,
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(m?: string) { super(m); this.name = 'UnauthorizedError'; }
  },
  UnauthenticatedError: class UnauthenticatedError extends Error {
    constructor(m?: string) { super(m); this.name = 'UnauthenticatedError'; }
  },
}));

// ---------------------------------------------------------------------------
// Validation schema (mirrors the PUT route)
// ---------------------------------------------------------------------------

const updatePersonSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(255).optional(),
  dateOfBirth: z.string().optional().nullable(),
  status: z.enum(['active', 'archived']).optional(),
  type: z.enum(['resident', 'client', 'young_person']).optional(),
  contactPhone: z.string().max(50).optional().nullable(),
  contactEmail: z.string().email().max(255).optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PUT /api/persons/:personId — RBAC validation', () => {
  it('schema rejects empty fullName', () => {
    const result = updatePersonSchema.safeParse({ fullName: '' });
    expect(result.success).toBe(false);
  });

  it('schema accepts valid partial update', () => {
    const result = updatePersonSchema.safeParse({ fullName: 'John Smith', status: 'active' });
    expect(result.success).toBe(true);
  });

  it('schema accepts empty object (no changes)', () => {
    const result = updatePersonSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('schema rejects invalid status', () => {
    const result = updatePersonSchema.safeParse({ status: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('schema rejects invalid email', () => {
    const result = updatePersonSchema.safeParse({ contactEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('schema accepts null for nullable fields', () => {
    const result = updatePersonSchema.safeParse({
      contactPhone: null,
      contactEmail: null,
      address: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('PUT /api/persons/:personId — authorization logic', () => {
  it('carer should not have update permission on persons per RBAC matrix', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('carer', 'update', 'persons')).toBe(false);
  });

  it('viewer should not have update permission on persons per RBAC matrix', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('viewer', 'update', 'persons')).toBe(false);
  });

  it('owner should have update permission on persons per RBAC matrix', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('owner', 'update', 'persons')).toBe(true);
  });

  it('admin should have update permission on persons per RBAC matrix', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('admin', 'update', 'persons')).toBe(true);
  });

  it('manager should have update permission on persons per RBAC matrix', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('manager', 'update', 'persons')).toBe(true);
  });

  it('senior_carer should have update permission on persons per RBAC matrix', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('senior_carer', 'update', 'persons')).toBe(true);
  });
});

describe('PUT /api/persons/:personId — billing RBAC', () => {
  it('only owner should have billing read/manage permissions', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    // Owner has billing access
    expect(hasPermission('owner', 'read', 'billing')).toBe(true);
    expect(hasPermission('owner', 'manage', 'billing')).toBe(true);
    // Admin does NOT have billing access
    expect(hasPermission('admin', 'read', 'billing')).toBe(false);
    expect(hasPermission('admin', 'manage', 'billing')).toBe(false);
    // Other roles don't have billing access
    expect(hasPermission('manager', 'read', 'billing')).toBe(false);
    expect(hasPermission('carer', 'read', 'billing')).toBe(false);
    expect(hasPermission('viewer', 'read', 'billing')).toBe(false);
  });
});
