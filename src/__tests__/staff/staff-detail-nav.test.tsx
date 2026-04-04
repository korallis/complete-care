import type { ReactNode } from 'react';
import type { StaffProfile } from '@/lib/db/schema/staff-profiles';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StaffDetailNav } from '@/components/staff/staff-detail-nav';
import { StaffDetail } from '@/components/staff/staff-detail';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() })),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const sampleStaff = {
  id: 'staff-123',
  fullName: 'Jane Doe',
  status: 'active',
  contractType: 'full_time',
  jobTitle: 'Senior Carer',
  weeklyHours: 37.5,
  startDate: '2024-01-10',
  endDate: null,
  niNumber: 'AB123456C',
  email: 'jane@example.com',
  phone: '07123456789',
  emergencyContactName: 'John Doe',
  emergencyContactPhone: '07999999999',
  emergencyContactRelation: 'Brother',
  employmentHistory: [],
} as const satisfies Partial<StaffProfile>;

describe('StaffDetailNav', () => {
  it('renders real links for each staff workspace section', () => {
    render(
      <StaffDetailNav
        orgSlug="acme"
        staffId="staff-123"
        activeSection="training"
      />,
    );

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/acme/staff/staff-123',
    );
    expect(screen.getByRole('link', { name: 'DBS checks' })).toHaveAttribute(
      'href',
      '/acme/staff/staff-123/dbs',
    );
    expect(screen.getByRole('link', { name: 'Training' })).toHaveAttribute(
      'href',
      '/acme/staff/staff-123/training',
    );
    expect(screen.getByRole('link', { name: 'Supervisions' })).toHaveAttribute(
      'href',
      '/acme/staff/staff-123/supervision',
    );
    expect(screen.getByRole('link', { name: 'Leave' })).toHaveAttribute(
      'href',
      '/acme/staff/staff-123/leave',
    );
  });

  it('marks only the active section as current', () => {
    render(
      <StaffDetailNav
        orgSlug="acme"
        staffId="staff-123"
        activeSection="leave"
      />,
    );

    expect(screen.getByRole('link', { name: 'Leave' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});

describe('StaffDetail', () => {
  it('uses the shared navigation instead of coming-soon tabs', () => {
    render(
      <StaffDetail
        staff={sampleStaff as StaffProfile}
        orgSlug="acme"
        canEdit={false}
        canUpdateStatus={false}
      />,
    );

    expect(
      screen.getByRole('link', { name: 'DBS checks' }),
    ).toHaveAttribute('href', '/acme/staff/staff-123/dbs');
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    expect(screen.getByText('Employment details')).toBeInTheDocument();
  });
});
