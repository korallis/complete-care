import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { RestraintList } from '@/features/keyworker/components/restraint-list';
import type { Restraint } from '@/lib/db/schema';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const baseRestraint = {
  id: 'restraint-1',
  organisationId: 'org-1',
  personId: 'person-1',
  dateTime: '2026-04-03T09:00:00.000Z',
  duration: 12,
  technique: 'team_teach',
  reason: 'Prevented injury during escalation',
  injuryCheck: {
    childInjured: false,
    staffInjured: false,
    medicalAttentionRequired: false,
  },
  childDebrief: null,
  staffDebrief: null,
  managementReview: null,
  recordedById: 'user-1',
  reviewedById: null,
  createdAt: new Date('2026-04-03T09:05:00.000Z'),
  updatedAt: new Date('2026-04-03T09:05:00.000Z'),
} as unknown as Restraint;

describe('RestraintList', () => {
  it('allows staff with update permission to complete missing debriefs', async () => {
    const onUpdateDebrief = vi.fn().mockResolvedValue({
      success: true,
      data: {
        ...baseRestraint,
        childDebrief: 'Talked through what happened with the child.',
        staffDebrief: 'Staff debrief captured learning points.',
      },
    });

    render(
      <RestraintList
        restraints={[baseRestraint]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        canUpdate={true}
        canApprove={false}
        onUpdateDebrief={onUpdateDebrief}
        onReview={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Child debrief'), {
      target: { value: 'Talked through what happened with the child.' },
    });
    fireEvent.change(screen.getByLabelText('Staff debrief'), {
      target: { value: 'Staff debrief captured learning points.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save debrief' }));

    await waitFor(() =>
      expect(onUpdateDebrief).toHaveBeenCalledWith('restraint-1', {
        childDebrief: 'Talked through what happened with the child.',
        staffDebrief: 'Staff debrief captured learning points.',
      }),
    );
    expect(toast.success).toHaveBeenCalledWith('Debrief saved');
    expect(screen.getByText(/Child debrief:/)).toBeTruthy();
  });

  it('surfaces manager sign-off once both debriefs are complete', async () => {
    const onReview = vi.fn().mockResolvedValue({
      success: true,
      data: {
        ...baseRestraint,
        childDebrief: 'Child debrief complete',
        staffDebrief: 'Staff debrief complete',
        managementReview: 'Manager confirmed debrief quality and follow-up.',
      },
    });

    render(
      <RestraintList
        restraints={[
          {
            ...baseRestraint,
            childDebrief: 'Child debrief complete',
            staffDebrief: 'Staff debrief complete',
          } as Restraint,
        ]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        canUpdate={true}
        canApprove={true}
        onUpdateDebrief={vi.fn()}
        onReview={onReview}
      />,
    );

    fireEvent.change(screen.getByLabelText('Manager sign-off'), {
      target: { value: 'Manager confirmed debrief quality and follow-up.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record manager sign-off' }));

    await waitFor(() =>
      expect(onReview).toHaveBeenCalledWith(
        'restraint-1',
        'Manager confirmed debrief quality and follow-up.',
      ),
    );
    expect(toast.success).toHaveBeenCalledWith('Manager sign-off recorded');
    expect(screen.getByText(/Manager sign-off:/)).toBeTruthy();
  });

  it('does not expose the debrief editor without update permission', () => {
    render(
      <RestraintList
        restraints={[baseRestraint]}
        orgSlug="test-org"
        personId="person-1"
        canCreate={true}
        canUpdate={false}
        canApprove={false}
        onUpdateDebrief={vi.fn()}
        onReview={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Save debrief' })).toBeNull();
    expect(screen.queryByLabelText('Child debrief')).toBeNull();
  });
});
