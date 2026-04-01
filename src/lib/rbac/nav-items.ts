/**
 * Role-Based Navigation Items
 *
 * Defines which dashboard navigation items are visible per role.
 * The dashboard shell renders ONLY items for the authenticated user's role.
 *
 * Design decisions:
 * - Owner and admin see full platform navigation including org settings
 * - Owner uniquely sees the Billing link (no other role does)
 * - Managers see clinical + operational features; no admin section
 * - Senior carers see all clinical items + compliance; no admin section
 * - Carers see daily-workflow items: their persons, tasks, schedule, medications
 * - Viewers see read-only clinical data + reports; no workflow items
 */

import type { Role } from './permissions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NavSection =
  | 'main'
  | 'care'
  | 'schedule'
  | 'staff'
  | 'operations'
  | 'admin';

export type NavItem = {
  /** Display label shown in the sidebar */
  label: string;
  /** Route path (relative to org context) */
  href: string;
  /** Lucide icon name for rendering */
  icon: string;
  /** Logical section grouping for sidebar headers */
  section: NavSection;
};

// ---------------------------------------------------------------------------
// Navigation items per role
// ---------------------------------------------------------------------------

export const NAV_ITEMS_BY_ROLE: Record<Role, NavItem[]> = {
  // -------------------------------------------------------------------------
  // Owner — all navigation items
  // -------------------------------------------------------------------------
  owner: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'layout-dashboard',
      section: 'main',
    },
    // Care section
    {
      label: 'People',
      href: '/persons',
      icon: 'users',
      section: 'care',
    },
    {
      label: 'Care Plans',
      href: '/care-plans',
      icon: 'clipboard-list',
      section: 'care',
    },
    {
      label: 'Daily Notes',
      href: '/notes',
      icon: 'notebook-pen',
      section: 'care',
    },
    {
      label: 'Assessments',
      href: '/assessments',
      icon: 'clipboard-check',
      section: 'care',
    },
    {
      label: 'Medications',
      href: '/medications',
      icon: 'pill',
      section: 'care',
    },
    {
      label: 'Incidents',
      href: '/incidents',
      icon: 'alert-triangle',
      section: 'care',
    },
    // Staff section
    {
      label: 'Staff',
      href: '/staff',
      icon: 'user-check',
      section: 'staff',
    },
    {
      label: 'Rostering',
      href: '/rostering',
      icon: 'calendar',
      section: 'staff',
    },
    // Operations section
    {
      label: 'Compliance',
      href: '/compliance',
      icon: 'shield-check',
      section: 'operations',
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: 'bar-chart-2',
      section: 'operations',
    },
    {
      label: 'Audit Log',
      href: '/audit-log',
      icon: 'file-search',
      section: 'operations',
    },
    // Admin section — owner only has Billing
    {
      label: 'Settings',
      href: '/settings',
      icon: 'settings',
      section: 'admin',
    },
    {
      label: 'Organisation',
      href: '/settings/organisation',
      icon: 'building-2',
      section: 'admin',
    },
    {
      label: 'Billing',
      href: '/settings/billing',
      icon: 'credit-card',
      section: 'admin',
    },
    {
      label: 'Team',
      href: '/settings/team',
      icon: 'users-round',
      section: 'admin',
    },
  ],

  // -------------------------------------------------------------------------
  // Admin — same as owner but without Billing
  // -------------------------------------------------------------------------
  admin: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'layout-dashboard',
      section: 'main',
    },
    // Care section
    {
      label: 'People',
      href: '/persons',
      icon: 'users',
      section: 'care',
    },
    {
      label: 'Care Plans',
      href: '/care-plans',
      icon: 'clipboard-list',
      section: 'care',
    },
    {
      label: 'Daily Notes',
      href: '/notes',
      icon: 'notebook-pen',
      section: 'care',
    },
    {
      label: 'Assessments',
      href: '/assessments',
      icon: 'clipboard-check',
      section: 'care',
    },
    {
      label: 'Medications',
      href: '/medications',
      icon: 'pill',
      section: 'care',
    },
    {
      label: 'Incidents',
      href: '/incidents',
      icon: 'alert-triangle',
      section: 'care',
    },
    // Staff section
    {
      label: 'Staff',
      href: '/staff',
      icon: 'user-check',
      section: 'staff',
    },
    {
      label: 'Rostering',
      href: '/rostering',
      icon: 'calendar',
      section: 'staff',
    },
    // Operations section
    {
      label: 'Compliance',
      href: '/compliance',
      icon: 'shield-check',
      section: 'operations',
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: 'bar-chart-2',
      section: 'operations',
    },
    {
      label: 'Audit Log',
      href: '/audit-log',
      icon: 'file-search',
      section: 'operations',
    },
    // Admin section — no Billing for admin
    {
      label: 'Settings',
      href: '/settings',
      icon: 'settings',
      section: 'admin',
    },
    {
      label: 'Organisation',
      href: '/settings/organisation',
      icon: 'building-2',
      section: 'admin',
    },
    {
      label: 'Team',
      href: '/settings/team',
      icon: 'users-round',
      section: 'admin',
    },
  ],

  // -------------------------------------------------------------------------
  // Manager — clinical + operational + staff; no admin section
  // -------------------------------------------------------------------------
  manager: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'layout-dashboard',
      section: 'main',
    },
    // Care section
    {
      label: 'People',
      href: '/persons',
      icon: 'users',
      section: 'care',
    },
    {
      label: 'Care Plans',
      href: '/care-plans',
      icon: 'clipboard-list',
      section: 'care',
    },
    {
      label: 'Daily Notes',
      href: '/notes',
      icon: 'notebook-pen',
      section: 'care',
    },
    {
      label: 'Assessments',
      href: '/assessments',
      icon: 'clipboard-check',
      section: 'care',
    },
    {
      label: 'Medications',
      href: '/medications',
      icon: 'pill',
      section: 'care',
    },
    {
      label: 'Incidents',
      href: '/incidents',
      icon: 'alert-triangle',
      section: 'care',
    },
    // Staff section
    {
      label: 'Staff',
      href: '/staff',
      icon: 'user-check',
      section: 'staff',
    },
    {
      label: 'Rostering',
      href: '/rostering',
      icon: 'calendar',
      section: 'staff',
    },
    // Operations section
    {
      label: 'Compliance',
      href: '/compliance',
      icon: 'shield-check',
      section: 'operations',
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: 'bar-chart-2',
      section: 'operations',
    },
  ],

  // -------------------------------------------------------------------------
  // Senior Carer — full clinical access, compliance, schedule view
  // -------------------------------------------------------------------------
  senior_carer: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'layout-dashboard',
      section: 'main',
    },
    // Care section
    {
      label: 'People',
      href: '/persons',
      icon: 'users',
      section: 'care',
    },
    {
      label: 'Care Plans',
      href: '/care-plans',
      icon: 'clipboard-list',
      section: 'care',
    },
    {
      label: 'Daily Notes',
      href: '/notes',
      icon: 'notebook-pen',
      section: 'care',
    },
    {
      label: 'Assessments',
      href: '/assessments',
      icon: 'clipboard-check',
      section: 'care',
    },
    {
      label: 'Medications',
      href: '/medications',
      icon: 'pill',
      section: 'care',
    },
    {
      label: 'Incidents',
      href: '/incidents',
      icon: 'alert-triangle',
      section: 'care',
    },
    // Schedule section
    {
      label: 'My Rota',
      href: '/rostering/my-rota',
      icon: 'calendar',
      section: 'schedule',
    },
    // Operations section
    {
      label: 'Compliance',
      href: '/compliance',
      icon: 'shield-check',
      section: 'operations',
    },
    {
      label: 'Audit Log',
      href: '/audit-log',
      icon: 'file-search',
      section: 'operations',
    },
  ],

  // -------------------------------------------------------------------------
  // Carer — daily workflow: assigned persons, tasks, notes, schedule
  // -------------------------------------------------------------------------
  carer: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'layout-dashboard',
      section: 'main',
    },
    // Care section (daily workflow)
    {
      label: 'My Persons',
      href: '/persons',
      icon: 'users',
      section: 'care',
    },
    {
      label: 'Daily Tasks',
      href: '/notes/new',
      icon: 'check-square',
      section: 'care',
    },
    {
      label: 'Notes',
      href: '/notes',
      icon: 'notebook-pen',
      section: 'care',
    },
    {
      label: 'Medications',
      href: '/medications',
      icon: 'pill',
      section: 'care',
    },
    {
      label: 'Incidents',
      href: '/incidents',
      icon: 'alert-triangle',
      section: 'care',
    },
    // Schedule section
    {
      label: 'My Schedule',
      href: '/rostering/my-rota',
      icon: 'calendar',
      section: 'schedule',
    },
  ],

  // -------------------------------------------------------------------------
  // Viewer — read-only: persons, care plans, notes, reports
  // -------------------------------------------------------------------------
  viewer: [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: 'layout-dashboard',
      section: 'main',
    },
    // Care section (read-only)
    {
      label: 'People',
      href: '/persons',
      icon: 'users',
      section: 'care',
    },
    {
      label: 'Care Plans',
      href: '/care-plans',
      icon: 'clipboard-list',
      section: 'care',
    },
    {
      label: 'Notes',
      href: '/notes',
      icon: 'notebook-pen',
      section: 'care',
    },
    // Operations section (read-only)
    {
      label: 'Reports',
      href: '/reports',
      icon: 'bar-chart-2',
      section: 'operations',
    },
  ],
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Returns the navigation items for a given role.
 * Falls back to viewer nav if the role is unrecognised.
 *
 * @param role - The user's role in the active organisation
 * @returns Array of NavItem objects to render in the sidebar
 */
export function getNavItems(role: Role): NavItem[] {
  return NAV_ITEMS_BY_ROLE[role] ?? NAV_ITEMS_BY_ROLE.viewer;
}
