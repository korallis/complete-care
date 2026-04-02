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
    mockAssertBelongsToOrg: vi.fn(),
    mockAuditLog: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/rbac', () => ({ requirePermission: mockRequirePermission }));
vi.mock('@/lib/tenant', () => ({ assertBelongsToOrg: mockAssertBelongsToOrg }));
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));

import {
  addManualChronologyEntry,
  createConcern,
  createDslReview,
  createLadoReferral,
} from '@/features/safeguarding/actions';

describe('safeguarding actions', () => {
  beforeEach(() => {
    selectQueue.length = 0;
    insertQueue.length = 0;
    updateQueue.length = 0;
    insertValuesCalls.length = 0;
    updateSetCalls.length = 0;
    vi.clearAllMocks();

    mockRequirePermission.mockResolvedValue({
      userId: 'user-1',
      orgId: 'org-1',
      role: 'manager',
    });
    mockAssertBelongsToOrg.mockImplementation(() => undefined);
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('createConcern rejects invalid payloads before auth or DB work', async () => {
    const result = await createConcern({
      childId: 'bad-id',
      description: 'short',
      severity: 'critical',
    } as never);

    expect(result.success).toBe(false);
    expect(mockRequirePermission).not.toHaveBeenCalled();
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it('createConcern requires a tenant-scoped child before insert', async () => {
    selectQueue.push([]);

    const result = await createConcern({
      childId: '550e8400-e29b-41d4-a716-446655440100',
      observedAt: new Date('2026-04-01T10:00:00Z'),
      description: 'Observed unexplained bruising after contact visit.',
      severity: 'high',
    });

    expect(mockRequirePermission).toHaveBeenCalledWith('create', 'persons');
    expect(result).toEqual({ success: false, error: 'Child not found' });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('createConcern writes chronology and audit evidence on success', async () => {
    const childId = '550e8400-e29b-41d4-a716-446655440101';
    selectQueue.push([{ id: childId, organisationId: 'org-1' }]);
    insertQueue.push([{ id: 'concern-1' }], undefined);

    const result = await createConcern({
      childId,
      observedAt: new Date('2026-04-01T10:00:00Z'),
      description: 'Observed unexplained bruising after contact visit.',
      severity: 'high',
      immediateActions: 'Spoke to manager and ensured child was safe.',
    });

    expect(result).toEqual({ success: true, data: { id: 'concern-1' } });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: 'org-1',
      childId,
      reportedById: 'user-1',
      severity: 'high',
    });
    expect(insertValuesCalls[1]).toMatchObject({
      organisationId: 'org-1',
      childId,
      source: 'concern',
      sourceRecordId: 'concern-1',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'safeguarding_concern',
      'concern-1',
      expect.objectContaining({
        after: expect.objectContaining({ severity: 'high' }),
      }),
      { userId: 'user-1', organisationId: 'org-1' },
    );
  });

  it('createDslReview rejects linked concerns outside the current tenant', async () => {
    selectQueue.push([{ id: 'concern-1', organisationId: 'org-2', childId: 'child-1' }]);
    mockAssertBelongsToOrg.mockImplementation(() => {
      throw new Error('cross-tenant');
    });

    await expect(
      createDslReview({
        concernId: '550e8400-e29b-41d4-a716-446655440110',
        decision: 'refer_to_mash',
        rationale: 'Threshold met for external safeguarding referral.',
        referralDate: new Date('2026-04-02T10:00:00Z'),
      }),
    ).rejects.toThrow('cross-tenant');
  });

  it('createLadoReferral requires linked DSL reviews to belong to the current tenant', async () => {
    const childId = '550e8400-e29b-41d4-a716-446655440120';
    selectQueue.push(
      [{ id: childId, organisationId: 'org-1' }],
      [{ id: 'review-1', organisationId: 'org-2' }],
    );
    mockAssertBelongsToOrg.mockImplementation((resourceOrgId: string, activeOrgId: string) => {
      if (resourceOrgId !== activeOrgId) throw new Error('cross-tenant');
    });

    await expect(
      createLadoReferral({
        dslReviewId: '550e8400-e29b-41d4-a716-446655440121',
        childId,
        allegationAgainstStaffName: 'Staff Member',
        allegationDetails: 'Detailed allegation text for safeguarding review.',
        referralDate: new Date('2026-04-02T10:00:00Z'),
      }),
    ).rejects.toThrow('cross-tenant');
  });

  it('addManualChronologyEntry requires a tenant-scoped child before insert', async () => {
    selectQueue.push([]);

    const result = await addManualChronologyEntry({
      childId: '550e8400-e29b-41d4-a716-446655440130',
      eventDate: new Date('2026-04-01T10:00:00Z'),
      title: 'Historic safeguarding note',
      description: 'This historical chronology entry records a past safeguarding event.',
      significance: 'standard',
      isRestricted: false,
    });

    expect(result).toEqual({ success: false, error: 'Child not found' });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });
});
