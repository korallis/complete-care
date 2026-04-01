/**
 * Tests for property UI components.
 *
 * Validates:
 * - PropertyList renders empty state and property cards
 * - OccupancyDashboard renders summary and per-property breakdown
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/test-org/properties'),
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

import { PropertyList } from '@/components/properties/property-list';
import { OccupancyDashboard } from '@/components/properties/occupancy-dashboard';
import type { PropertyListItem, OccupancyDashboardResult } from '@/features/properties/actions';

// ---------------------------------------------------------------------------
// PropertyList
// ---------------------------------------------------------------------------

const mockProperty: PropertyListItem = {
  id: 'prop-1',
  address: {
    line1: '42 Oak Avenue',
    city: 'Bristol',
    postcode: 'BS1 1AA',
  },
  landlordName: 'Acme Housing',
  propertyType: 'shared_house',
  capacity: 4,
  status: 'active',
  activeTenancyCount: 2,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-03-01'),
};

describe('PropertyList', () => {
  it('renders empty state when no properties', () => {
    render(
      <PropertyList
        properties={[]}
        orgSlug="test-org"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('No properties yet')).toBeTruthy();
  });

  it('shows add CTA in empty state when user can create', () => {
    render(
      <PropertyList
        properties={[]}
        orgSlug="test-org"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('Add property')).toBeTruthy();
  });

  it('hides add CTA when user cannot create', () => {
    render(
      <PropertyList
        properties={[]}
        orgSlug="test-org"
        canCreate={false}
        totalCount={0}
      />,
    );
    expect(screen.queryByText('Add property')).toBeNull();
  });

  it('renders property cards', () => {
    render(
      <PropertyList
        properties={[mockProperty]}
        orgSlug="test-org"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('42 Oak Avenue')).toBeTruthy();
  });

  it('shows occupancy information', () => {
    render(
      <PropertyList
        properties={[mockProperty]}
        orgSlug="test-org"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('2/4 occupied')).toBeTruthy();
  });

  it('shows vacancy count', () => {
    render(
      <PropertyList
        properties={[mockProperty]}
        orgSlug="test-org"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('2 vacancies')).toBeTruthy();
  });

  it('shows active status badge', () => {
    render(
      <PropertyList
        properties={[mockProperty]}
        orgSlug="test-org"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('shows landlord name', () => {
    render(
      <PropertyList
        properties={[mockProperty]}
        orgSlug="test-org"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Landlord: Acme Housing')).toBeTruthy();
  });

  it('shows total count', () => {
    render(
      <PropertyList
        properties={[mockProperty]}
        orgSlug="test-org"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('1 property')).toBeTruthy();
  });

  it('shows plural form for multiple properties', () => {
    render(
      <PropertyList
        properties={[mockProperty, { ...mockProperty, id: 'prop-2' }]}
        orgSlug="test-org"
        canCreate={true}
        totalCount={2}
      />,
    );
    expect(screen.getByText('2 properties')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// OccupancyDashboard
// ---------------------------------------------------------------------------

const mockOccupancyData: OccupancyDashboardResult = {
  properties: [
    {
      propertyId: 'prop-1',
      address: {
        line1: '42 Oak Avenue',
        city: 'Bristol',
        postcode: 'BS1 1AA',
      },
      propertyType: 'shared_house',
      capacity: 4,
      occupied: 3,
      vacancies: 1,
      occupancyPercent: 75,
    },
    {
      propertyId: 'prop-2',
      address: {
        line1: '10 Elm Street',
        city: 'Bristol',
        postcode: 'BS2 2BB',
      },
      propertyType: 'individual_flat',
      capacity: 1,
      occupied: 1,
      vacancies: 0,
      occupancyPercent: 100,
    },
  ],
  totalCapacity: 5,
  totalOccupied: 4,
  totalVacancies: 1,
  overallOccupancyPercent: 80,
};

describe('OccupancyDashboard', () => {
  it('renders summary cards', () => {
    render(<OccupancyDashboard data={mockOccupancyData} />);
    expect(screen.getByText('2')).toBeTruthy(); // Properties count
    expect(screen.getByText('5')).toBeTruthy(); // Total Capacity
    expect(screen.getByText('4')).toBeTruthy(); // Occupied
    expect(screen.getByText('80%')).toBeTruthy(); // Occupancy Rate
  });

  it('renders per-property breakdown', () => {
    render(<OccupancyDashboard data={mockOccupancyData} />);
    expect(screen.getByText('42 Oak Avenue')).toBeTruthy();
    expect(screen.getByText('10 Elm Street')).toBeTruthy();
  });

  it('shows vacancy counts per property', () => {
    render(<OccupancyDashboard data={mockOccupancyData} />);
    expect(screen.getByText('1 vacancy')).toBeTruthy();
    expect(screen.getByText('Full')).toBeTruthy();
  });

  it('shows occupancy ratios', () => {
    render(<OccupancyDashboard data={mockOccupancyData} />);
    expect(screen.getByText('3/4')).toBeTruthy();
    expect(screen.getByText('1/1')).toBeTruthy();
  });
});
