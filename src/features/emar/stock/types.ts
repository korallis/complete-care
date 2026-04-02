/**
 * Stock management types and Zod validation schemas.
 * VAL-EMAR-012: Stock levels, transactions, reorder workflow
 * VAL-EMAR-013: Expiry tracking
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const MEDICATION_FORMS = [
  'tablet',
  'capsule',
  'liquid',
  'cream',
  'ointment',
  'gel',
  'inhaler',
  'injection',
  'patch',
  'drops',
  'suppository',
  'spray',
  'powder',
  'lozenge',
  'other',
] as const;

export const STORAGE_REQUIREMENTS = [
  'room_temp',
  'refrigerated',
  'controlled_drug_cabinet',
] as const;

export const CD_SCHEDULES = [
  'schedule_2',
  'schedule_3',
  'schedule_4',
  'schedule_5',
] as const;

export const TRANSACTION_TYPES = [
  'receipt',
  'issue',
  'adjustment',
  'return',
  'disposal',
] as const;

export const REORDER_STATUSES = [
  'pending',
  'approved',
  'ordered',
  'partially_received',
  'received',
  'cancelled',
] as const;

export const STOCK_UNITS = [
  'tablets',
  'capsules',
  'ml',
  'doses',
  'patches',
  'ampoules',
  'sachets',
  'units',
  'grams',
  'applications',
] as const;

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

export const createMedicationStockSchema = z.object({
  medicationName: z.string().min(1, 'Medication name is required').max(500),
  medicationCode: z.string().max(50).optional(),
  form: z.enum(MEDICATION_FORMS),
  strength: z.string().min(1, 'Strength is required').max(100),
  currentQuantity: z.number().int().min(0).default(0),
  minimumThreshold: z.number().int().min(0).default(0),
  reorderPoint: z.number().int().min(0).default(0),
  reorderQuantity: z.number().int().min(0).default(0),
  unit: z.enum(STOCK_UNITS).default('tablets'),
  storageRequirement: z.enum(STORAGE_REQUIREMENTS).default('room_temp'),
  isControlledDrug: z.boolean().default(false),
  controlledDrugSchedule: z.enum(CD_SCHEDULES).optional(),
  pharmacySupplier: z.string().max(500).optional(),
});

export const updateMedicationStockSchema = createMedicationStockSchema.partial();

export const createStockBatchSchema = z.object({
  medicationStockId: z.string().uuid(),
  batchNumber: z.string().min(1, 'Batch number is required').max(100),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  expiryAlertDays: z.number().int().min(1).max(365).default(30),
});

export const createStockTransactionSchema = z.object({
  medicationStockId: z.string().uuid(),
  stockBatchId: z.string().uuid().optional(),
  transactionType: z.enum(TRANSACTION_TYPES),
  quantity: z.number().int().refine((v) => v !== 0, 'Quantity cannot be zero'),
  witnessedById: z.string().uuid().optional(),
  reason: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  administrationRecordId: z.string().uuid().optional(),
  sourceDestination: z.string().max(200).optional(),
});

export const createReorderRequestSchema = z.object({
  medicationStockId: z.string().uuid(),
  quantityRequested: z.number().int().min(1),
  notes: z.string().max(2000).optional(),
});

export const updateReorderStatusSchema = z.object({
  status: z.enum(REORDER_STATUSES),
  quantityReceived: z.number().int().min(0).optional(),
  pharmacyReference: z.string().max(200).optional(),
  expectedDeliveryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  cancellationReason: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type CreateMedicationStock = z.infer<typeof createMedicationStockSchema>;
export type UpdateMedicationStock = z.infer<typeof updateMedicationStockSchema>;
export type CreateStockBatch = z.infer<typeof createStockBatchSchema>;
export type CreateStockTransaction = z.infer<typeof createStockTransactionSchema>;
export type CreateReorderRequest = z.infer<typeof createReorderRequestSchema>;
export type UpdateReorderStatus = z.infer<typeof updateReorderStatusSchema>;

// ---------------------------------------------------------------------------
// Expiry alert type
// ---------------------------------------------------------------------------

export interface ExpiryAlert {
  batchId: string;
  medicationStockId: string;
  medicationName: string;
  batchNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: number;
  isExpired: boolean;
  isAcknowledged: boolean;
}

// ---------------------------------------------------------------------------
// Handover report summary structure (VAL-EMAR-016)
// ---------------------------------------------------------------------------

export interface HandoverSummary {
  administrations: {
    total: number;
    onTime: number;
    late: number;
    missed: number;
  };
  refusals: Array<{
    personId: string;
    medicationName: string;
    time: string;
    reason: string;
  }>;
  prnUsage: Array<{
    personId: string;
    medicationName: string;
    time: string;
    reason: string;
    effectiveness: string | null;
  }>;
  errors: Array<{
    errorId: string;
    type: string;
    severity: string;
    personId: string | null;
  }>;
  cdBalances: Array<{
    medicationName: string;
    expectedBalance: number;
    actualBalance: number;
    discrepancy: boolean;
  }>;
  notes: string;
}

export const SHIFT_TYPES = ['day', 'night', 'twilight', 'long_day'] as const;

export const createHandoverReportSchema = z.object({
  shiftType: z.enum(SHIFT_TYPES),
  shiftStartAt: z.string().datetime(),
  shiftEndAt: z.string().datetime(),
  summary: z.custom<HandoverSummary>(),
  handoverNotes: z.string().max(5000).optional(),
});

export type CreateHandoverReport = z.infer<typeof createHandoverReportSchema>;
