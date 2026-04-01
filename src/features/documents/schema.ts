/**
 * Documents & Body Map validation schemas — used for server actions and client-side forms.
 * This file MUST NOT have 'use server' — it is imported by client components too.
 */

import { z } from 'zod';
import {
  DOCUMENT_CATEGORIES,
  RETENTION_POLICIES,
  BODY_SIDES,
  BODY_REGIONS,
  ENTRY_TYPES,
} from './constants';

// ---------------------------------------------------------------------------
// Document upload schema
// ---------------------------------------------------------------------------

export const uploadDocumentSchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  name: z
    .string()
    .min(1, 'Document name is required')
    .max(255, 'Name must be 255 characters or fewer'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().int().positive().optional(),
  category: z.enum(DOCUMENT_CATEGORIES).default('other'),
  retentionPolicy: z.enum(RETENTION_POLICIES).default('standard'),
  storageUrl: z.string().url('Invalid storage URL'),
  storageKey: z.string().optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// ---------------------------------------------------------------------------
// Document update schema
// ---------------------------------------------------------------------------

export const updateDocumentSchema = z.object({
  name: z
    .string()
    .min(1, 'Document name is required')
    .max(255)
    .optional(),
  category: z.enum(DOCUMENT_CATEGORIES).optional(),
  retentionPolicy: z.enum(RETENTION_POLICIES).optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// ---------------------------------------------------------------------------
// Document filter schema (for query params)
// ---------------------------------------------------------------------------

export const documentFilterSchema = z.object({
  personId: z.string().uuid().optional(),
  category: z.enum(DOCUMENT_CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type DocumentFilter = z.infer<typeof documentFilterSchema>;

// ---------------------------------------------------------------------------
// Body map entry schema
// ---------------------------------------------------------------------------

export const createBodyMapEntrySchema = z.object({
  personId: z.string().uuid('Invalid person ID'),
  bodyRegion: z.enum(BODY_REGIONS),
  side: z.enum(BODY_SIDES).default('front'),
  xPercent: z
    .number()
    .min(0, 'X coordinate must be 0-100')
    .max(100, 'X coordinate must be 0-100'),
  yPercent: z
    .number()
    .min(0, 'Y coordinate must be 0-100')
    .max(100, 'Y coordinate must be 0-100'),
  entryType: z.enum(ENTRY_TYPES).default('mark'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be 2,000 characters or fewer'),
  dateObserved: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  linkedIncidentId: z.string().uuid().optional().nullable(),
});

export type CreateBodyMapEntryInput = z.infer<typeof createBodyMapEntrySchema>;

// ---------------------------------------------------------------------------
// Body map filter schema
// ---------------------------------------------------------------------------

export const bodyMapFilterSchema = z.object({
  personId: z.string().uuid().optional(),
  entryType: z.enum(ENTRY_TYPES).optional(),
  side: z.enum(BODY_SIDES).optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type BodyMapFilter = z.infer<typeof bodyMapFilterSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format file size to human-readable string */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format date for display */
export function formatDocumentDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Get file type icon name based on MIME type */
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'file-text';
  if (mimeType.startsWith('image/')) return 'image';
  if (
    mimeType.includes('word') ||
    mimeType.includes('document')
  ) return 'file-text';
  return 'file';
}
