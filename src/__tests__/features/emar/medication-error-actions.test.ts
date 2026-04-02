import { describe, expect, it } from 'vitest';

import {
  assignInvestigator,
  createHomelyRemedyProtocol,
  createTopicalMar,
  deactivateHomelyRemedyProtocol,
  discontinueTopicalMar,
  recordHomelyRemedyAdministration,
  recordTopicalAdministration,
  reportMedicationError,
  updateInvestigation,
} from '@/features/emar/errors/actions';

describe('emar medication-error and remedial actions', () => {
  const organisationId = '550e8400-e29b-41d4-a716-446655440101';
  const userId = '550e8400-e29b-41d4-a716-446655440102';
  const errorId = '550e8400-e29b-41d4-a716-446655440103';
  const investigatorId = '550e8400-e29b-41d4-a716-446655440104';
  const protocolId = '550e8400-e29b-41d4-a716-446655440105';
  const topicalMarId = '550e8400-e29b-41d4-a716-446655440106';

  it('rejects medication errors discovered before they occurred', async () => {
    await expect(
      reportMedicationError(organisationId, userId, {
        errorType: 'wrong_time',
        severity: 'moderate',
        occurredAt: '2026-04-02T10:00:00.000Z',
        discoveredAt: '2026-04-02T09:59:59.000Z',
        description: 'Medication round entry was recorded before the dose was given.',
      }),
    ).rejects.toThrow('Discovery date cannot be before occurrence date');
  });

  it('returns parsed payloads for medication incident investigation and topical/homely remedy actions', async () => {
    await expect(
      reportMedicationError(organisationId, userId, {
        errorType: 'wrong_dose',
        severity: 'low',
        occurredAt: '2026-04-02T08:00:00.000Z',
        discoveredAt: '2026-04-02T08:15:00.000Z',
        personId: '550e8400-e29b-41d4-a716-446655440107',
        description: 'A double dose was nearly administered and stopped before harm occurred.',
        immediateActions: 'Medication withheld and GP contacted for advice.',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        organisationId,
        reportedById: userId,
        errorType: 'wrong_dose',
      }),
    });

    await expect(
      updateInvestigation(organisationId, errorId, userId, {
        investigationStatus: 'resolved',
        investigationFindings: 'Shift handover omitted a recent dosage change.',
        rootCause: 'Communication gap during shift change.',
        correctiveActions: 'Updated handover checklist and retrained staff.',
        lessonsLearned: 'Dose changes must be read back during handover.',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: errorId,
        organisationId,
        investigationStatus: 'resolved',
      }),
    });

    await expect(
      createTopicalMar(organisationId, userId, {
        personId: '550e8400-e29b-41d4-a716-446655440108',
        medicationName: 'Aqueous cream',
        instructions: 'Apply to dry skin twice daily.',
        frequency: 'twice_daily',
        startDate: '2026-04-02',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        organisationId,
        medicationName: 'Aqueous cream',
      }),
    });

    await expect(
      recordTopicalAdministration(organisationId, userId, {
        topicalMarId,
        administeredAt: '2026-04-02T09:30:00.000Z',
        status: 'applied',
        applicationSite: 'Left forearm',
        notes: 'Skin intact and moisturised.',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        organisationId,
        administeredById: userId,
        topicalMarId,
      }),
    });

    await expect(
      createHomelyRemedyProtocol(organisationId, userId, {
        medicationName: 'Paracetamol',
        form: 'tablet',
        strength: '500mg',
        indication: 'Mild to moderate pain',
        dosageInstructions: '1-2 tablets every 4-6 hours when required',
        maxDose24Hours: '8 tablets',
        approvedBy: 'Dr Khan',
        approvedDate: '2026-04-01',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        organisationId,
        recordedById: userId,
        medicationName: 'Paracetamol',
      }),
    });

    await expect(
      recordHomelyRemedyAdministration(organisationId, userId, {
        protocolId,
        personId: '550e8400-e29b-41d4-a716-446655440109',
        administeredAt: '2026-04-02T13:00:00.000Z',
        doseGiven: '2 tablets',
        reason: 'Headache reported after lunch',
        outcome: 'Settled within 30 minutes',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        organisationId,
        administeredById: userId,
        protocolId,
      }),
    });
  });

  it('returns success for current stubbed assignment and deactivation helpers', async () => {
    await expect(assignInvestigator(organisationId, errorId, investigatorId, userId)).resolves.toEqual({
      success: true,
    });
    await expect(discontinueTopicalMar(organisationId, topicalMarId, userId, '2026-04-10')).resolves.toEqual({
      success: true,
    });
    await expect(deactivateHomelyRemedyProtocol(organisationId, protocolId, userId)).resolves.toEqual({
      success: true,
    });
  });
});
