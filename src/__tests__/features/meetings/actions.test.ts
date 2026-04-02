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

import { createMeeting, updateMeeting } from '@/features/meetings/actions';

describe('meeting actions', () => {
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

  it('requires a tenant-scoped person before creating a meeting', async () => {
    selectQueue.push([]);

    const result = await createMeeting({
      personId: '550e8400-e29b-41d4-a716-446655440200',
      meetingDate: '2026-04-01',
      title: 'Key worker catch-up',
      childAttendees: ['Young person'],
      staffAttendees: ['Key worker'],
      agendaItems: ['Education'],
      discussionPoints: 'Discussed attendance and homework support.',
      decisions: 'Agreed evening study support.',
      actions: [
        {
          action: 'Review progress next week',
          owner: 'Key worker',
          dueDate: '2026-04-08',
          completed: false,
        },
      ],
      sharedWithReg44: false,
    });

    expect(mockRequirePermission).toHaveBeenCalledWith('create', 'care_plans');
    expect(result).toEqual({ success: false, error: 'Person not found' });
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockAuditLog).not.toHaveBeenCalled();
  });

  it('creates and audits meetings inside the active tenant', async () => {
    const personId = '550e8400-e29b-41d4-a716-446655440201';
    selectQueue.push([{ id: personId }], [{ slug: 'org-slug' }]);
    insertQueue.push([{ id: 'meeting-1', personId }]);

    const result = await createMeeting({
      personId,
      meetingDate: '2026-04-01',
      title: 'Monthly placement review',
      childAttendees: ['Young person'],
      staffAttendees: ['Registered manager', 'Key worker'],
      agendaItems: ['Education', 'Family time'],
      discussionPoints: 'Reviewed school attendance and contact arrangements.',
      decisions: 'Increase tutoring support before exams.',
      actions: [
        {
          action: 'Book tutor',
          owner: 'Registered manager',
          dueDate: '2026-04-05',
          completed: false,
        },
        {
          action: 'Share summary with social worker',
          owner: 'Key worker',
          dueDate: '2026-04-03',
          completed: false,
        },
      ],
      sharedWithReg44: true,
    });

    expect(result).toEqual({ success: true, data: { id: 'meeting-1', personId } });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: 'org-1',
      personId,
      createdById: 'user-1',
      title: 'Monthly placement review',
      sharedWithReg44: true,
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'childrens_meeting',
      'meeting-1',
      expect.objectContaining({
        after: expect.objectContaining({ personId, actionCount: 2, title: 'Monthly placement review' }),
      }),
      { userId: 'user-1', organisationId: 'org-1' },
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/${'org-slug'}/persons/${personId}/meetings`);
  });

  it('updates meetings with RBAC, tenant checks, and audit logging', async () => {
    const meetingId = '550e8400-e29b-41d4-a716-446655440202';
    const existing = {
      id: meetingId,
      organisationId: 'org-1',
      personId: '550e8400-e29b-41d4-a716-446655440203',
      title: 'Old title',
      meetingDate: '2026-04-01',
      childAttendees: ['Young person'],
      staffAttendees: ['Key worker'],
      agendaItems: ['Agenda item'],
      discussionPoints: 'Original discussion.',
      decisions: 'Original decision.',
      actions: [
        {
          action: 'Existing action',
          owner: 'Key worker',
          dueDate: '2026-04-04',
          completed: false,
        },
      ],
      sharedWithReg44: false,
    };

    selectQueue.push([existing], [{ slug: 'org-slug' }]);
    updateQueue.push([{ ...existing, title: 'Updated title' }]);

    const result = await updateMeeting(meetingId, {
      title: 'Updated title',
      actions: [
        {
          action: 'Existing action',
          owner: 'Key worker',
          dueDate: '2026-04-04',
          completed: false,
        },
        {
          action: 'Follow up with social worker',
          owner: 'Registered manager',
          dueDate: '2026-04-06',
          completed: false,
        },
      ],
      sharedWithReg44: true,
    });

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({ id: meetingId, title: 'Updated title' }),
    });
    expect(mockRequirePermission).toHaveBeenCalledWith('update', 'care_plans');
    expect(mockAssertBelongsToOrg).toHaveBeenCalledWith('org-1', 'org-1');
    expect(updateSetCalls[0]).toMatchObject({
      title: 'Updated title',
      actions: [
        {
          action: 'Existing action',
          owner: 'Key worker',
          dueDate: '2026-04-04',
          completed: false,
        },
        {
          action: 'Follow up with social worker',
          owner: 'Registered manager',
          dueDate: '2026-04-06',
          completed: false,
        },
      ],
      sharedWithReg44: true,
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'update',
      'childrens_meeting',
      meetingId,
      {
        before: { title: 'Old title' },
        after: { title: 'Updated title' },
      },
      { userId: 'user-1', organisationId: 'org-1' },
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/${'org-slug'}/persons/${existing.personId}/meetings`);
  });
});
