/**
 * Role-Based Access Control — Permission Matrix
 *
 * Defines the 6 roles for Complete Care and their allowed actions on each resource.
 * Role hierarchy (highest to lowest): owner > admin > manager > senior_carer > carer > viewer
 *
 * This file is a pure constants module — no side effects, no DB calls.
 * Suitable for use in Edge runtime (middleware) and Node.js (server actions).
 */

// ---------------------------------------------------------------------------
// Role type
// ---------------------------------------------------------------------------

export const ROLES = [
  'owner',
  'admin',
  'manager',
  'senior_carer',
  'carer',
  'viewer',
] as const;

export type Role = (typeof ROLES)[number];

// ---------------------------------------------------------------------------
// Action type
// ---------------------------------------------------------------------------

export const ACTIONS = [
  'read',
  'create',
  'update',
  'delete',
  'approve',
  'export',
  'manage',
] as const;

export type Action = (typeof ACTIONS)[number];

// ---------------------------------------------------------------------------
// Resource type
// ---------------------------------------------------------------------------

export const RESOURCES = [
  'persons',
  'care_plans',
  'notes',
  'assessments',
  'documents',
  'medications',
  'incidents',
  'clinical',
  'staff',
  'rota',
  'compliance',
  'reports',
  'settings',
  'organisation',
  'billing',
  'users',
  'audit_logs',
] as const;

export type Resource = (typeof RESOURCES)[number];

// ---------------------------------------------------------------------------
// Permission matrix
// ---------------------------------------------------------------------------

/**
 * Defines which actions each role may perform on each resource.
 * An empty array means NO access to that resource.
 *
 * Design decisions:
 * - Only owners can manage billing (financial data)
 * - Admins have full platform access except billing
 * - Managers have clinical + staff management; no admin controls
 * - Senior carers have full clinical write access and can approve notes/plans
 * - Carers can create daily records but cannot modify or delete
 * - Viewers are read-only on clinical data; no admin/billing access at all
 */
