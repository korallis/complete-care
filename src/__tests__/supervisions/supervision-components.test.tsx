/**
 * Tests for supervision UI components.
 *
 * Validates:
 * - SupervisionStatusBadge renders correct labels and styles
 * - SupervisionTypeBadge renders correct labels
 * - SupervisionFrequencyBadge renders correct labels
 * - OverdueAlertBanner renders alerts correctly
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
  usePathname: vi.fn(() => '/test-org/staff/123/supervision'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  SupervisionStatusBadge,
  SupervisionTypeBadge,
  SupervisionFrequencyBadge,
} from '@/components/supervisions/supervision-status-badge';
import { OverdueAlertBanner } from '@/components/supervisions/overdue-alert-banner';

// ---------------------------------------------------------------------------
// SupervisionStatusBadge
// ---------------------------------------------------------------------------

describe('SupervisionStatusBadge', () => {
  it('renders "Scheduled" for scheduled status', () => {
    render(<SupervisionStatusBadge status="scheduled" />);
    expect(screen.getByText('Scheduled')).toBeTruthy();
  });

  it('renders "Completed" for completed status', () => {
    render(<SupervisionStatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('renders "Overdue" for overdue status', () => {
    render(<SupervisionStatusBadge status="overdue" />);
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('renders "Cancelled" for cancelled status', () => {
    render(<SupervisionStatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeTruthy();
  });

  it('falls back to raw status for unknown value', () => {
    render(<SupervisionStatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// SupervisionTypeBadge
// ---------------------------------------------------------------------------

describe('SupervisionTypeBadge', () => {
  it('renders "Supervision" for supervision type', () => {
    render(<SupervisionTypeBadge type="supervision" />);
    expect(screen.getByText('Supervision')).toBeTruthy();
  });

  it('renders "Appraisal" for appraisal type', () => {
    render(<SupervisionTypeBadge type="appraisal" />);
    expect(screen.getByText('Appraisal')).toBeTruthy();
  });

  it('falls back to raw type for unknown value', () => {
    render(<SupervisionTypeBadge type="review" />);
    expect(screen.getByText('review')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// SupervisionFrequencyBadge
// ---------------------------------------------------------------------------

describe('SupervisionFrequencyBadge', () => {
  it('renders "Monthly" for monthly frequency', () => {
    render(<SupervisionFrequencyBadge frequency="monthly" />);
    expect(screen.getByText('Monthly')).toBeTruthy();
  });

  it('renders "6-Weekly" for six_weekly frequency', () => {
    render(<SupervisionFrequencyBadge frequency="six_weekly" />);
    expect(screen.getByText('6-Weekly')).toBeTruthy();
  });

  it('renders "Quarterly" for quarterly frequency', () => {
    render(<SupervisionFrequencyBadge frequency="quarterly" />);
    expect(screen.getByText('Quarterly')).toBeTruthy();
  });

  it('renders "Annual" for annual frequency', () => {
    render(<SupervisionFrequencyBadge frequency="annual" />);
    expect(screen.getByText('Annual')).toBeTruthy();
  });

  it('falls back to raw frequency for unknown value', () => {
    render(<SupervisionFrequencyBadge frequency="weekly" />);
    expect(screen.getByText('weekly')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// OverdueAlertBanner
// ---------------------------------------------------------------------------

describe('OverdueAlertBanner', () => {
  it('renders nothing when there are no overdue or upcoming', () => {
    const { container } = render(
      <OverdueAlertBanner overdueCount={0} upcomingCount={0} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders red alert for overdue supervisions', () => {
    render(<OverdueAlertBanner overdueCount={3} upcomingCount={0} />);
    expect(screen.getByText('3 overdue supervisions')).toBeTruthy();
  });

  it('renders singular form for 1 overdue', () => {
    render(<OverdueAlertBanner overdueCount={1} upcomingCount={0} />);
    expect(screen.getByText('1 overdue supervision')).toBeTruthy();
  });

  it('renders amber alert for upcoming when no overdue', () => {
    render(<OverdueAlertBanner overdueCount={0} upcomingCount={2} />);
    expect(screen.getByText('2 upcoming supervisions this week')).toBeTruthy();
  });

  it('does not render upcoming alert when overdue exists', () => {
    render(<OverdueAlertBanner overdueCount={1} upcomingCount={2} />);
    expect(screen.getByText('1 overdue supervision')).toBeTruthy();
    // The upcoming alert should NOT render when overdue exists
    expect(screen.queryByText(/upcoming supervision/)).toBeNull();
  });

  it('has alert role', () => {
    render(<OverdueAlertBanner overdueCount={1} upcomingCount={0} />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
