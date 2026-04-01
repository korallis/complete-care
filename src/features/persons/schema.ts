/**
 * Person validation schemas — used for both server actions and client-side form validation.
 * This file MUST NOT have 'use server' — it's imported by client components too.
 */

import { z } from 'zod';

export const emergencyContactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Contact name is required').max(255),
  relationship: z.string().min(1, 'Relationship is required').max(100),
  phone: z.string().min(1, 'Phone number is required').max(50),
  priority: z.number().int().min(1),
  email: z.string().email().max(255).optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
});

export const createPersonSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or fewer'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or fewer'),
  preferredName: z.string().max(100).optional().nullable(),
  type: z.enum(['resident', 'client', 'young_person']).default('resident'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  gender: z.string().max(50).optional().nullable(),
  ethnicity: z.string().max(100).optional().nullable(),
  religion: z.string().max(100).optional().nullable(),
  firstLanguage: z.string().max(100).optional().nullable(),
  nhsNumber: z
    .string()
    .max(20)
    .regex(/^[\d\s]*$/, 'NHS number must contain only digits and spaces')
    .optional()
    .nullable(),
  gpName: z.string().max(255).optional().nullable(),
  gpPractice: z.string().max(255).optional().nullable(),
  allergies: z.array(z.string().min(1).max(255)).optional().default([]),
  medicalConditions: z
    .array(z.string().min(1).max(255))
    .optional()
    .default([]),
  contactPhone: z.string().max(50).optional().nullable(),
  contactEmail: z.string().email().max(255).optional().nullable().or(z.literal('')).transform(v => v === '' ? null : v),
  address: z.string().max(1000).optional().nullable(),
  emergencyContacts: z.array(emergencyContactSchema).optional().default([]),
  photoUrl: z.string().max(2048).optional().nullable(),
});

export const updatePersonSchema = createPersonSchema.partial().extend({
  status: z.enum(['active', 'archived']).optional(),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