export const PERMISSIONS: Record<Role, Partial<Record<Resource, Action[]>>> = {
  // -------------------------------------------------------------------------
  // Owner — full platform access including billing
  // -------------------------------------------------------------------------
  owner: {
    persons: ['read', 'create', 'update', 'delete', 'export'],
    care_plans: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    notes: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    assessments: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    documents: ['read', 'create', 'update', 'delete', 'export'],
    medications: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    incidents: ['read', 'create', 'update', 'delete', 'export'],
    clinical: ['read', 'create', 'update', 'delete', 'export'],
    staff: ['read', 'create', 'update', 'delete', 'export'],
    rota: ['read', 'create', 'update', 'delete', 'manage'],
    compliance: ['read', 'manage', 'export'],
    reports: ['read', 'export', 'manage'],
    settings: ['read', 'manage'],
    organisation: ['read', 'manage'],
    billing: ['read', 'manage'],
    users: ['read', 'create', 'update', 'delete', 'manage'],
    audit_logs: ['read', 'export'],
  },

  // -------------------------------------------------------------------------
  // Admin — full platform access except billing (owner-only)
  // -------------------------------------------------------------------------
  admin: {
    persons: ['read', 'create', 'update', 'delete', 'export'],
    care_plans: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    notes: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    assessments: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    documents: ['read', 'create', 'update', 'delete', 'export'],
    medications: ['read', 'create', 'update', 'delete', 'approve', 'export'],
    incidents: ['read', 'create', 'update', 'delete', 'export'],
    clinical: ['read', 'create', 'update', 'delete', 'export'],
    staff: ['read', 'create', 'update', 'delete', 'export'],
    rota: ['read', 'create', 'update', 'delete', 'manage'],
    compliance: ['read', 'manage', 'export'],
    reports: ['read', 'export', 'manage'],
    settings: ['read', 'manage'],
    organisation: ['read', 'manage'],
    billing: [], // Only owners can access billing
    users: ['read', 'create', 'update', 'delete', 'manage'],
    audit_logs: ['read', 'export'],
  },

  // -------------------------------------------------------------------------
  // Manager — clinical operations + staff management, no admin controls
  // -------------------------------------------------------------------------
  manager: {
    persons: ['read', 'create', 'update', 'export'],
    care_plans: ['read', 'create', 'update', 'approve', 'export'],
    notes: ['read', 'create', 'update', 'approve', 'export'],
    assessments: ['read', 'create', 'update', 'approve', 'export'],
    documents: ['read', 'create', 'update', 'export'],
    medications: ['read', 'create', 'update', 'approve'],
    incidents: ['read', 'create', 'update', 'export'],
    clinical: ['read', 'create', 'update', 'export'],
    staff: ['read', 'create', 'update', 'export'],
    rota: ['read', 'create', 'update', 'manage'],
    compliance: ['read', 'manage'],
    reports: ['read', 'export'],
    settings: ['read'],
    organisation: ['read'],
    billing: [],
    users: ['read'],
    audit_logs: ['read'],
  },

  // -------------------------------------------------------------------------
  // Senior Carer — full clinical write access, approval rights, no admin
  // -------------------------------------------------------------------------
  senior_carer: {
    persons: ['read', 'create', 'update'],
    care_plans: ['read', 'create', 'update', 'approve'],
    notes: ['read', 'create', 'update', 'approve'],
    assessments: ['read', 'create', 'update'],
    documents: ['read', 'create', 'update'],
    medications: ['read', 'create', 'update'],
    incidents: ['read', 'create', 'update'],
    clinical: ['read', 'create', 'update'],
    staff: ['read'],
    rota: ['read', 'update'],
    compliance: ['read'],
    reports: ['read'],
    settings: [],
    organisation: [],
    billing: [],
    users: [],
    audit_logs: ['read'],
  },

  // -------------------------------------------------------------------------
  // Carer — daily tasks: create notes/records, read assigned persons
  // -------------------------------------------------------------------------
  carer: {
    persons: ['read'],
    care_plans: ['read'],
    notes: ['read', 'create'],
    assessments: ['read'],
    documents: ['read', 'create'],
    medications: ['read', 'create'],
    incidents: ['read', 'create'],
    clinical: ['read'],
    staff: ['read'],
    rota: ['read'],
    compliance: [],
    reports: [],
    settings: [],
    organisation: [],
    billing: [],
    users: [],
    audit_logs: [],
  },

  // -------------------------------------------------------------------------
  // Viewer — read-only on clinical data; no admin, no write access
  // Used for inspectors, auditors, and family portal users
  // -------------------------------------------------------------------------
  viewer: {
    persons: ['read'],
    care_plans: ['read'],
    notes: ['read'],
    assessments: ['read'],
    documents: ['read'],
    medications: ['read'],
    incidents: ['read'],
    clinical: ['read'],
    staff: ['read'],
    rota: ['read'],
    compliance: ['read'],
    reports: ['read'],
    settings: [],
    organisation: [],
    billing: [],
    users: [],
    audit_logs: [],
  },
};

// ---------------------------------------------------------------------------
// Role hierarchy
// ---------------------------------------------------------------------------

/**
 * Numeric privilege level for each role (higher = more access).
 * Useful for comparison: can this role perform at least as much as another?
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 6,
  admin: 5,
  manager: 4,
  senior_carer: 3,
  carer: 2,
  viewer: 1,
};

// ---------------------------------------------------------------------------
// Core permission check
// ---------------------------------------------------------------------------

/**
 * Checks whether a role has permission to perform an action on a resource.
 *
 * This is a pure function — no side effects, no DB calls.
 * Use in both Edge runtime (navigation rendering) and Node.js (server actions).
 *
 * @param role - The user's role in the organisation
 * @param action - The action being attempted
 * @param resource - The resource being accessed
 * @returns true if the role has the required permission, false otherwise
 */
export function hasPermission(
  role: Role,
  action: Action,
  resource: Resource,
): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  const resourcePermissions = rolePermissions[resource];
  if (!resourcePermissions || resourcePermissions.length === 0) return false;

  return resourcePermissions.includes(action);
}
