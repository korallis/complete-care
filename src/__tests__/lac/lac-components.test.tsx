/**
 * Tests for LAC UI components.
 *
 * Validates:
 * - LacRecordDetail renders legal status, contacts, and key details
 * - PlacementPlanList renders plans with correct status badges
 * - StatusChangeHistory renders timeline entries
 * - Empty states render correctly
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LacRecordDetail } from '@/components/lac/lac-record-detail';
import { PlacementPlanList } from '@/components/lac/placement-plan-list';
import { StatusChangeHistory } from '@/components/lac/status-change-history';
import type { LacRecord, PlacementPlan, LacStatusChange } from '@/lib/db/schema/lac';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockLacRecord: LacRecord = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  organisationId: '660e8400-e29b-41d4-a716-446655440000',
  personId: '770e8400-e29b-41d4-a716-446655440000',
  legalStatus: 'section20',
  legalStatusDate: '2026-03-15',
  placingAuthority: 'London Borough of Camden',
  socialWorkerName: 'Jane Smith',
  socialWorkerEmail: 'jane.smith@camden.gov.uk',
  socialWorkerPhone: '020 1234 5678',
  iroName: 'John Doe',
  iroEmail: 'john.doe@camden.gov.uk',
  iroPhone: '020 9876 5432',
  admissionDate: '2026-03-20',
  createdAt: new Date('2026-03-20'),
  updatedAt: new Date('2026-03-20'),
};

const mockPlacementPlan: PlacementPlan = {
  id: '880e8400-e29b-41d4-a716-446655440000',
  organisationId: '660e8400-e29b-41d4-a716-446655440000',
  personId: '770e8400-e29b-41d4-a716-446655440000',
  lacRecordId: '550e8400-e29b-41d4-a716-446655440000',
  dueDate: '2026-03-27',
  completedDate: null,
  content: { objectives: 'Test objectives' },
  status: 'draft',
  reviewDate: '2026-06-20',
  reviewedById: null,
  createdAt: new Date('2026-03-20'),
  updatedAt: new Date('2026-03-20'),
};

const mockStatusChange: LacStatusChange = {
  id: '990e8400-e29b-41d4-a716-446655440000',
  organisationId: '660e8400-e29b-41d4-a716-446655440000',
  lacRecordId: '550e8400-e29b-41d4-a716-446655440000',
  previousStatus: 'section20',
  newStatus: 'ico',
  changedDate: '2026-03-25',
  reason: 'Court granted interim care order',
  changedById: 'aa0e8400-e29b-41d4-a716-446655440000',
  changedByName: 'Admin User',
  createdAt: new Date('2026-03-25'),
  updatedAt: new Date('2026-03-25'),
};

// ---------------------------------------------------------------------------
// LacRecordDetail
// ---------------------------------------------------------------------------

describe('LacRecordDetail', () => {
  it('renders legal status badge', () => {
    render(
      <LacRecordDetail
        record={mockLacRecord}
        personName="Alice Smith"
        orgSlug="test-org"
        personId={mockLacRecord.personId}
        canEdit={false}
      />,
    );
    expect(screen.getByText('S.20')).toBeDefined();
  });

  it('renders person name', () => {
    render(
      <LacRecordDetail
        record={mockLacRecord}
        personName="Alice Smith"
        orgSlug="test-org"
        personId={mockLacRecord.personId}
        canEdit={false}
      />,
    );
    expect(screen.getByText('Alice Smith')).toBeDefined();
  });

  it('renders placing authority', () => {
    render(
      <LacRecordDetail
        record={mockLacRecord}
        personName="Alice Smith"
        orgSlug="test-org"
        personId={mockLacRecord.personId}
        canEdit={false}
      />,
    );
    expect(screen.getByText('London Borough of Camden')).toBeDefined();
  });

  it('renders social worker name', () => {
    render(
      <LacRecordDetail
        record={mockLacRecord}
        personName="Alice Smith"
        orgSlug="test-org"
        personId={mockLacRecord.personId}
        canEdit={false}
      />,
    );
    expect(screen.getByText('Jane Smith')).toBeDefined();
  });

  it('renders IRO name', () => {
    render(
      <LacRecordDetail
        record={mockLacRecord}
        personName="Alice Smith"
        orgSlug="test-org"
        personId={mockLacRecord.personId}
        canEdit={false}
      />,
    );
    expect(screen.getByText('John Doe')).toBeDefined();
  });

  it('renders edit link when canEdit is true', () => {
    render(
      <LacRecordDetail
        record={mockLacRecord}
        personName="Alice Smith"
        orgSlug="test-org"
        personId={mockLacRecord.personId}
        canEdit={true}
      />,
    );
    expect(screen.getByText('Edit record')).toBeDefined();
  });

  it('does not render edit link when canEdit is false', () => {
    render(
      <LacRecordDetail
        record={mockLacRecord}
        personName="Alice Smith"
        orgSlug="test-org"
        personId={mockLacRecord.personId}
        canEdit={false}
      />,
    );
    expect(screen.queryByText('Edit record')).toBeNull();
  });

  it('renders social worker contact details', () => {
    render(
      <LacRecordDetail
        record={mockLacRecord}
        personName="Alice Smith"
        orgSlug="test-org"
        personId={mockLacRecord.personId}
        canEdit={false}
      />,
    );
    expect(screen.getByText('jane.smith@camden.gov.uk')).toBeDefined();
    expect(screen.getByText('020 1234 5678')).toBeDefined();
  });

  it('renders IRO contact details', () => {
    render(
      <LacRecordDetail
        record={mockLacRecord}
        personName="Alice Smith"
        orgSlug="test-org"
        personId={mockLacRecord.personId}
        canEdit={false}
      />,
    );
    expect(screen.getByText('john.doe@camden.gov.uk')).toBeDefined();
    expect(screen.getByText('020 9876 5432')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// PlacementPlanList
// ---------------------------------------------------------------------------

describe('PlacementPlanList', () => {
  it('renders empty state when no plans', () => {
    render(
      <PlacementPlanList
        plans={[]}
        orgSlug="test-org"
        personId="test-person"
        canCreate={false}
      />,
    );
    expect(screen.getByText('No placement plans yet')).toBeDefined();
  });

  it('renders empty state with create button when canCreate', () => {
    render(
      <PlacementPlanList
        plans={[]}
        orgSlug="test-org"
        personId="test-person"
        canCreate={true}
      />,
    );
    expect(screen.getByText('Create placement plan')).toBeDefined();
  });

  it('renders plan count', () => {
    render(
      <PlacementPlanList
        plans={[mockPlacementPlan]}
        orgSlug="test-org"
        personId="test-person"
        canCreate={false}
      />,
    );
    expect(screen.getByText('1 placement plan')).toBeDefined();
  });

  it('renders plan cards', () => {
    render(
      <PlacementPlanList
        plans={[mockPlacementPlan]}
        orgSlug="test-org"
        personId="test-person"
        canCreate={false}
      />,
    );
    expect(screen.getByText('Placement Plan')).toBeDefined();
  });

  it('renders new plan button when canCreate', () => {
    render(
      <PlacementPlanList
        plans={[mockPlacementPlan]}
        orgSlug="test-org"
        personId="test-person"
        canCreate={true}
      />,
    );
    expect(screen.getByText('New placement plan')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// StatusChangeHistory
// ---------------------------------------------------------------------------

describe('StatusChangeHistory', () => {
  it('renders empty state when no changes', () => {
    render(<StatusChangeHistory changes={[]} />);
    expect(
      screen.getByText('No status changes recorded yet.'),
    ).toBeDefined();
  });

  it('renders status change entries', () => {
    render(<StatusChangeHistory changes={[mockStatusChange]} />);
    expect(screen.getByText('Status change history')).toBeDefined();
  });

  it('renders previous and new status labels', () => {
    render(<StatusChangeHistory changes={[mockStatusChange]} />);
    expect(screen.getByText('S.20')).toBeDefined();
    expect(screen.getByText('ICO')).toBeDefined();
  });

  it('renders change reason', () => {
    render(<StatusChangeHistory changes={[mockStatusChange]} />);
    expect(
      screen.getByText(/Court granted interim care order/),
    ).toBeDefined();
  });

  it('renders changed by name', () => {
    render(<StatusChangeHistory changes={[mockStatusChange]} />);
    expect(screen.getByText(/Admin User/)).toBeDefined();
  });

  it('renders multiple changes', () => {
    const secondChange: LacStatusChange = {
      ...mockStatusChange,
      id: 'bb0e8400-e29b-41d4-a716-446655440000',
      previousStatus: 'ico',
      newStatus: 'co',
      changedDate: '2026-04-15',
      reason: 'Full care order granted',
    };
    render(
      <StatusChangeHistory changes={[secondChange, mockStatusChange]} />,
    );
    const coElements = screen.getAllByText('CO');
    expect(coElements.length).toBeGreaterThan(0);
    const icoElements = screen.getAllByText('ICO');
    expect(icoElements.length).toBeGreaterThan(0);
  });
});
