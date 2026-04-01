/**
 * Tests for training UI components.
 *
 * Validates:
 * - TrainingStatusBadge renders correct labels and styles
 * - QualificationStatusBadge renders correct labels
 * - TrainingCategoryBadge renders correct labels
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
  usePathname: vi.fn(() => '/test-org/staff/123/training'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
vi.mock('@/lib/rbac', () => ({
  requirePermission: vi.fn(),
  UnauthorizedError: class extends Error {},
}));

import {
  TrainingStatusBadge,
  QualificationStatusBadge,
  TrainingCategoryBadge,
} from '@/components/training/training-status-badge';

// ---------------------------------------------------------------------------
// TrainingStatusBadge
// ---------------------------------------------------------------------------

describe('TrainingStatusBadge', () => {
  it('renders "Current" for current status', () => {
    render(<TrainingStatusBadge status="current" />);
    expect(screen.getByText('Current')).toBeTruthy();
  });

  it('renders "Expiring Soon" for expiring_soon status', () => {
    render(<TrainingStatusBadge status="expiring_soon" />);
    expect(screen.getByText('Expiring Soon')).toBeTruthy();
  });

  it('renders "Expired" for expired status', () => {
    render(<TrainingStatusBadge status="expired" />);
    expect(screen.getByText('Expired')).toBeTruthy();
  });

  it('renders "Not Completed" for not_completed status', () => {
    render(<TrainingStatusBadge status="not_completed" />);
    expect(screen.getByText('Not Completed')).toBeTruthy();
  });

  it('falls back to raw status for unknown value', () => {
    render(<TrainingStatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// QualificationStatusBadge
// ---------------------------------------------------------------------------

describe('QualificationStatusBadge', () => {
  it('renders "Completed" for completed status', () => {
    render(<QualificationStatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('renders "Working Towards" for working_towards status', () => {
    render(<QualificationStatusBadge status="working_towards" />);
    expect(screen.getByText('Working Towards')).toBeTruthy();
  });

  it('falls back to raw status for unknown value', () => {
    render(<QualificationStatusBadge status="in_progress" />);
    expect(screen.getByText('in_progress')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// TrainingCategoryBadge
// ---------------------------------------------------------------------------

describe('TrainingCategoryBadge', () => {
  it('renders "Mandatory" for mandatory category', () => {
    render(<TrainingCategoryBadge category="mandatory" />);
    expect(screen.getByText('Mandatory')).toBeTruthy();
  });

  it('renders "Clinical" for clinical category', () => {
    render(<TrainingCategoryBadge category="clinical" />);
    expect(screen.getByText('Clinical')).toBeTruthy();
  });

  it('renders "Specialist" for specialist category', () => {
    render(<TrainingCategoryBadge category="specialist" />);
    expect(screen.getByText('Specialist')).toBeTruthy();
  });

  it('renders "Management" for management category', () => {
    render(<TrainingCategoryBadge category="management" />);
    expect(screen.getByText('Management')).toBeTruthy();
  });

  it('renders "Other" for other category', () => {
    render(<TrainingCategoryBadge category="other" />);
    expect(screen.getByText('Other')).toBeTruthy();
  });

  it('falls back to raw category for unknown value', () => {
    render(<TrainingCategoryBadge category="custom_cat" />);
    expect(screen.getByText('custom_cat')).toBeTruthy();
  });
});
