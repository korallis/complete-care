import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

/**
 * Address shape stored in the properties JSONB column.
 */
export type PropertyAddress = {
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
};

/**
 * Communal area definition stored in the communalAreas JSONB array.
 */
export type CommunalArea = {
  id: string;
  name: string;
  description?: string;
};

/**
 * Properties — supported living property register.
 *
 * Tracks physical properties, their landlords, capacity, and type.
 * Properties can be shared houses, individual flats, or cluster units.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a property by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const properties = pgTable(
  'properties',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),

    /** JSONB address: line1, line2, city, county, postcode */
    address: jsonb('address').$type<PropertyAddress>().notNull(),

    /** Landlord / property owner name */
    landlordName: text('landlord_name'),
    /** Landlord contact details (phone, email, etc.) */
    landlordContact: text('landlord_contact'),

    /** Property type: shared_house | individual_flat | cluster */
    propertyType: text('property_type').notNull().default('shared_house'),
    /** Maximum number of tenants the property can house */
    capacity: integer('capacity').notNull().default(1),

    /** JSONB array of communal area definitions */
    communalAreas: jsonb('communal_areas').$type<CommunalArea[]>().notNull().default([]),

    /** Lifecycle: active | inactive */
    status: text('status').notNull().default('active'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('properties_organisation_id_idx').on(t.organisationId),
    /** List properties by org + status */
    index('properties_organisation_status_idx').on(t.organisationId, t.status),
    /** Filter by property type within an org */
    index('properties_organisation_type_idx').on(t.organisationId, t.propertyType),
  ],
);

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;

/**
 * Tenancies — links a person (resident) to a property for a time period.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a tenancy by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const tenancies = pgTable(
  'tenancies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),

    /** The property this tenancy is for */
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),
    /** The person (resident) occupying the property */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),

    /** Tenancy start date (ISO YYYY-MM-DD) */
    startDate: text('start_date').notNull(),
    /** Tenancy end date (ISO YYYY-MM-DD), null if ongoing */
    endDate: text('end_date'),

    /** Tenancy type: assured | licensee | other */
    tenancyType: text('tenancy_type').notNull().default('assured'),
    /** Lifecycle: active | ended */
    status: text('status').notNull().default('active'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('tenancies_organisation_id_idx').on(t.organisationId),
    /** Tenancies for a specific property */
    index('tenancies_organisation_property_idx').on(t.organisationId, t.propertyId),
    /** Tenancies for a specific person */
    index('tenancies_organisation_person_idx').on(t.organisationId, t.personId),
    /** Active tenancies lookup */
    index('tenancies_organisation_status_idx').on(t.organisationId, t.status),
  ],
);

export type Tenancy = typeof tenancies.$inferSelect;
export type NewTenancy = typeof tenancies.$inferInsert;

/**
 * Property Documents — compliance and safety documents attached to properties.
 *
 * Tracks fire risk assessments, gas safety certs, electrical inspection certs,
 * landlord contacts, and maintenance records.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a property document by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const propertyDocuments = pgTable(
  'property_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),

    /** The property this document belongs to */
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),

    /** Document type: fire_risk | gas_safety | electrical | landlord_contact | maintenance | other */
    documentType: text('document_type').notNull().default('other'),
    /** Display name of the document */
    name: text('name').notNull(),
    /** Expiry date (ISO YYYY-MM-DD), null if no expiry */
    expiryDate: text('expiry_date'),
    /** External storage URL */
    fileUrl: text('file_url'),

    /** The staff member who uploaded the document */
    uploadedById: uuid('uploaded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('property_documents_organisation_id_idx').on(t.organisationId),
    /** Documents for a specific property */
    index('property_documents_organisation_property_idx').on(
      t.organisationId,
      t.propertyId,
    ),
    /** Filter by document type within an org */
    index('property_documents_organisation_type_idx').on(
      t.organisationId,
      t.documentType,
    ),
  ],
);

export type PropertyDocument = typeof propertyDocuments.$inferSelect;
export type NewPropertyDocument = typeof propertyDocuments.$inferInsert;

/**
 * Maintenance Requests — tracks maintenance issues for properties.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a maintenance request by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const maintenanceRequests = pgTable(
  'maintenance_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),

    /** The property this request is for */
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'cascade' }),

    /** Short title / summary */
    title: text('title').notNull(),
    /** Detailed description of the issue */
    description: text('description'),

    /** Priority: low | medium | high | urgent */
    priority: text('priority').notNull().default('medium'),
    /** Status: reported | in_progress | completed */
    status: text('status').notNull().default('reported'),

    /** The staff member who reported the issue */
    reportedById: uuid('reported_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Free-text field for who the request is assigned to */
    assignedTo: text('assigned_to'),
    /** When the maintenance was completed */
    completedAt: timestamp('completed_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('maintenance_requests_organisation_id_idx').on(t.organisationId),
    /** Requests for a specific property */
    index('maintenance_requests_organisation_property_idx').on(
      t.organisationId,
      t.propertyId,
    ),
    /** Filter by status within an org */
    index('maintenance_requests_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
    /** Filter by priority within an org */
    index('maintenance_requests_organisation_priority_idx').on(
      t.organisationId,
      t.priority,
    ),
  ],
);

export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type NewMaintenanceRequest = typeof maintenanceRequests.$inferInsert;
