/**
 * Ofsted Compliance Engine — Zod validation schemas.
 *
 * Used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import { EVIDENCE_STATUSES, LEGAL_STATUSES, SOP_STATUSES, EVIDENCE_TYPES } from './constants';

// ---------------------------------------------------------------------------
// Date validation helper
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function hasEvidenceDescription(value: string | null | undefined) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasEvidenceLink(value: string | null | undefined) {
  return typeof value === 'string' && value.length > 0;
}

// ---------------------------------------------------------------------------
// Evidence schemas
// ---------------------------------------------------------------------------

export const createEvidenceSchema = z
  .object({
    standardId: z.string().uuid('Invalid standard ID'),
    subRequirementId: z.string().min(1, 'Sub-requirement ID is required'),
    evidenceType: z.enum(EVIDENCE_TYPES),
    evidenceId: z
      .string()
      .uuid('Invalid evidence record ID')
      .optional()
      .nullable(),
    description: z
      .string()
      .max(2000, 'Description must be 2000 characters or fewer')
      .optional()
      .nullable(),
    status: z.enum(EVIDENCE_STATUSES).default('evidenced'),
  })
  .superRefine((data, ctx) => {
    const hasDescription = hasEvidenceDescription(data.description);
    const hasLinkedRecord = hasEvidenceLink(data.evidenceId);

    if (!hasDescription && !hasLinkedRecord) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add a description or link a record as evidence',
        path: ['description'],
      });
    }

    if (data.evidenceType === 'manual' && !hasDescription) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Manual evidence requires a description',
        path: ['description'],
      });
    }
  });

export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;

export const updateEvidenceSchema = z
  .object({
    description: z
      .string()
      .max(2000, 'Description must be 2000 characters or fewer')
      .optional()
      .nullable(),
    status: z.enum(EVIDENCE_STATUSES).optional(),
    evidenceType: z.enum(EVIDENCE_TYPES).optional(),
    evidenceId: z
      .string()
      .uuid('Invalid evidence record ID')
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    const hasDescription = hasEvidenceDescription(data.description);
    const hasLinkedRecord = hasEvidenceLink(data.evidenceId);
    const touchedEvidenceFields =
      data.description !== undefined || data.evidenceId !== undefined;

    if (touchedEvidenceFields && !hasDescription && !hasLinkedRecord) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Add a description or link a record as evidence',
        path: ['description'],
      });
    }

    if (
      data.evidenceType === 'manual' &&
      data.description !== undefined &&
      !hasDescription
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Manual evidence requires a description',
        path: ['description'],
      });
    }
  });

export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;

// ---------------------------------------------------------------------------
// Children's register schemas
// ---------------------------------------------------------------------------

export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email').optional().nullable(),
});

export const createRegisterEntrySchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  admissionDate: z
    .string()
    .regex(DATE_REGEX, 'Admission date must be in YYYY-MM-DD format'),
  dischargeDate: z
    .string()
    .regex(DATE_REGEX, 'Discharge date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  legalStatus: z.enum(LEGAL_STATUSES),
  placingAuthority: z.string().min(1, 'Placing authority is required'),
  socialWorkerName: z.string().max(255).optional().nullable(),
  socialWorkerEmail: z.string().email('Invalid email').max(255).optional().nullable(),
  socialWorkerPhone: z.string().max(50).optional().nullable(),
  iroName: z.string().max(255).optional().nullable(),
  emergencyContact: emergencyContactSchema,
});

export type CreateRegisterEntryInput = z.infer<typeof createRegisterEntrySchema>;

export const updateRegisterEntrySchema = z.object({
  admissionDate: z
    .string()
    .regex(DATE_REGEX, 'Admission date must be in YYYY-MM-DD format')
    .optional(),
  dischargeDate: z
    .string()
    .regex(DATE_REGEX, 'Discharge date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  legalStatus: z.enum(LEGAL_STATUSES).optional(),
  placingAuthority: z.string().min(1).optional(),
  socialWorkerName: z.string().max(255).optional().nullable(),
  socialWorkerEmail: z.string().email('Invalid email').max(255).optional().nullable(),
  socialWorkerPhone: z.string().max(50).optional().nullable(),
  iroName: z.string().max(255).optional().nullable(),
  emergencyContact: emergencyContactSchema.optional(),
});

export type UpdateRegisterEntryInput = z.infer<typeof updateRegisterEntrySchema>;

// ---------------------------------------------------------------------------
// Statement of Purpose schemas
// ---------------------------------------------------------------------------

export const sopSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Section title is required'),
  content: z.string(),
  order: z.number().int().min(0),
});

export const createStatementSchema = z.object({
  content: z.array(sopSectionSchema).min(1, 'At least one section is required'),
  status: z.enum(SOP_STATUSES).default('draft'),
});

export type CreateStatementInput = z.infer<typeof createStatementSchema>;

export const updateStatementSchema = z.object({
  content: z.array(sopSectionSchema).optional(),
  status: z.enum(SOP_STATUSES).optional(),
});

export type UpdateStatementInput = z.infer<typeof updateStatementSchema>;
