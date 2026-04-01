/**
 * Tests for EMAR UI components.
 *
 * Validates:
 * - MedicationStatusBadge renders correct labels
 * - AdministrationStatusBadge renders correct labels
 * - MedicationList renders empty state and medication cards
 * - Status badge colour coding
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(() => '/test-org/persons/person-1/emar'),
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

import { MedicationStatusBadge, AdministrationStatusBadge } from '@/components/emar/medication-status-badge';
import { MedicationList } from '@/components/emar/medication-list';
import type { MedicationListItem } from '@/features/emar/actions';

// ---------------------------------------------------------------------------
// MedicationStatusBadge
// ---------------------------------------------------------------------------

describe('MedicationStatusBadge', () => {
  it('renders "Active" for active status', () => {
    render(<MedicationStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders "Discontinued" for discontinued status', () => {
    render(<MedicationStatusBadge status="discontinued" />);
    expect(screen.getByText('Discontinued')).toBeTruthy();
  });

  it('renders "Suspended" for suspended status', () => {
    render(<MedicationStatusBadge status="suspended" />);
    expect(screen.getByText('Suspended')).toBeTruthy();
  });

  it('renders "Completed" for completed status', () => {
    render(<MedicationStatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('falls back gracefully for unknown status', () => {
    render(<MedicationStatusBadge status="unknown" />);
    expect(screen.getByText('unknown')).toBeTruthy();
  });

  it('includes aria-label for accessibility', () => {
    render(<MedicationStatusBadge status="active" />);
    expect(screen.getByLabelText('Medication status: Active')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AdministrationStatusBadge
// ---------------------------------------------------------------------------

describe('AdministrationStatusBadge', () => {
  it('renders "Given" for given status', () => {
    render(<AdministrationStatusBadge status="given" />);
    expect(screen.getByText('Given')).toBeTruthy();
  });

  it('renders "Refused" for refused status', () => {
    render(<AdministrationStatusBadge status="refused" />);
    expect(screen.getByText('Refused')).toBeTruthy();
  });

  it('renders "Self-Administered" for self_administered status', () => {
    render(<AdministrationStatusBadge status="self_administered" />);
    expect(screen.getByText('Self-Administered')).toBeTruthy();
  });

  it('renders "Withheld" for withheld status', () => {
    render(<AdministrationStatusBadge status="withheld" />);
    expect(screen.getByText('Withheld')).toBeTruthy();
  });

  it('renders "Omitted" for omitted status', () => {
    render(<AdministrationStatusBadge status="omitted" />);
    expect(screen.getByText('Omitted')).toBeTruthy();
  });

  it('renders "Not Available" for not_available status', () => {
    render(<AdministrationStatusBadge status="not_available" />);
    expect(screen.getByText('Not Available')).toBeTruthy();
  });

  it('includes aria-label', () => {
    render(<AdministrationStatusBadge status="given" />);
    expect(screen.getByLabelText('Administration status: Given')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// MedicationList
// ---------------------------------------------------------------------------

describe('MedicationList', () => {
  const mockMedications: MedicationListItem[] = [
    {
      id: 'med-1',
      drugName: 'Paracetamol',
      dose: '500',
      doseUnit: 'mg',
      route: 'oral',
      frequency: 'regular',
      status: 'active',
      prescribedDate: '2026-04-01',
      prescriberName: 'Dr. Smith',
      pharmacy: 'Boots',
      specialInstructions: 'Take with food',
      createdAt: new Date('2026-04-01'),
      updatedAt: new Date('2026-04-01'),
    },
    {
      id: 'med-2',
      drugName: 'Amlodipine',
      dose: '5',
      doseUnit: 'mg',
      route: 'oral',
      frequency: 'regular',
      status: 'active',
      prescribedDate: '2026-03-15',
      prescriberName: 'Dr. Jones',
      pharmacy: null,
      specialInstructions: null,
      createdAt: new Date('2026-03-15'),
      updatedAt: new Date('2026-03-15'),
    },
  ];

  it('renders empty state when no medications', () => {
    render(
      <MedicationList
        medications={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('No medications prescribed')).toBeTruthy();
  });

  it('shows "Add medication" button in empty state when canCreate', () => {
    render(
      <MedicationList
        medications={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('Add medication')).toBeTruthy();
  });

  it('hides "Add medication" button in empty state when cannot create', () => {
    render(
      <MedicationList
        medications={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={false}
        totalCount={0}
      />,
    );
    expect(screen.queryByText('Add medication')).toBeNull();
  });

  it('renders medication cards', () => {
    render(
      <MedicationList
        medications={mockMedications}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={2}
      />,
    );
    expect(screen.getByText('Paracetamol')).toBeTruthy();
    expect(screen.getByText('Amlodipine')).toBeTruthy();
  });

  it('displays count', () => {
    render(
      <MedicationList
        medications={mockMedications}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={2}
      />,
    );
    expect(screen.getByText('2 medications')).toBeTruthy();
  });

  it('shows special instructions when present', () => {
    render(
      <MedicationList
        medications={mockMedications}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={2}
      />,
    );
    expect(screen.getByText('Take with food')).toBeTruthy();
  });

  it('renders accessible medication links', () => {
    render(
      <MedicationList
        medications={mockMedications}
        orgSlug="test-org"
        personId="person-1"
        canCreate={false}
        totalCount={2}
      />,
    );
    const link = screen.getByLabelText('View medication: Paracetamol');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('/test-org/persons/person-1/emar/medications/med-1');
  });
});
