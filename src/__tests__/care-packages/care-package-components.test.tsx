/**
 * Tests for care package UI components.
 *
 * Validates:
 * - PackageStatusBadge renders correct labels
 * - VisitStatusBadge renders correct labels
 * - EnvironmentCard shows/hides keySafeCode based on canViewKeySafe
 * - VisitSchedule renders visits grouped by date
 * - VisitSchedule shows empty state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/test-org/persons/person-1/care-package'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  PackageStatusBadge,
  VisitStatusBadge,
} from '@/components/care-packages/care-package-status-badge';
import { EnvironmentCard } from '@/components/care-packages/environment-card';
import { VisitSchedule } from '@/components/care-packages/visit-schedule';
import type { ScheduledVisit } from '@/lib/db/schema/care-packages';

// ---------------------------------------------------------------------------
// PackageStatusBadge
// ---------------------------------------------------------------------------

describe('PackageStatusBadge', () => {
  it('renders "Active" for active status', () => {
    render(<PackageStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders "Suspended" for suspended status', () => {
    render(<PackageStatusBadge status="suspended" />);
    expect(screen.getByText('Suspended')).toBeTruthy();
  });

  it('renders "Ended" for ended status', () => {
    render(<PackageStatusBadge status="ended" />);
    expect(screen.getByText('Ended')).toBeTruthy();
  });

  it('falls back for unknown status', () => {
    render(<PackageStatusBadge status="unknown" />);
    expect(screen.getByText('unknown')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// VisitStatusBadge
// ---------------------------------------------------------------------------

describe('VisitStatusBadge', () => {
  it('renders "Scheduled" for scheduled status', () => {
    render(<VisitStatusBadge status="scheduled" />);
    expect(screen.getByText('Scheduled')).toBeTruthy();
  });

  it('renders "Completed" for completed status', () => {
    render(<VisitStatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('renders "Missed" for missed status', () => {
    render(<VisitStatusBadge status="missed" />);
    expect(screen.getByText('Missed')).toBeTruthy();
  });

  it('renders "In Progress" for in_progress status', () => {
    render(<VisitStatusBadge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeTruthy();
  });

  it('renders "Cancelled" for cancelled status', () => {
    render(<VisitStatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// EnvironmentCard
// ---------------------------------------------------------------------------

describe('EnvironmentCard', () => {
  it('shows empty state when no environment notes', () => {
    render(
      <EnvironmentCard
        environmentNotes={{}}
        canViewKeySafe={false}
      />,
    );
    expect(screen.getByText('No environment information recorded.')).toBeTruthy();
  });

  it('shows entry instructions', () => {
    render(
      <EnvironmentCard
        environmentNotes={{ entryInstructions: 'Use the side gate' }}
        canViewKeySafe={false}
      />,
    );
    expect(screen.getByText('Use the side gate')).toBeTruthy();
  });

  it('shows hazard notes', () => {
    render(
      <EnvironmentCard
        environmentNotes={{ hazards: 'Loose carpet on stairs' }}
        canViewKeySafe={false}
      />,
    );
    expect(screen.getByText('Loose carpet on stairs')).toBeTruthy();
  });

  it('shows parking info', () => {
    render(
      <EnvironmentCard
        environmentNotes={{ parking: 'Free parking on driveway' }}
        canViewKeySafe={false}
      />,
    );
    expect(screen.getByText('Free parking on driveway')).toBeTruthy();
  });

  it('hides keySafeCode when canViewKeySafe is false', () => {
    render(
      <EnvironmentCard
        environmentNotes={{ keySafeCode: '1234' }}
        canViewKeySafe={false}
      />,
    );
    expect(screen.queryByText('1234')).toBeNull();
    expect(screen.getByText('Only visible to assigned carers')).toBeTruthy();
  });

  it('shows reveal button when canViewKeySafe is true', () => {
    render(
      <EnvironmentCard
        environmentNotes={{ keySafeCode: '1234' }}
        canViewKeySafe={true}
      />,
    );
    expect(screen.queryByText('1234')).toBeNull();
    expect(screen.getByText('Reveal code')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// VisitSchedule
// ---------------------------------------------------------------------------

const mockVisit = (overrides: Partial<ScheduledVisit> = {}): ScheduledVisit & { staffName: string | null } => ({
  id: 'visit-1',
  visitTypeId: 'vt-1',
  carePackageId: 'pkg-1',
  personId: 'person-1',
  organisationId: 'org-1',
  assignedStaffId: null,
  date: '2026-04-06',
  scheduledStart: '07:00',
  scheduledEnd: '07:30',
  status: 'scheduled',
  isAdHoc: false,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  staffName: null,
  ...overrides,
});

describe('VisitSchedule', () => {
  it('renders empty state when no visits', () => {
    render(<VisitSchedule visits={[]} visitTypeNames={{}} />);
    expect(screen.getByText('No visits scheduled for this period.')).toBeTruthy();
  });

  it('renders visits grouped by date', () => {
    const visits = [
      mockVisit({ id: 'v1', date: '2026-04-06', scheduledStart: '07:00' }),
      mockVisit({ id: 'v2', date: '2026-04-06', scheduledStart: '12:00', scheduledEnd: '12:30' }),
      mockVisit({ id: 'v3', date: '2026-04-07', scheduledStart: '07:00' }),
    ];

    render(<VisitSchedule visits={visits} visitTypeNames={{ 'vt-1': 'morning' }} />);

    // Should have date headers
    expect(screen.getByText(/Monday, 6 Apr 2026/)).toBeTruthy();
    expect(screen.getByText(/Tuesday, 7 Apr 2026/)).toBeTruthy();
  });

  it('shows visit count per day', () => {
    const visits = [
      mockVisit({ id: 'v1', date: '2026-04-06' }),
      mockVisit({ id: 'v2', date: '2026-04-06', scheduledStart: '12:00' }),
    ];

    render(<VisitSchedule visits={visits} visitTypeNames={{}} />);
    expect(screen.getByText('(2 visits)')).toBeTruthy();
  });

  it('shows "Unassigned" for visits without staff', () => {
    const visits = [mockVisit({ assignedStaffId: null })];

    render(<VisitSchedule visits={visits} visitTypeNames={{}} />);
    expect(screen.getByText('Unassigned')).toBeTruthy();
  });

  it('shows "Ad-hoc" badge for ad-hoc visits', () => {
    const visits = [mockVisit({ isAdHoc: true })];

    render(<VisitSchedule visits={visits} visitTypeNames={{}} />);
    expect(screen.getByText('Ad-hoc')).toBeTruthy();
  });
});
