/**
 * Tests for risk assessment UI components.
 *
 * Validates:
 * - RiskLevelBadge renders correct labels and styles
 * - AssessmentStatusBadge renders correct labels
 * - ReviewStatusBadge shows overdue/due-soon indicators
 * - RiskAssessmentList renders empty state and assessment cards
 * - RiskAlertBanner renders alerts correctly
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
  usePathname: vi.fn(
    () => '/test-org/persons/person-1/risk-assessments',
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
  RiskLevelBadge,
  AssessmentStatusBadge,
  ReviewStatusBadge,
} from '@/components/risk-assessments/risk-level-badge';
import { RiskAssessmentList } from '@/components/risk-assessments/risk-assessment-list';
import { RiskAlertBanner } from '@/components/risk-assessments/risk-alert-banner';
import type { RiskAssessmentListItem } from '@/features/risk-assessments/actions';
import type { RiskAlert } from '@/features/risk-assessments/alerts';

// ---------------------------------------------------------------------------
// RiskLevelBadge
// ---------------------------------------------------------------------------

describe('RiskLevelBadge', () => {
  it('renders "Low" for low risk', () => {
    render(<RiskLevelBadge riskLevel="low" />);
    expect(screen.getByText('Low')).toBeTruthy();
  });

  it('renders "Medium" for medium risk', () => {
    render(<RiskLevelBadge riskLevel="medium" />);
    expect(screen.getByText('Medium')).toBeTruthy();
  });

  it('renders "High" for high risk', () => {
    render(<RiskLevelBadge riskLevel="high" />);
    expect(screen.getByText('High')).toBeTruthy();
  });

  it('renders "Critical" for critical risk', () => {
    render(<RiskLevelBadge riskLevel="critical" />);
    expect(screen.getByText('Critical')).toBeTruthy();
  });

  it('has aria-label for risk level', () => {
    render(<RiskLevelBadge riskLevel="high" />);
    expect(screen.getByRole('status')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AssessmentStatusBadge
// ---------------------------------------------------------------------------

describe('AssessmentStatusBadge', () => {
  it('renders "Draft" for draft status', () => {
    render(<AssessmentStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeTruthy();
  });

  it('renders "Completed" for completed status', () => {
    render(<AssessmentStatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('falls back gracefully for unknown status', () => {
    render(<AssessmentStatusBadge status="unknown" />);
    expect(screen.getByText('unknown')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ReviewStatusBadge
// ---------------------------------------------------------------------------

describe('ReviewStatusBadge', () => {
  it('renders null for null review date', () => {
    const { container } = render(<ReviewStatusBadge reviewDate={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Overdue" badge for past date', () => {
    render(<ReviewStatusBadge reviewDate="2020-01-01" />);
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('renders "Due soon" badge for date within 7 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const dateStr = soon.toISOString().slice(0, 10);
    render(<ReviewStatusBadge reviewDate={dateStr} />);
    expect(screen.getByText('Due soon')).toBeTruthy();
  });

  it('renders nothing for far future date', () => {
    const { container } = render(
      <ReviewStatusBadge reviewDate="2099-01-01" />,
    );
    expect(container.firstChild).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// RiskAssessmentList
// ---------------------------------------------------------------------------

const mockAssessment: RiskAssessmentListItem = {
  id: 'assessment-1',
  templateId: 'falls',
  riskLevel: 'medium',
  totalScore: 6,
  status: 'completed',
  version: 1,
  completedByName: 'Jane Doe',
  completedAt: new Date('2026-03-15'),
  reviewDate: '2099-06-01',
  reviewFrequency: 'monthly',
  createdAt: new Date('2026-03-15'),
  updatedAt: new Date('2026-03-15'),
};

describe('RiskAssessmentList', () => {
  it('renders empty state when no assessments', () => {
    render(
      <RiskAssessmentList
        assessments={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('No risk assessments yet')).toBeTruthy();
  });

  it('shows create CTA in empty state when user can create', () => {
    render(
      <RiskAssessmentList
        assessments={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={0}
      />,
    );
    expect(screen.getByText('New assessment')).toBeTruthy();
  });

  it('hides create CTA in empty state when user cannot create', () => {
    render(
      <RiskAssessmentList
        assessments={[]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={false}
        totalCount={0}
      />,
    );
    expect(screen.queryByText('New assessment')).toBeNull();
  });

  it('renders assessment cards', () => {
    render(
      <RiskAssessmentList
        assessments={[mockAssessment]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Falls')).toBeTruthy();
  });

  it('shows risk level badge', () => {
    render(
      <RiskAssessmentList
        assessments={[mockAssessment]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('Medium')).toBeTruthy();
  });

  it('shows version number', () => {
    render(
      <RiskAssessmentList
        assessments={[mockAssessment]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText('v1')).toBeTruthy();
  });

  it('shows total count', () => {
    render(
      <RiskAssessmentList
        assessments={[mockAssessment]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        totalCount={1}
      />,
    );
    expect(screen.getByText(/1 assessment/)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// RiskAlertBanner
// ---------------------------------------------------------------------------

describe('RiskAlertBanner', () => {
  it('renders nothing when no alerts', () => {
    const { container } = render(<RiskAlertBanner alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders red alert', () => {
    const alerts: RiskAlert[] = [
      {
        severity: 'red',
        title: 'High risk: Falls',
        message: 'Falls assessment scored high risk.',
        assessmentId: 'a1',
        templateId: 'falls',
        personId: 'p1',
      },
    ];
    render(<RiskAlertBanner alerts={alerts} />);
    expect(screen.getByText('High risk: Falls')).toBeTruthy();
  });

  it('renders amber alert', () => {
    const alerts: RiskAlert[] = [
      {
        severity: 'amber',
        title: 'Review overdue: Waterlow',
        message: 'Waterlow assessment review was due.',
        assessmentId: 'a2',
        templateId: 'waterlow',
        personId: 'p1',
      },
    ];
    render(<RiskAlertBanner alerts={alerts} />);
    expect(screen.getByText('Review overdue: Waterlow')).toBeTruthy();
  });

  it('sorts red alerts before amber', () => {
    const alerts: RiskAlert[] = [
      {
        severity: 'amber',
        title: 'Amber first',
        message: 'msg',
        assessmentId: 'a1',
        templateId: 't1',
        personId: 'p1',
      },
      {
        severity: 'red',
        title: 'Red second',
        message: 'msg',
        assessmentId: 'a2',
        templateId: 't2',
        personId: 'p1',
      },
    ];
    render(<RiskAlertBanner alerts={alerts} />);
    const allAlerts = screen.getAllByRole('alert');
    expect(allAlerts.length).toBe(2);
    // Red should be first in the DOM
    expect(allAlerts[0].textContent).toContain('Red second');
  });
});
