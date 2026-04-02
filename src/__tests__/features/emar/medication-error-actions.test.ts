import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  insertQueue,
  insertValuesCalls,
  mockAssertBelongsToOrg,
  mockAuditLog,
  mockDb,
  mockRequirePermission,
  selectQueue,
  updateQueue,
  updateSetCalls,
} = vi.hoisted(() => {
  const selectQueue: unknown[] = [];
  const insertQueue: unknown[] = [];
  const updateQueue: unknown[] = [];
  const insertValuesCalls: unknown[] = [];
  const updateSetCalls: unknown[] = [];

  function createSelectQuery(result: unknown) {
    const query = {
      where: vi.fn(() => query),
      orderBy: vi.fn(() => Promise.resolve(result)),
      limit: vi.fn(() => Promise.resolve(result)),
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    };
    return query;
  }

  function createUpdateQuery(result: unknown) {
    return {
      returning: vi.fn().mockResolvedValue(result),
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    };
  }

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => createSelectQuery(selectQueue.shift())),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((payload: unknown) => {
        insertValuesCalls.push(payload);
        const result = insertQueue.shift();
        return {
          returning: vi.fn().mockResolvedValue(result),
        };
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn((payload: unknown) => {
        updateSetCalls.push(payload);
        const result = updateQueue.shift();
        return {
          where: vi.fn(() => createUpdateQuery(result)),
        };
      }),
    })),
  };

  return {
    selectQueue,
    insertQueue,
    updateQueue,
    insertValuesCalls,
    updateSetCalls,
    mockDb,
    mockRequirePermission: vi.fn(),
    mockAuditLog: vi.fn(),
    mockAssertBelongsToOrg: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: mockRequirePermission,
  UnauthorizedError: class UnauthorizedError extends Error {},
}));
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));
vi.mock('@/lib/tenant', () => ({ assertBelongsToOrg: mockAssertBelongsToOrg }));

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
  const errorId = '550e8400-e29b-41d4-a716-446655440103';
  const investigatorId = '550e8400-e29b-41d4-a716-446655440104';
  const protocolId = '550e8400-e29b-41d4-a716-446655440105';
  const topicalMarId = '550e8400-e29b-41d4-a716-446655440106';
  const activeUserId = '550e8400-e29b-41d4-a716-446655440102';

  beforeEach(() => {
    selectQueue.length = 0;
    insertQueue.length = 0;
    updateQueue.length = 0;
    insertValuesCalls.length = 0;
    updateSetCalls.length = 0;
    vi.clearAllMocks();

    mockRequirePermission.mockResolvedValue({
      userId: activeUserId,
      orgId: organisationId,
      role: 'manager',
    });
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('rejects medication errors discovered before they occurred', async () => {
    await expect(
      reportMedicationError(organisationId, 'ignored', {
        errorType: 'wrong_time',
        severity: 'moderate',
        occurredAt: '2026-04-02T10:00:00.000Z',
        discoveredAt: '2026-04-02T09:59:59.000Z',
        description: 'Medication round entry was recorded before the dose was given.',
      }),
    ).rejects.toThrow('Discovery date cannot be before occurrence date');

    expect(mockRequirePermission).not.toHaveBeenCalled();
  });

  it('persists incident investigation and topical/homely remedy workflows with tenant scope and audits', async () => {
    insertQueue.push(
      [
        {
          id: errorId,
          organisationId,
          errorType: 'wrong_dose',
          severity: 'low',
          investigationStatus: 'reported',
          personId: '550e8400-e29b-41d4-a716-446655440107',
          reportedById: activeUserId,
        },
      ],
      [
        {
          id: topicalMarId,
          organisationId,
          personId: '550e8400-e29b-41d4-a716-446655440108',
          medicationName: 'Aqueous cream',
          frequency: 'twice_daily',
          startDate: '2026-04-02',
        },
      ],
      [
        {
          id: 'topical-admin-1',
          organisationId,
          topicalMarId,
          administeredById: activeUserId,
          applicationSite: 'Left forearm',
          status: 'applied',
        },
      ],
      [
        {
          id: protocolId,
          organisationId,
          medicationName: 'Paracetamol',
          approvedBy: 'Dr Khan',
          approvedDate: '2026-04-01',
          maxDose24Hours: '8 tablets',
          recordedById: activeUserId,
          isActive: true,
        },
      ],
      [
        {
          id: 'remedy-admin-1',
          organisationId,
          protocolId,
          personId: '550e8400-e29b-41d4-a716-446655440109',
          administeredById: activeUserId,
          doseGiven: '2 tablets',
        },
      ],
    );

    selectQueue.push(
      [
        {
          id: topicalMarId,
          organisationId,
          isActive: true,
          endDate: null,
        },
      ],
      [
        {
          id: protocolId,
          organisationId,
          maxDose24Hours: '8 tablets',
          isActive: true,
        },
      ],
      [],
      [
        {
          id: errorId,
          organisationId,
          investigationStatus: 'reported',
          investigatorId: null,
          gpNotified: false,
          gpNotifiedAt: null,
          personInformed: false,
          personInformedAt: null,
          resolvedAt: null,
        },
      ],
      [{ id: 'membership-1' }],
      [
        {
          id: errorId,
          organisationId,
          investigationStatus: 'resolved',
          investigatorId: null,
        },
      ],
      [
        {
          id: topicalMarId,
          organisationId,
          isActive: true,
          endDate: null,
        },
      ],
      [
        {
          id: protocolId,
          organisationId,
          isActive: true,
        },
      ],
    );

    updateQueue.push(
      [
        {
          id: errorId,
          organisationId,
          investigationStatus: 'resolved',
          investigatorId: null,
          gpNotified: true,
          personInformed: true,
        },
      ],
      undefined,
      undefined,
      undefined,
    );

    await expect(
      reportMedicationError(organisationId, 'ignored', {
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
        id: errorId,
        reportedById: activeUserId,
        investigationStatus: 'reported',
      }),
    });

    await expect(
      createTopicalMar(organisationId, 'ignored', {
        personId: '550e8400-e29b-41d4-a716-446655440108',
        medicationName: 'Aqueous cream',
        instructions: 'Apply to dry skin twice daily.',
        frequency: 'twice_daily',
        startDate: '2026-04-02',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: topicalMarId,
        medicationName: 'Aqueous cream',
      }),
    });

    await expect(
      recordTopicalAdministration(organisationId, 'ignored', {
        topicalMarId,
        administeredAt: '2026-04-02T09:30:00.000Z',
        status: 'applied',
        applicationSite: 'Left forearm',
        notes: 'Skin intact and moisturised.',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: 'topical-admin-1',
        topicalMarId,
        administeredById: activeUserId,
      }),
    });

    await expect(
      createHomelyRemedyProtocol(organisationId, 'ignored', {
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
        id: protocolId,
        recordedById: activeUserId,
      }),
    });

    await expect(
      recordHomelyRemedyAdministration(organisationId, 'ignored', {
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
        id: 'remedy-admin-1',
        protocolId,
        administeredById: activeUserId,
      }),
    });

    await expect(
      updateInvestigation(organisationId, errorId, 'ignored', {
        investigationStatus: 'resolved',
        investigationFindings: 'Shift handover omitted a recent dosage change.',
        rootCause: 'Communication gap during shift change.',
        correctiveActions: 'Updated handover checklist and retrained staff.',
        lessonsLearned: 'Dose changes must be read back during handover.',
        gpNotified: true,
        personInformed: true,
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: errorId,
        investigationStatus: 'resolved',
        gpNotified: true,
        personInformed: true,
      }),
    });

    await expect(assignInvestigator(organisationId, errorId, investigatorId, 'ignored')).resolves.toEqual({
      success: true,
    });
    await expect(discontinueTopicalMar(organisationId, topicalMarId, 'ignored', '2026-04-10')).resolves.toEqual({
      success: true,
    });
    await expect(deactivateHomelyRemedyProtocol(organisationId, protocolId, 'ignored')).resolves.toEqual({
      success: true,
    });

    expect(insertValuesCalls[0]).toMatchObject({
      organisationId,
      reportedById: activeUserId,
      errorType: 'wrong_dose',
    });
    expect(updateSetCalls[0]).toMatchObject({ investigationStatus: 'resolved', gpNotified: true, personInformed: true });
    expect(updateSetCalls[1]).toMatchObject({ investigatorId, investigationStatus: 'under_investigation' });
    expect(updateSetCalls[2]).toMatchObject({ isActive: false, endDate: '2026-04-10' });
    expect(updateSetCalls[3]).toMatchObject({ isActive: false });
    expect(mockAuditLog).toHaveBeenCalled();
  });

  it('rejects homely remedy administrations that exceed the approved 24-hour maximum', async () => {
    selectQueue.push(
      [
        {
          id: protocolId,
          organisationId,
          maxDose24Hours: '4 tablets',
          isActive: true,
        },
      ],
      [{ doseGiven: '3 tablets' }],
    );

    await expect(
      recordHomelyRemedyAdministration(organisationId, 'ignored', {
        protocolId,
        personId: '550e8400-e29b-41d4-a716-446655440109',
        administeredAt: '2026-04-02T13:00:00.000Z',
        doseGiven: '2 tablets',
        reason: 'Headache reported after lunch',
      }),
    ).rejects.toThrow('Homely remedy dose exceeds the approved maximum in 24 hours');

    expect(insertValuesCalls).toHaveLength(0);
  });
});
