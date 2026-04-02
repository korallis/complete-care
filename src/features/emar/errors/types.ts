/**
 * Medication error/incident reporting types and validation schemas.
 * VAL-EMAR-015: Medication error/incident reporting
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const ERROR_TYPES = [
  'wrong_dose',
  'wrong_person',
  'wrong_time',
  'missed',
  'wrong_medication',
  'wrong_route',
  'wrong_form',
  'omission',
  'extra_dose',
  'expired_medication',
  'documentation_error',
  'storage_error',
  'other',
] as const;

export const SEVERITY_LEVELS = [
  'no_harm',
  'low',
  'moderate',
  'severe',
  'death',
] as const;

export const INVESTIGATION_STATUSES = [
  'reported',
  'under_investigation',
  'resolved',
  'closed',
] as const;

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

export const reportMedicationErrorSchema = z.object({
  errorType: z.enum(ERROR_TYPES),
  severity: z.enum(SEVERITY_LEVELS),
  occurredAt: z.string().datetime(),
  discoveredAt: z.string().datetime(),
  personId: z.string().uuid().optional(),
  medicationStockId: z.string().uuid().optional(),
  administrationRecordId: z.string().uuid().optional(),
  involvedStaffId: z.string().uuid().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  immediateActions: z.string().max(5000).optional(),
});

export const updateInvestigationSchema = z.object({
  investigationStatus: z.enum(INVESTIGATION_STATUSES),
  investigatorId: z.string().uuid().optional(),
  investigationFindings: z.string().max(5000).optional(),
  rootCause: z.string().max(5000).optional(),
  correctiveActions: z.string().max(5000).optional(),
  externallyReported: z.boolean().optional(),
  externalReportingDetails: z.string().max(2000).optional(),
  personInformed: z.boolean().optional(),
  gpNotified: z.boolean().optional(),
  lessonsLearned: z.string().max(5000).optional(),
});

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

export type ReportMedicationError = z.infer<typeof reportMedicationErrorSchema>;
export type UpdateInvestigation = z.infer<typeof updateInvestigationSchema>;

// ---------------------------------------------------------------------------
// Topical MAR types (VAL-EMAR-019)
// ---------------------------------------------------------------------------

export const TOPICAL_FREQUENCIES = [
  'as_needed',
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'other',
] as const;

export const TOPICAL_STATUSES = [
  'applied',
  'refused',
  'not_required',
  'skin_condition_prevented',
] as const;

export interface BodyMapSite {
  region: string;
  x: number;
  y: number;
  description: string;
}

export interface BodyMapData {
  sites: BodyMapSite[];
}

export const createTopicalMarSchema = z.object({
  personId: z.string().uuid(),
  medicationStockId: z.string().uuid().optional(),
  medicationName: z.string().min(1).max(500),
  instructions: z.string().min(1).max(2000),
  frequency: z.enum(TOPICAL_FREQUENCIES),
  frequencyDescription: z.string().max(500).optional(),
  prescriber: z.string().max(200).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const recordTopicalAdministrationSchema = z.object({
  topicalMarId: z.string().uuid(),
  administeredAt: z.string().datetime(),
  status: z.enum(TOPICAL_STATUSES).default('applied'),
  bodyMapData: z.custom<BodyMapData>().optional(),
  applicationSite: z.string().min(1).max(500),
  skinCondition: z.string().max(1000).optional(),
  adverseReaction: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateTopicalMar = z.infer<typeof createTopicalMarSchema>;
export type RecordTopicalAdministration = z.infer<typeof recordTopicalAdministrationSchema>;

// ---------------------------------------------------------------------------
// Homely Remedies types (VAL-EMAR-019)
// ---------------------------------------------------------------------------

export const createHomelyRemedyProtocolSchema = z.object({
  medicationName: z.string().min(1).max(500),
  form: z.string().min(1).max(100),
  strength: z.string().min(1).max(100),
  indication: z.string().min(1).max(1000),
  dosageInstructions: z.string().min(1).max(2000),
  maxDose24Hours: z.string().min(1).max(200),
  contraindications: z.string().max(2000).optional(),
  sideEffects: z.string().max(2000).optional(),
  interactions: z.string().max(2000).optional(),
  maxDurationDays: z.number().int().min(1).max(365).optional(),
  approvedBy: z.string().min(1).max(200),
  approvedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reviewDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const recordHomelyRemedyAdministrationSchema = z.object({
  protocolId: z.string().uuid(),
  personId: z.string().uuid(),
  administeredAt: z.string().datetime(),
  doseGiven: z.string().min(1).max(200),
  reason: z.string().min(1).max(1000),
  outcome: z.string().max(1000).optional(),
  gpInformed: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

export type CreateHomelyRemedyProtocol = z.infer<typeof createHomelyRemedyProtocolSchema>;
export type RecordHomelyRemedyAdministration = z.infer<
  typeof recordHomelyRemedyAdministrationSchema
>;
