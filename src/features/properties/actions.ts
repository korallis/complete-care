'use server';

/**
 * Property & Tenancy Server Actions
 *
 * Full CRUD for property register, tenancies, property documents,
 * and maintenance requests.
 *
 * All actions are tenant-scoped and RBAC-protected.
 */

import { and, count, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  properties,
  tenancies,
  propertyDocuments,
  maintenanceRequests,
  organisations,
  persons,
} from '@/lib/db/schema';
import type { Property } from '@/lib/db/schema/properties';
import type { Tenancy } from '@/lib/db/schema/properties';
import type { PropertyDocument } from '@/lib/db/schema/properties';
import type { MaintenanceRequest } from '@/lib/db/schema/properties';
import { requirePermission, UnauthorizedError } from '@/lib/rbac';
import { assertBelongsToOrg } from '@/lib/tenant';
import { auditLog } from '@/lib/audit';
import type { ActionResult } from '@/types';
import {
  createPropertySchema,
  updatePropertySchema,
  createTenancySchema,
  updateTenancySchema,
  createPropertyDocumentSchema,
  createMaintenanceRequestSchema,
  updateMaintenanceRequestSchema,
  propertyFilterSchema,
} from './schema';
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
  CreateTenancyInput,
  UpdateTenancyInput,
  CreatePropertyDocumentInput,
  CreateMaintenanceRequestInput,
  UpdateMaintenanceRequestInput,
} from './schema';

// Re-export for external use
export type {
  CreatePropertyInput,
  UpdatePropertyInput,
  CreateTenancyInput,
  UpdateTenancyInput,
  CreatePropertyDocumentInput,
  CreateMaintenanceRequestInput,
  UpdateMaintenanceRequestInput,
} from './schema';

// ---------------------------------------------------------------------------
// Helper: get org slug for revalidation
// ---------------------------------------------------------------------------

async function getOrgSlug(orgId: string): Promise<string | null> {
  const [org] = await db
    .select({ slug: organisations.slug })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  return org?.slug ?? null;
}

// ============================================================================
// PROPERTIES
// ============================================================================

// ---------------------------------------------------------------------------
// List properties with filters + pagination
// ---------------------------------------------------------------------------

