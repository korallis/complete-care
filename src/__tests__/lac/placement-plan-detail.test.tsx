import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlacementPlanDetail } from '@/components/lac/placement-plan-detail';
import type { PlacementPlan } from '@/lib/db/schema/lac';

const mockPlan: PlacementPlan = {
  id: 'a6dbd212-c645-4457-9de0-d24f155463a0',
  organisationId: '8ee43b2d-0f2a-4fef-8a07-c53245fbb045',
  personId: '336b36d2-2260-4eb4-9d02-bd6570dcbeb0',
  lacRecordId: 'c8b33ff7-2539-4070-b489-da0c4a484543',
  dueDate: '2026-04-10',
  completedDate: null,
  content: {
    objectives: 'Stabilise school attendance and family contact routine.',
    arrangements: 'Single bedroom with staff support overnight.',
  },
  status: 'draft',
  reviewDate: '2026-05-01',
  reviewedById: null,
  createdAt: new Date('2026-04-01T08:00:00.000Z'),
  updatedAt: new Date('2026-04-02T09:00:00.000Z'),
};

describe('PlacementPlanDetail', () => {
  it('renders plan content sections', () => {
    render(
      <PlacementPlanDetail
        plan={mockPlan}
        orgSlug="child-home"
        personId={mockPlan.personId}
        canEdit={false}
      />,
    );

    expect(screen.getByText('Placement Plan')).toBeDefined();
    expect(
      screen.getByText(
        'Stabilise school attendance and family contact routine.',
      ),
    ).toBeDefined();
    expect(
      screen.getByText('Single bedroom with staff support overnight.'),
    ).toBeDefined();
  });

  it('renders edit action when editable', () => {
    render(
      <PlacementPlanDetail
        plan={mockPlan}
        orgSlug="child-home"
        personId={mockPlan.personId}
        canEdit={true}
      />,
    );

    expect(screen.getByText('Edit plan')).toBeDefined();
  });
});
