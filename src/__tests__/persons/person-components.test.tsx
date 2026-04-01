/**
 * Tests for person management UI components.
 *
 * Validates:
 * - PersonAvatar displays initials correctly
 * - PersonTypeBadge renders correct labels
 * - PersonStatusBadge renders correct status
 * - PersonsEmptyState renders CTA for new org
 * - PersonsEmptyState shows filtered empty state
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock DB dependencies (needed because PersonsEmptyState imports from features/persons/utils
// which re-exports from actions, which imports db)
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock('@/auth', () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn() })),
  usePathname: vi.fn(() => '/test-org/persons'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import { PersonAvatar } from '@/components/persons/person-avatar';
import { PersonTypeBadge, PersonStatusBadge } from '@/components/persons/person-type-badge';
import { PersonsEmptyState } from '@/components/persons/persons-empty-state';
import type { PersonTerminology } from '@/features/persons/utils';

// ---------------------------------------------------------------------------
// PersonAvatar
// ---------------------------------------------------------------------------

describe('PersonAvatar', () => {
  it('renders initials from full name', () => {
    render(<PersonAvatar fullName="Alice Smith" />);
    expect(screen.getByText('AS')).toBeTruthy();
  });

  it('renders single initial for single name', () => {
    render(<PersonAvatar fullName="Alice" />);
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('renders allergy indicator when hasAllergies is true', () => {
    render(<PersonAvatar fullName="Bob Jones" hasAllergies={true} />);
    const allergyIndicator = screen.getByLabelText('Has allergies');
    expect(allergyIndicator).toBeTruthy();
  });

  it('does not render allergy indicator by default', () => {
    render(<PersonAvatar fullName="Bob Jones" />);
    expect(screen.queryByLabelText('Has allergies')).toBeNull();
  });

  it('renders photo when photoUrl is provided', () => {
    render(<PersonAvatar fullName="Carol White" photoUrl="https://example.com/photo.jpg" />);
    // The img is inside an aria-hidden container; use getAllByAltText
    const img = screen.getByAltText('Photo of Carol White');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
  });
});

// ---------------------------------------------------------------------------
// PersonTypeBadge
// ---------------------------------------------------------------------------

describe('PersonTypeBadge', () => {
  it('renders "Resident" for resident type', () => {
    render(<PersonTypeBadge type="resident" />);
    expect(screen.getByText('Resident')).toBeTruthy();
  });

  it('renders "Client" for client type', () => {
    render(<PersonTypeBadge type="client" />);
    expect(screen.getByText('Client')).toBeTruthy();
  });

  it('renders "Young Person" for young_person type', () => {
    render(<PersonTypeBadge type="young_person" />);
    expect(screen.getByText('Young Person')).toBeTruthy();
  });

  it('renders the raw type value for unknown types', () => {
    render(<PersonTypeBadge type="unknown_type" />);
    expect(screen.getByText('unknown_type')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PersonStatusBadge
// ---------------------------------------------------------------------------

describe('PersonStatusBadge', () => {
  it('renders "Active" for active status', () => {
    render(<PersonStatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders "Archived" for archived status', () => {
    render(<PersonStatusBadge status="archived" />);
    expect(screen.getByText('Archived')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PersonsEmptyState
// ---------------------------------------------------------------------------

const domCareTerminology: PersonTerminology = {
  singular: 'Client',
  plural: 'Clients',
  singularLower: 'client',
  pluralLower: 'clients',
};

const childrenTerminology: PersonTerminology = {
  singular: 'Young Person',
  plural: 'Young People',
  singularLower: 'young person',
  pluralLower: 'young people',
};

describe('PersonsEmptyState', () => {
  it('renders empty state for new org with CTA', () => {
    render(
      <PersonsEmptyState
        orgSlug="test-org"
        terminology={domCareTerminology}
        canCreate={true}
      />,
    );
    expect(screen.getByText('No clients yet')).toBeTruthy();
    const cta = screen.getByRole('link', { name: 'Add Client' });
    expect(cta).toBeTruthy();
    expect(cta.getAttribute('href')).toBe('/test-org/persons/new');
  });

  it('renders domain-specific terminology in empty state', () => {
    render(
      <PersonsEmptyState
        orgSlug="test-org"
        terminology={childrenTerminology}
        canCreate={true}
      />,
    );
    expect(screen.getByText('No young people yet')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Add Young Person' })).toBeTruthy();
  });

  it('does not show CTA when canCreate is false', () => {
    render(
      <PersonsEmptyState
        orgSlug="test-org"
        terminology={domCareTerminology}
        canCreate={false}
      />,
    );
    expect(screen.queryByRole('link', { name: 'Add Client' })).toBeNull();
  });

  it('renders filtered empty state message', () => {
    render(
      <PersonsEmptyState
        orgSlug="test-org"
        terminology={domCareTerminology}
        isFiltered={true}
        canCreate={true}
      />,
    );
    expect(screen.getByText('No results found')).toBeTruthy();
    expect(screen.getByText(/Try adjusting your search/)).toBeTruthy();
  });

  it('empty state has descriptive text about what can be managed', () => {
    render(
      <PersonsEmptyState
        orgSlug="test-org"
        terminology={domCareTerminology}
        canCreate={true}
      />,
    );
    // Check that description mentions the care management features
    expect(screen.getByText(/care/i)).toBeTruthy();
  });
});
