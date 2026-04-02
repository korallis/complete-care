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

  function createSelectQuery(result: unknown) {
    const query = {
      where: vi.fn(() => query),
      innerJoin: vi.fn(() => query),
      orderBy: vi.fn(() => Promise.resolve(result)),
      limit: vi.fn(() => Promise.resolve(result)),
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    };
    return query;
  }

  function createUpdateQuery(result: unknown) {
    return {
      returning: vi.fn().mockResolvedValue(result),
      then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    };
  }

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => createSelectQuery(selectQueue.shift())),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((payload: unknown) => {
        insertValuesCalls.push(payload);
        const result = insertQueue.shift();
        return {
          returning: vi.fn().mockResolvedValue(result),
        };
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn((payload: unknown) => {
        updateSetCalls.push(payload);
        const result = updateQueue.shift();
        return {
          where: vi.fn(() => createUpdateQuery(result)),
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
  acknowledgeExpiryAlert,
  checkAndGenerateReorders,
  createMedicationStock,
  createReorderRequest,
  createStockBatch,
  generateHandoverReport,
  getExpiryAlerts,
  notifyPharmacy,
  recordStockTransaction,
  signHandoverReport,
  updateMedicationStock,
  updateReorderStatus,
} from '@/features/emar/stock/actions';

describe('emar stock actions', () => {
  const organisationId = '550e8400-e29b-41d4-a716-446655440001';
  const stockId = '550e8400-e29b-41d4-a716-446655440003';
  const batchId = '550e8400-e29b-41d4-a716-446655440004';
  const reorderId = '550e8400-e29b-41d4-a716-446655440005';
  const reportId = '550e8400-e29b-41d4-a716-446655440006';
  const activeUserId = '550e8400-e29b-41d4-a716-446655440099';

  beforeEach(() => {
    selectQueue.length = 0;
    insertQueue.length = 0;
    updateQueue.length = 0;
    insertValuesCalls.length = 0;
    updateSetCalls.length = 0;
    vi.clearAllMocks();

    mockRequirePermission.mockResolvedValue({
      userId: activeUserId,
      orgId: organisationId,
      role: 'manager',
    });
    mockAuditLog.mockResolvedValue(undefined);
  });

  it('requires a controlled drug schedule before creating stock records', async () => {
    await expect(
      createMedicationStock(organisationId, 'ignored', {
        medicationName: 'Morphine sulphate',
        form: 'tablet',
        strength: '10mg',
        isControlledDrug: true,
      }),
    ).rejects.toThrow('Controlled drug schedule is required for controlled drugs');

    expect(mockRequirePermission).not.toHaveBeenCalled();
  });

  it('persists tenant-scoped stock, transaction, reorder, and handover records with audit evidence', async () => {
    insertQueue.push(
      [
        {
          id: stockId,
          organisationId,
          medicationName: 'Paracetamol',
          form: 'tablet',
          strength: '500mg',
          currentQuantity: 120,
          reorderPoint: 30,
          isControlledDrug: false,
        },
      ],
      [
        {
          id: batchId,
          organisationId,
          medicationStockId: stockId,
          batchNumber: 'BATCH-001',
          expiryDate: '2027-02-01',
          quantity: 80,
          expiryAlertDays: 30,
        },
      ],
      [{ id: 'txn-batch-1' }],
      [
        {
          id: 'txn-1',
          organisationId,
          medicationStockId: stockId,
          quantity: -95,
          transactionType: 'disposal',
          balanceAfter: 25,
          performedById: activeUserId,
        },
      ],
      [
        {
          id: 'auto-reorder-1',
          organisationId,
          medicationStockId: stockId,
          quantityRequested: 100,
          status: 'pending',
        },
      ],
      [
        {
          id: reorderId,
          organisationId,
          medicationStockId: stockId,
          quantityRequested: 60,
          status: 'pending',
          requestedById: activeUserId,
        },
      ],
      [
        {
          id: reportId,
          organisationId,
          shiftType: 'night',
          generatedById: activeUserId,
          isCompleted: false,
        },
      ],
    );

    selectQueue.push(
      [
        {
          id: stockId,
          organisationId,
          medicationName: 'Paracetamol',
          medicationCode: 'PARA500',
          form: 'tablet',
          strength: '500mg',
          currentQuantity: 120,
          minimumThreshold: 20,
          reorderPoint: 30,
          reorderQuantity: 100,
          unit: 'tablets',
          storageRequirement: 'room_temp',
          isControlledDrug: false,
          controlledDrugSchedule: null,
          pharmacySupplier: 'Community Pharmacy',
        },
      ],
      [
        {
          id: stockId,
          organisationId,
          medicationName: 'Paracetamol',
          currentQuantity: 120,
          reorderPoint: 30,
          reorderQuantity: 100,
          isControlledDrug: false,
          pharmacySupplier: 'Community Pharmacy',
        },
      ],
      [],
      [
        {
          id: stockId,
          organisationId,
          medicationName: 'Paracetamol',
          currentQuantity: 120,
          reorderPoint: 30,
          reorderQuantity: 100,
          isControlledDrug: false,
          pharmacySupplier: 'Community Pharmacy',
        },
      ],
      [
        {
          id: batchId,
          organisationId,
          medicationStockId: stockId,
          quantity: 80,
        },
      ],
      [],
      [
        {
          id: reorderId,
          organisationId,
          medicationStockId: stockId,
          quantityReceived: null,
          status: 'pending',
          pharmacyReference: null,
          expectedDeliveryDate: null,
          cancellationReason: null,
          notes: null,
        },
      ],
      [
        {
          id: stockId,
          organisationId,
          currentQuantity: 25,
          reorderPoint: 30,
          reorderQuantity: 100,
        },
      ],
    );

    updateQueue.push(
      [
        {
          id: stockId,
          organisationId,
          currentQuantity: 80,
          reorderPoint: 25,
          isControlledDrug: false,
        },
      ],
      undefined,
      undefined,
      [
        {
          id: reorderId,
          organisationId,
          status: 'partially_received',
          quantityReceived: 20,
          pharmacyReference: 'RX-123',
        },
      ],
    );

    await expect(
      createMedicationStock(organisationId, 'ignored', {
        medicationName: 'Paracetamol',
        medicationCode: 'PARA500',
        form: 'tablet',
        strength: '500mg',
        currentQuantity: 120,
        minimumThreshold: 20,
        reorderPoint: 30,
        reorderQuantity: 100,
        unit: 'tablets',
        storageRequirement: 'room_temp',
        pharmacySupplier: 'Community Pharmacy',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: stockId,
        organisationId,
        medicationName: 'Paracetamol',
      }),
    });

    await expect(
      updateMedicationStock(organisationId, stockId, 'ignored', {
        currentQuantity: 80,
        reorderPoint: 25,
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: stockId,
        currentQuantity: 80,
        reorderPoint: 25,
      }),
    });

    await expect(
      createStockBatch(organisationId, 'ignored', {
        medicationStockId: stockId,
        batchNumber: 'BATCH-001',
        expiryDate: '2027-02-01',
        quantity: 80,
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: batchId,
        medicationStockId: stockId,
      }),
    });

    await expect(
      recordStockTransaction(organisationId, 'ignored', {
        medicationStockId: stockId,
        stockBatchId: batchId,
        transactionType: 'disposal',
        quantity: -95,
        reason: 'Damaged blister pack',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: 'txn-1',
        quantity: -95,
        balanceAfter: 25,
      }),
    });

    await expect(
      createReorderRequest(organisationId, 'ignored', {
        medicationStockId: stockId,
        quantityRequested: 60,
        notes: 'Low stock after GP round',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: reorderId,
        quantityRequested: 60,
      }),
    });

    await expect(
      updateReorderStatus(organisationId, reorderId, 'ignored', {
        status: 'partially_received',
        quantityReceived: 20,
        pharmacyReference: 'RX-123',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: reorderId,
        status: 'partially_received',
        quantityReceived: 20,
      }),
    });

    await expect(
      generateHandoverReport(organisationId, 'ignored', {
        shiftType: 'night',
        shiftStartAt: '2026-04-02T19:00:00.000Z',
        shiftEndAt: '2026-04-03T07:00:00.000Z',
        summary: {
          administrations: { total: 12, onTime: 10, late: 1, missed: 1 },
          refusals: [],
          prnUsage: [],
          errors: [],
          cdBalances: [],
          notes: 'Escalate one missed dose to day shift.',
        },
        handoverNotes: 'Night lead to brief day staff at 07:00.',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        id: reportId,
        shiftType: 'night',
        generatedById: activeUserId,
      }),
    });

    expect(insertValuesCalls[0]).toMatchObject({
      organisationId,
      medicationName: 'Paracetamol',
      pharmacySupplier: 'Community Pharmacy',
    });
    expect(insertValuesCalls[3]).toMatchObject({
      medicationStockId: stockId,
      quantity: -95,
      performedById: activeUserId,
    });
    expect(updateSetCalls[1]).toMatchObject({ currentQuantity: 200 });
    expect(mockAuditLog).toHaveBeenCalled();
  });

  it('supports expiry alerts, auto-reorders, pharmacy notification, and handover sign-off', async () => {
    selectQueue.push(
      [
        {
          batchId,
          medicationStockId: stockId,
          medicationName: 'Paracetamol',
          batchNumber: 'BATCH-001',
          expiryDate: '2026-04-15',
          quantity: 12,
          expiryAlertDays: 30,
          isExhausted: false,
          expiryAlertAcknowledged: false,
        },
      ],
      [
        {
          id: batchId,
          organisationId,
          expiryAlertAcknowledged: false,
        },
      ],
      [
        {
          id: stockId,
          organisationId,
          medicationName: 'Paracetamol',
          currentQuantity: 5,
          reorderPoint: 10,
          reorderQuantity: 25,
        },
      ],
      [],
      [
        {
          id: reorderId,
          organisationId,
          pharmacyNotified: false,
        },
      ],
      [
        {
          id: reportId,
          organisationId,
          outgoingStaffId: null,
          incomingStaffId: activeUserId,
          isCompleted: false,
        },
      ],
    );

    insertQueue.push([
      {
        id: 'generated-reorder-1',
        organisationId,
        medicationStockId: stockId,
        quantityRequested: 25,
        status: 'pending',
      },
    ]);

    updateQueue.push(undefined, undefined, undefined);

    const alerts = await getExpiryAlerts(organisationId);
    expect(alerts).toEqual([
      expect.objectContaining({
        batchId,
        medicationStockId: stockId,
        medicationName: 'Paracetamol',
        isAcknowledged: false,
      }),
    ]);

    await expect(acknowledgeExpiryAlert(organisationId, batchId, 'ignored')).resolves.toEqual({
      success: true,
    });
    await expect(checkAndGenerateReorders(organisationId, 'ignored')).resolves.toEqual({
      success: true,
      reordersGenerated: 1,
    });
    await expect(notifyPharmacy(organisationId, reorderId, 'ignored')).resolves.toEqual({
      success: true,
    });
    await expect(signHandoverReport(organisationId, reportId, 'ignored', 'outgoing')).resolves.toEqual({
      success: true,
    });

    expect(updateSetCalls[0]).toMatchObject({ expiryAlertAcknowledged: true });
    expect(updateSetCalls[2]).toMatchObject({ pharmacyNotified: true });
    expect(updateSetCalls[3]).toMatchObject({ outgoingStaffId: activeUserId, isCompleted: true });
  });
});
