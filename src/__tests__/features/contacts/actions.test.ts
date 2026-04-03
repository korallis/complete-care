import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  insertQueue,
  insertValuesCalls,
  mockAuditLog,
  mockDb,
  mockRequirePermission,
  mockRevalidatePath,
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
    mockRevalidatePath: vi.fn(),
  };
});

vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));
vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/rbac', () => ({ requirePermission: mockRequirePermission }));
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));

import { createContactRecord } from '@/features/contacts/actions';

describe('contact actions', () => {
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

  it('rejects recording contact against a different child than the approved register entry', async () => {
    selectQueue.push([]);

    const result = await createContactRecord({
      personId: '550e8400-e29b-41d4-a716-446655440001',
      approvedContactId: '660e8400-e29b-41d4-a716-446655440001',
      contactType: 'phone',
      contactDate: '2026-04-02T12:00',
      supervisionLevel: 'supervised_by_staff',
    });

    expect(result).toEqual({
      success: false,
      error: 'Contact is not in the approved register for this child.',
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('rejects contact types not permitted by the approved register', async () => {
    selectQueue.push([
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        organisationId: 'org-1',
        personId: '550e8400-e29b-41d4-a716-446655440001',
        allowedContactTypes: ['phone'],
        isActive: true,
      },
    ]);

    const result = await createContactRecord({
      personId: '550e8400-e29b-41d4-a716-446655440001',
      approvedContactId: '660e8400-e29b-41d4-a716-446655440001',
      contactType: 'video',
      contactDate: '2026-04-02T12:00',
      supervisionLevel: 'supervised_by_staff',
    });

    expect(result).toEqual({
      success: false,
      error: 'Contact type "video" is not permitted for this contact.',
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('rejects linked schedules that do not match the selected child and contact', async () => {
    selectQueue.push(
      [
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          organisationId: 'org-1',
          personId: '550e8400-e29b-41d4-a716-446655440001',
          allowedContactTypes: ['phone'],
          isActive: true,
        },
      ],
      [
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          organisationId: 'org-1',
          personId: '550e8400-e29b-41d4-a716-446655440999',
          approvedContactId: '660e8400-e29b-41d4-a716-446655440001',
          contactType: 'phone',
        },
      ],
    );

    const result = await createContactRecord({
      personId: '550e8400-e29b-41d4-a716-446655440001',
      approvedContactId: '660e8400-e29b-41d4-a716-446655440001',
      contactScheduleId: '770e8400-e29b-41d4-a716-446655440001',
      contactType: 'phone',
      contactDate: '2026-04-02T12:00',
      supervisionLevel: 'supervised_by_staff',
    });

    expect(result).toEqual({
      success: false,
      error: 'Scheduled contact does not match the selected child/contact.',
    });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('records tenant-scoped contact records and completes the linked schedule on success', async () => {
    const personId = '550e8400-e29b-41d4-a716-446655440001';
    const approvedContactId = '660e8400-e29b-41d4-a716-446655440001';
    const scheduleId = '770e8400-e29b-41d4-a716-446655440001';

    selectQueue.push(
      [
        {
          id: approvedContactId,
          organisationId: 'org-1',
          personId,
          allowedContactTypes: ['phone'],
          isActive: true,
        },
      ],
      [
        {
          id: scheduleId,
          organisationId: 'org-1',
          personId,
          approvedContactId,
          contactType: 'phone',
        },
      ],
      [{ slug: 'child-home' }],
    );
    insertQueue.push([
      {
        id: 'record-1',
        organisationId: 'org-1',
        personId,
        approvedContactId,
        contactScheduleId: scheduleId,
        contactType: 'phone',
        contactDate: new Date('2026-04-02T12:00:00.000Z'),
        supervisionLevel: 'supervised_by_staff',
      },
    ]);
    updateQueue.push(undefined);

    const result = await createContactRecord({
      personId,
      approvedContactId,
      contactScheduleId: scheduleId,
      contactType: 'phone',
      contactDate: '2026-04-02T12:00',
      supervisionLevel: 'supervised_by_staff',
      notes: 'Observed positive engagement throughout the phone call.',
    });

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: 'record-1',
        personId,
        approvedContactId,
      }),
    });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: 'org-1',
      personId,
      approvedContactId,
      contactScheduleId: scheduleId,
      contactType: 'phone',
      supervisionLevel: 'supervised_by_staff',
      recordedById: 'user-1',
    });
    expect(updateSetCalls[0]).toMatchObject({
      status: 'completed',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'contact_record',
      'record-1',
      expect.objectContaining({
        after: expect.objectContaining({ personId, approvedContactId }),
      }),
      { userId: 'user-1', organisationId: 'org-1' },
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      `/${'child-home'}/persons/${personId}/contacts`,
    );
  });
});