export type PropertyListItem = {
  id: string;
  address: Property['address'];
  landlordName: string | null;
  propertyType: string;
  capacity: number;
  status: string;
  activeTenancyCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PropertyListResult = {
  properties: PropertyListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listProperties(
  filters: Record<string, unknown> = {},
): Promise<PropertyListResult> {
  const { orgId } = await requirePermission('read', 'properties');

  const parsed = propertyFilterSchema.safeParse(filters);
  const f = parsed.success ? parsed.data : { page: 1, pageSize: 25 };

  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(properties.organisationId, orgId)];

  if (f.status) {
    conditions.push(eq(properties.status, f.status));
  }

  if (f.propertyType) {
    conditions.push(eq(properties.propertyType, f.propertyType));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: properties.id,
        address: properties.address,
        landlordName: properties.landlordName,
        propertyType: properties.propertyType,
        capacity: properties.capacity,
        status: properties.status,
        createdAt: properties.createdAt,
        updatedAt: properties.updatedAt,
      })
      .from(properties)
      .where(whereClause)
      .orderBy(desc(properties.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(properties).where(whereClause),
  ]);

  // Get active tenancy counts for each property
  const propertyIds = rows.map((r) => r.id);
  let tenancyCounts: Record<string, number> = {};

  if (propertyIds.length > 0) {
    const tenancyRows = await db
      .select({
        propertyId: tenancies.propertyId,
        count: count(),
      })
      .from(tenancies)
      .where(
        and(
          eq(tenancies.organisationId, orgId),
          eq(tenancies.status, 'active'),
        ),
      )
      .groupBy(tenancies.propertyId);

    tenancyCounts = Object.fromEntries(
      tenancyRows.map((r) => [r.propertyId, r.count]),
    );
  }

  const totalCount = countResult[0]?.count ?? 0;

  return {
    properties: rows.map((r) => ({
      ...r,
      activeTenancyCount: tenancyCounts[r.id] ?? 0,
    })),
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

// ---------------------------------------------------------------------------
// Get single property
// ---------------------------------------------------------------------------

export async function getProperty(propertyId: string): Promise<Property | null> {
  const { orgId } = await requirePermission('read', 'properties');

  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property) return null;

  assertBelongsToOrg(property.organisationId, orgId);

  return property;
}

// ---------------------------------------------------------------------------
// Create property
// ---------------------------------------------------------------------------

export async function createProperty(
  input: CreatePropertyInput,
): Promise<ActionResult<Property>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'properties');

    const parsed = createPropertySchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    const [property] = await db
      .insert(properties)
      .values({
        organisationId: orgId,
        address: data.address,
        landlordName: data.landlordName ?? null,
        landlordContact: data.landlordContact ?? null,
        propertyType: data.propertyType,
        capacity: data.capacity,
        communalAreas: data.communalAreas,
        status: data.status,
      })
      .returning();

    await auditLog('create', 'property', property.id, {
      before: null,
      after: {
        address: data.address,
        propertyType: data.propertyType,
        capacity: data.capacity,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/properties`);
    }

    return { success: true, data: property };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createProperty] Error:', error);
    return { success: false, error: 'Failed to create property' };
  }
}

// ---------------------------------------------------------------------------
// Update property
// ---------------------------------------------------------------------------

export async function updateProperty(
  propertyId: string,
  input: UpdatePropertyInput,
): Promise<ActionResult<Property>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'properties');

    const parsed = updatePropertySchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Property not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof properties.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.address !== undefined) updates.address = data.address;
    if (data.landlordName !== undefined) updates.landlordName = data.landlordName;
    if (data.landlordContact !== undefined) updates.landlordContact = data.landlordContact;
    if (data.propertyType !== undefined) updates.propertyType = data.propertyType;
    if (data.capacity !== undefined) updates.capacity = data.capacity;
    if (data.communalAreas !== undefined) updates.communalAreas = data.communalAreas;
    if (data.status !== undefined) updates.status = data.status;

    const [updated] = await db
      .update(properties)
      .set(updates)
      .where(eq(properties.id, propertyId))
      .returning();

    await auditLog('update', 'property', propertyId, {
      before: { address: existing.address, status: existing.status },
      after: { address: updated.address, status: updated.status },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/properties`);
      revalidatePath(`/${slug}/properties/${propertyId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateProperty] Error:', error);
    return { success: false, error: 'Failed to update property' };
  }
}

// ---------------------------------------------------------------------------
// Delete property (hard delete — only if no active tenancies)
// ---------------------------------------------------------------------------

export async function deleteProperty(
  propertyId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('delete', 'properties');

    const [existing] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Property not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    // Check for active tenancies
    const [activeTenancy] = await db
      .select({ id: tenancies.id })
      .from(tenancies)
      .where(
        and(
          eq(tenancies.propertyId, propertyId),
          eq(tenancies.status, 'active'),
        ),
      )
      .limit(1);

    if (activeTenancy) {
      return {
        success: false,
        error: 'Cannot delete a property with active tenancies. End all tenancies first.',
      };
    }

    await db.delete(properties).where(eq(properties.id, propertyId));

    await auditLog('delete', 'property', propertyId, {
      before: { address: existing.address, propertyType: existing.propertyType },
      after: null,
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/properties`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deleteProperty] Error:', error);
    return { success: false, error: 'Failed to delete property' };
  }
}

// ============================================================================
// TENANCIES
// ============================================================================

// ---------------------------------------------------------------------------
// List tenancies for a property
// ---------------------------------------------------------------------------

export type TenancyListItem = {
  id: string;
  propertyId: string;
  personId: string;
  personName: string;
  startDate: string;
  endDate: string | null;
  tenancyType: string;
  status: string;
  createdAt: Date;
};

