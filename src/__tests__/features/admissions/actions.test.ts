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
vi.mock('@/lib/rbac', () => ({ requirePermission: mockRequirePermission }));
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));

import {
  completeAdmission,
  createMatchingAssessment,
  createReferral,
  recordDecision,
  updateChecklistItem,
} from '@/features/admissions/actions';

describe('admissions actions', () => {
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
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('createReferral creates a received referral and initial transition', async () => {
    insertQueue.push([{ id: 'ref-1' }], undefined);

    const result = await createReferral({
      childFirstName: 'Jane',
      childLastName: 'Doe',
      childDateOfBirth: '2010-01-01',
      childGender: 'female',
      placingAuthorityName: 'County Council',
      socialWorkerName: 'Social Worker',
      socialWorkerEmail: 'sw@example.com',
      socialWorkerPhone: '0123456789',
      referralReason: 'Placement breakdown requiring urgent move',
    });

    expect(result).toEqual({ success: true, referral: { id: 'ref-1' } });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: 'org-1',
      childFirstName: 'Jane',
      createdBy: 'user-1',
    });
    expect(insertValuesCalls[1]).toMatchObject({
      organisationId: 'org-1',
      referralId: 'ref-1',
      fromStatus: 'none',
      toStatus: 'received',
      performedBy: 'user-1',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'referral',
      'ref-1',
      expect.objectContaining({
        after: expect.objectContaining({ childFirstName: 'Jane' }),
      }),
      { userId: 'user-1', organisationId: 'org-1' },
    );
  });

  it('createMatchingAssessment rejects referrals outside the required received state', async () => {
    selectQueue.push([{ id: 'ref-1', organisationId: 'org-1', status: 'accepted' }]);

    await expect(
      createMatchingAssessment({
        referralId: '550e8400-e29b-41d4-a716-446655440300',
        overallRiskRating: 'medium',
        recommendation: 'accept',
        recommendationRationale: 'Assessment supports progression.',
      }),
    ).rejects.toThrow('Referral must be in "received" status to create an assessment');
  });

  it('recordDecision creates default checklist items when accepting a referral', async () => {
    selectQueue.push([{ id: 'ref-1', organisationId: 'org-1', status: 'assessment_complete' }]);
    updateQueue.push(undefined);
    insertQueue.push(undefined, undefined);

    const result = await recordDecision({
      referralId: '550e8400-e29b-41d4-a716-446655440301',
      decision: 'accepted',
      reason: 'Placement is suitable and capacity confirmed.',
      acceptanceConditions: 'Weekly transition calls for first month',
    });

    expect(result).toEqual({ success: true });
    expect(updateSetCalls[0]).toMatchObject({
      status: 'accepted',
      decisionBy: 'user-1',
      decisionReason: 'Placement is suitable and capacity confirmed.',
      acceptanceConditions: 'Weekly transition calls for first month',
    });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: 'org-1',
      referralId: '550e8400-e29b-41d4-a716-446655440301',
      fromStatus: 'assessment_complete',
      toStatus: 'accepted',
    });
    expect(Array.isArray(insertValuesCalls[1])).toBe(true);
    expect((insertValuesCalls[1] as Array<Record<string, unknown>>)[0]).toMatchObject({
      organisationId: 'org-1',
      referralId: '550e8400-e29b-41d4-a716-446655440301',
      category: 'documentation',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'update',
      'referral',
      '550e8400-e29b-41d4-a716-446655440301',
      {
        before: { status: 'assessment_complete' },
        after: {
          status: 'accepted',
          reason: 'Placement is suitable and capacity confirmed.',
        },
      },
      { userId: 'user-1', organisationId: 'org-1' },
    );
  });

  it('updateChecklistItem records completion state changes for tenant-scoped items', async () => {
    selectQueue.push([{ id: 'item-1', organisationId: 'org-1', completed: false, notes: null }]);
    updateQueue.push(undefined);

    const result = await updateChecklistItem({
      id: '550e8400-e29b-41d4-a716-446655440302',
      completed: true,
      notes: 'Uploaded signed delegated authority form',
    });

    expect(result).toEqual({ success: true });
    expect(updateSetCalls[0]).toMatchObject({
      completed: true,
      completedBy: 'user-1',
      notes: 'Uploaded signed delegated authority form',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'update',
      'admission_checklist_item',
      '550e8400-e29b-41d4-a716-446655440302',
      {
        before: { completed: false },
        after: { completed: true },
      },
      { userId: 'user-1', organisationId: 'org-1' },
    );
  });

  it('completeAdmission reports incomplete required checklist items', async () => {
    selectQueue.push(
      [{ id: 'ref-1', organisationId: 'org-1', status: 'accepted' }],
      [
        { title: 'Placement plan received', required: true, completed: false },
        { title: 'Medication and MAR chart', required: false, completed: false },
      ],
    );

    const result = await completeAdmission({
      referralId: '550e8400-e29b-41d4-a716-446655440303',
    });

    expect(result).toEqual({
      success: false,
      error: '1 required checklist item(s) are incomplete',
      incompleteItems: ['Placement plan received'],
    });
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('completeAdmission admits the referral when required items are complete', async () => {
    selectQueue.push(
      [{ id: 'ref-1', organisationId: 'org-1', status: 'accepted' }],
      [
        { title: 'Placement plan received', required: true, completed: true },
        { title: 'Medication and MAR chart', required: false, completed: false },
      ],
    );
    updateQueue.push(undefined);
    insertQueue.push(undefined);

    const result = await completeAdmission({
      referralId: '550e8400-e29b-41d4-a716-446655440304',
    });

    expect(result).toEqual({ success: true });
    expect(updateSetCalls[0]).toMatchObject({
      status: 'admitted',
      admittedBy: 'user-1',
    });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: 'org-1',
      referralId: '550e8400-e29b-41d4-a716-446655440304',
      fromStatus: 'accepted',
      toStatus: 'admitted',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'update',
      'referral',
      '550e8400-e29b-41d4-a716-446655440304',
      {
        before: { status: 'accepted' },
        after: { status: 'admitted' },
      },
      { userId: 'user-1', organisationId: 'org-1' },
    );
  });
});
