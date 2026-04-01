/**
 * Tests for person management API routes and RBAC.
 *
 * Validates:
 * - persons schema has all required columns
 * - RBAC permissions for persons resource
 * - Domain-aware terminology utilities
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

import { persons } from '@/lib/db/schema/persons';
import { hasPermission } from '@/lib/rbac/permissions';
import { getPersonTerminology } from '@/features/persons/utils';

// ---------------------------------------------------------------------------
// Schema structure
// ---------------------------------------------------------------------------

describe('persons table schema', () => {
  it('has all required demographic columns', () => {
    const columns = Object.keys(persons);
    expect(columns).toContain('firstName');
    expect(columns).toContain('lastName');
    expect(columns).toContain('preferredName');
    expect(columns).toContain('dateOfBirth');
    expect(columns).toContain('gender');
    expect(columns).toContain('ethnicity');
    expect(columns).toContain('religion');
    expect(columns).toContain('firstLanguage');
  });

  it('has all required medical columns', () => {
    const columns = Object.keys(persons);
    expect(columns).toContain('nhsNumber');
    expect(columns).toContain('gpName');
    expect(columns).toContain('gpPractice');
    expect(columns).toContain('allergies');
    expect(columns).toContain('medicalConditions');
  });

  it('has emergency contacts column', () => {
    const columns = Object.keys(persons);
    expect(columns).toContain('emergencyContacts');
  });

  it('has photo URL column', () => {
    const columns = Object.keys(persons);
    expect(columns).toContain('photoUrl');
  });

  it('has tenant isolation column', () => {
    const columns = Object.keys(persons);
    expect(columns).toContain('organisationId');
  });

  it('has lifecycle columns', () => {
    const columns = Object.keys(persons);
    expect(columns).toContain('status');
    expect(columns).toContain('deletedAt');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has type discriminator column', () => {
    const columns = Object.keys(persons);
    expect(columns).toContain('type');
    expect(columns).toContain('fullName');
  });
});

// ---------------------------------------------------------------------------
// RBAC for persons
// ---------------------------------------------------------------------------

describe('RBAC — persons resource', () => {
  // Create permissions
  it('owner can create persons', () => {
    expect(hasPermission('owner', 'create', 'persons')).toBe(true);
  });

  it('admin can create persons', () => {
    expect(hasPermission('admin', 'create', 'persons')).toBe(true);
  });

  it('manager can create persons', () => {
    expect(hasPermission('manager', 'create', 'persons')).toBe(true);
  });

  it('senior_carer can create persons', () => {
    expect(hasPermission('senior_carer', 'create', 'persons')).toBe(true);
  });

  it('carer CANNOT create persons', () => {
    expect(hasPermission('carer', 'create', 'persons')).toBe(false);
  });

  it('viewer CANNOT create persons', () => {
    expect(hasPermission('viewer', 'create', 'persons')).toBe(false);
  });

  // Read permissions
  it('all roles can read persons', () => {
    for (const role of ['owner', 'admin', 'manager', 'senior_carer', 'carer', 'viewer'] as const) {
      expect(hasPermission(role, 'read', 'persons')).toBe(true);
    }
  });

  // Update permissions
  it('owner can update persons', () => {
    expect(hasPermission('owner', 'update', 'persons')).toBe(true);
  });

  it('senior_carer can update persons', () => {
    expect(hasPermission('senior_carer', 'update', 'persons')).toBe(true);
  });

  it('carer CANNOT update persons', () => {
    expect(hasPermission('carer', 'update', 'persons')).toBe(false);
  });

  it('viewer CANNOT update persons', () => {
    expect(hasPermission('viewer', 'update', 'persons')).toBe(false);
  });

  // Delete permissions (owner/admin only)
  it('owner can delete persons', () => {
    expect(hasPermission('owner', 'delete', 'persons')).toBe(true);
  });

  it('admin can delete persons', () => {
    expect(hasPermission('admin', 'delete', 'persons')).toBe(true);
  });

  it('manager CANNOT delete persons', () => {
    expect(hasPermission('manager', 'delete', 'persons')).toBe(false);
  });

  it('senior_carer CANNOT delete persons', () => {
    expect(hasPermission('senior_carer', 'delete', 'persons')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Domain-aware terminology (comprehensive)
// ---------------------------------------------------------------------------

describe('domain-aware terminology — edge cases', () => {
  it('handles multiple domains — childrens_residential takes priority', () => {
    const t = getPersonTerminology(['domiciliary', 'supported_living', 'childrens_residential']);
    expect(t.singular).toBe('Young Person');
  });

  it('handles unknown domain gracefully', () => {
    const t = getPersonTerminology(['unknown_domain']);
    expect(t.singular).toBe('Person'); // falls back to default
  });

  it('terminology is consistent: singular/plural match', () => {
    const domains = [
      ['domiciliary'],
      ['supported_living'],
      ['childrens_residential'],
    ];
    for (const d of domains) {
      const t = getPersonTerminology(d);
      expect(t.singularLower).toBe(t.singular.toLowerCase());
      expect(t.pluralLower).toBe(t.plural.toLowerCase());
    }
  });
});