export async function listTenancies(propertyId: string): Promise<TenancyListItem[]> {
  const { orgId } = await requirePermission('read', 'properties');

  // Verify property belongs to org
  const [property] = await db
    .select({ organisationId: properties.organisationId })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property) return [];
  assertBelongsToOrg(property.organisationId, orgId);

  const rows = await db
    .select({
      id: tenancies.id,
      propertyId: tenancies.propertyId,
      personId: tenancies.personId,
      personName: persons.fullName,
      startDate: tenancies.startDate,
      endDate: tenancies.endDate,
      tenancyType: tenancies.tenancyType,
      status: tenancies.status,
      createdAt: tenancies.createdAt,
    })
    .from(tenancies)
    .innerJoin(persons, eq(tenancies.personId, persons.id))
    .where(
      and(
        eq(tenancies.organisationId, orgId),
        eq(tenancies.propertyId, propertyId),
      ),
    )
    .orderBy(desc(tenancies.startDate));

  return rows;
}

// ---------------------------------------------------------------------------
// Create tenancy
// ---------------------------------------------------------------------------

export async function createTenancy(
  input: CreateTenancyInput,
): Promise<ActionResult<Tenancy>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'properties');

    const parsed = createTenancySchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify property belongs to org
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, data.propertyId))
      .limit(1);

    if (!property) {
      return { success: false, error: 'Property not found' };
    }
    assertBelongsToOrg(property.organisationId, orgId);

    // Verify person belongs to org
    const [person] = await db
      .select({ id: persons.id })
      .from(persons)
      .where(
        and(
          eq(persons.id, data.personId),
          eq(persons.organisationId, orgId),
        ),
      )
      .limit(1);

    if (!person) {
      return { success: false, error: 'Person not found' };
    }

    // Check capacity
    const [activeTenancyCount] = await db
      .select({ count: count() })
      .from(tenancies)
      .where(
        and(
          eq(tenancies.propertyId, data.propertyId),
          eq(tenancies.status, 'active'),
        ),
      );

    if ((activeTenancyCount?.count ?? 0) >= property.capacity) {
      return {
        success: false,
        error: `Property is at full capacity (${property.capacity}). End an existing tenancy first.`,
      };
    }

    const [tenancy] = await db
      .insert(tenancies)
      .values({
        organisationId: orgId,
        propertyId: data.propertyId,
        personId: data.personId,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        tenancyType: data.tenancyType,
        status: data.status,
      })
      .returning();

    await auditLog('create', 'tenancy', tenancy.id, {
      before: null,
      after: {
        propertyId: data.propertyId,
        personId: data.personId,
        startDate: data.startDate,
        tenancyType: data.tenancyType,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/properties/${data.propertyId}`);
    }

    return { success: true, data: tenancy };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createTenancy] Error:', error);
    return { success: false, error: 'Failed to create tenancy' };
  }
}

// ---------------------------------------------------------------------------
// Update tenancy (typically to end it)
// ---------------------------------------------------------------------------

export async function updateTenancy(
  tenancyId: string,
  input: UpdateTenancyInput,
): Promise<ActionResult<Tenancy>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'properties');

    const parsed = updateTenancySchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(tenancies)
      .where(eq(tenancies.id, tenancyId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Tenancy not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof tenancies.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.endDate !== undefined) updates.endDate = data.endDate;
    if (data.tenancyType !== undefined) updates.tenancyType = data.tenancyType;
    if (data.status !== undefined) updates.status = data.status;

    const [updated] = await db
      .update(tenancies)
      .set(updates)
      .where(eq(tenancies.id, tenancyId))
      .returning();

    await auditLog('update', 'tenancy', tenancyId, {
      before: { status: existing.status, endDate: existing.endDate },
      after: { status: updated.status, endDate: updated.endDate },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/properties/${existing.propertyId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateTenancy] Error:', error);
    return { success: false, error: 'Failed to update tenancy' };
  }
}

// ============================================================================
// PROPERTY DOCUMENTS
// ============================================================================

// ---------------------------------------------------------------------------
// List property documents
// ---------------------------------------------------------------------------

export async function listPropertyDocuments(
  propertyId: string,
): Promise<PropertyDocument[]> {
  const { orgId } = await requirePermission('read', 'properties');

  // Verify property belongs to org
  const [property] = await db
    .select({ organisationId: properties.organisationId })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property) return [];
  assertBelongsToOrg(property.organisationId, orgId);

  return db
    .select()
    .from(propertyDocuments)
    .where(
      and(
        eq(propertyDocuments.organisationId, orgId),
        eq(propertyDocuments.propertyId, propertyId),
      ),
    )
    .orderBy(desc(propertyDocuments.createdAt));
}

// ---------------------------------------------------------------------------
// Create property document
// ---------------------------------------------------------------------------

export async function createPropertyDocument(
  input: CreatePropertyDocumentInput,
): Promise<ActionResult<PropertyDocument>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'properties');

    const parsed = createPropertyDocumentSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify property belongs to org
    const [property] = await db
      .select({ organisationId: properties.organisationId })
      .from(properties)
      .where(eq(properties.id, data.propertyId))
      .limit(1);

    if (!property) {
      return { success: false, error: 'Property not found' };
    }
    assertBelongsToOrg(property.organisationId, orgId);

    const [doc] = await db
      .insert(propertyDocuments)
      .values({
        organisationId: orgId,
        propertyId: data.propertyId,
        documentType: data.documentType,
        name: data.name,
        expiryDate: data.expiryDate ?? null,
        fileUrl: data.fileUrl ?? null,
        uploadedById: userId,
      })
      .returning();

    await auditLog('create', 'property_document', doc.id, {
      before: null,
      after: {
        propertyId: data.propertyId,
        documentType: data.documentType,
        name: data.name,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/properties/${data.propertyId}`);
    }

    return { success: true, data: doc };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createPropertyDocument] Error:', error);
    return { success: false, error: 'Failed to create property document' };
  }
}

