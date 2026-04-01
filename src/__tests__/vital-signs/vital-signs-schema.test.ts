/**
 * Tests for vital signs Zod validation schema.
 *
 * Validates:
 * - recordVitalSignsSchema accepts valid input / rejects invalid
 * - Range validation for each vital parameter
 * - Optional/nullable fields
 */

import { describe, it, expect } from 'vitest';
import { recordVitalSignsSchema } from '@/features/vital-signs/schema';

const validInput = {
  personId: '550e8400-e29b-41d4-a716-446655440000',
  temperature: 37.0,
  systolicBp: 120,
  diastolicBp: 80,
  bpPosition: 'sitting' as const,
  pulseRate: 72,
  pulseRhythm: 'regular' as const,
  respiratoryRate: 16,
  spo2: 98,
  supplementalOxygen: false,
  oxygenFlowRate: null,
  avpu: 'alert' as const,
  bloodGlucose: 5.5,
  painScore: 0,
  isCopd: false,
  recordedAt: '2026-04-01T10:00:00.000Z',
  notes: null,
};

describe('recordVitalSignsSchema', () => {
  // --- Valid inputs ---

  it('accepts full valid input', () => {
    const result = recordVitalSignsSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts minimal input (only required fields)', () => {
    const result = recordVitalSignsSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      recordedAt: '2026-04-01T10:00:00.000Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all fields as null/optional', () => {
    const result = recordVitalSignsSchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      temperature: null,
      systolicBp: null,
      diastolicBp: null,
      bpPosition: null,
      pulseRate: null,
      pulseRhythm: null,
      respiratoryRate: null,
      spo2: null,
      supplementalOxygen: null,
      oxygenFlowRate: null,
      avpu: null,
      bloodGlucose: null,
      painScore: null,
      isCopd: false,
      recordedAt: '2026-04-01T10:00:00.000Z',
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts COPD patient input', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      isCopd: true,
    });
    expect(result.success).toBe(true);
  });

  // --- Person ID ---

  it('rejects invalid person ID', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  // --- Temperature range ---

  it('rejects temperature below 32', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      temperature: 31.9,
    });
    expect(result.success).toBe(false);
  });

  it('rejects temperature above 42', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      temperature: 42.1,
    });
    expect(result.success).toBe(false);
  });

  it('accepts temperature at boundaries', () => {
    expect(
      recordVitalSignsSchema.safeParse({ ...validInput, temperature: 32.0 }).success,
    ).toBe(true);
    expect(
      recordVitalSignsSchema.safeParse({ ...validInput, temperature: 42.0 }).success,
    ).toBe(true);
  });

  // --- Systolic BP range ---

  it('rejects systolic BP below 60', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      systolicBp: 59,
    });
    expect(result.success).toBe(false);
  });

  it('rejects systolic BP above 250', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      systolicBp: 251,
    });
    expect(result.success).toBe(false);
  });

  // --- Diastolic BP range ---

  it('rejects diastolic BP below 30', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      diastolicBp: 29,
    });
    expect(result.success).toBe(false);
  });

  it('rejects diastolic BP above 150', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      diastolicBp: 151,
    });
    expect(result.success).toBe(false);
  });

  // --- BP Position ---

  it('accepts all valid BP positions', () => {
    for (const pos of ['sitting', 'standing', 'lying'] as const) {
      expect(
        recordVitalSignsSchema.safeParse({ ...validInput, bpPosition: pos }).success,
      ).toBe(true);
    }
  });

  it('rejects invalid BP position', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      bpPosition: 'kneeling',
    });
    expect(result.success).toBe(false);
  });

  // --- Pulse rate range ---

  it('rejects pulse rate below 20', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      pulseRate: 19,
    });
    expect(result.success).toBe(false);
  });

  it('rejects pulse rate above 250', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      pulseRate: 251,
    });
    expect(result.success).toBe(false);
  });

  // --- Pulse rhythm ---

  it('accepts regular and irregular', () => {
    expect(
      recordVitalSignsSchema.safeParse({ ...validInput, pulseRhythm: 'regular' }).success,
    ).toBe(true);
    expect(
      recordVitalSignsSchema.safeParse({ ...validInput, pulseRhythm: 'irregular' }).success,
    ).toBe(true);
  });

  it('rejects invalid pulse rhythm', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      pulseRhythm: 'bounding',
    });
    expect(result.success).toBe(false);
  });

  // --- Respiratory rate range ---

  it('rejects respiratory rate below 1', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      respiratoryRate: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects respiratory rate above 60', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      respiratoryRate: 61,
    });
    expect(result.success).toBe(false);
  });

  // --- SpO2 range ---

  it('rejects SpO2 below 50', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      spo2: 49,
    });
    expect(result.success).toBe(false);
  });

  it('rejects SpO2 above 100', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      spo2: 101,
    });
    expect(result.success).toBe(false);
  });

  // --- AVPU ---

  it('accepts all AVPU levels', () => {
    for (const level of ['alert', 'voice', 'pain', 'unresponsive'] as const) {
      expect(
        recordVitalSignsSchema.safeParse({ ...validInput, avpu: level }).success,
      ).toBe(true);
    }
  });

  it('rejects invalid AVPU level', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      avpu: 'confused',
    });
    expect(result.success).toBe(false);
  });

  // --- Blood glucose range ---

  it('rejects blood glucose below 1.0', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      bloodGlucose: 0.9,
    });
    expect(result.success).toBe(false);
  });

  it('rejects blood glucose above 40.0', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      bloodGlucose: 40.1,
    });
    expect(result.success).toBe(false);
  });

  // --- Pain score range ---

  it('rejects pain score below 0', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      painScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects pain score above 10', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      painScore: 11,
    });
    expect(result.success).toBe(false);
  });

  // --- Notes ---

  it('rejects notes over 5000 characters', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      notes: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('accepts notes up to 5000 characters', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      notes: 'x'.repeat(5000),
    });
    expect(result.success).toBe(true);
  });

  // --- recordedAt ---

  it('rejects invalid date', () => {
    const result = recordVitalSignsSchema.safeParse({
      ...validInput,
      recordedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});
