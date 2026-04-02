/**
 * Zod validation schema tests for EMAR feature.
 * Tests input validation for CD transactions, reconciliations, allergies, and overrides.
 */
import { describe, it, expect } from 'vitest';
import {
  cdRegisterEntrySchema,
  cdReconciliationSchema,
  transdermalPatchSchema,
  patchRemovalSchema,
  allergySchema,
  allergyOverrideSchema,
  dualWitnessSchema,
  drugInteractionSchema,
} from '@/features/emar/types';

// ---------------------------------------------------------------------------
// dualWitnessSchema
// ---------------------------------------------------------------------------

describe('dualWitnessSchema', () => {
  it('rejects same performer and witness', () => {
    const result = dualWitnessSchema.safeParse({
      performedBy: '550e8400-e29b-41d4-a716-446655440000',
      witnessedBy: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('accepts different performer and witness', () => {
    const result = dualWitnessSchema.safeParse({
      performedBy: '550e8400-e29b-41d4-a716-446655440000',
      witnessedBy: '550e8400-e29b-41d4-a716-446655440001',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid strings', () => {
    const result = dualWitnessSchema.safeParse({
      performedBy: 'not-a-uuid',
      witnessedBy: 'also-not-uuid',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// cdRegisterEntrySchema
// ---------------------------------------------------------------------------

describe('cdRegisterEntrySchema', () => {
  const validEntry = {
    registerId: '550e8400-e29b-41d4-a716-446655440000',
    transactionType: 'receipt' as const,
    quantityIn: 28,
    quantityOut: 0,
    transactionDate: new Date(),
    performedBy: '550e8400-e29b-41d4-a716-446655440001',
    witnessedBy: '550e8400-e29b-41d4-a716-446655440002',
  };

  it('accepts valid entry', () => {
    const result = cdRegisterEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('rejects invalid transaction type', () => {
    const result = cdRegisterEntrySchema.safeParse({
      ...validEntry,
      transactionType: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantities', () => {
    const result = cdRegisterEntrySchema.safeParse({
      ...validEntry,
      quantityIn: -5,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid transaction types', () => {
    const types = [
      'receipt',
      'administration',
      'disposal',
      'destruction',
      'adjustment',
      'return_to_pharmacy',
    ];
    for (const type of types) {
      const result = cdRegisterEntrySchema.safeParse({
        ...validEntry,
        transactionType: type,
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// cdReconciliationSchema
// ---------------------------------------------------------------------------

describe('cdReconciliationSchema', () => {
  it('requires investigation notes when discrepancy exists', () => {
    const result = cdReconciliationSchema.safeParse({
      registerId: '550e8400-e29b-41d4-a716-446655440000',
      expectedBalance: 10,
      actualCount: 8,
      reconciliationDate: new Date(),
      performedBy: '550e8400-e29b-41d4-a716-446655440001',
      witnessedBy: '550e8400-e29b-41d4-a716-446655440002',
      // No investigationNotes — should fail
    });
    expect(result.success).toBe(false);
  });

  it('accepts matching count without investigation notes', () => {
    const result = cdReconciliationSchema.safeParse({
      registerId: '550e8400-e29b-41d4-a716-446655440000',
      expectedBalance: 10,
      actualCount: 10,
      reconciliationDate: new Date(),
      performedBy: '550e8400-e29b-41d4-a716-446655440001',
      witnessedBy: '550e8400-e29b-41d4-a716-446655440002',
    });
    expect(result.success).toBe(true);
  });

  it('accepts discrepancy with investigation notes', () => {
    const result = cdReconciliationSchema.safeParse({
      registerId: '550e8400-e29b-41d4-a716-446655440000',
      expectedBalance: 10,
      actualCount: 8,
      reconciliationDate: new Date(),
      performedBy: '550e8400-e29b-41d4-a716-446655440001',
      witnessedBy: '550e8400-e29b-41d4-a716-446655440002',
      investigationNotes: 'Counted three times. Two tablets unaccounted for.',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// allergySchema
// ---------------------------------------------------------------------------

describe('allergySchema', () => {
  it('accepts valid allergy', () => {
    const result = allergySchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      allergen: 'Penicillin',
      allergyType: 'drug',
      severity: 'severe',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty allergen', () => {
    const result = allergySchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      allergen: '',
    });
    expect(result.success).toBe(false);
  });

  it('defaults allergyType to drug', () => {
    const result = allergySchema.safeParse({
      personId: '550e8400-e29b-41d4-a716-446655440000',
      allergen: 'Codeine',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allergyType).toBe('drug');
    }
  });
});

// ---------------------------------------------------------------------------
// allergyOverrideSchema
// ---------------------------------------------------------------------------

describe('allergyOverrideSchema', () => {
  const validOverride = {
    personId: '550e8400-e29b-41d4-a716-446655440000',
    medicationId: '550e8400-e29b-41d4-a716-446655440001',
    allergyId: '550e8400-e29b-41d4-a716-446655440002',
    requestedBy: '550e8400-e29b-41d4-a716-446655440003',
    authorisedBy: '550e8400-e29b-41d4-a716-446655440004',
    clinicalJustification:
      'Patient has tolerated this medication previously without adverse reaction. Benefits outweigh risks.',
    matchedAllergen: 'Penicillin',
    matchedMedicationDetail: 'Amoxicillin (active ingredient)',
  };

  it('accepts valid override with sufficient justification', () => {
    const result = allergyOverrideSchema.safeParse(validOverride);
    expect(result.success).toBe(true);
  });

  it('rejects justification shorter than 10 characters', () => {
    const result = allergyOverrideSchema.safeParse({
      ...validOverride,
      clinicalJustification: 'Too short',
    });
    expect(result.success).toBe(false);
  });

  it('requires matchedAllergen', () => {
    const { matchedAllergen: _, ...rest } = validOverride;
    const result = allergyOverrideSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('requires authorisedBy', () => {
    const { authorisedBy: _, ...rest } = validOverride;
    const result = allergyOverrideSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// drugInteractionSchema
// ---------------------------------------------------------------------------

describe('drugInteractionSchema', () => {
  it('accepts valid interaction', () => {
    const result = drugInteractionSchema.safeParse({
      drugA: 'Warfarin',
      drugB: 'Aspirin',
      severity: 'major',
      description: 'Increased bleeding risk',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid severity', () => {
    const result = drugInteractionSchema.safeParse({
      drugA: 'A',
      drugB: 'B',
      severity: 'invalid',
      description: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid severity levels', () => {
    for (const severity of ['minor', 'moderate', 'major', 'contraindicated']) {
      const result = drugInteractionSchema.safeParse({
        drugA: 'A',
        drugB: 'B',
        severity,
        description: 'test',
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// transdermalPatchSchema
// ---------------------------------------------------------------------------

describe('transdermalPatchSchema', () => {
  it('accepts valid patch application', () => {
    const result = transdermalPatchSchema.safeParse({
      registerId: '550e8400-e29b-41d4-a716-446655440000',
      medicationId: '550e8400-e29b-41d4-a716-446655440001',
      personId: '550e8400-e29b-41d4-a716-446655440002',
      applicationSite: 'left_upper_arm',
      appliedAt: new Date(),
      appliedBy: '550e8400-e29b-41d4-a716-446655440003',
      applicationWitnessedBy: '550e8400-e29b-41d4-a716-446655440004',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid application site', () => {
    const result = transdermalPatchSchema.safeParse({
      registerId: '550e8400-e29b-41d4-a716-446655440000',
      medicationId: '550e8400-e29b-41d4-a716-446655440001',
      personId: '550e8400-e29b-41d4-a716-446655440002',
      applicationSite: 'invalid_site',
      appliedAt: new Date(),
      appliedBy: '550e8400-e29b-41d4-a716-446655440003',
      applicationWitnessedBy: '550e8400-e29b-41d4-a716-446655440004',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// patchRemovalSchema
// ---------------------------------------------------------------------------

describe('patchRemovalSchema', () => {
  it('accepts valid patch removal', () => {
    const result = patchRemovalSchema.safeParse({
      patchId: '550e8400-e29b-41d4-a716-446655440000',
      removedAt: new Date(),
      removedBy: '550e8400-e29b-41d4-a716-446655440001',
      removalWitnessedBy: '550e8400-e29b-41d4-a716-446655440002',
      disposalMethod: 'clinical_waste',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid disposal method', () => {
    const result = patchRemovalSchema.safeParse({
      patchId: '550e8400-e29b-41d4-a716-446655440000',
      removedAt: new Date(),
      removedBy: '550e8400-e29b-41d4-a716-446655440001',
      removalWitnessedBy: '550e8400-e29b-41d4-a716-446655440002',
      disposalMethod: 'invalid_method',
    });
    expect(result.success).toBe(false);
  });
});
