import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StandardDetail } from '@/components/ofsted/standard-detail';
import type { OfstedStandard } from '@/lib/db/schema/ofsted';
import type { OfstedEvidenceWithReviewer } from '@/features/ofsted/actions';
import { QUALITY_STANDARDS } from '@/features/ofsted/standards';

const mockStandard: OfstedStandard = {
  id: '2f5b88a0-4c2d-4ea4-9e1d-6fba180b7f10',
  organisationId: '53cd0d03-5555-4444-9999-111111111111',
  regulationNumber: 6,
  standardName: 'The quality and purpose of care standard',
  description: 'Children receive care aligned to the home statement of purpose.',
  createdAt: new Date('2026-04-01T08:00:00.000Z'),
  updatedAt: new Date('2026-04-01T08:00:00.000Z'),
};

const mockEvidence: OfstedEvidenceWithReviewer[] = [
  {
    id: '30509b97-0c86-4f83-b5f7-b3c67ba26911',
    organisationId: mockStandard.organisationId,
    standardId: mockStandard.id,
    subRequirementId: 'reg6_1',
    evidenceType: 'care_plan',
    evidenceId: null,
    description: 'Placement plan objective references quality of care actions.',
    status: 'evidenced',
    reviewedById: 'a8e93520-44d0-4968-80f1-30f25367fb41',
    reviewedByName: 'Alex Reviewer',
    reviewedAt: new Date('2026-04-01T09:00:00.000Z'),
    createdAt: new Date('2026-04-01T09:00:00.000Z'),
    updatedAt: new Date('2026-04-01T09:00:00.000Z'),
  },
];

describe('StandardDetail', () => {
  it('renders standard heading and evidence description', () => {
    render(
      <StandardDetail
        standard={mockStandard}
        template={QUALITY_STANDARDS[0]}
        evidence={mockEvidence}
        canManage={false}
        onAddEvidence={() => {}}
      />,
    );

    expect(screen.getByText(mockStandard.standardName)).toBeDefined();
    expect(
      screen.getByText(
        'Placement plan objective references quality of care actions.',
      ),
    ).toBeDefined();
  });

  it('shows add evidence actions for managers', () => {
    const onAddEvidence = vi.fn();

    render(
      <StandardDetail
        standard={mockStandard}
        template={QUALITY_STANDARDS[0]}
        evidence={mockEvidence}
        canManage={true}
        onAddEvidence={onAddEvidence}
      />,
    );

    fireEvent.click(screen.getAllByText('Add Evidence')[0]);
    expect(onAddEvidence).toHaveBeenCalled();
  });

  it('renders reviewed metadata for linked evidence', () => {
    render(
      <StandardDetail
        standard={mockStandard}
        template={QUALITY_STANDARDS[0]}
        evidence={mockEvidence}
        canManage={false}
        onAddEvidence={() => {}}
      />,
    );

    expect(screen.getByText(/Reviewed 1 Apr 2026 by/i)).toBeDefined();
    expect(screen.getByText('Alex Reviewer')).toBeDefined();
  });
});
