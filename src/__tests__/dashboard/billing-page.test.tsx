/**
 * Tests for billing page RBAC enforcement.
 *
 * Validates:
 * - Only owner role has billing permissions
 * - Billing nav item exists only for owner
 * - RBAC matrix correctly restricts billing access
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BillingContent } from '@/components/billing/billing-content';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BillingContent component', () => {
  it('renders billing heading', () => {
    render(<BillingContent />);
    expect(screen.getByText('Billing & Subscription')).toBeInTheDocument();
  });

  it('shows current plan section', () => {
    render(<BillingContent />);
    expect(screen.getByText('Current plan')).toBeInTheDocument();
    // "Free" appears multiple times (in text and badge), so check for at least one
    const freeTexts = screen.getAllByText('Free');
    expect(freeTexts.length).toBeGreaterThan(0);
  });

  it('shows upgrade options', () => {
    render(<BillingContent />);
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('shows payment and invoices section', () => {
    render(<BillingContent />);
    expect(screen.getByText('Payment & invoices')).toBeInTheDocument();
  });
});

describe('Billing RBAC permissions', () => {
  it('owner has billing:read permission', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('owner', 'read', 'billing')).toBe(true);
  });

  it('admin does NOT have billing:read permission', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('admin', 'read', 'billing')).toBe(false);
  });

  it('manager does NOT have billing:read permission', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('manager', 'read', 'billing')).toBe(false);
  });

  it('carer does NOT have billing:read permission', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('carer', 'read', 'billing')).toBe(false);
  });

  it('viewer does NOT have billing:read permission', async () => {
    const { hasPermission } = await import('@/lib/rbac/permissions');
    expect(hasPermission('viewer', 'read', 'billing')).toBe(false);
  });
});

describe('Billing nav item visibility', () => {
  it('owner navigation includes Billing link', async () => {
    // Import directly from nav-items to avoid Auth.js server-only module issues in tests
    const { getNavItems } = await import('@/lib/rbac/nav-items');
    const ownerNav = getNavItems('owner');
    const billingItem = ownerNav.find((item) => item.label === 'Billing');
    expect(billingItem).toBeDefined();
    expect(billingItem?.href).toBe('/settings/billing');
  });

  it('admin navigation does NOT include Billing link', async () => {
    const { getNavItems } = await import('@/lib/rbac/nav-items');
    const adminNav = getNavItems('admin');
    const billingItem = adminNav.find((item) => item.label === 'Billing');
    expect(billingItem).toBeUndefined();
  });

  it('manager navigation does NOT include Billing link', async () => {
    const { getNavItems } = await import('@/lib/rbac/nav-items');
    const managerNav = getNavItems('manager');
    const billingItem = managerNav.find((item) => item.label === 'Billing');
    expect(billingItem).toBeUndefined();
  });
});
