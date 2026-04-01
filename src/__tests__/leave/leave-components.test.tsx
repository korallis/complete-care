/**
 * Tests for leave UI components.
 *
 * Validates:
 * - LeaveStatusBadge renders correct labels and styles
 * - LeaveTypeBadge renders correct labels
 * - LeaveBalanceCard renders balance data correctly
 * - LeaveRequestList renders empty state and table rows
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
  usePathname: vi.fn(() => '/test-org/staff/123/leave'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  LeaveStatusBadge,
  LeaveTypeBadge,
} from '@/components/leave/leave-status-badge';
import { LeaveBalanceCard } from '@/components/leave/leave-balance-card';
import { LeaveRequestList } from '@/components/leave/leave-request-list';

// ---------------------------------------------------------------------------
// LeaveStatusBadge
// ---------------------------------------------------------------------------

describe('LeaveStatusBadge', () => {
  it('renders "Pending" for pending status', () => {
    render(<LeaveStatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it('renders "Approved" for approved status', () => {
    render(<LeaveStatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeTruthy();
  });

  it('renders "Denied" for denied status', () => {
    render(<LeaveStatusBadge status="denied" />);
    expect(screen.getByText('Denied')).toBeTruthy();
  });

  it('renders "Cancelled" for cancelled status', () => {
    render(<LeaveStatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeTruthy();
  });

  it('renders raw status string for unknown status', () => {
    render(<LeaveStatusBadge status="unknown" />);
    expect(screen.getByText('unknown')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// LeaveTypeBadge
// ---------------------------------------------------------------------------

describe('LeaveTypeBadge', () => {
  it('renders "Annual Leave" for annual type', () => {
    render(<LeaveTypeBadge type="annual" />);
    expect(screen.getByText('Annual Leave')).toBeTruthy();
  });

  it('renders "Sick Leave" for sick type', () => {
    render(<LeaveTypeBadge type="sick" />);
    expect(screen.getByText('Sick Leave')).toBeTruthy();
  });

  it('renders "Compassionate Leave" for compassionate type', () => {
    render(<LeaveTypeBadge type="compassionate" />);
    expect(screen.getByText('Compassionate Leave')).toBeTruthy();
  });

  it('renders "Unpaid Leave" for unpaid type', () => {
    render(<LeaveTypeBadge type="unpaid" />);
    expect(screen.getByText('Unpaid Leave')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// LeaveBalanceCard
// ---------------------------------------------------------------------------

describe('LeaveBalanceCard', () => {
  const mockBalance = {
    id: 'balance-1',
    organisationId: 'org-1',
    staffProfileId: 'staff-1',
    year: 2026,
    annualEntitlement: 28,
    annualUsed: 10,
    annualRemaining: 18,
    sickDays: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders the year', () => {
    render(<LeaveBalanceCard balance={mockBalance} />);
    expect(screen.getByText(/2026/)).toBeTruthy();
  });

  it('renders remaining days', () => {
    render(<LeaveBalanceCard balance={mockBalance} />);
    expect(screen.getByText('18')).toBeTruthy();
  });

  it('renders used days', () => {
    render(<LeaveBalanceCard balance={mockBalance} />);
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('renders sick days', () => {
    render(<LeaveBalanceCard balance={mockBalance} />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('renders remaining/entitlement text', () => {
    render(<LeaveBalanceCard balance={mockBalance} />);
    expect(screen.getByText('18 / 28 days remaining')).toBeTruthy();
  });

  it('renders usage percentage', () => {
    render(<LeaveBalanceCard balance={mockBalance} />);
    expect(screen.getByText(/36%/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// LeaveRequestList
// ---------------------------------------------------------------------------

describe('LeaveRequestList', () => {
  it('renders empty state when no requests', () => {
    render(<LeaveRequestList requests={[]} />);
    expect(screen.getByText('No leave requests')).toBeTruthy();
  });

  it('renders request rows', () => {
    const requests = [
      {
        id: 'req-1',
        staffProfileId: 'staff-1',
        staffName: 'Alice Smith',
        type: 'annual',
        startDate: '2026-06-01',
        endDate: '2026-06-05',
        totalDays: 5,
        reason: 'Holiday',
        status: 'pending',
        reviewedByName: null,
        reviewedAt: null,
        reviewNote: null,
        createdAt: new Date(),
      },
    ];

    render(<LeaveRequestList requests={requests} />);
    expect(screen.getByText('Annual Leave')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it('shows cancel button when canCancel is true', () => {
    const requests = [
      {
        id: 'req-1',
        staffProfileId: 'staff-1',
        staffName: 'Alice Smith',
        type: 'annual',
        startDate: '2026-06-01',
        endDate: '2026-06-05',
        totalDays: 5,
        reason: null,
        status: 'pending',
        reviewedByName: null,
        reviewedAt: null,
        reviewNote: null,
        createdAt: new Date(),
      },
    ];

    render(
      <LeaveRequestList
        requests={requests}
        canCancel={true}
        onCancel={async () => ({ success: true })}
      />,
    );
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('does not show cancel button for denied requests', () => {
    const requests = [
      {
        id: 'req-1',
        staffProfileId: 'staff-1',
        staffName: 'Bob Jones',
        type: 'sick',
        startDate: '2026-06-01',
        endDate: '2026-06-02',
        totalDays: 2,
        reason: null,
        status: 'denied',
        reviewedByName: 'Manager',
        reviewedAt: new Date(),
        reviewNote: 'Insufficient notice',
        createdAt: new Date(),
      },
    ];

    render(
      <LeaveRequestList
        requests={requests}
        canCancel={true}
        onCancel={async () => ({ success: true })}
      />,
    );
    expect(screen.queryByText('Cancel')).toBeNull();
  });
});
