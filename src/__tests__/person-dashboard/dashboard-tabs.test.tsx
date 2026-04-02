import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardTabs } from '@/components/person-dashboard/dashboard-tabs';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/test-org/persons/person-1/meetings'),
}));

describe('DashboardTabs', () => {
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
});
