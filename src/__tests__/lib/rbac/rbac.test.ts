/**
 * RBAC System Tests
 *
 * Covers:
 * - Permission matrix correctness (owner has all, viewer has read-only)
 * - hasPermission() for all 6 roles
 * - Role hierarchy enforcement (carer cannot access admin features)
 * - Navigation items per role
 * - getNavItems() returns appropriate items per role
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  PERMISSIONS,
  ROLES,
  ROLE_HIERARCHY,
  type Role,
  type Action,
  type Resource,
} from '@/lib/rbac/permissions';
import { getNavItems, NAV_ITEMS_BY_ROLE } from '@/lib/rbac/nav-items';

// ---------------------------------------------------------------------------
// hasPermission — core permission checks
// ---------------------------------------------------------------------------

describe('hasPermission', () => {
  // -------------------------------------------------------------------------
  // Owner — should have all permissions
  // -------------------------------------------------------------------------
  describe('owner', () => {
    it('can read persons', () => {
      expect(hasPermission('owner', 'read', 'persons')).toBe(true);
    });

    it('can delete persons', () => {
      expect(hasPermission('owner', 'delete', 'persons')).toBe(true);
    });

    it('can manage billing', () => {
      expect(hasPermission('owner', 'manage', 'billing')).toBe(true);
    });

    it('can manage organisation settings', () => {
      expect(hasPermission('owner', 'manage', 'organisation')).toBe(true);
    });

    it('can manage users (team management)', () => {
      expect(hasPermission('owner', 'manage', 'users')).toBe(true);
    });

    it('can delete users', () => {
      expect(hasPermission('owner', 'delete', 'users')).toBe(true);
    });

    it('can export audit logs', () => {
      expect(hasPermission('owner', 'export', 'audit_logs')).toBe(true);
    });

    it('can manage settings', () => {
      expect(hasPermission('owner', 'manage', 'settings')).toBe(true);
    });

    it('can approve care plans', () => {
      expect(hasPermission('owner', 'approve', 'care_plans')).toBe(true);
    });

    it('can approve medications', () => {
      expect(hasPermission('owner', 'approve', 'medications')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Admin — all except billing management
  // -------------------------------------------------------------------------
  describe('admin', () => {
    it('can read persons', () => {
      expect(hasPermission('admin', 'read', 'persons')).toBe(true);
    });

    it('can delete persons', () => {
      expect(hasPermission('admin', 'delete', 'persons')).toBe(true);
    });

    it('cannot manage billing (owner only)', () => {
      expect(hasPermission('admin', 'manage', 'billing')).toBe(false);
    });

    it('cannot read billing', () => {
      expect(hasPermission('admin', 'read', 'billing')).toBe(false);
    });

    it('can manage organisation settings', () => {
      expect(hasPermission('admin', 'manage', 'organisation')).toBe(true);
    });

    it('can manage users', () => {
      expect(hasPermission('admin', 'manage', 'users')).toBe(true);
    });

    it('can manage settings', () => {
      expect(hasPermission('admin', 'manage', 'settings')).toBe(true);
    });

    it('can approve care plans', () => {
      expect(hasPermission('admin', 'approve', 'care_plans')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Manager — clinical + staff, no admin
  // -------------------------------------------------------------------------
  describe('manager', () => {
    it('can read persons', () => {
      expect(hasPermission('manager', 'read', 'persons')).toBe(true);
    });

    it('can create persons', () => {
      expect(hasPermission('manager', 'create', 'persons')).toBe(true);
    });

    it('cannot delete persons', () => {
      expect(hasPermission('manager', 'delete', 'persons')).toBe(false);
    });

    it('can approve care plans', () => {
      expect(hasPermission('manager', 'approve', 'care_plans')).toBe(true);
    });

    it('cannot manage billing', () => {
      expect(hasPermission('manager', 'manage', 'billing')).toBe(false);
    });

    it('cannot manage users', () => {
      expect(hasPermission('manager', 'manage', 'users')).toBe(false);
    });

    it('cannot manage organisation', () => {
      expect(hasPermission('manager', 'manage', 'organisation')).toBe(false);
    });

    it('can read settings', () => {
      expect(hasPermission('manager', 'read', 'settings')).toBe(true);
    });

    it('cannot manage settings', () => {
      expect(hasPermission('manager', 'manage', 'settings')).toBe(false);
    });

    it('can manage rota', () => {
      expect(hasPermission('manager', 'manage', 'rota')).toBe(true);
    });

    it('can export reports', () => {
      expect(hasPermission('manager', 'export', 'reports')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Senior Carer — full clinical, elevated notes approval
  // -------------------------------------------------------------------------
  describe('senior_carer', () => {
    it('can read persons', () => {
      expect(hasPermission('senior_carer', 'read', 'persons')).toBe(true);
    });

    it('can create care plans', () => {
      expect(hasPermission('senior_carer', 'create', 'care_plans')).toBe(true);
    });

    it('can approve notes', () => {
      expect(hasPermission('senior_carer', 'approve', 'notes')).toBe(true);
    });

    it('cannot delete care plans', () => {
      expect(hasPermission('senior_carer', 'delete', 'care_plans')).toBe(false);
    });

    it('cannot manage users', () => {
      expect(hasPermission('senior_carer', 'manage', 'users')).toBe(false);
    });

    it('cannot manage billing', () => {
      expect(hasPermission('senior_carer', 'manage', 'billing')).toBe(false);
    });

    it('cannot manage settings', () => {
      expect(hasPermission('senior_carer', 'manage', 'settings')).toBe(false);
    });

    it('cannot manage organisation', () => {
      expect(hasPermission('senior_carer', 'manage', 'organisation')).toBe(false);
    });

    it('can create medications', () => {
      expect(hasPermission('senior_carer', 'create', 'medications')).toBe(true);
    });

    it('can read staff records', () => {
      expect(hasPermission('senior_carer', 'read', 'staff')).toBe(true);
    });

    it('cannot delete staff records', () => {
      expect(hasPermission('senior_carer', 'delete', 'staff')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Carer — daily tasks, notes, assigned persons (read)
  // -------------------------------------------------------------------------
  describe('carer', () => {
    it('can read persons', () => {
      expect(hasPermission('carer', 'read', 'persons')).toBe(true);
    });

    it('cannot create persons', () => {
      expect(hasPermission('carer', 'create', 'persons')).toBe(false);
    });

    it('can create notes', () => {
      expect(hasPermission('carer', 'create', 'notes')).toBe(true);
    });

    it('cannot update notes (only create)', () => {
      expect(hasPermission('carer', 'update', 'notes')).toBe(false);
    });

    it('cannot approve care plans', () => {
      expect(hasPermission('carer', 'approve', 'care_plans')).toBe(false);
    });

    it('can read staff records (read-only)', () => {
      expect(hasPermission('carer', 'read', 'staff')).toBe(true);
    });

    it('cannot create staff records', () => {
      expect(hasPermission('carer', 'create', 'staff')).toBe(false);
    });

    it('cannot manage rota', () => {
      expect(hasPermission('carer', 'manage', 'rota')).toBe(false);
    });

    it('cannot access compliance', () => {
      expect(hasPermission('carer', 'read', 'compliance')).toBe(false);
    });

    it('cannot access reports', () => {
      expect(hasPermission('carer', 'read', 'reports')).toBe(false);
    });

    it('cannot access billing', () => {
      expect(hasPermission('carer', 'manage', 'billing')).toBe(false);
    });

    it('cannot access organisation settings', () => {
      expect(hasPermission('carer', 'manage', 'organisation')).toBe(false);
    });

    it('can create incidents', () => {
      expect(hasPermission('carer', 'create', 'incidents')).toBe(true);
    });

    it('can create documents', () => {
      expect(hasPermission('carer', 'create', 'documents')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Viewer — read-only access
  // -------------------------------------------------------------------------
  describe('viewer', () => {
    it('can read persons', () => {
      expect(hasPermission('viewer', 'read', 'persons')).toBe(true);
    });

    it('can read care plans', () => {
      expect(hasPermission('viewer', 'read', 'care_plans')).toBe(true);
    });

    it('can read notes', () => {
      expect(hasPermission('viewer', 'read', 'notes')).toBe(true);
    });

    it('cannot create persons', () => {
      expect(hasPermission('viewer', 'create', 'persons')).toBe(false);
    });

    it('cannot create notes', () => {
      expect(hasPermission('viewer', 'create', 'notes')).toBe(false);
    });

    it('cannot update anything', () => {
      const resources: Resource[] = [
        'persons',
        'care_plans',
        'notes',
        'assessments',
        'medications',
      ];
      resources.forEach((resource) => {
        expect(hasPermission('viewer', 'update', resource)).toBe(false);
      });
    });

    it('cannot delete anything', () => {
      const resources: Resource[] = [
        'persons',
        'care_plans',
        'notes',
        'staff',
        'users',
      ];
      resources.forEach((resource) => {
        expect(hasPermission('viewer', 'delete', resource)).toBe(false);
      });
    });

    it('can read staff records (read-only)', () => {
      expect(hasPermission('viewer', 'read', 'staff')).toBe(true);
    });

    it('cannot create staff records', () => {
      expect(hasPermission('viewer', 'create', 'staff')).toBe(false);
    });

    it('cannot manage billing', () => {
      expect(hasPermission('viewer', 'manage', 'billing')).toBe(false);
    });

    it('can read reports', () => {
      expect(hasPermission('viewer', 'read', 'reports')).toBe(true);
    });

    it('cannot manage organisation', () => {
      expect(hasPermission('viewer', 'manage', 'organisation')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('returns false for unknown role', () => {
      expect(hasPermission('unknown' as Role, 'read', 'persons')).toBe(false);
    });

    it('returns false for empty resource permissions', () => {
      // Carer has no staff permissions
      expect(hasPermission('carer', 'read', 'users')).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Role hierarchy
// ---------------------------------------------------------------------------

describe('ROLE_HIERARCHY', () => {
  it('owner has the highest privilege level', () => {
    const ownerLevel = ROLE_HIERARCHY['owner'];
    ROLES.forEach((role) => {
      if (role !== 'owner') {
        expect(ownerLevel).toBeGreaterThan(ROLE_HIERARCHY[role]);
      }
    });
  });

  it('viewer has the lowest privilege level', () => {
    const viewerLevel = ROLE_HIERARCHY['viewer'];
    ROLES.forEach((role) => {
      if (role !== 'viewer') {
        expect(ROLE_HIERARCHY[role]).toBeGreaterThan(viewerLevel);
      }
    });
  });

  it('hierarchy order: owner > admin > manager > senior_carer > carer > viewer', () => {
    expect(ROLE_HIERARCHY['owner']).toBeGreaterThan(ROLE_HIERARCHY['admin']);
    expect(ROLE_HIERARCHY['admin']).toBeGreaterThan(ROLE_HIERARCHY['manager']);
    expect(ROLE_HIERARCHY['manager']).toBeGreaterThan(ROLE_HIERARCHY['senior_carer']);
    expect(ROLE_HIERARCHY['senior_carer']).toBeGreaterThan(ROLE_HIERARCHY['carer']);
    expect(ROLE_HIERARCHY['carer']).toBeGreaterThan(ROLE_HIERARCHY['viewer']);
  });
});

// ---------------------------------------------------------------------------
// PERMISSIONS matrix completeness
// ---------------------------------------------------------------------------

describe('PERMISSIONS matrix', () => {
  it('defines permissions for all 6 roles', () => {
    const expectedRoles: Role[] = [
      'owner',
      'admin',
      'manager',
      'senior_carer',
      'carer',
      'viewer',
    ];
    expectedRoles.forEach((role) => {
      expect(PERMISSIONS).toHaveProperty(role);
    });
  });

  it('owner has more permissions than admin (billing)', () => {
    const ownerBilling = PERMISSIONS['owner']['billing'] ?? [];
    const adminBilling = PERMISSIONS['admin']['billing'] ?? [];
    expect(ownerBilling.length).toBeGreaterThan(adminBilling.length);
  });

  it('owner has all clinical resource actions', () => {
    const clinicalResources: Resource[] = [
      'persons',
      'care_plans',
      'notes',
      'assessments',
      'medications',
    ];
    clinicalResources.forEach((resource) => {
      const actions = PERMISSIONS['owner'][resource] ?? [];
      expect(actions).toContain('read');
      expect(actions).toContain('create');
      expect(actions).toContain('update');
      expect(actions).toContain('delete');
    });
  });

  it('viewer only has read permissions on clinical resources', () => {
    const clinicalResources: Resource[] = [
      'persons',
      'care_plans',
      'notes',
      'assessments',
    ];
    clinicalResources.forEach((resource) => {
      const actions = PERMISSIONS['viewer'][resource] ?? [];
      expect(actions).toContain('read');
      expect(actions).not.toContain('create');
      expect(actions).not.toContain('update');
      expect(actions).not.toContain('delete');
    });
  });

  it('carer cannot access admin resources', () => {
    const adminResources: Resource[] = [
      'organisation',
      'billing',
      'settings',
      'users',
    ];
    adminResources.forEach((resource) => {
      const actions = PERMISSIONS['carer'][resource] ?? [];
      expect(actions.length).toBe(0);
    });
  });

  it('viewer cannot access admin resources', () => {
    const adminResources: Resource[] = [
      'organisation',
      'billing',
      'settings',
      'users',
    ];
    adminResources.forEach((resource) => {
      const actions = PERMISSIONS['viewer'][resource] ?? [];
      expect(actions.length).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Navigation items per role
// ---------------------------------------------------------------------------

describe('getNavItems', () => {
  it('returns nav items for all 6 roles', () => {
    ROLES.forEach((role) => {
      const items = getNavItems(role);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  it('owner nav includes billing', () => {
    const items = getNavItems('owner');
    const hasBilling = items.some((item) => item.href.includes('billing'));
    expect(hasBilling).toBe(true);
  });

  it('admin nav does not include billing', () => {
    const items = getNavItems('admin');
    const hasBilling = items.some((item) => item.href.includes('billing'));
    expect(hasBilling).toBe(false);
  });

  it('admin nav includes settings', () => {
    const items = getNavItems('admin');
    const hasSettings = items.some(
      (item) => item.href.includes('settings') || item.label.toLowerCase().includes('setting'),
    );
    expect(hasSettings).toBe(true);
  });

  it('carer nav includes daily tasks', () => {
    const items = getNavItems('carer');
    const hasDailyTasks = items.some(
      (item) =>
        item.label.toLowerCase().includes('task') ||
        item.href.includes('task') ||
        item.label.toLowerCase().includes('daily'),
    );
    expect(hasDailyTasks).toBe(true);
  });

  it('carer nav does not include staff management', () => {
    const items = getNavItems('carer');
    const hasStaff = items.some(
      (item) =>
        item.href === '/staff' && item.label.toLowerCase() === 'staff',
    );
    expect(hasStaff).toBe(false);
  });

  it('carer nav does not include settings', () => {
    const items = getNavItems('carer');
    const hasSettings = items.some((item) => item.href === '/settings');
    expect(hasSettings).toBe(false);
  });

  it('viewer nav only has read-relevant items', () => {
    const items = getNavItems('viewer');
    // Viewer should not have write-action nav items
    const adminItems = items.filter(
      (item) =>
        item.href.includes('settings') ||
        item.href.includes('billing') ||
        item.href.includes('team'),
    );
    expect(adminItems.length).toBe(0);
  });

  it('owner nav has the most items (all features)', () => {
    const ownerCount = getNavItems('owner').length;
    ROLES.forEach((role) => {
      if (role !== 'owner') {
        expect(ownerCount).toBeGreaterThanOrEqual(getNavItems(role).length);
      }
    });
  });

  it('all nav items have required fields (label, href)', () => {
    ROLES.forEach((role) => {
      const items = getNavItems(role);
      items.forEach((item) => {
        expect(item.label).toBeTruthy();
        expect(item.href).toBeTruthy();
        expect(item.href).toMatch(/^\//); // must start with /
      });
    });
  });

  it('falls back to viewer nav for unknown role', () => {
    const items = getNavItems('unknown' as Role);
    const viewerItems = getNavItems('viewer');
    expect(items).toEqual(viewerItems);
  });

  it('NAV_ITEMS_BY_ROLE covers all 6 roles', () => {
    ROLES.forEach((role) => {
      expect(NAV_ITEMS_BY_ROLE).toHaveProperty(role);
    });
  });
});

// ---------------------------------------------------------------------------
// Critical security assertions
// ---------------------------------------------------------------------------

describe('critical security assertions', () => {
  it('carer cannot perform any action on organisation', () => {
    const actions: Action[] = ['read', 'create', 'update', 'delete', 'manage'];
    actions.forEach((action) => {
      expect(hasPermission('carer', action, 'organisation')).toBe(false);
    });
  });

  it('carer cannot perform any action on billing', () => {
    const actions: Action[] = ['read', 'create', 'update', 'delete', 'manage'];
    actions.forEach((action) => {
      expect(hasPermission('carer', action, 'billing')).toBe(false);
    });
  });

  it('viewer cannot perform any action on billing', () => {
    const actions: Action[] = ['read', 'create', 'update', 'delete', 'manage'];
    actions.forEach((action) => {
      expect(hasPermission('viewer', action, 'billing')).toBe(false);
    });
  });

  it('only owner can manage billing', () => {
    ROLES.forEach((role) => {
      if (role === 'owner') {
        expect(hasPermission(role, 'manage', 'billing')).toBe(true);
      } else {
        expect(hasPermission(role, 'manage', 'billing')).toBe(false);
      }
    });
  });

  it('lower roles cannot delete clinical records', () => {
    const lowRoles: Role[] = ['carer', 'viewer', 'senior_carer'];
    lowRoles.forEach((role) => {
      expect(hasPermission(role, 'delete', 'care_plans')).toBe(false);
      expect(hasPermission(role, 'delete', 'persons')).toBe(false);
    });
  });
});
