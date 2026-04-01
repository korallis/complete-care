/**
 * Tests for staff UI components.
 *
 * Validates:
 * - StaffStatusBadge renders correct labels and styles
 * - StaffContractBadge renders correct labels
 * - StaffEmptyState renders appropriate state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock DB dependencies
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/test-org/staff'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  StaffStatusBadge,
  StaffContractBadge,
} from '@/components/staff/staff-status-badge';
import { StaffEmptyState } from '@/components/staff/staff-empty-state';

// ---------------------------------------------------------------------------
// StaffStatusBadge
// ---------------------------------------------------------------------------

describe('StaffStatusBadge', () => {
  it('renders "Active" for active status', () => {
    render(<StaffStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders "Suspended" for suspended status', () => {
    render(<StaffStatusBadge status="suspended" />);
    expect(screen.getByText('Suspended')).toBeTruthy();
  });

  it('renders "On Leave" for on_leave status', () => {
    render(<StaffStatusBadge status="on_leave" />);
    expect(screen.getByText('On Leave')).toBeTruthy();
  });

  it('renders "Terminated" for terminated status', () => {
    render(<StaffStatusBadge status="terminated" />);
    expect(screen.getByText('Terminated')).toBeTruthy();
  });

  it('falls back to raw status for unknown value', () => {
    render(<StaffStatusBadge status="custom_status" />);
    expect(screen.getByText('custom_status')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// StaffContractBadge
// ---------------------------------------------------------------------------

describe('StaffContractBadge', () => {
  it('renders "Full Time" for full_time', () => {
    render(<StaffContractBadge contractType="full_time" />);
    expect(screen.getByText('Full Time')).toBeTruthy();
  });

  it('renders "Part Time" for part_time', () => {
    render(<StaffContractBadge contractType="part_time" />);
    expect(screen.getByText('Part Time')).toBeTruthy();
  });

  it('renders "Zero Hours" for zero_hours', () => {
    render(<StaffContractBadge contractType="zero_hours" />);
    expect(screen.getByText('Zero Hours')).toBeTruthy();
  });

  it('renders "Agency" for agency', () => {
    render(<StaffContractBadge contractType="agency" />);
    expect(screen.getByText('Agency')).toBeTruthy();
  });

  it('renders "Bank" for bank', () => {
    render(<StaffContractBadge contractType="bank" />);
    expect(screen.getByText('Bank')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// StaffEmptyState
// ---------------------------------------------------------------------------

describe('StaffEmptyState', () => {
  it('shows filtered empty message when isFiltered is true', () => {
    render(
      <StaffEmptyState
        orgSlug="test-org"
        isFiltered={true}
        canCreate={true}
      />,
    );
    expect(screen.getByText('No matching staff found')).toBeTruthy();
    // Should not show "Add staff member" link when filtered
    expect(screen.queryByText('Add staff member')).toBeNull();
  });

  it('shows CTA when not filtered and canCreate is true', () => {
    render(
      <StaffEmptyState
        orgSlug="test-org"
        isFiltered={false}
        canCreate={true}
      />,
    );
    expect(screen.getByText('No staff profiles yet')).toBeTruthy();
    const link = screen.getByText('Add staff member');
    expect(link).toBeTruthy();
    expect(link.closest('a')?.getAttribute('href')).toBe('/test-org/staff/new');
  });

  it('hides CTA when canCreate is false', () => {
    render(
      <StaffEmptyState
        orgSlug="test-org"
        isFiltered={false}
        canCreate={false}
      />,
    );
    expect(screen.getByText('No staff profiles yet')).toBeTruthy();
    expect(screen.queryByText('Add staff member')).toBeNull();
  });
});
