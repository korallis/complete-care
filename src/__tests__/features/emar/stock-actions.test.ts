import { describe, expect, it } from 'vitest';

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
  const userId = '550e8400-e29b-41d4-a716-446655440002';
  const stockId = '550e8400-e29b-41d4-a716-446655440003';
  const batchId = '550e8400-e29b-41d4-a716-446655440004';
  const reorderId = '550e8400-e29b-41d4-a716-446655440005';
  const reportId = '550e8400-e29b-41d4-a716-446655440006';

  it('requires a controlled drug schedule before creating stock records', async () => {
    await expect(
      createMedicationStock(organisationId, userId, {
        medicationName: 'Morphine sulphate',
        form: 'tablet',
        strength: '10mg',
        isControlledDrug: true,
      }),
    ).rejects.toThrow('Controlled drug schedule is required for controlled drugs');
  });

  it('returns parsed stock payloads for medication, batch, transaction, reorder, and handover actions', async () => {
    await expect(
      createMedicationStock(organisationId, userId, {
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
        organisationId,
        medicationName: 'Paracetamol',
        currentQuantity: 120,
      }),
    });

    await expect(
      updateMedicationStock(organisationId, stockId, userId, {
        currentQuantity: 80,
        reorderPoint: 25,
      }),
    ).resolves.toEqual({
      success: true,
      data: { id: stockId, organisationId, currentQuantity: 80, reorderPoint: 25 },
    });

    await expect(
      createStockBatch(organisationId, userId, {
        medicationStockId: stockId,
        batchNumber: 'BATCH-001',
        expiryDate: '2027-02-01',
        quantity: 80,
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        organisationId,
        medicationStockId: stockId,
        expiryAlertDays: 30,
      }),
    });

    await expect(
      recordStockTransaction(organisationId, userId, {
        medicationStockId: stockId,
        stockBatchId: batchId,
        transactionType: 'disposal',
        quantity: -4,
        reason: 'Damaged blister pack',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        organisationId,
        performedById: userId,
        quantity: -4,
        transactionType: 'disposal',
      }),
    });

    await expect(
      createReorderRequest(organisationId, userId, {
        medicationStockId: stockId,
        quantityRequested: 60,
        notes: 'Low stock after GP round',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        organisationId,
        requestedById: userId,
        quantityRequested: 60,
      }),
    });

    await expect(
      updateReorderStatus(organisationId, reorderId, userId, {
        status: 'partially_received',
        quantityReceived: 20,
        pharmacyReference: 'RX-123',
      }),
    ).resolves.toEqual({
      success: true,
      data: {
        id: reorderId,
        organisationId,
        status: 'partially_received',
        quantityReceived: 20,
        pharmacyReference: 'RX-123',
      },
    });

    await expect(
      generateHandoverReport(organisationId, userId, {
        shiftType: 'night',
        shiftStartAt: '2026-04-02T19:00:00.000Z',
        shiftEndAt: '2026-04-03T07:00:00.000Z',
        summary: {
          administrations: { total: 12, onTime: 10, late: 1, missed: 1 },
          refusals: [],
          prnUsage: [],
          errors: [
            {
              errorId: '550e8400-e29b-41d4-a716-446655440007',
              type: 'missed',
              severity: 'low',
              personId: null,
            },
          ],
          cdBalances: [],
          notes: 'Escalate one missed dose to day shift.',
        },
        handoverNotes: 'Night lead to brief day staff at 07:00.',
      }),
    ).resolves.toEqual({
      success: true,
      data: expect.objectContaining({
        organisationId,
        generatedById: userId,
        shiftType: 'night',
      }),
    });
  });

  it('returns default no-op results for currently stubbed alert and sign-off helpers', async () => {
    await expect(getExpiryAlerts(organisationId)).resolves.toEqual([]);
    await expect(acknowledgeExpiryAlert(organisationId, batchId, userId)).resolves.toEqual({
      success: true,
    });
    await expect(checkAndGenerateReorders(organisationId, userId)).resolves.toEqual({
      success: true,
      reordersGenerated: 0,
    });
    await expect(notifyPharmacy(organisationId, reorderId, userId)).resolves.toEqual({
      success: true,
    });
    await expect(signHandoverReport(organisationId, reportId, userId, 'incoming')).resolves.toEqual({
      success: true,
    });
  });
});
