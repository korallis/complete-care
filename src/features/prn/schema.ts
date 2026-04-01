/**
 * PRN Management validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import { EFFECT_OUTCOMES } from './constants';

// ---------------------------------------------------------------------------
// Sign/symptom schema
// ---------------------------------------------------------------------------

export const prnSignSymptomSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
});

// ---------------------------------------------------------------------------
// Pre-dose assessment schema
// ---------------------------------------------------------------------------

export const preDoseAssessmentSchema = z.object({
  painScore: z
    .number()
    .int()
    .min(0, 'Pain score must be 0-10')
    .max(10, 'Pain score must be 0-10'),
  symptoms: z.array(z.string().min(1).max(500)).default([]),
  notes: z.string().max(2000).optional(),
});

export type PreDoseAssessmentInput = z.infer<typeof preDoseAssessmentSchema>;

// ---------------------------------------------------------------------------
// Post-dose assessment schema
// ---------------------------------------------------------------------------

export const postDoseAssessmentSchema = z.object({
  painScore: z
    .number()
    .int()
    .min(0, 'Pain score must be 0-10')
    .max(10, 'Pain score must be 0-10'),
  effectAchieved: z.enum(EFFECT_OUTCOMES, {
    message: 'Please select effectiveness outcome',
  }),
  notes: z.string().max(2000).optional(),
});

export type PostDoseAssessmentInput = z.infer<typeof postDoseAssessmentSchema>;

// ---------------------------------------------------------------------------
// Create PRN protocol schema
// ---------------------------------------------------------------------------

export const createPrnProtocolSchema = z.object({
  medicationId: z.string().uuid('Invalid medication ID'),
  indication: z
    .string()
    .min(1, 'Indication is required')
    .max(500, 'Indication must be 500 characters or fewer'),
  signsSymptoms: z.array(prnSignSymptomSchema).default([]),
  doseRange: z
    .string()
    .min(1, 'Dose range is required')
    .max(255),
  maxDose24hr: z
    .string()
    .min(1, 'Maximum 24hr dose is required')
    .max(255),
  minInterval: z
    .number()
    .int()
    .positive('Minimum interval must be positive'),
  nonPharmAlternatives: z.string().max(2000).optional().nullable(),
  expectedEffect: z
    .string()
    .min(1, 'Expected effect is required')
    .max(1000),
  escalationCriteria: z.string().max(2000).optional().nullable(),
  followUpMinutes: z.number().int().positive().default(60),
});

export type CreatePrnProtocolInput = z.infer<typeof createPrnProtocolSchema>;

// ---------------------------------------------------------------------------
// Update PRN protocol schema
// ---------------------------------------------------------------------------

export const updatePrnProtocolSchema = z.object({
  indication: z.string().min(1).max(500).optional(),
  signsSymptoms: z.array(prnSignSymptomSchema).optional(),
  doseRange: z.string().min(1).max(255).optional(),
  maxDose24hr: z.string().min(1).max(255).optional(),
  minInterval: z.number().int().positive().optional(),
  nonPharmAlternatives: z.string().max(2000).optional().nullable(),
  expectedEffect: z.string().min(1).max(1000).optional(),
  escalationCriteria: z.string().max(2000).optional().nullable(),
  followUpMinutes: z.number().int().positive().optional(),
});

export type UpdatePrnProtocolInput = z.infer<typeof updatePrnProtocolSchema>;

// ---------------------------------------------------------------------------
// Record PRN administration schema
// ---------------------------------------------------------------------------

export const recordPrnAdministrationSchema = z.object({
  prnProtocolId: z.string().uuid('Invalid protocol ID'),
  medicationId: z.string().uuid('Invalid medication ID'),
  personId: z.string().uuid('Invalid person ID'),
  preDoseAssessment: preDoseAssessmentSchema,
  administeredAt: z.string().datetime({ message: 'Invalid administration time' }).optional(),
});

export type RecordPrnAdministrationInput = z.infer<typeof recordPrnAdministrationSchema>;

// ---------------------------------------------------------------------------
// Record follow-up assessment schema
// ---------------------------------------------------------------------------

export const recordFollowUpSchema = z.object({
  prnAdministrationId: z.string().uuid('Invalid administration ID'),
  postDoseAssessment: postDoseAssessmentSchema,
  followUpActions: z.string().max(2000).optional().nullable(),
});

export type RecordFollowUpInput = z.infer<typeof recordFollowUpSchema>;
