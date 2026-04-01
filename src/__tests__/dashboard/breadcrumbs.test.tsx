/**
 * Breadcrumbs Component Tests
 *
 * Covers:
 * - Renders home link
 * - Shows breadcrumb segments from pathname
 * - Maps route segments to human-readable labels
 * - Marks last segment as current page
 * - UUID segments are replaced with "Detail"
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '@/components/dashboard/breadcrumbs';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function renderBreadcrumbs(pathname: string) {
  mockPathname.mockReturnValue(pathname);
  return render(<Breadcrumbs orgSlug="acme" orgName="Acme Care" />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Breadcrumbs', () => {
  describe('home link', () => {
    it('renders a home link', () => {
      renderBreadcrumbs('/acme/dashboard');
      const homeLink = screen.getByRole('link', { name: /acme care dashboard/i });
      expect(homeLink).toBeInTheDocument();
    });

    it('home link points to the dashboard', () => {
      renderBreadcrumbs('/acme/dashboard');
      const homeLink = screen.getByRole('link', { name: /acme care dashboard/i });
      expect(homeLink).toHaveAttribute('href', '/acme/dashboard');
    });
  });

  describe('segment rendering', () => {
    it('renders Dashboard segment on dashboard route', () => {
      renderBreadcrumbs('/acme/dashboard');
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders Settings segment on settings route', () => {
      renderBreadcrumbs('/acme/settings');
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders nested segments for settings/team', () => {
      renderBreadcrumbs('/acme/settings/team');
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
    });

    it('renders People segment for /persons route', () => {
      renderBreadcrumbs('/acme/persons');
      expect(screen.getByText('People')).toBeInTheDocument();
    });

    it('replaces UUID segments with "Detail"', () => {
      renderBreadcrumbs('/acme/persons/550e8400-e29b-41d4-a716-446655440000');
      expect(screen.getByText('Detail')).toBeInTheDocument();
    });
  });

  describe('aria attributes', () => {
    it('marks the breadcrumb nav with aria-label', () => {
      renderBreadcrumbs('/acme/dashboard');
      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    });

    it('marks last breadcrumb segment as current page', () => {
      renderBreadcrumbs('/acme/settings');
      const settingsEl = screen.getByText('Settings');
      expect(settingsEl).toHaveAttribute('aria-current', 'page');
    });
  });
});
