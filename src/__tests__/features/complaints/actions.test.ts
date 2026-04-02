import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  insertQueue,
  insertValuesCalls,
  mockAssertBelongsToOrg,
  mockAuditLog,
  mockDb,
  mockRevalidatePath,
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
    mockRevalidatePath: vi.fn(),
  };
});

vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));
vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: mockRequirePermission,
  UnauthorizedError: class UnauthorizedError extends Error {},
}));
vi.mock('@/lib/tenant', () => ({ assertBelongsToOrg: mockAssertBelongsToOrg }));
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));

import { createComplaint, updateComplaint } from '@/features/complaints/actions';

describe('complaint actions', () => {
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

  it('requires a tenant-scoped person before creating a complaint', async () => {
    selectQueue.push([]);

    const result = await createComplaint({
      personId: '550e8400-e29b-41d4-a716-446655440100',
      complaintDate: '2026-04-01',
      raisedBy: 'Parent',
      nature: 'Concerns about weekend contact arrangements.',
      status: 'received',
      advocacyOffered: true,
    });

    expect(mockRequirePermission).toHaveBeenCalledWith('create', 'incidents');
    expect(result).toEqual({ success: false, error: 'Person not found' });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('creates and audits complaints within the active tenant scope', async () => {
    const personId = '550e8400-e29b-41d4-a716-446655440101';
    selectQueue.push([{ id: personId }], [{ slug: 'org-slug' }]);
    insertQueue.push([{ id: 'complaint-1', personId }]);

    const result = await createComplaint({
      personId,
      complaintDate: '2026-04-01',
      raisedBy: 'Independent advocate',
      nature: 'Complaint about delayed school transport.',
      desiredOutcome: 'Transport plan reviewed within 48 hours.',
      status: 'investigated',
      advocacyOffered: true,
      advocacyNotes: 'Advocate attended the review meeting.',
    });

    expect(result).toEqual({ success: true, data: { id: 'complaint-1', personId } });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: 'org-1',
      personId,
      createdById: 'user-1',
      status: 'investigated',
      advocacyOffered: true,
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'childrens_complaint',
      'complaint-1',
      expect.objectContaining({
        after: expect.objectContaining({ personId, status: 'investigated' }),
      }),
      { userId: 'user-1', organisationId: 'org-1' },
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/${'org-slug'}/persons/${personId}/complaints`);
  });

  it('updates complaints with RBAC, tenant checks, and audit evidence', async () => {
    const complaintId = '550e8400-e29b-41d4-a716-446655440102';
    const existing = {
      id: complaintId,
      organisationId: 'org-1',
      personId: '550e8400-e29b-41d4-a716-446655440103',
      status: 'received',
      raisedBy: 'Parent',
      complaintDate: '2026-04-01',
      nature: 'Original concern',
      desiredOutcome: null,
      advocacyOffered: false,
      advocacyNotes: null,
      investigationNotes: null,
      outcomeSummary: null,
      satisfaction: null,
    };

    selectQueue.push([existing], [{ slug: 'org-slug' }]);
    updateQueue.push([{ ...existing, status: 'closed', outcomeSummary: 'Complaint resolved after transport rota review.', satisfaction: 'satisfied' }]);

    const result = await updateComplaint(complaintId, {
      status: 'closed',
      outcomeSummary: 'Complaint resolved after transport rota review.',
      satisfaction: 'satisfied',
    });

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({ id: complaintId, status: 'closed' }),
    });
    expect(mockRequirePermission).toHaveBeenCalledWith('update', 'incidents');
    expect(mockAssertBelongsToOrg).toHaveBeenCalledWith('org-1', 'org-1');
    expect(updateSetCalls[0]).toMatchObject({
      status: 'closed',
      outcomeSummary: 'Complaint resolved after transport rota review.',
      satisfaction: 'satisfied',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'update',
      'childrens_complaint',
      complaintId,
      {
        before: { status: 'received' },
        after: { status: 'closed' },
      },
      { userId: 'user-1', organisationId: 'org-1' },
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/${'org-slug'}/persons/${existing.personId}/complaints`);
  });
});
