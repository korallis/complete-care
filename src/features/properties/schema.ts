/**
 * Properties & Tenancies validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import {
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  TENANCY_TYPES,
  TENANCY_STATUSES,
  PROPERTY_DOCUMENT_TYPES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUSES,
} from './constants';

// ---------------------------------------------------------------------------
// Address sub-schema
// ---------------------------------------------------------------------------

export const addressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required').max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1, 'City is required').max(100),
  county: z.string().max(100).optional(),
  postcode: z
    .string()
    .min(1, 'Postcode is required')
    .max(10, 'Postcode must be 10 characters or fewer'),
});

// ---------------------------------------------------------------------------
// Communal area sub-schema
// ---------------------------------------------------------------------------

export const communalAreaSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Area name is required').max(100),
  description: z.string().max(500).optional(),
});

// ---------------------------------------------------------------------------
// Create property schema
// ---------------------------------------------------------------------------

export const createPropertySchema = z.object({
  address: addressSchema,
  landlordName: z.string().max(255).optional().nullable(),
  landlordContact: z.string().max(500).optional().nullable(),
  propertyType: z.enum(PROPERTY_TYPES).default('shared_house'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(100),
  communalAreas: z.array(communalAreaSchema).default([]),
  status: z.enum(PROPERTY_STATUSES).default('active'),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

// ---------------------------------------------------------------------------
// Update property schema
// ---------------------------------------------------------------------------

export const updatePropertySchema = z.object({
  address: addressSchema.optional(),
  landlordName: z.string().max(255).optional().nullable(),
  landlordContact: z.string().max(500).optional().nullable(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  capacity: z.number().int().min(1).max(100).optional(),
  communalAreas: z.array(communalAreaSchema).optional(),
  status: z.enum(PROPERTY_STATUSES).optional(),
});

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

// ---------------------------------------------------------------------------
// Create tenancy schema
// ---------------------------------------------------------------------------

export const createTenancySchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  personId: z.string().uuid('Invalid person ID'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  tenancyType: z.enum(TENANCY_TYPES).default('assured'),
  status: z.enum(TENANCY_STATUSES).default('active'),
});

export type CreateTenancyInput = z.infer<typeof createTenancySchema>;

// ---------------------------------------------------------------------------
// Update tenancy schema
// ---------------------------------------------------------------------------

export const updateTenancySchema = z.object({
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  tenancyType: z.enum(TENANCY_TYPES).optional(),
  status: z.enum(TENANCY_STATUSES).optional(),
});

export type UpdateTenancyInput = z.infer<typeof updateTenancySchema>;

// ---------------------------------------------------------------------------
// Create property document schema
// ---------------------------------------------------------------------------

export const createPropertyDocumentSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  documentType: z.enum(PROPERTY_DOCUMENT_TYPES).default('other'),
  name: z
    .string()
    .min(1, 'Document name is required')
    .max(255, 'Name must be 255 characters or fewer'),
  expiryDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  fileUrl: z.string().url('Invalid file URL').optional().nullable(),
});

export type CreatePropertyDocumentInput = z.infer<typeof createPropertyDocumentSchema>;

// ---------------------------------------------------------------------------
// Create maintenance request schema
// ---------------------------------------------------------------------------

export const createMaintenanceRequestSchema = z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be 255 characters or fewer'),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(MAINTENANCE_PRIORITIES).default('medium'),
  assignedTo: z.string().max(255).optional().nullable(),
});

export type CreateMaintenanceRequestInput = z.infer<typeof createMaintenanceRequestSchema>;

// ---------------------------------------------------------------------------
// Update maintenance request schema
// ---------------------------------------------------------------------------

export const updateMaintenanceRequestSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(MAINTENANCE_PRIORITIES).optional(),
  status: z.enum(MAINTENANCE_STATUSES).optional(),
  assignedTo: z.string().max(255).optional().nullable(),
});

export type UpdateMaintenanceRequestInput = z.infer<typeof updateMaintenanceRequestSchema>;

// ---------------------------------------------------------------------------
// Property filter schema (for query params)
// ---------------------------------------------------------------------------

export const propertyFilterSchema = z.object({
  status: z.enum(PROPERTY_STATUSES).optional(),
  propertyType: z.enum(PROPERTY_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type PropertyFilter = z.infer<typeof propertyFilterSchema>;
