import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChildrensRegister } from '@/components/ofsted/childrens-register';
import type { ChildrensRegisterEntry } from '@/lib/db/schema/ofsted';

const baseEntry = {
  organisationId: 'org-1',
  personId: 'person-1',
  legalStatus: 'section20',
  placingAuthority: 'Bristol City Council',
  socialWorkerName: 'Lucy Morgan',
  socialWorkerEmail: 'lucy@example.com',
  socialWorkerPhone: '0117 000 0000',
  iroName: 'Helen Jarvis',
  emergencyContact: {
    name: 'Sarah Hart',
    relationship: 'Mother',
    phone: '07000 000000',
    email: null,
  },
  createdAt: new Date('2026-04-01T09:00:00.000Z'),
  updatedAt: new Date('2026-04-01T09:00:00.000Z'),
} satisfies Omit<ChildrensRegisterEntry, 'id' | 'admissionDate' | 'dischargeDate'>;

const entries: ChildrensRegisterEntry[] = [
  {
    ...baseEntry,
    id: 'entry-1',
    admissionDate: '2026-03-01',
    dischargeDate: null,
  },
  {
    ...baseEntry,
    id: 'entry-2',
    personId: 'person-2',
    admissionDate: '2026-01-10',
    dischargeDate: '2026-03-18',
  },
];

describe('ChildrensRegister', () => {
  it('shows current residents by default', () => {
    render(
      <ChildrensRegister
        entries={entries}
        personNames={{ 'person-1': 'Amelia Hart', 'person-2': 'Mia Young' }}
        canManage={true}
        orgSlug="test-org"
      />,
    );

    expect(screen.getByText('Amelia Hart')).toBeDefined();
    expect(screen.queryByText('Mia Young')).toBeNull();
  });

  it('filters to departed residents', () => {
    render(
      <ChildrensRegister
        entries={entries}
        personNames={{ 'person-1': 'Amelia Hart', 'person-2': 'Mia Young' }}
        canManage={true}
        orgSlug="test-org"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Departed \(1\)/i }));
    expect(screen.getByText('Mia Young')).toBeDefined();
    expect(screen.queryByText('Amelia Hart')).toBeNull();
  });
});
