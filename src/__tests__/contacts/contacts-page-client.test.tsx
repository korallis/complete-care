import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/features/contacts/actions', () => ({
  createApprovedContact: vi.fn(),
  createContactRecord: vi.fn(),
  createContactSchedule: vi.fn(),
  getComplianceSummary: vi.fn().mockResolvedValue({ success: true, data: [] }),
  updateContactScheduleStatus: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { ContactsPageClient } from '@/app/(dashboard)/[orgSlug]/persons/[personId]/contacts/contacts-page-client';

const contact = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  organisationId: 'org-1',
  personId: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Jane Doe',
  relationship: 'mother',
  phone: '07700 111111',
  email: null,
  address: null,
  allowedContactTypes: ['phone'],
  frequency: 'Weekly phone call',
  supervisionLevel: 'supervised_by_staff',
  hasRestrictions: false,
  courtOrderReference: null,
  courtOrderDate: null,
  courtOrderConditions: null,
  isActive: true,
  approvedById: null,
  approvedAt: new Date('2026-04-01T08:00:00.000Z'),
  createdAt: new Date('2026-04-01T08:00:00.000Z'),
  updatedAt: new Date('2026-04-01T08:00:00.000Z'),
};

describe('ContactsPageClient', () => {
  it('hides schedule actions for read-only users', () => {
    render(
      <ContactsPageClient
        orgSlug="child-home"
        personId="550e8400-e29b-41d4-a716-446655440001"
        canManage={false}
        initialContacts={[contact]}
        initialSchedules={[]}
        initialRecords={[]}
        initialComplianceSummaries={[]}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Schedule' }),
    ).toBeNull();
  });

  it('shows schedule actions for managers', () => {
    render(
      <ContactsPageClient
        orgSlug="child-home"
        personId="550e8400-e29b-41d4-a716-446655440001"
        canManage={true}
        initialContacts={[contact]}
        initialSchedules={[]}
        initialRecords={[]}
        initialComplianceSummaries={[]}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Schedule' }),
    ).toBeDefined();
  });
});
