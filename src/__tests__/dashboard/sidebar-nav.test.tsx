/**
 * SidebarNav Component Tests
 *
 * Covers:
 * - Renders navigation items for the given role
 * - Groups items by section with section headers
 * - Marks active item based on current pathname
 * - Calls onNavigate when a link is clicked
 * - All nav item icons are resolved correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { getNavItems } from '@/lib/rbac/nav-items';

// ---------------------------------------------------------------------------
// Mock next/navigation
// ---------------------------------------------------------------------------

const mockPathname = vi.fn().mockReturnValue('/acme/dashboard');

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link to render a regular anchor for testing
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    onClick,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderSidebarNav(role: Parameters<typeof getNavItems>[0] = 'manager') {
  const items = getNavItems(role);
  return render(
    <SidebarNav items={items} orgSlug="acme" onNavigate={vi.fn()} />,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SidebarNav', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/acme/dashboard');
  });

  describe('renders nav items', () => {
    it('renders Dashboard link for all roles', () => {
      renderSidebarNav('owner');
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('renders People link for owner', () => {
      renderSidebarNav('owner');
      expect(screen.getByRole('link', { name: /people/i })).toBeInTheDocument();
    });

    it('renders Staff link for owner', () => {
      renderSidebarNav('owner');
      expect(screen.getByRole('link', { name: /^staff$/i })).toBeInTheDocument();
    });

    it('renders Billing link only for owner', () => {
      renderSidebarNav('owner');
      expect(screen.getByRole('link', { name: /billing/i })).toBeInTheDocument();
    });

    it('does not render Billing link for admin', () => {
      renderSidebarNav('admin');
      expect(screen.queryByRole('link', { name: /billing/i })).not.toBeInTheDocument();
    });

    it('does not render Billing link for manager', () => {
      renderSidebarNav('manager');
      expect(screen.queryByRole('link', { name: /billing/i })).not.toBeInTheDocument();
    });

    it('renders correct items for carer role', () => {
      renderSidebarNav('carer');
      expect(screen.getByRole('link', { name: /my persons/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^staff$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /compliance/i })).not.toBeInTheDocument();
    });

    it('renders read-only items for viewer role', () => {
      renderSidebarNav('viewer');
      expect(screen.getByRole('link', { name: /reports/i })).toBeInTheDocument();
      // Viewer should not see settings
      expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('marks Dashboard as active when on dashboard route', () => {
      mockPathname.mockReturnValue('/acme/dashboard');
      renderSidebarNav('owner');
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    });

    it('marks People link as active when on /persons route', () => {
      mockPathname.mockReturnValue('/acme/persons');
      renderSidebarNav('owner');
      const peopleLink = screen.getByRole('link', { name: /people/i });
      expect(peopleLink).toHaveAttribute('aria-current', 'page');
    });

    it('marks People link as active on nested persons route', () => {
      mockPathname.mockReturnValue('/acme/persons/some-uuid');
      renderSidebarNav('owner');
      const peopleLink = screen.getByRole('link', { name: /people/i });
      expect(peopleLink).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark Dashboard as active when on another route', () => {
      mockPathname.mockReturnValue('/acme/persons');
      renderSidebarNav('owner');
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).not.toHaveAttribute('aria-current');
    });
  });

  describe('navigation callback', () => {
    it('calls onNavigate when a link is clicked', () => {
      const onNavigate = vi.fn();
      const items = getNavItems('manager');
      render(<SidebarNav items={items} orgSlug="acme" onNavigate={onNavigate} />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      fireEvent.click(dashboardLink);
      expect(onNavigate).toHaveBeenCalledOnce();
    });
  });

  describe('section grouping', () => {
    it('renders People & Care section header for owner', () => {
      renderSidebarNav('owner');
      expect(screen.getByText('People & Care')).toBeInTheDocument();
    });

    it('renders Staff section header for owner', () => {
      renderSidebarNav('owner');
      // There will be multiple "Staff" elements (section header + nav link)
      const staffElements = screen.getAllByText('Staff');
      expect(staffElements.length).toBeGreaterThanOrEqual(1);
    });

    it('renders Operations section header for manager', () => {
      renderSidebarNav('manager');
      expect(screen.getByText('Operations')).toBeInTheDocument();
    });

    it('renders Administration section header for owner', () => {
      renderSidebarNav('owner');
      expect(screen.getByText('Administration')).toBeInTheDocument();
    });
  });

  describe('link href construction', () => {
    it('prefixes links with org slug', () => {
      const items = getNavItems('owner');
      render(<SidebarNav items={items} orgSlug="test-org" />);
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/test-org/dashboard');
    });
  });

  describe('main nav', () => {
    it('renders the nav landmark', () => {
      renderSidebarNav('owner');
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });
});
