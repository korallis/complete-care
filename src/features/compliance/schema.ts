/**
 * Compliance Dashboard validation schemas -- used for server actions and client-side forms.
 * This file MUST NOT have 'use server' -- it is imported by client components too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Date validation helper
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------------------
// Agency register statuses
// ---------------------------------------------------------------------------

export const AGENCY_STATUSES = ['active', 'inactive'] as const;

export type AgencyStatus = (typeof AGENCY_STATUSES)[number];

export const AGENCY_STATUS_LABELS: Record<AgencyStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

// ---------------------------------------------------------------------------
// Offer statuses
// ---------------------------------------------------------------------------

export const OFFER_STATUSES = ['pending', 'accepted', 'declined'] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
};

// ---------------------------------------------------------------------------
// Reference statuses
// ---------------------------------------------------------------------------

export const REFERENCE_STATUSES = ['pending', 'received', 'verified'] as const;

export type ReferenceStatus = (typeof REFERENCE_STATUSES)[number];

// ---------------------------------------------------------------------------
// RAG status types
// ---------------------------------------------------------------------------

export const RAG_COLOURS = ['green', 'amber', 'red', 'grey'] as const;

export type RagColour = (typeof RAG_COLOURS)[number];

// ---------------------------------------------------------------------------
// Compliance area types
// ---------------------------------------------------------------------------

export const COMPLIANCE_AREAS = [
  'dbs',
  'training',
  'supervision',
  'right_to_work',
  'qualifications',
] as const;

export type ComplianceArea = (typeof COMPLIANCE_AREAS)[number];

export const COMPLIANCE_AREA_LABELS: Record<ComplianceArea, string> = {
  dbs: 'DBS',
  training: 'Training',
  supervision: 'Supervision',
  right_to_work: 'Right to Work',
  qualifications: 'Qualifications',
};

// ---------------------------------------------------------------------------
// Create agency schema
// ---------------------------------------------------------------------------

export const createAgencySchema = z.object({
  agencyName: z
    .string()
    .min(1, 'Agency name is required')
    .max(255, 'Agency name must be 255 characters or fewer'),
  contactEmail: z
    .string()
    .email('Invalid email address')
    .max(255)
    .optional()
    .nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  contractStart: z
    .string()
    .regex(DATE_REGEX, 'Contract start date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  contractEnd: z
    .string()
    .regex(DATE_REGEX, 'Contract end date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  status: z.enum(AGENCY_STATUSES).default('active'),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;

// ---------------------------------------------------------------------------
// Update agency schema
// ---------------------------------------------------------------------------

export const updateAgencySchema = createAgencySchema.partial();

export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;

// ---------------------------------------------------------------------------
// Create agency worker schema
// ---------------------------------------------------------------------------

export const createAgencyWorkerSchema = z.object({
  agencyId: z.string().uuid('Invalid agency ID'),
  name: z
    .string()
    .min(1, 'Worker name is required')
    .max(255, 'Worker name must be 255 characters or fewer'),
  role: z.string().max(255).optional().nullable(),
  startDate: z
    .string()
    .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  dbsCertificateNumber: z.string().max(50).optional().nullable(),
});

export type CreateAgencyWorkerInput = z.infer<typeof createAgencyWorkerSchema>;

// ---------------------------------------------------------------------------
// Update agency worker schema
// ---------------------------------------------------------------------------

export const updateAgencyWorkerSchema = z.object({
  name: z
    .string()
    .min(1, 'Worker name is required')
    .max(255, 'Worker name must be 255 characters or fewer')
    .optional(),
  role: z.string().max(255).optional().nullable(),
  startDate: z
    .string()
    .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(DATE_REGEX, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  dbsCertificateNumber: z.string().max(50).optional().nullable(),
});

export type UpdateAgencyWorkerInput = z.infer<typeof updateAgencyWorkerSchema>;

// ---------------------------------------------------------------------------
// Create recruitment record schema
// ---------------------------------------------------------------------------

export const createRecruitmentRecordSchema = z.object({
  staffProfileId: z.string().uuid('Invalid staff profile ID'),
  interviewDate: z
    .string()
    .regex(DATE_REGEX, 'Interview date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  references: z
    .array(
      z.object({
        id: z.string(),
        refereeName: z.string().min(1, 'Referee name is required'),
        relationship: z.string().min(1, 'Relationship is required'),
        contactEmail: z.string().email().optional().nullable(),
        contactPhone: z.string().max(50).optional().nullable(),
        status: z.enum(REFERENCE_STATUSES).default('pending'),
        receivedDate: z
          .string()
          .regex(DATE_REGEX)
          .optional()
          .nullable(),
        notes: z.string().max(2000).optional().nullable(),
      }),
    )
    .default([]),
  offerDate: z
    .string()
    .regex(DATE_REGEX, 'Offer date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  offerStatus: z.enum(OFFER_STATUSES).default('pending'),
  startDate: z
    .string()
    .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or fewer')
    .optional()
    .nullable(),
});

export type CreateRecruitmentRecordInput = z.infer<
  typeof createRecruitmentRecordSchema
>;

// ---------------------------------------------------------------------------
// Update recruitment record schema
// ---------------------------------------------------------------------------

export const updateRecruitmentRecordSchema = z.object({
  interviewDate: z
    .string()
    .regex(DATE_REGEX, 'Interview date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  references: z
    .array(
      z.object({
        id: z.string(),
        refereeName: z.string().min(1),
        relationship: z.string().min(1),
        contactEmail: z.string().email().optional().nullable(),
        contactPhone: z.string().max(50).optional().nullable(),
        status: z.enum(REFERENCE_STATUSES).default('pending'),
        receivedDate: z
          .string()
          .regex(DATE_REGEX)
          .optional()
          .nullable(),
        notes: z.string().max(2000).optional().nullable(),
      }),
    )
    .optional(),
  offerDate: z
    .string()
    .regex(DATE_REGEX, 'Offer date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  offerStatus: z.enum(OFFER_STATUSES).optional(),
  startDate: z
    .string()
    .regex(DATE_REGEX, 'Start date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, 'Notes must be 2000 characters or fewer')
    .optional()
    .nullable(),
});

export type UpdateRecruitmentRecordInput = z.infer<
  typeof updateRecruitmentRecordSchema
>;
