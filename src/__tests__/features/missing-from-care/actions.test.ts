import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectQueue: unknown[] = [];
const insertQueue: unknown[] = [];
const updateQueue: unknown[] = [];

const selectWhereCalls: unknown[][] = [];
const insertValuesCalls: unknown[] = [];
const updateSetCalls: unknown[] = [];
const updateWhereCalls: unknown[][] = [];

function makeAwaitableQuery<T>(result: T) {
  return {
    limit: vi.fn().mockResolvedValue(result),
    orderBy: vi.fn().mockResolvedValue(result),
    returning: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
}

const mockDb = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn((...args: unknown[]) => {
        selectWhereCalls.push(args);
        return makeAwaitableQuery(selectQueue.shift());
      }),
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
        where: vi.fn((...args: unknown[]) => {
          updateWhereCalls.push(args);
          return makeAwaitableQuery(updateQueue.shift());
        }),
      };
    }),
  })),
};

const mockRequirePermission = vi.fn();
const mockAssertBelongsToOrg = vi.fn();
const mockAuditLog = vi.fn();

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/rbac', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/rbac')>();
  return {
    ...original,
    requirePermission: mockRequirePermission,
  };
});
vi.mock('@/lib/tenant', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/tenant')>();
  return {
    ...original,
    assertBelongsToOrg: mockAssertBelongsToOrg,
  };
});
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));

import {
  completeRhi,
  createMissingEpisode,
  escalateRhi,
  recordReturn,
} from '@/features/missing-from-care/actions';

describe('missing-from-care actions', () => {
  beforeEach(() => {
    selectQueue.length = 0;
    insertQueue.length = 0;
    updateQueue.length = 0;
    selectWhereCalls.length = 0;
    insertValuesCalls.length = 0;
    updateSetCalls.length = 0;
    updateWhereCalls.length = 0;
    vi.clearAllMocks();

    mockRequirePermission.mockResolvedValue({
      userId: 'user-1',
      orgId: 'org-1',
      role: 'manager',
    });
    mockAssertBelongsToOrg.mockImplementation(() => undefined);
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('createMissingEpisode rejects invalid input before auth or DB work', async () => {
    const result = await createMissingEpisode({
      personId: 'not-a-uuid',
      initialActionsTaken: '',
      riskLevel: 'critical',
    });

    expect(result.success).toBe(false);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('createMissingEpisode requires a tenant-scoped person before creating an episode', async () => {
    selectQueue.push([]);

    const result = await createMissingEpisode({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      absenceNoticedAt: '2026-04-01T10:00:00Z',
      initialActionsTaken: 'Searched the unit and local park',
      riskLevel: 'high',
    });

    expect(mockRequirePermission).toHaveBeenCalledWith('create', 'persons');
    expect(result).toEqual({ success: false, error: 'Person not found' });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('recordReturn enforces tenant scope and writes audit evidence for recovery', async () => {
    selectQueue.push([
      {
        id: 'episode-1',
        organisationId: 'org-1',
        personId: 'person-1',
        status: 'open',
      },
    ]);
    updateQueue.push(undefined);
    insertQueue.push(undefined, [{ id: 'rhi-1' }], undefined);

    const returnedAt = new Date('2026-04-01T18:00:00Z');
    const result = await recordReturn({
      episodeId: 'episode-1',
      returnedAt,
      returnMethod: 'self',
      wellbeingCheckNotes: 'Child was safe and medically well.',
    });

    expect(result).toEqual({ success: true, data: { rhiId: 'rhi-1' } });
    expect(mockRequirePermission).toHaveBeenCalledWith('update', 'persons');
    expect(mockAssertBelongsToOrg).toHaveBeenCalledWith('org-1', 'org-1');
    expect(updateSetCalls[0]).toMatchObject({
      status: 'returned',
      returnedAt,
      returnMethod: 'self',
      wellbeingCheckCompleted: true,
      wellbeingCheckNotes: 'Child was safe and medically well.',
    });
    expect(mockAuditLog).toHaveBeenNthCalledWith(
      1,
      'update',
      'missing_episode',
      'episode-1',
      expect.objectContaining({
        after: expect.objectContaining({ status: 'returned', returnedAt }),
      }),
      { userId: 'user-1', organisationId: 'org-1' },
    );
    expect(mockAuditLog).toHaveBeenNthCalledWith(
      2,
      'create',
      'return_home_interview',
      'rhi-1',
      expect.objectContaining({
        after: expect.objectContaining({ episodeId: 'episode-1' }),
      }),
      { userId: 'user-1', organisationId: 'org-1' },
    );
  });

  it('completeRhi rejects invalid payloads before permission or persistence work', async () => {
    const result = await completeRhi({
      id: 'not-a-uuid',
      whereChildWas: '',
    });

    expect(result.success).toBe(false);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockDb.select).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('completeRhi enforces RBAC, tenant scope, and audit logging', async () => {
    const existingRhi = {
      id: 'rhi-1',
      organisationId: 'org-1',
      status: 'pending',
      episodeId: 'episode-1',
      whereChildWas: null,
    };
    selectQueue.push([existingRhi]);
    updateQueue.push(undefined);

    const result = await completeRhi({
      id: 'rhi-1',
      whereChildWas: 'Town centre',
      whoChildWasWith: 'Friends',
      childDeclined: false,
      safeguardingReferralNeeded: true,
    });

    expect(result).toEqual({ success: true, data: undefined });
    expect(mockRequirePermission).toHaveBeenCalledWith('update', 'persons');
    expect(mockAssertBelongsToOrg).toHaveBeenCalledWith('org-1', 'org-1');
    expect(updateSetCalls[0]).toMatchObject({
      whereChildWas: 'Town centre',
      whoChildWasWith: 'Friends',
      status: 'completed',
      conductedById: 'user-1',
      safeguardingReferralNeeded: true,
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'update',
      'return_home_interview',
      'rhi-1',
      {
        before: existingRhi,
        after: expect.objectContaining({ status: 'completed', whereChildWas: 'Town centre' }),
      },
      { userId: 'user-1', organisationId: 'org-1' },
    );
  });

  it('escalateRhi enforces tenant scope and records audit history', async () => {
    const existingRhi = {
      id: 'rhi-2',
      organisationId: 'org-1',
      status: 'overdue',
      episodeId: 'episode-9',
      escalatedToRi: false,
    };
    selectQueue.push([existingRhi]);
    updateQueue.push(undefined);

    const result = await escalateRhi({ id: 'rhi-2' });

    expect(result).toEqual({ success: true, data: undefined });
    expect(mockRequirePermission).toHaveBeenCalledWith('update', 'persons');
    expect(mockAssertBelongsToOrg).toHaveBeenCalledWith('org-1', 'org-1');
    expect(updateSetCalls[0]).toMatchObject({
      status: 'escalated',
      escalatedToRi: true,
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'update',
      'return_home_interview',
      'rhi-2',
      {
        before: existingRhi,
        after: { status: 'escalated', escalatedToRi: true },
      },
      { userId: 'user-1', organisationId: 'org-1' },
    );
  });
});
