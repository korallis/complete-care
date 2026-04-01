/**
 * Tests for property schema, validation, constants, and utilities.
 *
 * Validates:
 * - properties, tenancies, property_documents, maintenance_requests tables have required columns
 * - Zod validation schemas work correctly
 * - Constants have labels for all options
 * - Helper functions (formatAddress, isDocumentExpired, isDocumentExpiringSoon)
 * - RBAC permissions for properties resource
 */

import { describe, it, expect } from 'vitest';
import {
  properties,
  tenancies,
  propertyDocuments,
  maintenanceRequests,
} from '@/lib/db/schema/properties';
import {
  createPropertySchema,
  updatePropertySchema,
  createTenancySchema,
  updateTenancySchema,
  createPropertyDocumentSchema,
  createMaintenanceRequestSchema,
  updateMaintenanceRequestSchema,
  propertyFilterSchema,
} from '@/features/properties/schema';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  PROPERTY_STATUSES,
  PROPERTY_STATUS_LABELS,
  TENANCY_TYPES,
  TENANCY_TYPE_LABELS,
  TENANCY_STATUSES,
  TENANCY_STATUS_LABELS,
  PROPERTY_DOCUMENT_TYPES,
  PROPERTY_DOCUMENT_TYPE_LABELS,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_PRIORITY_LABELS,
  MAINTENANCE_PRIORITY_COLOURS,
  MAINTENANCE_STATUSES,
  MAINTENANCE_STATUS_LABELS,
  formatAddress,
  isDocumentExpired,
  isDocumentExpiringSoon,
} from '@/features/properties/constants';
import { hasPermission } from '@/lib/rbac/permissions';

// ---------------------------------------------------------------------------
// properties table schema
// ---------------------------------------------------------------------------

