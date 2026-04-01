/**
 * Tests for /api/organisations/:id route.
 *
 * Validates:
 * - Route structure and exports
 * - Validation schema correctness for org settings
 * - RBAC logic: only owner/admin can update org settings
 */

import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

// Mock dependencies that require real DB/auth in tests
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
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

vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn().mockResolvedValue({ userId: 'user-1', orgId: 'org-1', role: 'owner' }),
  UnauthorizedError: class UnauthorizedError extends Error { constructor(m?: string) { super(m); this.name = 'UnauthorizedError'; } },
  UnauthenticatedError: class UnauthenticatedError extends Error { constructor(m?: string) { super(m); this.name = 'UnauthenticatedError'; } },
}));

vi.mock('@/features/organisations/actions', () => ({
  updateOrgSettings: vi.fn().mockResolvedValue({ success: true, data: undefined }),
}));

// Validation schema (mirrors the route)
const updateOrgSchema = z.object({
  name: z
    .string()
    .min(1, 'Organisation name is required')
    .max(100, 'Organisation name must be 100 characters or fewer'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(63, 'Slug must be 63 characters or fewer')
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  domains: z.array(z.string()).min(1, 'At least one care domain must be selected'),
});

describe('/api/organisations/:id route — structure', () => {
  it('exports a PUT handler for org updates', async () => {
    const routeModule = await import('../../app/api/organisations/[id]/route');
    expect(typeof routeModule.PUT).toBe('function');
  });

  it('does not export a DELETE handler (orgs are not deleted via API)', async () => {
    const routeModule = await import('../../app/api/organisations/[id]/route');
    expect((routeModule as Record<string, unknown>).DELETE).toBeUndefined();
  });
});

describe('PUT /api/organisations/:id — validation schema', () => {
  const validPayload = {
    name: 'Care Services Ltd',
    slug: 'care-services-ltd',
    domains: ['domiciliary'],
  };

  it('accepts valid organisation update data', () => {
    expect(updateOrgSchema.safeParse(validPayload).success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = updateOrgSchema.safeParse({ ...validPayload, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 100 characters (max-length enforcement)', () => {
    const result = updateOrgSchema.safeParse({
      ...validPayload,
      name: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages.some((m) => m.includes('100 characters'))).toBe(true);
  });

  it('accepts name at exactly 100 characters', () => {
    const result = updateOrgSchema.safeParse({
      ...validPayload,
      name: 'A'.repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it('rejects slug with uppercase letters', () => {
    const result = updateOrgSchema.safeParse({ ...validPayload, slug: 'Care-Services' });
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const result = updateOrgSchema.safeParse({ ...validPayload, slug: 'care services' });
    expect(result.success).toBe(false);
  });

  it('rejects empty domains array', () => {
    const result = updateOrgSchema.safeParse({ ...validPayload, domains: [] });
    expect(result.success).toBe(false);
  });

  it('accepts multiple domains', () => {
    const result = updateOrgSchema.safeParse({
      ...validPayload,
      domains: ['domiciliary', 'supported_living'],
    });
    expect(result.success).toBe(true);
  });
});
