/**
 * Tests for document and body map schema, validation, and utilities.
 *
 * Validates:
 * - documents table has required columns (including new fields)
 * - body_map_entries table has required columns
 * - Zod validation schemas work correctly
 * - Filter schema validation
 * - Helper functions (formatFileSize, formatDocumentDate, getFileTypeIcon)
 * - Constants have labels for all options
 * - Body region detection from coordinates
 * - RBAC permissions for documents resource
 */

import { describe, it, expect } from 'vitest';
import { documents, bodyMapEntries } from '@/lib/db/schema/documents';
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  documentFilterSchema,
  createBodyMapEntrySchema,
  bodyMapFilterSchema,
  formatFileSize,
  formatDocumentDate,
  getFileTypeIcon,
} from '@/features/documents/schema';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  RETENTION_POLICIES,
  RETENTION_POLICY_LABELS,
  BODY_REGIONS,
  BODY_REGION_LABELS,
  ENTRY_TYPES,
  ENTRY_TYPE_LABELS,
  ENTRY_TYPE_COLOURS,
  BODY_SIDES,
  BODY_SIDE_LABELS,
  detectBodyRegion,
} from '@/features/documents/constants';
import { hasPermission } from '@/lib/rbac/permissions';

// ---------------------------------------------------------------------------
// documents table schema
// ---------------------------------------------------------------------------

