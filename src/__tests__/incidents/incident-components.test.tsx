/**
 * Tests for incident reporting UI components.
 *
 * Validates:
 * - SeverityBadge renders correct labels and styles
 * - StatusBadge renders correct labels
 * - NotifiableBadge shows indicator for notifiable incidents
 * - DutyOfCandourBadge shows indicator for duty of candour
 * - IncidentList renders empty state and incident cards
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(
    () => '/test-org/persons/person-1/incidents',
  ),
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

import {
  SeverityBadge,
  StatusBadge,
  NotifiableBadge,
  DutyOfCandourBadge,
} from '@/components/incidents/severity-badge';
import { IncidentList } from '@/components/incidents/incident-list';
import type { IncidentListItem } from '@/features/incidents/actions';

// ---------------------------------------------------------------------------
// SeverityBadge
// ---------------------------------------------------------------------------

describe('SeverityBadge', () => {
  it('renders "Minor" for minor severity', () => {
    render(<SeverityBadge severity="minor" />);
    expect(screen.getByText('Minor')).toBeTruthy();
  });

  it('renders "Moderate" for moderate severity', () => {
    render(<SeverityBadge severity="moderate" />);
    expect(screen.getByText('Moderate')).toBeTruthy();
  });

  it('renders "Serious" for serious severity', () => {
    render(<SeverityBadge severity="serious" />);
    expect(screen.getByText('Serious')).toBeTruthy();
  });

  it('renders "Death" for death severity', () => {
    render(<SeverityBadge severity="death" />);
    expect(screen.getByText('Death')).toBeTruthy();
  });

  it('has aria-label for severity', () => {
    render(<SeverityBadge severity="serious" />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows dot indicator for serious severity', () => {
    const { container } = render(<SeverityBadge severity="serious" />);
    // Serious severity should have a dot indicator
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

describe('StatusBadge', () => {
  it('renders "Reported" for reported status', () => {
    render(<StatusBadge status="reported" />);
    expect(screen.getByText('Reported')).toBeTruthy();
  });

  it('renders "Under Review" for under_review status', () => {
    render(<StatusBadge status="under_review" />);
    expect(screen.getByText('Under Review')).toBeTruthy();
  });

  it('renders "Investigating" for investigating status', () => {
    render(<StatusBadge status="investigating" />);
    expect(screen.getByText('Investigating')).toBeTruthy();
  });

  it('renders "Resolved" for resolved status', () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeTruthy();
  });

  it('renders "Closed" for closed status', () => {
    render(<StatusBadge status="closed" />);
    expect(screen.getByText('Closed')).toBeTruthy();
  });

  it('falls back gracefully for unknown status', () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText('unknown')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// NotifiableBadge
// ---------------------------------------------------------------------------

describe('NotifiableBadge', () => {
  it('renders nothing when not notifiable', () => {
    const { container } = render(<NotifiableBadge isNotifiable="no" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders badge when notifiable', () => {
    render(<NotifiableBadge isNotifiable="yes" />);
    expect(screen.getByText(/Notifiable/)).toBeTruthy();
  });

  it('shows regulatory body in badge', () => {
    render(<NotifiableBadge isNotifiable="yes" regulatoryBody="CQC" />);
    expect(screen.getByText(/CQC/)).toBeTruthy();
  });

  it('has aria-label', () => {
    render(<NotifiableBadge isNotifiable="yes" />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DutyOfCandourBadge
// ---------------------------------------------------------------------------

describe('DutyOfCandourBadge', () => {
  it('renders nothing when not triggered', () => {
    const { container } = render(<DutyOfCandourBadge triggered="no" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders badge when triggered', () => {
    render(<DutyOfCandourBadge triggered="yes" />);
    expect(screen.getByText('Duty of Candour')).toBeTruthy();
  });

  it('has aria-label', () => {
    render(<DutyOfCandourBadge triggered="yes" />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// IncidentList
// ---------------------------------------------------------------------------

const mockIncident: IncidentListItem = {
  id: 'incident-1',
  personId: 'person-1',
  reportedByName: 'Jane Doe',
  dateTime: new Date('2026-03-15T14:30:00'),
  location: 'bedroom',
  description: 'Person found on the floor after an unwitnessed fall. No visible injuries.',
  severity: 'moderate',
  status: 'reported',
  isNotifiable: 'no',
  dutyOfCandourTriggered: 'no',
  createdAt: new Date('2026-03-15T15:00:00'),
};

describe('IncidentList', () => {
  it('renders empty state when no incidents', () => {
    render(
      <IncidentList
        incidents={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('No incidents recorded')).toBeTruthy();
  });

  it('shows create CTA in empty state when user can create', () => {
    render(
      <IncidentList
        incidents={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('Report incident')).toBeTruthy();
  });

  it('hides create CTA in empty state when user cannot create', () => {
    render(
      <IncidentList
        incidents={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={false}
        totalCount={0}
      />,
    );
    expect(screen.queryByText('Report incident')).toBeNull();
  });

  it('renders incident cards', () => {
    render(
      <IncidentList
        incidents={[mockIncident]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Bedroom')).toBeTruthy();
  });

  it('shows severity badge', () => {
    render(
      <IncidentList
        incidents={[mockIncident]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Moderate')).toBeTruthy();
  });

  it('shows status badge', () => {
    render(
      <IncidentList
        incidents={[mockIncident]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Reported')).toBeTruthy();
  });

  it('shows reporter name', () => {
    render(
      <IncidentList
        incidents={[mockIncident]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Jane Doe')).toBeTruthy();
  });

  it('shows total count', () => {
    render(
      <IncidentList
        incidents={[mockIncident]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText(/1 incident/)).toBeTruthy();
  });

  it('shows description preview', () => {
    render(
      <IncidentList
        incidents={[mockIncident]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText(/Person found on the floor/)).toBeTruthy();
  });

  it('renders serious incident with notifiable badge', () => {
    const seriousIncident: IncidentListItem = {
      ...mockIncident,
      severity: 'serious',
      isNotifiable: 'yes',
      dutyOfCandourTriggered: 'yes',
    };
    render(
      <IncidentList
        incidents={[seriousIncident]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Serious')).toBeTruthy();
    expect(screen.getByText(/Notifiable/)).toBeTruthy();
    expect(screen.getByText('Duty of Candour')).toBeTruthy();
  });
});
