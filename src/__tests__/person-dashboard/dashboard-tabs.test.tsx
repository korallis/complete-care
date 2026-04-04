import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardTabs } from '@/components/person-dashboard/dashboard-tabs';

const mockUsePathname = vi.fn(() => '/test-org/persons/person-1/meetings');

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('DashboardTabs', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/test-org/persons/person-1/meetings');
  });

  it('renders meetings and complaints tabs for person records', () => {
    render(<DashboardTabs orgSlug="test-org" personId="person-1" />);

    expect(screen.getByRole('tab', { name: 'Meetings' })).toHaveAttribute(
      'href',
      '/test-org/persons/person-1/meetings',
    );
    expect(screen.getByRole('tab', { name: 'Complaints' })).toHaveAttribute(
      'href',
      '/test-org/persons/person-1/complaints',
    );
  });

  it('marks the matching tab as active from the pathname', () => {
    render(<DashboardTabs orgSlug="test-org" personId="person-1" />);

    expect(screen.getByRole('tab', { name: 'Meetings' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Complaints' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('marks the Clinical tab active for nested clinical routes', () => {
    mockUsePathname.mockReturnValue(
      '/test-org/persons/person-1/clinical/alerts',
    );

    render(<DashboardTabs orgSlug="test-org" personId="person-1" />);

    expect(screen.getByRole('tab', { name: 'Clinical' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Meetings' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });
});
