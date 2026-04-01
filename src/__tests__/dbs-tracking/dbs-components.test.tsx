/**
 * Tests for DBS tracking UI components.
 *
 * Validates:
 * - DbsStatusBadge renders correct labels and styles
 * - DbsLevelBadge renders correct labels
 * - DbsAlertBanner renders alerts correctly
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
  usePathname: vi.fn(() => '/test-org/staff/123/dbs'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  DbsStatusBadge,
  DbsLevelBadge,
} from '@/components/dbs-tracking/dbs-status-badge';
import { DbsAlertBanner } from '@/components/dbs-tracking/dbs-alert-banner';
import type { DbsAlert } from '@/features/dbs-tracking/alerts';

// ---------------------------------------------------------------------------
// DbsStatusBadge
// ---------------------------------------------------------------------------

describe('DbsStatusBadge', () => {
  it('renders "Current" for current status', () => {
    render(<DbsStatusBadge status="current" />);
    expect(screen.getByText('Current')).toBeTruthy();
  });

  it('renders "Expiring Soon" for expiring_soon status', () => {
    render(<DbsStatusBadge status="expiring_soon" />);
    expect(screen.getByText('Expiring Soon')).toBeTruthy();
  });

  it('renders "Expired" for expired status', () => {
    render(<DbsStatusBadge status="expired" />);
    expect(screen.getByText('Expired')).toBeTruthy();
  });

  it('falls back to raw status for unknown value', () => {
    render(<DbsStatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DbsLevelBadge
// ---------------------------------------------------------------------------

describe('DbsLevelBadge', () => {
  it('renders "Basic" for basic level', () => {
    render(<DbsLevelBadge level="basic" />);
    expect(screen.getByText('Basic')).toBeTruthy();
  });

  it('renders "Standard" for standard level', () => {
    render(<DbsLevelBadge level="standard" />);
    expect(screen.getByText('Standard')).toBeTruthy();
  });

  it('renders "Enhanced" for enhanced level', () => {
    render(<DbsLevelBadge level="enhanced" />);
    expect(screen.getByText('Enhanced')).toBeTruthy();
  });

  it('renders "Enhanced + Barred" for enhanced_barred level', () => {
    render(<DbsLevelBadge level="enhanced_barred" />);
    expect(screen.getByText('Enhanced + Barred')).toBeTruthy();
  });

  it('falls back to raw level for unknown value', () => {
    render(<DbsLevelBadge level="super_basic" />);
    expect(screen.getByText('super_basic')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DbsAlertBanner
// ---------------------------------------------------------------------------

describe('DbsAlertBanner', () => {
  it('renders nothing when there are no alerts', () => {
    const { container } = render(<DbsAlertBanner alerts={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a red alert banner', () => {
    const alerts: DbsAlert[] = [
      {
        severity: 'red',
        title: 'DBS expired: John Doe',
        message: 'Certificate 123 expired 5 days ago.',
        dbsCheckId: 'check-1',
        staffProfileId: 'staff-1',
        daysUntilExpiry: -5,
      },
    ];
    render(<DbsAlertBanner alerts={alerts} />);
    expect(screen.getByText('DBS expired: John Doe')).toBeTruthy();
    expect(screen.getByText('Certificate 123 expired 5 days ago.')).toBeTruthy();
  });

  it('renders an amber alert banner', () => {
    const alerts: DbsAlert[] = [
      {
        severity: 'amber',
        title: 'DBS recheck approaching: Jane Smith',
        message: 'Certificate 456 expires in 20 days.',
        dbsCheckId: 'check-2',
        staffProfileId: 'staff-2',
        daysUntilExpiry: 20,
      },
    ];
    render(<DbsAlertBanner alerts={alerts} />);
    expect(
      screen.getByText('DBS recheck approaching: Jane Smith'),
    ).toBeTruthy();
  });

  it('renders red alerts before amber alerts', () => {
    const alerts: DbsAlert[] = [
      {
        severity: 'amber',
        title: 'Amber alert',
        message: 'Amber message',
        dbsCheckId: 'check-1',
        staffProfileId: 'staff-1',
        daysUntilExpiry: 20,
      },
      {
        severity: 'red',
        title: 'Red alert',
        message: 'Red message',
        dbsCheckId: 'check-2',
        staffProfileId: 'staff-2',
        daysUntilExpiry: -5,
      },
    ];
    render(<DbsAlertBanner alerts={alerts} />);
    // The wrapper div has role="alert" - check the titles are in correct order
    const titles = screen.getAllByText(/alert/i);
    expect(titles[0]?.textContent).toContain('Red alert');
  });

  it('renders multiple alerts', () => {
    const alerts: DbsAlert[] = [
      {
        severity: 'red',
        title: 'Alert 1',
        message: 'Message 1',
        dbsCheckId: 'check-1',
        staffProfileId: 'staff-1',
        daysUntilExpiry: -1,
      },
      {
        severity: 'red',
        title: 'Alert 2',
        message: 'Message 2',
        dbsCheckId: 'check-2',
        staffProfileId: 'staff-2',
        daysUntilExpiry: -3,
      },
    ];
    render(<DbsAlertBanner alerts={alerts} />);
    expect(screen.getByText('Alert 1')).toBeTruthy();
    expect(screen.getByText('Alert 2')).toBeTruthy();
  });
});
