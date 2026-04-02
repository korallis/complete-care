/**
 * Key Worker Engagement — Zod validation schemas.
 *
 * Used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import {
  RESTRAINT_TECHNIQUES,
  SANCTION_TYPES,
  VISITOR_RELATIONSHIPS,
  VOICE_CATEGORIES,
  VOICE_METHODS,
} from './constants';

// ---------------------------------------------------------------------------
// Date / time validation helpers
// ---------------------------------------------------------------------------

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

// ---------------------------------------------------------------------------
// Key Worker Session schemas
// ---------------------------------------------------------------------------

const sessionActionSchema = z.object({
  action: z.string().min(1, 'Action is required').max(500),
  deadline: z
    .string()
    .regex(DATE_REGEX, 'Deadline must be in YYYY-MM-DD format'),
  completed: z.boolean().default(false),
});

const sessionGoalsSchema = z.object({
  shortTerm: z.array(z.string().max(500)).optional(),
  longTerm: z.array(z.string().max(500)).optional(),
  progress: z.string().max(5000).optional(),
});

export const createSessionSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  keyworkerId: z.string().uuid('Invalid key worker ID'),
  sessionDate: z
    .string()
    .regex(DATE_REGEX, 'Session date must be in YYYY-MM-DD format'),
  checkIn: z.string().max(5000).optional().nullable(),
  weekReview: z.string().max(5000).optional().nullable(),
  goals: sessionGoalsSchema.default({}),
  education: z.string().max(5000).optional().nullable(),
  health: z.string().max(5000).optional().nullable(),
  family: z.string().max(5000).optional().nullable(),
  wishesAndFeelings: z.string().max(5000).optional().nullable(),
  actions: z.array(sessionActionSchema).default([]),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const updateSessionSchema = z.object({
  checkIn: z.string().max(5000).optional().nullable(),
  weekReview: z.string().max(5000).optional().nullable(),
  goals: sessionGoalsSchema.optional(),
  education: z.string().max(5000).optional().nullable(),
  health: z.string().max(5000).optional().nullable(),
  family: z.string().max(5000).optional().nullable(),
  wishesAndFeelings: z.string().max(5000).optional().nullable(),
  actions: z.array(sessionActionSchema).optional(),
});

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;

// ---------------------------------------------------------------------------
// Restraint schemas
// ---------------------------------------------------------------------------

const injuryCheckSchema = z.object({
  childInjured: z.boolean(),
  childInjuryDetails: z.string().max(2000).optional(),
  staffInjured: z.boolean(),
  staffInjuryDetails: z.string().max(2000).optional(),
  medicalAttentionRequired: z.boolean(),
  medicalAttentionDetails: z.string().max(2000).optional(),
});

export const createRestraintSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  dateTime: z
    .string()
    .regex(DATETIME_REGEX, 'Date/time must be in ISO format'),
  duration: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours'),
  technique: z.enum(RESTRAINT_TECHNIQUES),
  reason: z.string().min(1, 'Reason is required').max(5000),
  injuryCheck: injuryCheckSchema,
  childDebrief: z.string().max(5000).optional().nullable(),
  staffDebrief: z.string().max(5000).optional().nullable(),
  managementReview: z.string().max(5000).optional().nullable(),
});

export type CreateRestraintInput = z.infer<typeof createRestraintSchema>;

export const updateRestraintSchema = z.object({
  childDebrief: z.string().max(5000).optional().nullable(),
  staffDebrief: z.string().max(5000).optional().nullable(),
  managementReview: z.string().max(5000).optional().nullable(),
  reviewedById: z.string().uuid().optional().nullable(),
});

export type UpdateRestraintInput = z.infer<typeof updateRestraintSchema>;

// ---------------------------------------------------------------------------
// Sanction schemas
// ---------------------------------------------------------------------------

export const createSanctionSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  dateTime: z
    .string()
    .regex(DATETIME_REGEX, 'Date/time must be in ISO format'),
  description: z.string().min(1, 'Description is required').max(5000),
  sanctionType: z.enum(SANCTION_TYPES),
  isProhibited: z.boolean().default(false),
  justification: z.string().max(5000).optional().nullable(),
});

export type CreateSanctionInput = z.infer<typeof createSanctionSchema>;

export const updateSanctionSchema = z.object({
  description: z.string().min(1).max(5000).optional(),
  justification: z.string().max(5000).optional().nullable(),
  reviewedById: z.string().uuid().optional().nullable(),
});

export type UpdateSanctionInput = z.infer<typeof updateSanctionSchema>;

// ---------------------------------------------------------------------------
// Visitor Log schemas
// ---------------------------------------------------------------------------

export const createVisitorSchema = z.object({
  visitorName: z.string().min(1, 'Visitor name is required').max(255),
  relationship: z.enum(VISITOR_RELATIONSHIPS),
  personVisitedId: z.string().uuid('Invalid person ID').optional().nullable(),
  visitDate: z
    .string()
    .regex(DATE_REGEX, 'Visit date must be in YYYY-MM-DD format'),
  arrivalTime: z
    .string()
    .regex(TIME_REGEX, 'Arrival time must be in HH:MM format'),
  departureTime: z
    .string()
    .regex(TIME_REGEX, 'Departure time must be in HH:MM format')
    .optional()
    .nullable(),
  idChecked: z.boolean().default(false),
  dbsChecked: z.boolean().default(false),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateVisitorInput = z.infer<typeof createVisitorSchema>;

export const updateVisitorSchema = z.object({
  departureTime: z
    .string()
    .regex(TIME_REGEX, 'Departure time must be in HH:MM format')
    .optional()
    .nullable(),
  idChecked: z.boolean().optional(),
  dbsChecked: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateVisitorInput = z.infer<typeof updateVisitorSchema>;

// ---------------------------------------------------------------------------
// Children's Voice schemas
// ---------------------------------------------------------------------------

export const createVoiceSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  recordedDate: z
    .string()
    .regex(DATE_REGEX, 'Date must be in YYYY-MM-DD format'),
  category: z.enum(VOICE_CATEGORIES),
  content: z.string().min(1, 'Content is required').max(10000),
  method: z.enum(VOICE_METHODS).optional().nullable(),
  actionTaken: z.string().max(5000).optional().nullable(),
});

export type CreateVoiceInput = z.infer<typeof createVoiceSchema>;

export const updateVoiceSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  actionTaken: z.string().max(5000).optional().nullable(),
});

export type UpdateVoiceInput = z.infer<typeof updateVoiceSchema>;
