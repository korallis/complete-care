import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { staffProfiles } from './staff-profiles';

/**
 * Agency Register -- approved staffing agencies per organisation.
 *
 * Tracks approved agencies, their contract periods, and contact details.
 * Each organisation maintains its own register of approved agencies.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const agencyRegister = pgTable(
  'agency_register',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope -- all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Name of the staffing agency */
    agencyName: text('agency_name').notNull(),
    /** Primary contact email for the agency */
    contactEmail: text('contact_email'),
    /** Primary contact phone for the agency */
    contactPhone: text('contact_phone'),
    /** Contract start date (ISO date string YYYY-MM-DD) */
    contractStart: text('contract_start'),
    /** Contract end date (ISO date string YYYY-MM-DD) */
    contractEnd: text('contract_end'),
    /** Status: active | inactive */
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('agency_register_organisation_id_idx').on(t.organisationId),
    /** Filter by status within an org */
    index('agency_register_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
  ],
);

export type AgencyRegisterEntry = typeof agencyRegister.$inferSelect;
export type NewAgencyRegisterEntry = typeof agencyRegister.$inferInsert;

/**
 * Agency Workers -- workers supplied by approved agencies.
 *
 * Tracks individual agency workers, their assignments, and DBS details.
 * Each worker is linked to an agency and scoped to an organisation.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const agencyWorkers = pgTable(
  'agency_workers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope -- all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Reference to the approved agency */
    agencyId: uuid('agency_id')
      .notNull()
      .references(() => agencyRegister.id, { onDelete: 'cascade' }),
    /** Worker's full name */
    name: text('name').notNull(),
    /** Worker's role/position */
    role: text('role'),
    /** Assignment start date (ISO date string YYYY-MM-DD) */
    startDate: text('start_date'),
    /** Assignment end date (ISO date string YYYY-MM-DD) */
    endDate: text('end_date'),
    /** DBS certificate number for the agency worker */
    dbsCertificateNumber: text('dbs_certificate_number'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('agency_workers_organisation_id_idx').on(t.organisationId),
    /** Workers by agency within an org */
    index('agency_workers_organisation_agency_idx').on(
      t.organisationId,
      t.agencyId,
    ),
  ],
);

export type AgencyWorker = typeof agencyWorkers.$inferSelect;
export type NewAgencyWorker = typeof agencyWorkers.$inferInsert;

/**
 * Reference entry stored in the references JSONB array on recruitment records.
 */
export type RecruitmentReference = {
  id: string;
  refereeName: string;
  relationship: string;
  contactEmail: string | null;
  contactPhone: string | null;
  status: 'pending' | 'received' | 'verified';
  receivedDate: string | null;
  notes: string | null;
};

/**
 * Recruitment Records -- tracks the recruitment pipeline for staff.
 *
 * Records interview dates, references, offer status, and start dates
 * for prospective and newly hired staff members.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const recruitmentRecords = pgTable(
  'recruitment_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope -- all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The staff profile this recruitment record is for */
    staffProfileId: uuid('staff_profile_id')
      .notNull()
      .references(() => staffProfiles.id, { onDelete: 'cascade' }),
    /** Interview date (ISO date string YYYY-MM-DD) */
    interviewDate: text('interview_date'),
    /** JSONB array of reference entries */
    references: jsonb('references')
      .$type<RecruitmentReference[]>()
      .notNull()
      .default([]),
    /** Date the offer was made (ISO date string YYYY-MM-DD) */
    offerDate: text('offer_date'),
    /** Offer status: pending | accepted | declined */
    offerStatus: text('offer_status').notNull().default('pending'),
    /** Proposed or actual start date (ISO date string YYYY-MM-DD) */
    startDate: text('start_date'),
    /** Additional notes about the recruitment process */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('recruitment_records_organisation_id_idx').on(t.organisationId),
    /** Recruitment record by staff member within an org */
    index('recruitment_records_organisation_staff_idx').on(
      t.organisationId,
      t.staffProfileId,
    ),
    /** Filter by offer status within an org */
    index('recruitment_records_organisation_status_idx').on(
      t.organisationId,
      t.offerStatus,
    ),
  ],
);

export type RecruitmentRecord = typeof recruitmentRecords.$inferSelect;
export type NewRecruitmentRecord = typeof recruitmentRecords.$inferInsert;
