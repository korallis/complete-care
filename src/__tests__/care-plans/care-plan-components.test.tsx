/**
 * Tests for care plan UI components.
 *
 * Validates:
 * - CarePlanStatusBadge renders correct labels and styles
 * - ReviewStatusBadge shows overdue/due-soon indicators
 * - CarePlanVersionHistory renders version list correctly
 * - CarePlanList renders empty state and plan cards
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/test-org/persons/person-1/care-plans'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock auth/db for server action imports
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

import { CarePlanStatusBadge, ReviewStatusBadge } from '@/components/care-plans/care-plan-status-badge';
import { CarePlanList } from '@/components/care-plans/care-plan-list';
import { CarePlanVersionHistory } from '@/components/care-plans/care-plan-version-history';
import type { CarePlanListItem } from '@/features/care-plans/actions';
import type { CarePlanVersion } from '@/lib/db/schema/care-plan-versions';

// ---------------------------------------------------------------------------
// CarePlanStatusBadge
// ---------------------------------------------------------------------------

describe('CarePlanStatusBadge', () => {
  it('renders "Draft" for draft status', () => {
    render(<CarePlanStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeTruthy();
  });

  it('renders "In Review" for review status', () => {
    render(<CarePlanStatusBadge status="review" />);
    expect(screen.getByText('In Review')).toBeTruthy();
  });

  it('renders "Approved" for approved status', () => {
    render(<CarePlanStatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeTruthy();
  });

  it('renders "Archived" for archived status', () => {
    render(<CarePlanStatusBadge status="archived" />);
    expect(screen.getByText('Archived')).toBeTruthy();
  });

  it('falls back gracefully for unknown status', () => {
    render(<CarePlanStatusBadge status="unknown" />);
    expect(screen.getByText('unknown')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ReviewStatusBadge
// ---------------------------------------------------------------------------

describe('ReviewStatusBadge', () => {
  it('renders null for null review date', () => {
    const { container } = render(<ReviewStatusBadge nextReviewDate={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Overdue" badge for past date', () => {
    render(<ReviewStatusBadge nextReviewDate="2020-01-01" />);
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('renders "Due soon" badge for date within 7 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const dateStr = soon.toISOString().slice(0, 10);
    render(<ReviewStatusBadge nextReviewDate={dateStr} />);
    expect(screen.getByText('Due soon')).toBeTruthy();
  });

  it('renders nothing for far future date', () => {
    const { container } = render(<ReviewStatusBadge nextReviewDate="2099-01-01" />);
    // Should render null (no badge needed for far future)
    expect(container.firstChild).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// CarePlanList
// ---------------------------------------------------------------------------

const mockPlan: CarePlanListItem = {
  id: 'plan-1',
  title: 'Comprehensive Care Plan',
  status: 'approved',
  version: 3,
  template: 'comprehensive',
  reviewFrequency: 'monthly',
  nextReviewDate: '2099-06-01',
  approvedAt: new Date('2026-03-01'),
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-03-01'),
};

describe('CarePlanList', () => {
  it('renders empty state when no care plans', () => {
    render(
      <CarePlanList
        carePlans={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('No care plans yet')).toBeTruthy();
  });

  it('shows create CTA in empty state when user can create', () => {
    render(
      <CarePlanList
        carePlans={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('Create care plan')).toBeTruthy();
  });

  it('hides create CTA in empty state when user cannot create', () => {
    render(
      <CarePlanList
        carePlans={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={false}
        totalCount={0}
      />,
    );
    expect(screen.queryByText('Create care plan')).toBeNull();
  });

  it('renders care plan cards', () => {
    render(
      <CarePlanList
        carePlans={[mockPlan]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Comprehensive Care Plan')).toBeTruthy();
  });

  it('shows version number', () => {
    render(
      <CarePlanList
        carePlans={[mockPlan]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('v3')).toBeTruthy();
  });

  it('shows status badge', () => {
    render(
      <CarePlanList
        carePlans={[mockPlan]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Approved')).toBeTruthy();
  });

  it('shows total count', () => {
    render(
      <CarePlanList
        carePlans={[mockPlan]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText(/1 care plan/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// CarePlanVersionHistory
// ---------------------------------------------------------------------------

const mockVersions: CarePlanVersion[] = [
  {
    id: 'v2-id',
    carePlanId: 'plan-1',
    organisationId: 'org-1',
    versionNumber: 2,
    title: 'Comprehensive Care Plan',
    sections: [],
    status: 'approved',
    createdById: 'user-1',
    createdByName: 'Alice Smith',
    createdAt: new Date('2026-03-01'),
  },
  {
    id: 'v1-id',
    carePlanId: 'plan-1',
    organisationId: 'org-1',
    versionNumber: 1,
    title: 'Comprehensive Care Plan',
    sections: [],
    status: 'draft',
    createdById: 'user-1',
    createdByName: 'Alice Smith',
    createdAt: new Date('2026-01-15'),
  },
];

describe('CarePlanVersionHistory', () => {
  it('renders empty state when no versions', () => {
    render(
      <CarePlanVersionHistory
        versions={[]}
        currentVersion={1}
        orgSlug="test-org"
        personId="person-1"
        carePlanId="plan-1"
      />,
    );
    expect(screen.getByText('No version history available.')).toBeTruthy();
  });

  it('renders version list', () => {
    render(
      <CarePlanVersionHistory
        versions={mockVersions}
        currentVersion={2}
        orgSlug="test-org"
        personId="person-1"
        carePlanId="plan-1"
      />,
    );
    expect(screen.getByText('v2')).toBeTruthy();
    expect(screen.getByText('v1')).toBeTruthy();
  });

  it('marks current version', () => {
    render(
      <CarePlanVersionHistory
        versions={mockVersions}
        currentVersion={2}
        orgSlug="test-org"
        personId="person-1"
        carePlanId="plan-1"
      />,
    );
    expect(screen.getByText('Current')).toBeTruthy();
  });

  it('shows author name', () => {
    render(
      <CarePlanVersionHistory
        versions={mockVersions}
        currentVersion={2}
        orgSlug="test-org"
        personId="person-1"
        carePlanId="plan-1"
      />,
    );
    const authorElements = screen.getAllByText('Alice Smith');
    expect(authorElements.length).toBeGreaterThan(0);
  });

  it('shows compare controls when multiple versions exist', () => {
    render(
      <CarePlanVersionHistory
        versions={mockVersions}
        currentVersion={2}
        orgSlug="test-org"
        personId="person-1"
        carePlanId="plan-1"
      />,
    );
    // Should show "Compare" buttons for each version
    const compareButtons = screen.getAllByText('Compare');
    expect(compareButtons.length).toBeGreaterThanOrEqual(2);
  });
});
