import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  insertQueue,
  insertValuesCalls,
  mockAuditLog,
  mockDb,
  mockRequirePermission,
  selectQueue,
} = vi.hoisted(() => {
  const selectQueue: unknown[] = [];
  const insertQueue: unknown[] = [];
  const insertValuesCalls: unknown[] = [];

  function makeAwaitableQuery<T>(result: T) {
    return {
      limit: vi.fn().mockResolvedValue(result),
      orderBy: vi.fn().mockResolvedValue(result),
      returning: vi.fn().mockResolvedValue(result),
      then: (
        resolve: (value: T) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(result).then(resolve, reject),
    };
  }

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => makeAwaitableQuery(selectQueue.shift())),
        orderBy: vi.fn(() => Promise.resolve(selectQueue.shift())),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((payload: unknown) => {
        insertValuesCalls.push(payload);
        return makeAwaitableQuery(insertQueue.shift());
      }),
    })),
  };

  return {
    selectQueue,
    insertQueue,
    insertValuesCalls,
    mockDb,
    mockRequirePermission: vi.fn(),
    mockAuditLog: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: mockRequirePermission,
  UnauthorizedError: class UnauthorizedError extends Error {},
}));
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));

import {
  checkMedicationAlerts,
  recordAllergy,
  recordAllergyOverride,
} from '@/features/emar/actions/medication-alerts';

describe('medication alert actions', () => {
  beforeEach(() => {
    selectQueue.length = 0;
    insertQueue.length = 0;
    insertValuesCalls.length = 0;
    vi.clearAllMocks();

    mockRequirePermission.mockResolvedValue({
      userId: '550e8400-e29b-41d4-a716-446655440111',
      orgId: '550e8400-e29b-41d4-a716-446655440199',
      role: 'manager',
    });
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('recordAllergy rejects invalid payloads before auth or DB work', async () => {
    const result = await recordAllergy(
      '550e8400-e29b-41d4-a716-446655440199',
      'ignored',
      {
        personId: 'bad-id',
        allergen: '',
      } as never,
    );

    expect(result.success).toBe(false);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('recordAllergy persists tenant-scoped allergy records and audits them', async () => {
    selectQueue.push([{ id: 'person-1' }]);
    insertQueue.push([{ id: '550e8400-e29b-41d4-a716-446655440210' }]);

    const result = await recordAllergy(
      '550e8400-e29b-41d4-a716-446655440199',
      'ignored',
      {
        personId: '550e8400-e29b-41d4-a716-446655440211',
        allergen: 'Penicillin',
        allergyType: 'drug',
        severity: 'severe',
        reaction: 'Shortness of breath',
      },
    );

    expect(result).toEqual({
      success: true,
      data: { allergyId: '550e8400-e29b-41d4-a716-446655440210' },
    });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: '550e8400-e29b-41d4-a716-446655440199',
      personId: '550e8400-e29b-41d4-a716-446655440211',
      allergen: 'Penicillin',
      recordedBy: '550e8400-e29b-41d4-a716-446655440111',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'allergy',
      '550e8400-e29b-41d4-a716-446655440210',
      expect.objectContaining({
        after: expect.objectContaining({
          allergen: 'Penicillin',
          severity: 'severe',
        }),
      }),
      {
        userId: '550e8400-e29b-41d4-a716-446655440111',
        organisationId: '550e8400-e29b-41d4-a716-446655440199',
      },
    );
  });

  it('checkMedicationAlerts returns blocking allergy matches for the active tenant', async () => {
    selectQueue.push(
      [
        {
          id: '550e8400-e29b-41d4-a716-446655440220',
          personId: '550e8400-e29b-41d4-a716-446655440221',
          drugName: 'Penicillin V',
          activeIngredients: ['Penicillin'],
          therapeuticClass: 'antibiotic',
        },
      ],
      [{ id: 'person-2' }],
      [
        {
          id: '550e8400-e29b-41d4-a716-446655440222',
          allergen: 'Penicillin',
          severity: 'life_threatening',
          reaction: 'Anaphylaxis',
          status: 'active',
          personId: '550e8400-e29b-41d4-a716-446655440221',
        },
      ],
      [],
      [],
    );

    const result = await checkMedicationAlerts(
      '550e8400-e29b-41d4-a716-446655440199',
      '550e8400-e29b-41d4-a716-446655440220',
      '550e8400-e29b-41d4-a716-446655440221',
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.isBlocking).toBe(true);
    expect(result.data.alerts).toEqual([
      expect.objectContaining({
        type: 'allergy',
        allergen: 'Penicillin',
        medicationName: 'Penicillin V',
        severity: 'life_threatening',
      }),
    ]);
  });

  it('recordAllergyOverride stores immutable override evidence for authorised staff', async () => {
    selectQueue.push(
      [{ id: 'membership-1' }],
      [
        {
          id: '550e8400-e29b-41d4-a716-446655440230',
          personId: '550e8400-e29b-41d4-a716-446655440231',
          allergen: 'Penicillin',
          status: 'active',
        },
      ],
      [
        {
          id: '550e8400-e29b-41d4-a716-446655440232',
          personId: '550e8400-e29b-41d4-a716-446655440231',
        },
      ],
    );
    insertQueue.push([{ id: '550e8400-e29b-41d4-a716-446655440233' }]);

    const result = await recordAllergyOverride(
      '550e8400-e29b-41d4-a716-446655440199',
      {
        personId: '550e8400-e29b-41d4-a716-446655440231',
        medicationId: '550e8400-e29b-41d4-a716-446655440232',
        allergyId: '550e8400-e29b-41d4-a716-446655440230',
        requestedBy: '550e8400-e29b-41d4-a716-446655440112',
        authorisedBy: '550e8400-e29b-41d4-a716-446655440111',
        clinicalJustification: 'Benefits outweigh risk with close observation',
        matchedAllergen: 'Penicillin',
        matchedMedicationDetail: 'Penicillin V 250mg capsules',
      },
    );

    expect(result).toEqual({
      success: true,
      data: { overrideId: '550e8400-e29b-41d4-a716-446655440233' },
    });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: '550e8400-e29b-41d4-a716-446655440199',
      personId: '550e8400-e29b-41d4-a716-446655440231',
      requestedBy: '550e8400-e29b-41d4-a716-446655440112',
      authorisedBy: '550e8400-e29b-41d4-a716-446655440111',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'allergy_alert_override',
      '550e8400-e29b-41d4-a716-446655440233',
      expect.objectContaining({
        after: expect.objectContaining({
          medicationId: '550e8400-e29b-41d4-a716-446655440232',
          allergyId: '550e8400-e29b-41d4-a716-446655440230',
        }),
      }),
      {
        userId: '550e8400-e29b-41d4-a716-446655440111',
        organisationId: '550e8400-e29b-41d4-a716-446655440199',
      },
    );
  });
});
