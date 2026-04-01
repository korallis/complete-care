/**
 * Tests for EMAR Zod validation schemas.
 *
 * Validates:
 * - createMedicationSchema accepts valid input
 * - createMedicationSchema rejects invalid input
 * - recordAdministrationSchema validation
 * - Reason required for refused/withheld/omitted statuses
 * - discontinueMedicationSchema validation
 * - frequencyDetailSchema validation
 */

import { describe, it, expect } from 'vitest';
import {
  createMedicationSchema,
  updateMedicationSchema,
  recordAdministrationSchema,
  discontinueMedicationSchema,
  frequencyDetailSchema,
} from '@/features/emar/schema';

// ---------------------------------------------------------------------------
// createMedicationSchema
// ---------------------------------------------------------------------------

describe('createMedicationSchema', () => {
  const validInput = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    drugName: 'Paracetamol',
    dose: '500',
    doseUnit: 'mg' as const,
    route: 'oral' as const,
    frequency: 'regular' as const,
    frequencyDetail: {
      timesOfDay: ['08:00', '14:00', '22:00'],
    },
    prescribedDate: '2026-04-01',
    prescriberName: 'Dr. Smith',
    pharmacy: 'Boots',
    specialInstructions: 'Take with food',
  };

  it('accepts valid complete input', () => {
    const result = createMedicationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts input with optional fields omitted', () => {
    const required = {
      personId: validInput.personId,
      drugName: validInput.drugName,
      dose: validInput.dose,
      doseUnit: validInput.doseUnit,
      route: validInput.route,
      frequency: validInput.frequency,
      frequencyDetail: validInput.frequencyDetail,
      prescribedDate: validInput.prescribedDate,
      prescriberName: validInput.prescriberName,
    };
    const result = createMedicationSchema.safeParse(required);
    expect(result.success).toBe(true);
  });

  it('rejects missing drug name', () => {
    const result = createMedicationSchema.safeParse({
      ...validInput,
      drugName: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('drugName');
    }
  });

  it('rejects invalid person ID', () => {
    const result = createMedicationSchema.safeParse({
      ...validInput,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid route', () => {
    const result = createMedicationSchema.safeParse({
      ...validInput,
      route: 'intravenous',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid frequency', () => {
    const result = createMedicationSchema.safeParse({
      ...validInput,
      frequency: 'bi_weekly',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid prescribed date format', () => {
    const result = createMedicationSchema.safeParse({
      ...validInput,
      prescribedDate: '01/04/2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing dose', () => {
    const result = createMedicationSchema.safeParse({
      ...validInput,
      dose: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing prescriber name', () => {
    const result = createMedicationSchema.safeParse({
      ...validInput,
      prescriberName: '',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateMedicationSchema
// ---------------------------------------------------------------------------

describe('updateMedicationSchema', () => {
  it('accepts partial updates', () => {
    const result = updateMedicationSchema.safeParse({
      drugName: 'Ibuprofen',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (no changes)', () => {
    const result = updateMedicationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid dose unit', () => {
    const result = updateMedicationSchema.safeParse({
      doseUnit: 'liters',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// recordAdministrationSchema
// ---------------------------------------------------------------------------

describe('recordAdministrationSchema', () => {
  const validAdmin = {
    medicationId: '550e8400-e29b-41d4-a716-446655440000',
    scheduledTime: '2026-04-01T08:00:00.000Z',
    status: 'given' as const,
  };

  it('accepts valid "given" administration', () => {
    const result = recordAdministrationSchema.safeParse(validAdmin);
    expect(result.success).toBe(true);
  });

  it('accepts "self_administered" without reason', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      status: 'self_administered',
    });
    expect(result.success).toBe(true);
  });

  it('accepts "refused" with reason', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      status: 'refused',
      reason: 'Patient declined medication, stated feeling nauseous',
    });
    expect(result.success).toBe(true);
  });

  it('rejects "refused" without reason', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      status: 'refused',
    });
    expect(result.success).toBe(false);
  });

  it('rejects "withheld" without reason', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      status: 'withheld',
      reason: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects "omitted" without reason', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      status: 'omitted',
    });
    expect(result.success).toBe(false);
  });

  it('rejects "not_available" without reason', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      status: 'not_available',
    });
    expect(result.success).toBe(false);
  });

  it('accepts "withheld" with reason', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      status: 'withheld',
      reason: 'Low blood pressure, GP advised to withhold',
    });
    expect(result.success).toBe(true);
  });

  it('accepts with witness and notes', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      witnessId: '550e8400-e29b-41d4-a716-446655440001',
      witnessName: 'Jane Doe',
      notes: 'Patient observed swallowing tablet',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid medication ID', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      medicationId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = recordAdministrationSchema.safeParse({
      ...validAdmin,
      status: 'administered',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// discontinueMedicationSchema
// ---------------------------------------------------------------------------

describe('discontinueMedicationSchema', () => {
  it('accepts valid discontinuation', () => {
    const result = discontinueMedicationSchema.safeParse({
      reason: 'GP advised to stop medication',
      status: 'discontinued',
    });
    expect(result.success).toBe(true);
  });

  it('defaults to discontinued status', () => {
    const result = discontinueMedicationSchema.safeParse({
      reason: 'Course completed',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('discontinued');
    }
  });

  it('accepts suspended status', () => {
    const result = discontinueMedicationSchema.safeParse({
      reason: 'Temporary hold pending blood test results',
      status: 'suspended',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing reason', () => {
    const result = discontinueMedicationSchema.safeParse({
      reason: '',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// frequencyDetailSchema
// ---------------------------------------------------------------------------

describe('frequencyDetailSchema', () => {
  it('accepts valid times', () => {
    const result = frequencyDetailSchema.safeParse({
      timesOfDay: ['08:00', '14:00', '22:00'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts with days of week', () => {
    const result = frequencyDetailSchema.safeParse({
      timesOfDay: ['09:00'],
      daysOfWeek: ['mon', 'wed', 'fri'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty times', () => {
    const result = frequencyDetailSchema.safeParse({
      timesOfDay: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid time format', () => {
    const result = frequencyDetailSchema.safeParse({
      timesOfDay: ['8:00'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time value', () => {
    const result = frequencyDetailSchema.safeParse({
      timesOfDay: ['25:00'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid day of week', () => {
    const result = frequencyDetailSchema.safeParse({
      timesOfDay: ['08:00'],
      daysOfWeek: ['monday'],
    });
    expect(result.success).toBe(false);
  });
});
