import { describe, it, expect } from 'vitest';
import {
  createMedicationStockSchema,
  createStockBatchSchema,
  createStockTransactionSchema,
  createReorderRequestSchema,
  updateReorderStatusSchema,
  createHandoverReportSchema,
} from './types';

describe('createMedicationStockSchema', () => {
  const validData = {
    medicationName: 'Paracetamol',
    form: 'tablet' as const,
    strength: '500mg',
    currentQuantity: 100,
    minimumThreshold: 20,
    reorderPoint: 30,
    reorderQuantity: 100,
    unit: 'tablets' as const,
    storageRequirement: 'room_temp' as const,
    isControlledDrug: false,
  };

  it('should validate correct medication stock data', () => {
    const result = createMedicationStockSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty medication name', () => {
    const result = createMedicationStockSchema.safeParse({
      ...validData,
      medicationName: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid form', () => {
    const result = createMedicationStockSchema.safeParse({
      ...validData,
      form: 'invalid_form',
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative quantities', () => {
    const result = createMedicationStockSchema.safeParse({
      ...validData,
      currentQuantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should accept controlled drug with schedule', () => {
    const result = createMedicationStockSchema.safeParse({
      ...validData,
      isControlledDrug: true,
      controlledDrugSchedule: 'schedule_2',
    });
    expect(result.success).toBe(true);
  });

  it('should apply defaults for optional fields', () => {
    const result = createMedicationStockSchema.parse({
      medicationName: 'Ibuprofen',
      form: 'tablet',
      strength: '200mg',
    });
    expect(result.currentQuantity).toBe(0);
    expect(result.minimumThreshold).toBe(0);
    expect(result.unit).toBe('tablets');
    expect(result.storageRequirement).toBe('room_temp');
    expect(result.isControlledDrug).toBe(false);
  });
});

describe('createStockBatchSchema', () => {
  const validBatch = {
    medicationStockId: '550e8400-e29b-41d4-a716-446655440000',
    batchNumber: 'BATCH-2026-001',
    expiryDate: '2027-06-15',
    quantity: 100,
  };

  it('should validate correct batch data', () => {
    const result = createStockBatchSchema.safeParse(validBatch);
    expect(result.success).toBe(true);
  });

  it('should reject invalid date format', () => {
    const result = createStockBatchSchema.safeParse({
      ...validBatch,
      expiryDate: '15/06/2027',
    });
    expect(result.success).toBe(false);
  });

  it('should reject zero quantity', () => {
    const result = createStockBatchSchema.safeParse({
      ...validBatch,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should default expiryAlertDays to 30', () => {
    const result = createStockBatchSchema.parse(validBatch);
    expect(result.expiryAlertDays).toBe(30);
  });
});

describe('createStockTransactionSchema', () => {
  const validTransaction = {
    medicationStockId: '550e8400-e29b-41d4-a716-446655440000',
    transactionType: 'receipt' as const,
    quantity: 50,
  };

  it('should validate correct transaction data', () => {
    const result = createStockTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
  });

  it('should reject zero quantity', () => {
    const result = createStockTransactionSchema.safeParse({
      ...validTransaction,
      quantity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should accept negative quantity for disposals', () => {
    const result = createStockTransactionSchema.safeParse({
      ...validTransaction,
      transactionType: 'disposal',
      quantity: -10,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid transaction type', () => {
    const result = createStockTransactionSchema.safeParse({
      ...validTransaction,
      transactionType: 'steal',
    });
    expect(result.success).toBe(false);
  });
});

describe('createReorderRequestSchema', () => {
  it('should validate correct reorder data', () => {
    const result = createReorderRequestSchema.safeParse({
      medicationStockId: '550e8400-e29b-41d4-a716-446655440000',
      quantityRequested: 100,
    });
    expect(result.success).toBe(true);
  });

  it('should reject zero quantity', () => {
    const result = createReorderRequestSchema.safeParse({
      medicationStockId: '550e8400-e29b-41d4-a716-446655440000',
      quantityRequested: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateReorderStatusSchema', () => {
  it('should validate status transitions', () => {
    const result = updateReorderStatusSchema.safeParse({
      status: 'ordered',
      pharmacyReference: 'PH-2026-001',
    });
    expect(result.success).toBe(true);
  });

  it('should accept received status with quantity', () => {
    const result = updateReorderStatusSchema.safeParse({
      status: 'received',
      quantityReceived: 100,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = updateReorderStatusSchema.safeParse({
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });
});

describe('createHandoverReportSchema', () => {
  it('should validate correct handover report', () => {
    const result = createHandoverReportSchema.safeParse({
      shiftType: 'day',
      shiftStartAt: '2026-04-02T07:00:00.000Z',
      shiftEndAt: '2026-04-02T19:00:00.000Z',
      summary: {
        administrations: { total: 45, onTime: 40, late: 3, missed: 2 },
        refusals: [],
        prnUsage: [],
        errors: [],
        cdBalances: [],
        notes: '',
      },
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid shift type', () => {
    const result = createHandoverReportSchema.safeParse({
      shiftType: 'invalid',
      shiftStartAt: '2026-04-02T07:00:00.000Z',
      shiftEndAt: '2026-04-02T19:00:00.000Z',
      summary: {},
    });
    expect(result.success).toBe(false);
  });
});