// ---------------------------------------------------------------------------
// Delete property document
// ---------------------------------------------------------------------------

export async function deletePropertyDocument(
  documentId: string,
): Promise<ActionResult<void>> {
  try {
    const { orgId, userId } = await requirePermission('delete', 'properties');

    const [existing] = await db
      .select()
      .from(propertyDocuments)
      .where(eq(propertyDocuments.id, documentId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Document not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    await db.delete(propertyDocuments).where(eq(propertyDocuments.id, documentId));

    await auditLog('delete', 'property_document', documentId, {
      before: { name: existing.name, documentType: existing.documentType },
      after: null,
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/properties/${existing.propertyId}`);
    }

    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[deletePropertyDocument] Error:', error);
    return { success: false, error: 'Failed to delete property document' };
  }
}

// ============================================================================
// MAINTENANCE REQUESTS
// ============================================================================

// ---------------------------------------------------------------------------
// List maintenance requests for a property
// ---------------------------------------------------------------------------

export async function listMaintenanceRequests(
  propertyId: string,
): Promise<MaintenanceRequest[]> {
  const { orgId } = await requirePermission('read', 'properties');

  // Verify property belongs to org
  const [property] = await db
    .select({ organisationId: properties.organisationId })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1);

  if (!property) return [];
  assertBelongsToOrg(property.organisationId, orgId);

  return db
    .select()
    .from(maintenanceRequests)
    .where(
      and(
        eq(maintenanceRequests.organisationId, orgId),
        eq(maintenanceRequests.propertyId, propertyId),
      ),
    )
    .orderBy(desc(maintenanceRequests.createdAt));
}

// ---------------------------------------------------------------------------
// Create maintenance request
// ---------------------------------------------------------------------------

export async function createMaintenanceRequest(
  input: CreateMaintenanceRequestInput,
): Promise<ActionResult<MaintenanceRequest>> {
  try {
    const { orgId, userId } = await requirePermission('create', 'properties');

    const parsed = createMaintenanceRequestSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const data = parsed.data;

    // Verify property belongs to org
    const [property] = await db
      .select({ organisationId: properties.organisationId })
      .from(properties)
      .where(eq(properties.id, data.propertyId))
      .limit(1);

    if (!property) {
      return { success: false, error: 'Property not found' };
    }
    assertBelongsToOrg(property.organisationId, orgId);

    const [request] = await db
      .insert(maintenanceRequests)
      .values({
        organisationId: orgId,
        propertyId: data.propertyId,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        status: 'reported',
        reportedById: userId,
        assignedTo: data.assignedTo ?? null,
      })
      .returning();

    await auditLog('create', 'maintenance_request', request.id, {
      before: null,
      after: {
        propertyId: data.propertyId,
        title: data.title,
        priority: data.priority,
      },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/properties/${data.propertyId}`);
    }

    return { success: true, data: request };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[createMaintenanceRequest] Error:', error);
    return { success: false, error: 'Failed to create maintenance request' };
  }
}

// ---------------------------------------------------------------------------
// Update maintenance request
// ---------------------------------------------------------------------------

export async function updateMaintenanceRequest(
  requestId: string,
  input: UpdateMaintenanceRequestInput,
): Promise<ActionResult<MaintenanceRequest>> {
  try {
    const { orgId, userId } = await requirePermission('update', 'properties');

    const parsed = updateMaintenanceRequestSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return {
        success: false,
        error: firstError?.message ?? 'Validation failed',
        field: firstError?.path?.[0]?.toString(),
      };
    }

    const [existing] = await db
      .select()
      .from(maintenanceRequests)
      .where(eq(maintenanceRequests.id, requestId))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Maintenance request not found' };
    }

    assertBelongsToOrg(existing.organisationId, orgId);

    const data = parsed.data;
    const updates: Partial<typeof maintenanceRequests.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.assignedTo !== undefined) updates.assignedTo = data.assignedTo;
    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === 'completed') {
        updates.completedAt = new Date();
      }
    }

    const [updated] = await db
      .update(maintenanceRequests)
      .set(updates)
      .where(eq(maintenanceRequests.id, requestId))
      .returning();

    await auditLog('update', 'maintenance_request', requestId, {
      before: { status: existing.status, priority: existing.priority },
      after: { status: updated.status, priority: updated.priority },
    }, { userId, organisationId: orgId });

    const slug = await getOrgSlug(orgId);
    if (slug) {
      revalidatePath(`/${slug}/properties/${existing.propertyId}`);
    }

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    console.error('[updateMaintenanceRequest] Error:', error);
    return { success: false, error: 'Failed to update maintenance request' };
  }
}

