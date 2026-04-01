/**
 * RBAC — Public API
 *
 * This module provides the complete role-based access control system for Complete Care.
 *
 * Exports:
 * - hasPermission(role, action, resource)  — pure synchronous check (Edge-safe)
 * - requirePermission(action, resource)    — async server-side guard (throws on denied)
 * - getCurrentRole(userId, orgId)         — fetch current DB role for a user in an org
 * - getNavItems(role)                     — sidebar navigation items for a role
 * - UnauthorizedError                     — error class thrown on access denial
 *
 * Architecture note:
 * requirePermission() always queries the DB for the user's current role (not the JWT).
 * This ensures mid-session role changes take effect on the very next server request,
 * without requiring a sign-out/sign-in cycle.
 *
 * For client-side use (e.g., hiding UI elements), consume the role from the session
 * and call hasPermission() directly — no DB query needed.
 */

export {
  hasPermission,
  PERMISSIONS,
  ROLES,
  ROLE_HIERARCHY,
  ACTIONS,
  RESOURCES,
} from './permissions';

export type { Role, Action, Resource } from './permissions';

export { getNavItems, NAV_ITEMS_BY_ROLE } from './nav-items';
export type { NavItem, NavSection } from './nav-items';

// Re-export requirePermission, getCurrentRole, and UnauthorizedError from the
// server-only module. These are split out because they import from @/lib/db
// which should only run in Node.js (not Edge runtime).
export {
  requirePermission,
  getCurrentRole,
  UnauthorizedError,
} from './server';
