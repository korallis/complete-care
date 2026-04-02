/**
 * EMAR feature types — Controlled Drugs & Medication Alerts
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// CD Transaction Types
// ---------------------------------------------------------------------------

export const CD_TRANSACTION_TYPES = [
  'receipt',
  'administration',
  'disposal',
  'destruction',
  'adjustment',
  'return_to_pharmacy',
] as const;
export type CdTransactionType = (typeof CD_TRANSACTION_TYPES)[number];

export const CD_SCHEDULES = ['2', '3', '4', '5'] as const;
export type CdSchedule = (typeof CD_SCHEDULES)[number];

export const CD_FORMS = [
  'tablet',
  'capsule',
  'liquid',
  'patch',
  'ampoule',
  'other',
] as const;
export type CdForm = (typeof CD_FORMS)[number];

// ---------------------------------------------------------------------------
// Patch Tracking
// ---------------------------------------------------------------------------

export const PATCH_SITES = [
  'left_upper_arm',
  'right_upper_arm',
  'left_chest',
  'right_chest',
  'left_back',
  'right_back',
  'left_thigh',
  'right_thigh',
  'other',
] as const;
export type PatchSite = (typeof PATCH_SITES)[number];

export const PATCH_DISPOSAL_METHODS = [
  'folded_and_flushed',
  'returned_to_pharmacy',
  'clinical_waste',
  'other',
] as const;
export type PatchDisposalMethod = (typeof PATCH_DISPOSAL_METHODS)[number];

// ---------------------------------------------------------------------------
// Allergy & Interaction Types
// ---------------------------------------------------------------------------

export const ALLERGY_TYPES = ['drug', 'food', 'environmental', 'other'] as const;
export type AllergyType = (typeof ALLERGY_TYPES)[number];

export const ALLERGY_SEVERITIES = [
  'mild',
  'moderate',
  'severe',
  'life_threatening',
] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];

export const INTERACTION_SEVERITIES = [
  'minor',
  'moderate',
  'major',
  'contraindicated',
] as const;
export type InteractionSeverity = (typeof INTERACTION_SEVERITIES)[number];

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const cdRegisterEntrySchema = z.object({
  registerId: z.string().uuid(),
  transactionType: z.enum(CD_TRANSACTION_TYPES),
  quantityIn: z.number().int().min(0).default(0),
  quantityOut: z.number().int().min(0).default(0),
  transactionDate: z.coerce.date(),
  performedBy: z.string().uuid(),
  witnessedBy: z.string().uuid(),
  sourceOrDestination: z.string().optional(),
  batchNumber: z.string().optional(),
  administeredToPersonId: z.string().uuid().optional(),
  disposalMethod: z.string().optional(),
  notes: z.string().optional(),
});

export const cdReconciliationSchema = z
  .object({
    registerId: z.string().uuid(),
    expectedBalance: z.number().int(),
    actualCount: z.number().int().min(0),
    reconciliationDate: z.coerce.date(),
    performedBy: z.string().uuid(),
    witnessedBy: z.string().uuid(),
    investigationNotes: z.string().optional(),
    cdaoNotified: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const hasDiscrepancy = data.expectedBalance !== data.actualCount;
      if (hasDiscrepancy && !data.investigationNotes) {
        return false;
      }
      return true;
    },
    {
      message:
        'Investigation notes are mandatory when a discrepancy is detected',
      path: ['investigationNotes'],
    },
  );

export const transdermalPatchSchema = z.object({
  registerId: z.string().uuid(),
  medicationId: z.string().uuid(),
  personId: z.string().uuid(),
  applicationSite: z.enum(PATCH_SITES),
  applicationSiteDetail: z.string().optional(),
  appliedAt: z.coerce.date(),
  scheduledRemovalAt: z.coerce.date().optional(),
  appliedBy: z.string().uuid(),
  applicationWitnessedBy: z.string().uuid(),
  notes: z.string().optional(),
});

export const patchRemovalSchema = z.object({
  patchId: z.string().uuid(),
  removedAt: z.coerce.date(),
  removedBy: z.string().uuid(),
  removalWitnessedBy: z.string().uuid(),
  disposalMethod: z.enum(PATCH_DISPOSAL_METHODS),
  notes: z.string().optional(),
});

export const allergySchema = z.object({
  personId: z.string().uuid(),
  allergen: z.string().min(1),
  allergyType: z.enum(ALLERGY_TYPES).default('drug'),
  severity: z.enum(ALLERGY_SEVERITIES).default('moderate'),
  reaction: z.string().optional(),
  identifiedDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const allergyOverrideSchema = z.object({
  personId: z.string().uuid(),
  medicationId: z.string().uuid(),
  allergyId: z.string().uuid(),
  requestedBy: z.string().uuid(),
  authorisedBy: z.string().uuid(),
  clinicalJustification: z.string().min(10, {
    message:
      'Clinical justification must be at least 10 characters and provide clear rationale',
  }),
  matchedAllergen: z.string(),
  matchedMedicationDetail: z.string(),
});

export const drugInteractionSchema = z.object({
  drugA: z.string().min(1),
  drugB: z.string().min(1),
  severity: z.enum(INTERACTION_SEVERITIES),
  description: z.string().min(1),
  recommendation: z.string().optional(),
  source: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Dual Witness Validation
// ---------------------------------------------------------------------------

export const dualWitnessSchema = z
  .object({
    performedBy: z.string().uuid(),
    witnessedBy: z.string().uuid(),
  })
  .refine((data) => data.performedBy !== data.witnessedBy, {
    message: 'Witness must be a different staff member from the person performing the operation',
    path: ['witnessedBy'],
  });

// ---------------------------------------------------------------------------
// Alert Types for UI
// ---------------------------------------------------------------------------

export interface AllergyAlert {
  type: 'allergy';
  severity: AllergySeverity;
  allergyId: string;
  allergen: string;
  reaction: string | null;
  matchedOn: string; // what field matched (name, ingredient, etc.)
  medicationName: string;
  personId: string;
}

export interface InteractionAlert {
  type: 'interaction';
  severity: InteractionSeverity;
  interactionId: string;
  drugA: string;
  drugB: string;
  description: string;
  recommendation: string | null;
}

export interface DuplicateTherapeuticAlert {
  type: 'duplicate_therapeutic';
  therapeuticClass: string;
  existingMedication: string;
  newMedication: string;
}

export type MedicationAlert =
  | AllergyAlert
  | InteractionAlert
  | DuplicateTherapeuticAlert;