// ============================================================================
// OCCUPANCY DASHBOARD
// ============================================================================

export type OccupancySummary = {
  propertyId: string;
  address: Property['address'];
  propertyType: string;
  capacity: number;
  occupied: number;
  vacancies: number;
  occupancyPercent: number;
};

export type OccupancyDashboardResult = {
  properties: OccupancySummary[];
  totalCapacity: number;
  totalOccupied: number;
  totalVacancies: number;
  overallOccupancyPercent: number;
};

export async function getOccupancyDashboard(): Promise<OccupancyDashboardResult> {
  const { orgId } = await requirePermission('read', 'properties');

  const allProperties = await db
    .select({
      id: properties.id,
      address: properties.address,
      propertyType: properties.propertyType,
      capacity: properties.capacity,
    })
    .from(properties)
    .where(
      and(
        eq(properties.organisationId, orgId),
        eq(properties.status, 'active'),
      ),
    )
    .orderBy(properties.createdAt);

  // Get active tenancy counts per property
  const tenancyRows = await db
    .select({
      propertyId: tenancies.propertyId,
      count: count(),
    })
    .from(tenancies)
    .where(
      and(
        eq(tenancies.organisationId, orgId),
        eq(tenancies.status, 'active'),
      ),
    )
    .groupBy(tenancies.propertyId);

  const tenancyCounts = Object.fromEntries(
    tenancyRows.map((r) => [r.propertyId, r.count]),
  );

  const summaries: OccupancySummary[] = allProperties.map((p) => {
    const occupied = tenancyCounts[p.id] ?? 0;
    return {
      propertyId: p.id,
      address: p.address,
      propertyType: p.propertyType,
      capacity: p.capacity,
      occupied,
      vacancies: Math.max(0, p.capacity - occupied),
      occupancyPercent: p.capacity > 0 ? Math.round((occupied / p.capacity) * 100) : 0,
    };
  });

  const totalCapacity = summaries.reduce((sum, s) => sum + s.capacity, 0);
  const totalOccupied = summaries.reduce((sum, s) => sum + s.occupied, 0);

  return {
    properties: summaries,
    totalCapacity,
    totalOccupied,
    totalVacancies: Math.max(0, totalCapacity - totalOccupied),
    overallOccupancyPercent:
      totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
  };
}
