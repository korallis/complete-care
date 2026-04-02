/**
 * EVV validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import { VERIFICATION_METHODS } from './constants';

// ---------------------------------------------------------------------------
// Check-in schema
// ---------------------------------------------------------------------------

export const checkInSchema = z.object({
  scheduledVisitId: z.string().uuid('Invalid visit ID'),
  method: z.enum(VERIFICATION_METHODS),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  qrCode: z.string().optional(),
  manualOverrideReason: z.string().min(1).max(2000).optional(),
}).refine(
  (data) => {
    if (data.method === 'gps') return data.lat !== undefined && data.lng !== undefined;
    if (data.method === 'qr') return !!data.qrCode;
    if (data.method === 'manual') return !!data.manualOverrideReason;
    return true;
  },
  {
    message: 'GPS requires coordinates, QR requires code, manual requires reason',
  },
);

export type CheckInInput = z.infer<typeof checkInSchema>;

// ---------------------------------------------------------------------------
// Check-out schema
// ---------------------------------------------------------------------------

export const checkOutSchema = z.object({
  verificationId: z.string().uuid('Invalid verification ID'),
  method: z.enum(VERIFICATION_METHODS),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  qrCode: z.string().optional(),
  manualOverrideReason: z.string().min(1).max(2000).optional(),
}).refine(
  (data) => {
    if (data.method === 'gps') return data.lat !== undefined && data.lng !== undefined;
    if (data.method === 'qr') return !!data.qrCode;
    if (data.method === 'manual') return !!data.manualOverrideReason;
    return true;
  },
  {
    message: 'GPS requires coordinates, QR requires code, manual requires reason',
  },
);

export type CheckOutInput = z.infer<typeof checkOutSchema>;

// ---------------------------------------------------------------------------
// Manual override approval schema
// ---------------------------------------------------------------------------

export const approveOverrideSchema = z.object({
  verificationId: z.string().uuid('Invalid verification ID'),
  approved: z.boolean(),
});

export type ApproveOverrideInput = z.infer<typeof approveOverrideSchema>;

// ---------------------------------------------------------------------------
// Client location schema
// ---------------------------------------------------------------------------

export const createClientLocationSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  lat: z.number().min(-90, 'Latitude must be between -90 and 90').max(90),
  lng: z.number().min(-180, 'Longitude must be between -180 and 180').max(180),
  geofenceRadius: z
    .number()
    .int()
    .min(10, 'Radius must be at least 10 metres')
    .max(500, 'Radius must be at most 500 metres')
    .default(50),
  label: z.string().max(100).optional(),
});

export type CreateClientLocationInput = z.infer<typeof createClientLocationSchema>;

export const updateClientLocationSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  geofenceRadius: z.number().int().min(10).max(500).optional(),
  label: z.string().max(100).optional().nullable(),
});

export type UpdateClientLocationInput = z.infer<typeof updateClientLocationSchema>;

// ---------------------------------------------------------------------------
// Field dashboard query schema
// ---------------------------------------------------------------------------

export const fieldDashboardSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export type FieldDashboardInput = z.infer<typeof fieldDashboardSchema>;