describe('properties table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(properties);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('address');
    expect(columns).toContain('landlordName');
    expect(columns).toContain('landlordContact');
    expect(columns).toContain('propertyType');
    expect(columns).toContain('capacity');
    expect(columns).toContain('communalAreas');
    expect(columns).toContain('status');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has organisationId for tenant isolation', () => {
    const columns = Object.keys(properties);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// tenancies table schema
// ---------------------------------------------------------------------------

describe('tenancies table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(tenancies);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('propertyId');
    expect(columns).toContain('personId');
    expect(columns).toContain('startDate');
    expect(columns).toContain('endDate');
    expect(columns).toContain('tenancyType');
    expect(columns).toContain('status');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has organisationId for tenant isolation', () => {
    const columns = Object.keys(tenancies);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// property_documents table schema
// ---------------------------------------------------------------------------

describe('property_documents table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(propertyDocuments);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('propertyId');
    expect(columns).toContain('documentType');
    expect(columns).toContain('name');
    expect(columns).toContain('expiryDate');
    expect(columns).toContain('fileUrl');
    expect(columns).toContain('uploadedById');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has organisationId for tenant isolation', () => {
    const columns = Object.keys(propertyDocuments);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// maintenance_requests table schema
// ---------------------------------------------------------------------------

describe('maintenance_requests table schema', () => {
  it('has all required columns', () => {
    const columns = Object.keys(maintenanceRequests);
    expect(columns).toContain('id');
    expect(columns).toContain('organisationId');
    expect(columns).toContain('propertyId');
    expect(columns).toContain('title');
    expect(columns).toContain('description');
    expect(columns).toContain('priority');
    expect(columns).toContain('status');
    expect(columns).toContain('reportedById');
    expect(columns).toContain('assignedTo');
    expect(columns).toContain('completedAt');
    expect(columns).toContain('createdAt');
    expect(columns).toContain('updatedAt');
  });

  it('has organisationId for tenant isolation', () => {
    const columns = Object.keys(maintenanceRequests);
    expect(columns).toContain('organisationId');
  });
});

// ---------------------------------------------------------------------------
// createPropertySchema validation
// ---------------------------------------------------------------------------

describe('createPropertySchema', () => {
  const validInput = {
    address: {
      line1: '42 Oak Avenue',
      city: 'Bristol',
      postcode: 'BS1 1AA',
    },
    propertyType: 'shared_house' as const,
    capacity: 4,
  };

  it('accepts valid input', () => {
    const result = createPropertySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts full address with optional fields', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      address: {
        line1: '42 Oak Avenue',
        line2: 'Flat 2',
        city: 'Bristol',
        county: 'Avon',
        postcode: 'BS1 1AA',
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts all property types', () => {
    for (const type of PROPERTY_TYPES) {
      const result = createPropertySchema.safeParse({
        ...validInput,
        propertyType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects missing address line1', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      address: { city: 'Bristol', postcode: 'BS1 1AA' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing city', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      address: { line1: '42 Oak Avenue', postcode: 'BS1 1AA' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing postcode', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      address: { line1: '42 Oak Avenue', city: 'Bristol' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects capacity < 1', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      capacity: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects capacity > 100', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      capacity: 101,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid property type', () => {
    const result = createPropertySchema.safeParse({
      ...validInput,
      propertyType: 'mansion',
    });
    expect(result.success).toBe(false);
  });

  it('defaults status to active', () => {
    const result = createPropertySchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('active');
    }
  });
});

// ---------------------------------------------------------------------------
// updatePropertySchema
// ---------------------------------------------------------------------------

describe('updatePropertySchema', () => {
  it('accepts partial updates', () => {
    const result = updatePropertySchema.safeParse({
      landlordName: 'Acme Housing',
    });
    expect(result.success).toBe(true);
  });

  it('accepts address update', () => {
    const result = updatePropertySchema.safeParse({
      address: { line1: 'New Street', city: 'London', postcode: 'SW1A 1AA' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts status update', () => {
    const result = updatePropertySchema.safeParse({ status: 'inactive' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updatePropertySchema.safeParse({ status: 'deleted' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createTenancySchema
// ---------------------------------------------------------------------------

describe('createTenancySchema', () => {
  const validInput = {
    propertyId: '00000000-0000-0000-0000-000000000001',
    personId: '00000000-0000-0000-0000-000000000002',
    startDate: '2026-04-01',
    tenancyType: 'assured' as const,
  };

  it('accepts valid input', () => {
    const result = createTenancySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts all tenancy types', () => {
    for (const type of TENANCY_TYPES) {
      const result = createTenancySchema.safeParse({
        ...validInput,
        tenancyType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts optional endDate', () => {
    const result = createTenancySchema.safeParse({
      ...validInput,
      endDate: '2027-04-01',
    });
    expect(result.success).toBe(true);
  });

  it('accepts null endDate', () => {
    const result = createTenancySchema.safeParse({
      ...validInput,
      endDate: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid propertyId', () => {
    const result = createTenancySchema.safeParse({
      ...validInput,
      propertyId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid personId', () => {
    const result = createTenancySchema.safeParse({
      ...validInput,
      personId: 'bad',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createTenancySchema.safeParse({
      ...validInput,
      startDate: '01-04-2026',
    });
    expect(result.success).toBe(false);
  });

  it('defaults tenancyType to assured', () => {
    const result = createTenancySchema.safeParse({
      propertyId: '00000000-0000-0000-0000-000000000001',
      personId: '00000000-0000-0000-0000-000000000002',
      startDate: '2026-04-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tenancyType).toBe('assured');
    }
  });
});

// ---------------------------------------------------------------------------
// updateTenancySchema
// ---------------------------------------------------------------------------

describe('updateTenancySchema', () => {
  it('accepts partial update with endDate', () => {
    const result = updateTenancySchema.safeParse({
      endDate: '2027-04-01',
      status: 'ended',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateTenancySchema.safeParse({ status: 'cancelled' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createPropertyDocumentSchema
// ---------------------------------------------------------------------------

describe('createPropertyDocumentSchema', () => {
  const validInput = {
    propertyId: '00000000-0000-0000-0000-000000000001',
    documentType: 'fire_risk' as const,
    name: 'Fire Risk Assessment 2026',
    expiryDate: '2027-04-01',
  };

  it('accepts valid input', () => {
    const result = createPropertyDocumentSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts all document types', () => {
    for (const type of PROPERTY_DOCUMENT_TYPES) {
      const result = createPropertyDocumentSchema.safeParse({
        ...validInput,
        documentType: type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty name', () => {
    const result = createPropertyDocumentSchema.safeParse({
      ...validInput,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid propertyId', () => {
    const result = createPropertyDocumentSchema.safeParse({
      ...validInput,
      propertyId: 'bad',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createMaintenanceRequestSchema
// ---------------------------------------------------------------------------

describe('createMaintenanceRequestSchema', () => {
  const validInput = {
    propertyId: '00000000-0000-0000-0000-000000000001',
    title: 'Broken window in bedroom 2',
    description: 'The window latch is broken and the window cannot close.',
    priority: 'high' as const,
  };

  it('accepts valid input', () => {
    const result = createMaintenanceRequestSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts all priorities', () => {
    for (const p of MAINTENANCE_PRIORITIES) {
      const result = createMaintenanceRequestSchema.safeParse({
        ...validInput,
        priority: p,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty title', () => {
    const result = createMaintenanceRequestSchema.safeParse({
      ...validInput,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects title over 255 chars', () => {
    const result = createMaintenanceRequestSchema.safeParse({
      ...validInput,
      title: 'x'.repeat(256),
    });
    expect(result.success).toBe(false);
  });

  it('defaults priority to medium', () => {
    const result = createMaintenanceRequestSchema.safeParse({
      propertyId: '00000000-0000-0000-0000-000000000001',
      title: 'Minor issue',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.priority).toBe('medium');
    }
  });
});

// ---------------------------------------------------------------------------
// updateMaintenanceRequestSchema
// ---------------------------------------------------------------------------

describe('updateMaintenanceRequestSchema', () => {
  it('accepts status update', () => {
    const result = updateMaintenanceRequestSchema.safeParse({
      status: 'completed',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const result = updateMaintenanceRequestSchema.safeParse({
      status: 'cancelled',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// propertyFilterSchema
// ---------------------------------------------------------------------------

describe('propertyFilterSchema', () => {
  it('accepts empty filters with defaults', () => {
    const result = propertyFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(25);
    }
  });

  it('accepts all filter fields', () => {
    const result = propertyFilterSchema.safeParse({
      status: 'active',
      propertyType: 'cluster',
      page: 2,
      pageSize: 50,
    });
    expect(result.success).toBe(true);
  });

  it('caps pageSize at 100', () => {
    const result = propertyFilterSchema.safeParse({ pageSize: 999 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Constants: all options have labels
// ---------------------------------------------------------------------------

describe('constants and labels', () => {
  it('every property type has a label', () => {
    for (const type of PROPERTY_TYPES) {
      expect(PROPERTY_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('every property status has a label', () => {
    for (const s of PROPERTY_STATUSES) {
      expect(PROPERTY_STATUS_LABELS[s]).toBeTruthy();
    }
  });

  it('every tenancy type has a label', () => {
    for (const type of TENANCY_TYPES) {
      expect(TENANCY_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('every tenancy status has a label', () => {
    for (const s of TENANCY_STATUSES) {
      expect(TENANCY_STATUS_LABELS[s]).toBeTruthy();
    }
  });

  it('every property document type has a label', () => {
    for (const type of PROPERTY_DOCUMENT_TYPES) {
      expect(PROPERTY_DOCUMENT_TYPE_LABELS[type]).toBeTruthy();
    }
  });

  it('every maintenance priority has a label', () => {
    for (const p of MAINTENANCE_PRIORITIES) {
      expect(MAINTENANCE_PRIORITY_LABELS[p]).toBeTruthy();
    }
  });

  it('every maintenance priority has a colour', () => {
    for (const p of MAINTENANCE_PRIORITIES) {
      expect(MAINTENANCE_PRIORITY_COLOURS[p]).toBeTruthy();
    }
  });

  it('every maintenance status has a label', () => {
    for (const s of MAINTENANCE_STATUSES) {
      expect(MAINTENANCE_STATUS_LABELS[s]).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

describe('formatAddress', () => {
  it('formats a minimal address', () => {
    const result = formatAddress({
      line1: '42 Oak Avenue',
      city: 'Bristol',
      postcode: 'BS1 1AA',
    });
    expect(result).toBe('42 Oak Avenue, Bristol, BS1 1AA');
  });

  it('formats a full address', () => {
    const result = formatAddress({
      line1: '42 Oak Avenue',
      line2: 'Flat 2',
      city: 'Bristol',
      county: 'Avon',
      postcode: 'BS1 1AA',
    });
    expect(result).toBe('42 Oak Avenue, Flat 2, Bristol, Avon, BS1 1AA');
  });
});

describe('isDocumentExpired', () => {
  it('returns true for past date', () => {
    expect(isDocumentExpired('2020-01-01')).toBe(true);
  });

  it('returns false for future date', () => {
    expect(isDocumentExpired('2099-01-01')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDocumentExpired(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDocumentExpired(undefined)).toBe(false);
  });
});

describe('isDocumentExpiringSoon', () => {
  it('returns true for date within 30 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    const dateStr = soon.toISOString().slice(0, 10);
    expect(isDocumentExpiringSoon(dateStr)).toBe(true);
  });

  it('returns false for far future date', () => {
    expect(isDocumentExpiringSoon('2099-12-31')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isDocumentExpiringSoon(null)).toBe(false);
  });

  it('supports custom window', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const dateStr = soon.toISOString().slice(0, 10);
    expect(isDocumentExpiringSoon(dateStr, 7)).toBe(true);
    expect(isDocumentExpiringSoon(dateStr, 3)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// RBAC permissions for properties
// ---------------------------------------------------------------------------

describe('RBAC permissions for properties', () => {
  it('owner has full access to properties', () => {
    expect(hasPermission('owner', 'read', 'properties')).toBe(true);
    expect(hasPermission('owner', 'create', 'properties')).toBe(true);
    expect(hasPermission('owner', 'update', 'properties')).toBe(true);
    expect(hasPermission('owner', 'delete', 'properties')).toBe(true);
    expect(hasPermission('owner', 'export', 'properties')).toBe(true);
  });

  it('admin has full access to properties', () => {
    expect(hasPermission('admin', 'read', 'properties')).toBe(true);
    expect(hasPermission('admin', 'create', 'properties')).toBe(true);
    expect(hasPermission('admin', 'update', 'properties')).toBe(true);
    expect(hasPermission('admin', 'delete', 'properties')).toBe(true);
    expect(hasPermission('admin', 'export', 'properties')).toBe(true);
  });

  it('manager can read, create, update, and export properties', () => {
    expect(hasPermission('manager', 'read', 'properties')).toBe(true);
    expect(hasPermission('manager', 'create', 'properties')).toBe(true);
    expect(hasPermission('manager', 'update', 'properties')).toBe(true);
    expect(hasPermission('manager', 'export', 'properties')).toBe(true);
    expect(hasPermission('manager', 'delete', 'properties')).toBe(false);
  });

  it('senior_carer can only read properties', () => {
    expect(hasPermission('senior_carer', 'read', 'properties')).toBe(true);
    expect(hasPermission('senior_carer', 'create', 'properties')).toBe(false);
    expect(hasPermission('senior_carer', 'update', 'properties')).toBe(false);
  });

  it('carer can only read properties', () => {
    expect(hasPermission('carer', 'read', 'properties')).toBe(true);
    expect(hasPermission('carer', 'create', 'properties')).toBe(false);
    expect(hasPermission('carer', 'update', 'properties')).toBe(false);
  });

  it('viewer can only read properties', () => {
    expect(hasPermission('viewer', 'read', 'properties')).toBe(true);
    expect(hasPermission('viewer', 'create', 'properties')).toBe(false);
    expect(hasPermission('viewer', 'update', 'properties')).toBe(false);
  });
});
