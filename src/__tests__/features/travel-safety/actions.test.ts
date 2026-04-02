import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  insertQueue,
  insertValuesCalls,
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
    update: vi.fn(() => ({
      set: vi.fn((payload: unknown) => {
        updateSetCalls.push(payload);
        return {
          where: vi.fn(() => makeAwaitableQuery(updateQueue.shift())),
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
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: mockRequirePermission,
  UnauthorizedError: class UnauthorizedError extends Error {},
}));
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));

import {
  createRouteSuggestion,
  createTravelRecord,
  upsertClientEnvironment,
  upsertLoneWorkerConfig,
} from '@/features/travel-safety/actions';

describe('travel-safety actions', () => {
  beforeEach(() => {
    selectQueue.length = 0;
    insertQueue.length = 0;
    updateQueue.length = 0;
    insertValuesCalls.length = 0;
    updateSetCalls.length = 0;
    vi.clearAllMocks();

    mockRequirePermission.mockResolvedValue({
      userId: '550e8400-e29b-41d4-a716-446655440001',
      orgId: '550e8400-e29b-41d4-a716-446655440099',
      role: 'carer',
    });
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('createTravelRecord rejects invalid payloads before auth or persistence work', async () => {
    const result = await createTravelRecord({
      organisationId: 'not-a-uuid',
      carerId: 'also-bad',
      toVisitId: 'bad',
      travelDate: 'invalid-date',
    } as never);

    expect(result.success).toBe(false);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('createTravelRecord persists tenant-scoped travel records and writes audit evidence', async () => {
    const orgId = '550e8400-e29b-41d4-a716-446655440099';
    const userId = '550e8400-e29b-41d4-a716-446655440001';
    const visitId = '550e8400-e29b-41d4-a716-446655440010';

    selectQueue.push([{ id: 'membership-1' }], [{ id: visitId }]);
    insertQueue.push([{ id: '550e8400-e29b-41d4-a716-446655440020' }]);

    const result = await createTravelRecord({
      organisationId: orgId,
      carerId: userId,
      toVisitId: visitId,
      expectedMinutes: 15,
      actualMinutes: 19,
      travelMode: 'car',
      notes: 'Heavy traffic near the ring road',
      travelDate: new Date('2026-04-02T10:00:00Z'),
    });

    expect(result).toEqual({
      success: true,
      data: { id: '550e8400-e29b-41d4-a716-446655440020' },
    });
    expect(mockRequirePermission).toHaveBeenCalledWith('read', 'rota');
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: orgId,
      carerId: userId,
      toVisitId: visitId,
      isOverdue: true,
      notes: 'Heavy traffic near the ring road',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'travel_record',
      '550e8400-e29b-41d4-a716-446655440020',
      expect.objectContaining({
        after: expect.objectContaining({
          carerId: userId,
          toVisitId: visitId,
          isOverdue: true,
        }),
      }),
      { userId, organisationId: orgId },
    );
  });

  it('createRouteSuggestion rejects visit orders that do not belong to the active tenant', async () => {
    mockRequirePermission.mockResolvedValue({
      userId: '550e8400-e29b-41d4-a716-446655440002',
      orgId: '550e8400-e29b-41d4-a716-446655440099',
      role: 'manager',
    });

    selectQueue.push(
      [{ id: 'membership-2' }],
      [{ id: '550e8400-e29b-41d4-a716-446655440030' }],
    );

    const result = await createRouteSuggestion({
      organisationId: '550e8400-e29b-41d4-a716-446655440099',
      carerId: '550e8400-e29b-41d4-a716-446655440002',
      routeDate: new Date('2026-04-03T00:00:00Z'),
      suggestedOrder: [
        '550e8400-e29b-41d4-a716-446655440030',
        '550e8400-e29b-41d4-a716-446655440031',
      ],
      optimisationMethod: 'simple_nearest',
    });

    expect(result).toEqual({ success: false, error: 'Resource not found' });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('upsertClientEnvironment creates a scoped environment record with audit history', async () => {
    mockRequirePermission.mockResolvedValue({
      userId: '550e8400-e29b-41d4-a716-446655440003',
      orgId: '550e8400-e29b-41d4-a716-446655440099',
      role: 'manager',
    });

    selectQueue.push([{ id: 'person-1' }], []);
    insertQueue.push([{ id: '550e8400-e29b-41d4-a716-446655440040' }]);

    const result = await upsertClientEnvironment({
      organisationId: '550e8400-e29b-41d4-a716-446655440099',
      clientId: '550e8400-e29b-41d4-a716-446655440041',
      clientName: 'Taylor Example',
      riskLevel: 'medium',
      accessInstructions: 'Use side gate and ring bell twice',
      parkingInfo: 'Visitor bay 3',
    });

    expect(result).toEqual({
      success: true,
      data: { id: '550e8400-e29b-41d4-a716-446655440040' },
    });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: '550e8400-e29b-41d4-a716-446655440099',
      clientId: '550e8400-e29b-41d4-a716-446655440041',
      clientName: 'Taylor Example',
      riskLevel: 'medium',
      accessInstructions: 'Use side gate and ring bell twice',
      lastVerifiedBy: '550e8400-e29b-41d4-a716-446655440003',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'client_environment',
      '550e8400-e29b-41d4-a716-446655440040',
      expect.objectContaining({
        after: expect.objectContaining({
          clientId: '550e8400-e29b-41d4-a716-446655440041',
          clientName: 'Taylor Example',
        }),
      }),
      {
        userId: '550e8400-e29b-41d4-a716-446655440003',
        organisationId: '550e8400-e29b-41d4-a716-446655440099',
      },
    );
  });

  it('upsertLoneWorkerConfig updates existing settings and records the delta', async () => {
    mockRequirePermission.mockResolvedValue({
      userId: '550e8400-e29b-41d4-a716-446655440004',
      orgId: '550e8400-e29b-41d4-a716-446655440099',
      role: 'manager',
    });

    selectQueue.push([
      {
        id: '550e8400-e29b-41d4-a716-446655440050',
        welfareCheckBufferMinutes: 15,
        escalationDelayMinutes: 15,
        gpsTrackingEnabled: true,
        sosEnabled: true,
      },
    ]);
    updateQueue.push([{ id: '550e8400-e29b-41d4-a716-446655440050' }]);

    const result = await upsertLoneWorkerConfig({
      organisationId: '550e8400-e29b-41d4-a716-446655440099',
      welfareCheckBufferMinutes: 20,
      escalationDelayMinutes: 30,
      gpsTrackingEnabled: true,
      gpsPingIntervalSeconds: 45,
      sosEnabled: true,
      autoEmergencyCallEnabled: false,
      autoEmergencyCallDelayMinutes: 90,
    });

    expect(result).toEqual({
      success: true,
      data: { id: '550e8400-e29b-41d4-a716-446655440050' },
    });
    expect(updateSetCalls[0]).toMatchObject({
      organisationId: '550e8400-e29b-41d4-a716-446655440099',
      welfareCheckBufferMinutes: 20,
      escalationDelayMinutes: 30,
      gpsPingIntervalSeconds: 45,
      autoEmergencyCallDelayMinutes: 90,
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'update',
      'lone_worker_config',
      '550e8400-e29b-41d4-a716-446655440050',
      {
        before: {
          welfareCheckBufferMinutes: 15,
          escalationDelayMinutes: 15,
          gpsTrackingEnabled: true,
          sosEnabled: true,
        },
        after: {
          welfareCheckBufferMinutes: 20,
          escalationDelayMinutes: 30,
          gpsTrackingEnabled: true,
          sosEnabled: true,
        },
      },
      {
        userId: '550e8400-e29b-41d4-a716-446655440004',
        organisationId: '550e8400-e29b-41d4-a716-446655440099',
      },
    );
  });
});
