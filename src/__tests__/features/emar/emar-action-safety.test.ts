import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  insertQueue,
  insertValuesCalls,
  mockAuditLog,
  mockDb,
  mockRevalidatePath,
  mockRequirePermission,
  selectQueue,
  updateSetCalls,
} = vi.hoisted(() => {
  const selectQueue: unknown[] = [];
  const insertQueue: unknown[] = [];
  const insertValuesCalls: unknown[] = [];
  const updateSetCalls: unknown[] = [];

  function makeAwaitableQuery<T>(result: T) {
    return {
      limit: vi.fn().mockResolvedValue(result),
      orderBy: vi.fn().mockResolvedValue(result),
      then: (
        resolve: (value: T) => unknown,
        reject?: (reason: unknown) => unknown,
      ) => Promise.resolve(result).then(resolve, reject),
    };
  }

  function makeFromChain() {
    return {
      where: vi.fn(() => makeAwaitableQuery(selectQueue.shift())),
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => makeAwaitableQuery(selectQueue.shift())),
      })),
    };
  }

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => makeFromChain()),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((payload: unknown) => {
        insertValuesCalls.push(payload);
        return {
          returning: vi.fn().mockResolvedValue(insertQueue.shift()),
        };
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn((payload: unknown) => {
        updateSetCalls.push(payload);
        return {
          where: vi.fn().mockResolvedValue(undefined),
        };
      }),
    })),
  };

  return {
    selectQueue,
    insertQueue,
    insertValuesCalls,
    updateSetCalls,
    mockDb,
    mockRequirePermission: vi.fn(),
    mockAuditLog: vi.fn(),
    mockRevalidatePath: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/rbac', () => ({
  requirePermission: mockRequirePermission,
  UnauthorizedError: class UnauthorizedError extends Error {},
}));
vi.mock('@/lib/audit', () => ({ auditLog: mockAuditLog }));
vi.mock('next/cache', () => ({ revalidatePath: mockRevalidatePath }));

import { recordAdministration } from '@/features/emar/actions';
import { recordCdTransaction } from '@/features/emar/actions/controlled-drugs';

describe('eMAR safety action guards', () => {
  beforeEach(() => {
    selectQueue.length = 0;
    insertQueue.length = 0;
    insertValuesCalls.length = 0;
    updateSetCalls.length = 0;
    vi.clearAllMocks();

    mockRequirePermission.mockResolvedValue({
      userId: '550e8400-e29b-41d4-a716-446655440101',
      orgId: '550e8400-e29b-41d4-a716-446655440199',
      role: 'manager',
    });
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('blocks controlled drug administrations without a second witness', async () => {
    selectQueue.push([
      {
        id: '550e8400-e29b-41d4-a716-446655440301',
        organisationId: '550e8400-e29b-41d4-a716-446655440199',
        personId: '550e8400-e29b-41d4-a716-446655440401',
        drugName: 'Morphine Sulfate',
        isControlledDrug: true,
      },
    ]);
    selectQueue.push([{ name: 'Primary Nurse' }]);

    const result = await recordAdministration('550e8400-e29b-41d4-a716-446655440401', {
      medicationId: '550e8400-e29b-41d4-a716-446655440301',
      scheduledTime: '2026-04-02T09:00:00.000Z',
      administeredAt: '2026-04-02T09:02:00.000Z',
      status: 'given',
      reason: null,
      witnessId: null,
      witnessName: null,
      notes: 'Given with breakfast',
    });

    expect(result).toEqual({
      success: false,
      error: 'A second witness is required for controlled drug administration',
    });
    expect(insertValuesCalls).toHaveLength(0);
  });

  it('persists validated controlled drug administrations with the resolved witness name', async () => {
    selectQueue.push([
      {
        id: '550e8400-e29b-41d4-a716-446655440302',
        organisationId: '550e8400-e29b-41d4-a716-446655440199',
        personId: '550e8400-e29b-41d4-a716-446655440402',
        drugName: 'Morphine Sulfate',
        isControlledDrug: true,
      },
    ]);
    selectQueue.push([{ name: 'Primary Nurse' }]);
    selectQueue.push([{ id: 'membership-1', name: 'Witness Nurse' }]);
    insertQueue.push([{ id: 'admin-1' }]);
    selectQueue.push([{ slug: 'acme-care' }]);

    const result = await recordAdministration('550e8400-e29b-41d4-a716-446655440402', {
      medicationId: '550e8400-e29b-41d4-a716-446655440302',
      scheduledTime: '2026-04-02T09:00:00.000Z',
      administeredAt: '2026-04-02T09:02:00.000Z',
      status: 'given',
      reason: null,
      witnessId: '550e8400-e29b-41d4-a716-446655440102',
      witnessName: null,
      notes: 'Observed and administered safely',
    });

    expect(result).toEqual({ success: true, data: { id: 'admin-1' } });
    expect(insertValuesCalls[0]).toMatchObject({
      administeredById: '550e8400-e29b-41d4-a716-446655440101',
      witnessId: '550e8400-e29b-41d4-a716-446655440102',
      witnessName: 'Witness Nurse',
    });
    expect(mockAuditLog).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith('/acme-care/persons/550e8400-e29b-41d4-a716-446655440402/emar');
  });

  it('records controlled drug register transactions using the authenticated staff member and updated balance', async () => {
    selectQueue.push([{ id: 'membership-1' }]);
    selectQueue.push([
      {
        id: '550e8400-e29b-41d4-a716-446655440501',
        personId: '550e8400-e29b-41d4-a716-446655440601',
        currentBalance: 12,
      },
    ]);
    insertQueue.push([{ id: 'entry-1' }]);
    selectQueue.push([{ slug: 'acme-care' }]);

    const result = await recordCdTransaction({
      registerId: '550e8400-e29b-41d4-a716-446655440501',
      transactionType: 'receipt',
      quantityIn: 8,
      quantityOut: 0,
      transactionDate: new Date('2026-04-02T10:00:00.000Z'),
      performedBy: '550e8400-e29b-41d4-a716-446655440103',
      witnessedBy: '550e8400-e29b-41d4-a716-446655440102',
      sourceOrDestination: 'Boots Pharmacy',
      batchNumber: 'BN-2026-04',
      notes: 'Weekly delivery',
    });

    expect(result).toEqual({
      success: true,
      data: { entryId: 'entry-1', newBalance: 20 },
    });
    expect(insertValuesCalls[0]).toMatchObject({
      organisationId: '550e8400-e29b-41d4-a716-446655440199',
      performedBy: '550e8400-e29b-41d4-a716-446655440101',
      witnessedBy: '550e8400-e29b-41d4-a716-446655440102',
      balanceAfter: 20,
    });
    expect(updateSetCalls[0]).toMatchObject({ currentBalance: 20 });
    expect(mockAuditLog).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith('/acme-care/emar/controlled-drugs');
  });

  it('rejects controlled drug register transactions when the witness matches the performer', async () => {
    const result = await recordCdTransaction({
      registerId: '550e8400-e29b-41d4-a716-446655440502',
      transactionType: 'receipt',
      quantityIn: 1,
      quantityOut: 0,
      transactionDate: new Date('2026-04-02T10:00:00.000Z'),
      performedBy: '550e8400-e29b-41d4-a716-446655440103',
      witnessedBy: '550e8400-e29b-41d4-a716-446655440101',
      notes: 'Invalid witness',
    });

    expect(result).toEqual({
      success: false,
      error: 'Witness must be a different staff member from the person performing the operation',
    });
    expect(insertValuesCalls).toHaveLength(0);
  });
});
