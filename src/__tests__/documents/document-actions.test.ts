import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  insertQueue,
  insertValuesCalls,
  mockAuditLog,
  mockDb,
  mockRequirePermission,
  selectQueue,
  mockRevalidatePath,
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
    mockRevalidatePath: vi.fn(),
  };
});

vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));
vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: mockRequirePermission,
  UnauthorizedError: class UnauthorizedError extends Error {},
}));
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));
vi.mock('@/lib/tenant', () => ({ assertBelongsToOrg: vi.fn() }));

import { createBodyMapEntry } from '@/features/documents/actions';

describe('document body-map actions', () => {
  beforeEach(() => {
    selectQueue.length = 0;
    insertQueue.length = 0;
    insertValuesCalls.length = 0;
    vi.clearAllMocks();

    mockRequirePermission.mockResolvedValue({
      userId: 'user-1',
      orgId: 'org-1',
      role: 'manager',
    });
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('rejects invalid payloads before auth-dependent lookups', async () => {
    const result = await createBodyMapEntry({
      personId: 'bad-id',
      bodyRegion: 'left_arm',
      xPercent: 10,
      yPercent: 20,
      description: '',
      dateObserved: 'bad-date',
    } as never);

    expect(result.success).toBe(false);
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it('requires a tenant-scoped person before creating a body-map entry', async () => {
    selectQueue.push([]);

    const result = await createBodyMapEntry({
      personId: '550e8400-e29b-41d4-a716-446655440200',
      bodyRegion: 'left_arm',
      side: 'front',
      xPercent: 10,
      yPercent: 20,
      entryType: 'bruise',
      description: 'Bruise observed on left arm',
      dateObserved: '2026-04-02',
    });

    expect(result).toEqual({ success: false, error: 'Person not found' });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('rejects linked incidents outside the current org before insert', async () => {
    selectQueue.push(
      [{ id: '550e8400-e29b-41d4-a716-446655440200' }],
      [],
    );

    const result = await createBodyMapEntry({
      personId: '550e8400-e29b-41d4-a716-446655440200',
      bodyRegion: 'left_arm',
      side: 'front',
      xPercent: 10,
      yPercent: 20,
      entryType: 'bruise',
      description: 'Bruise observed on left arm',
      dateObserved: '2026-04-02',
      linkedIncidentId: '550e8400-e29b-41d4-a716-446655440201',
    });

    expect(result).toEqual({ success: false, error: 'Linked incident not found' });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('creates and audits a body-map entry when person and incident are tenant-scoped', async () => {
    selectQueue.push(
      [{ id: '550e8400-e29b-41d4-a716-446655440200' }],
      [{ id: '550e8400-e29b-41d4-a716-446655440201' }],
      [{ name: 'Alex Staff' }],
      [{ slug: 'org-slug' }],
    );
    insertQueue.push([
      { id: 'entry-1', personId: '550e8400-e29b-41d4-a716-446655440200' },
    ]);

    const result = await createBodyMapEntry({
      personId: '550e8400-e29b-41d4-a716-446655440200',
      bodyRegion: 'left_arm',
      side: 'front',
      xPercent: 10,
      yPercent: 20,
      entryType: 'bruise',
      description: 'Bruise observed on left arm',
      dateObserved: '2026-04-02',
      linkedIncidentId: '550e8400-e29b-41d4-a716-446655440201',
    });

    expect(result).toEqual({
      success: true,
      data: { id: 'entry-1', personId: '550e8400-e29b-41d4-a716-446655440200' },
    });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: 'org-1',
      personId: '550e8400-e29b-41d4-a716-446655440200',
      linkedIncidentId: '550e8400-e29b-41d4-a716-446655440201',
      createdById: 'user-1',
      createdByName: 'Alex Staff',
    });
    expect(mockAuditLog).toHaveBeenCalledWith(
      'create',
      'body_map_entry',
      'entry-1',
      expect.objectContaining({
        after: expect.objectContaining({
          personId: '550e8400-e29b-41d4-a716-446655440200',
          linkedIncidentId: '550e8400-e29b-41d4-a716-446655440201',
        }),
      }),
      { userId: 'user-1', organisationId: 'org-1' },
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith('/org-slug/persons/550e8400-e29b-41d4-a716-446655440200/body-map');
  });
});