describe('documents table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(documents);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('personId');
    expect(columns).toContain('uploadedById');
    expect(columns).toContain('uploadedByName');
    expect(columns).toContain('name');
    expect(columns).toContain('fileName');
    expect(columns).toContain('fileType');
    expect(columns).toContain('fileSize');
    expect(columns).toContain('category');
    expect(columns).toContain('version');
    expect(columns).toContain('retentionPolicy');
    expect(columns).toContain('storageUrl');
    expect(columns).toContain('storageKey');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
    expect(columns).toContain('deletedAt');
  });

  it('has organisationId for tenant isolation', () => {
    const columns = Object.keys(documents);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// body_map_entries table schema
// ---------------------------------------------------------------------------

describe('body_map_entries table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(bodyMapEntries);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('personId');
    expect(columns).toContain('bodyRegion');
    expect(columns).toContain('side');
    expect(columns).toContain('xPercent');
    expect(columns).toContain('yPercent');
    expect(columns).toContain('entryType');
    expect(columns).toContain('description');
    expect(columns).toContain('dateObserved');
    expect(columns).toContain('linkedIncidentId');
    expect(columns).toContain('createdById');
    expect(columns).toContain('createdByName');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has organisationId for tenant isolation', () => {
    const columns = Object.keys(bodyMapEntries);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// uploadDocumentSchema validation
// ---------------------------------------------------------------------------

describe('uploadDocumentSchema', () => {
  const validInput = {
    personId: '00000000-0000-0000-0000-000000000001',
    name: 'Assessment Report',
    fileName: 'assessment.pdf',
    fileType: 'application/pdf',
    fileSize: 1024,
    category: 'assessment' as const,
    retentionPolicy: 'standard' as const,
    storageUrl: 'https://blob.storage.com/file.pdf',
  };

  it('accepts valid input', () => {
    const result = uploadDocumentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts minimal input with defaults', () => {
    const result = uploadDocumentSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      name: 'My Document',
      fileName: 'doc.pdf',
      fileType: 'application/pdf',
      storageUrl: 'https://example.com/file.pdf',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('other');
      expect(result.data.retentionPolicy).toBe('standard');
    }
  });

  it('rejects empty name', () => {
    const result = uploadDocumentSchema.safeParse({
      ...validInput,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid personId', () => {
    const result = uploadDocumentSchema.safeParse({
      ...validInput,
      personId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid storageUrl', () => {
    const result = uploadDocumentSchema.safeParse({
      ...validInput,
      storageUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = uploadDocumentSchema.safeParse({
      ...validInput,
      category: 'invalid_category',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid categories', () => {
    for (const category of DOCUMENT_CATEGORIES) {
      const result = uploadDocumentSchema.safeParse({
        ...validInput,
        category,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid retention policies', () => {
    for (const policy of RETENTION_POLICIES) {
      const result = uploadDocumentSchema.safeParse({
        ...validInput,
        retentionPolicy: policy,
      });
      expect(result.success).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// updateDocumentSchema
// ---------------------------------------------------------------------------

describe('updateDocumentSchema', () => {
  it('accepts partial updates', () => {
    const result = updateDocumentSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('accepts category update', () => {
    const result = updateDocumentSchema.safeParse({ category: 'consent' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = updateDocumentSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// documentFilterSchema
// ---------------------------------------------------------------------------

describe('documentFilterSchema', () => {
  it('accepts empty filters with defaults', () => {
    const result = documentFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(25);
    }
  });

  it('accepts all filter fields', () => {
    const result = documentFilterSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      category: 'care_plan',
      page: 2,
      pageSize: 50,
    });
    expect(result.success).toBe(true);
  });

  it('caps pageSize at 100', () => {
    const result = documentFilterSchema.safeParse({ pageSize: 999 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createBodyMapEntrySchema
// ---------------------------------------------------------------------------

describe('createBodyMapEntrySchema', () => {
  const validEntry = {
    personId: '00000000-0000-0000-0000-000000000001',
    bodyRegion: 'left_arm' as const,
    side: 'front' as const,
    xPercent: 25.5,
    yPercent: 40.2,
    entryType: 'bruise' as const,
    description: 'Small bruise on inner left arm',
    dateObserved: '2026-04-01',
  };

  it('accepts valid entry', () => {
    const result = createBodyMapEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('accepts entry with defaults', () => {
    const result = createBodyMapEntrySchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      bodyRegion: 'head',
      xPercent: 50,
      yPercent: 10,
      description: 'Scratch on forehead',
      dateObserved: '2026-04-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.side).toBe('front');
      expect(result.data.entryType).toBe('mark');
    }
  });

  it('rejects invalid personId', () => {
    const result = createBodyMapEntrySchema.safeParse({
      ...validEntry,
      personId: 'bad',
    });
    expect(result.success).toBe(false);
  });

  it('rejects xPercent > 100', () => {
    const result = createBodyMapEntrySchema.safeParse({
      ...validEntry,
      xPercent: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects xPercent < 0', () => {
    const result = createBodyMapEntrySchema.safeParse({
      ...validEntry,
      xPercent: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects yPercent > 100', () => {
    const result = createBodyMapEntrySchema.safeParse({
      ...validEntry,
      yPercent: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty description', () => {
    const result = createBodyMapEntrySchema.safeParse({
      ...validEntry,
      description: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects description over 2000 chars', () => {
    const result = createBodyMapEntrySchema.safeParse({
      ...validEntry,
      description: 'x'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createBodyMapEntrySchema.safeParse({
      ...validEntry,
      dateObserved: '01-04-2026',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid body regions', () => {
    for (const region of BODY_REGIONS) {
      const result = createBodyMapEntrySchema.safeParse({
        ...validEntry,
        bodyRegion: region,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid entry types', () => {
    for (const type of ENTRY_TYPES) {
      const result = createBodyMapEntrySchema.safeParse({
        ...validEntry,
        entryType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid sides', () => {
    for (const s of BODY_SIDES) {
      const result = createBodyMapEntrySchema.safeParse({
        ...validEntry,
        side: s,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts optional linkedIncidentId', () => {
    const result = createBodyMapEntrySchema.safeParse({
      ...validEntry,
      linkedIncidentId: '00000000-0000-0000-0000-000000000099',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null linkedIncidentId', () => {
    const result = createBodyMapEntrySchema.safeParse({
      ...validEntry,
      linkedIncidentId: null,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// bodyMapFilterSchema
// ---------------------------------------------------------------------------

describe('bodyMapFilterSchema', () => {
  it('accepts empty filters with defaults', () => {
    const result = bodyMapFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(50);
    }
  });

  it('accepts all filter fields', () => {
    const result = bodyMapFilterSchema.safeParse({
      personId: '00000000-0000-0000-0000-000000000001',
      entryType: 'bruise',
      side: 'front',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      page: 2,
      pageSize: 25,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid date format', () => {
    const result = bodyMapFilterSchema.safeParse({
      dateFrom: '01-01-2026',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constants: all options have labels
// ---------------------------------------------------------------------------

describe('constants and labels', () => {
  it('every document category has a label', () => {
    for (const cat of DOCUMENT_CATEGORIES) {
      expect(DOCUMENT_CATEGORY_LABELS[cat]).toBeTruthy();
    }
  });

  it('every retention policy has a label', () => {
    for (const pol of RETENTION_POLICIES) {
      expect(RETENTION_POLICY_LABELS[pol]).toBeTruthy();
    }
  });

  it('every body region has a label', () => {
    for (const region of BODY_REGIONS) {
      expect(BODY_REGION_LABELS[region]).toBeTruthy();
    }
  });

  it('every entry type has a label', () => {
    for (const type of ENTRY_TYPES) {
      expect(ENTRY_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('every entry type has a colour', () => {
    for (const type of ENTRY_TYPES) {
      expect(ENTRY_TYPE_COLOURS[type]).toBeTruthy();
    }
  });

  it('every body side has a label', () => {
    for (const s of BODY_SIDES) {
      expect(BODY_SIDE_LABELS[s]).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// detectBodyRegion
// ---------------------------------------------------------------------------

describe('detectBodyRegion', () => {
  it('detects head region', () => {
    expect(detectBodyRegion(50, 10, 'front')).toBe('head');
  });

  it('detects neck region', () => {
    expect(detectBodyRegion(50, 17, 'front')).toBe('neck');
  });

  it('detects chest on front view', () => {
    expect(detectBodyRegion(50, 28, 'front')).toBe('chest');
  });

  it('detects upper_back on back view', () => {
    expect(detectBodyRegion(50, 28, 'back')).toBe('upper_back');
  });

  it('detects abdomen on front view', () => {
    expect(detectBodyRegion(50, 42, 'front')).toBe('abdomen');
  });

  it('detects lower_back on back view', () => {
    expect(detectBodyRegion(50, 42, 'back')).toBe('lower_back');
  });

  it('detects left_arm', () => {
    expect(detectBodyRegion(20, 40, 'front')).toBe('left_arm');
  });

  it('detects right_arm', () => {
    expect(detectBodyRegion(80, 40, 'front')).toBe('right_arm');
  });

  it('detects left_leg', () => {
    expect(detectBodyRegion(40, 70, 'front')).toBe('left_leg');
  });

  it('detects right_leg', () => {
    expect(detectBodyRegion(60, 70, 'front')).toBe('right_leg');
  });

  it('detects left_foot', () => {
    expect(detectBodyRegion(40, 90, 'front')).toBe('left_foot');
  });

  it('detects right_foot', () => {
    expect(detectBodyRegion(60, 90, 'front')).toBe('right_foot');
  });

  it('detects left_hip', () => {
    expect(detectBodyRegion(40, 54, 'front')).toBe('left_hip');
  });

  it('detects right_hip', () => {
    expect(detectBodyRegion(60, 54, 'front')).toBe('right_hip');
  });
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('returns Unknown for null', () => {
    expect(formatFileSize(null)).toBe('Unknown');
  });

  it('returns Unknown for undefined', () => {
    expect(formatFileSize(undefined)).toBe('Unknown');
  });
});

describe('formatDocumentDate', () => {
  it('formats a Date object', () => {
    const d = new Date('2026-04-01T10:30:00Z');
    const result = formatDocumentDate(d);
    expect(result).toMatch(/1/);
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/2026/);
  });

  it('formats a date string', () => {
    const result = formatDocumentDate('2026-04-01');
    expect(result).toMatch(/Apr/);
    expect(result).toMatch(/2026/);
  });
});

describe('getFileTypeIcon', () => {
  it('returns file-text for PDF', () => {
    expect(getFileTypeIcon('application/pdf')).toBe('file-text');
  });

  it('returns image for image types', () => {
    expect(getFileTypeIcon('image/jpeg')).toBe('image');
    expect(getFileTypeIcon('image/png')).toBe('image');
  });

  it('returns file-text for Word documents', () => {
    expect(getFileTypeIcon('application/msword')).toBe('file-text');
    expect(
      getFileTypeIcon(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe('file-text');
  });

  it('returns file for unknown types', () => {
    expect(getFileTypeIcon('application/octet-stream')).toBe('file');
  });
});

// ---------------------------------------------------------------------------
// RBAC permissions for documents
// ---------------------------------------------------------------------------

describe('RBAC permissions for documents', () => {
  it('owner has full access to documents', () => {
    expect(hasPermission('owner', 'read', 'documents')).toBe(true);
    expect(hasPermission('owner', 'create', 'documents')).toBe(true);
    expect(hasPermission('owner', 'update', 'documents')).toBe(true);
    expect(hasPermission('owner', 'delete', 'documents')).toBe(true);
  });

  it('carer can read and create documents', () => {
    expect(hasPermission('carer', 'read', 'documents')).toBe(true);
    expect(hasPermission('carer', 'create', 'documents')).toBe(true);
  });

  it('carer cannot update or delete documents', () => {
    expect(hasPermission('carer', 'update', 'documents')).toBe(false);
    expect(hasPermission('carer', 'delete', 'documents')).toBe(false);
  });

  it('viewer can only read documents', () => {
    expect(hasPermission('viewer', 'read', 'documents')).toBe(true);
    expect(hasPermission('viewer', 'create', 'documents')).toBe(false);
    expect(hasPermission('viewer', 'update', 'documents')).toBe(false);
  });

  it('manager can read, create, update, and export documents', () => {
    expect(hasPermission('manager', 'read', 'documents')).toBe(true);
    expect(hasPermission('manager', 'create', 'documents')).toBe(true);
    expect(hasPermission('manager', 'update', 'documents')).toBe(true);
    expect(hasPermission('manager', 'export', 'documents')).toBe(true);
  });

  it('senior_carer can read, create, and update documents', () => {
    expect(hasPermission('senior_carer', 'read', 'documents')).toBe(true);
    expect(hasPermission('senior_carer', 'create', 'documents')).toBe(true);
    expect(hasPermission('senior_carer', 'update', 'documents')).toBe(true);
  });
});
