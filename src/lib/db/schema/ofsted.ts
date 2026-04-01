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
 * Ofsted Quality Standards — the 9 standards (Regulations 6-14) for
 * children's residential homes.
 *
 * Seeded once per organisation via seedStandards action.
 * Each standard maps to a regulation number and has a set of sub-requirements.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const ofstedStandards = pgTable(
  'ofsted_standards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Regulation number 6-14 corresponding to the 9 Quality Standards */
    regulationNumber: integer('regulation_number').notNull(),
    /** Human-readable standard name (e.g. "The quality and purpose of care standard") */
    standardName: text('standard_name').notNull(),
    /** Description of the standard */
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('ofsted_standards_organisation_id_idx').on(t.organisationId),
    /** Lookup by org + regulation number */
    index('ofsted_standards_org_reg_idx').on(
      t.organisationId,
      t.regulationNumber,
    ),
  ],
);

export type OfstedStandard = typeof ofstedStandards.$inferSelect;
export type NewOfstedStandard = typeof ofstedStandards.$inferInsert;

/**
 * Ofsted Evidence — links system records (or manual entries) to standard
 * sub-requirements as evidence of compliance.
 *
 * Each evidence row maps a sub-requirement within a standard to a supporting
 * record (care plan, note, incident, training record, document, or manual).
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const ofstedEvidence = pgTable(
  'ofsted_evidence',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The standard this evidence supports */
    standardId: uuid('standard_id')
      .notNull()
      .references(() => ofstedStandards.id, { onDelete: 'cascade' }),
    /** Sub-requirement identifier within the standard (from the template) */
    subRequirementId: text('sub_requirement_id').notNull(),
    /**
     * Type of evidence record:
     * care_plan | note | incident | training | document | manual
     */
    evidenceType: text('evidence_type').notNull(),
    /**
     * FK to the actual system record (nullable for 'manual' type).
     * Polymorphic — the evidenceType determines which table this references.
     */
    evidenceId: uuid('evidence_id'),
    /** Free-text description of the evidence */
    description: text('description'),
    /** Evidence status: evidenced | partial | missing */
    status: text('status').notNull().default('missing'),
    /** User who last reviewed this evidence */
    reviewedById: uuid('reviewed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** When the evidence was last reviewed */
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('ofsted_evidence_organisation_id_idx').on(t.organisationId),
    /** Evidence rows for a specific standard */
    index('ofsted_evidence_standard_idx').on(t.organisationId, t.standardId),
    /** Evidence by sub-requirement within a standard */
    index('ofsted_evidence_sub_req_idx').on(
      t.organisationId,
      t.standardId,
      t.subRequirementId,
    ),
    /** Filter by status for gap analysis */
    index('ofsted_evidence_status_idx').on(t.organisationId, t.status),
  ],
);

export type OfstedEvidence = typeof ofstedEvidence.$inferSelect;
export type NewOfstedEvidence = typeof ofstedEvidence.$inferInsert;

/**
 * Emergency contact shape for the children's register.
 */
export type ChildRegisterEmergencyContact = {
  name: string;
  relationship: string;
  phone: string;
  email?: string | null;
};

/**
 * Children's Register — Schedule 4 compliant register of children
 * admitted to the residential home.
 *
 * Tracks admission date, discharge date, legal status, placing authority,
 * social worker details, IRO, and emergency contacts.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const childrensRegister = pgTable(
  'childrens_register',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (child) this register entry is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Admission date (ISO date string YYYY-MM-DD) */
    admissionDate: text('admission_date').notNull(),
    /** Discharge date (ISO date string YYYY-MM-DD), null if still resident */
    dischargeDate: text('discharge_date'),
    /**
     * Legal status of placement:
     * full_care_order | interim_care_order | section20 | remand | other
     */
    legalStatus: text('legal_status').notNull(),
    /** Local authority or body that placed the child */
    placingAuthority: text('placing_authority').notNull(),
    /** Name of the assigned social worker */
    socialWorkerName: text('social_worker_name'),
    /** Social worker email */
    socialWorkerEmail: text('social_worker_email'),
    /** Social worker phone */
    socialWorkerPhone: text('social_worker_phone'),
    /** Name of the Independent Reviewing Officer */
    iroName: text('iro_name'),
    /** Emergency contact stored as JSONB */
    emergencyContact: jsonb('emergency_contact')
      .$type<ChildRegisterEmergencyContact>()
      .notNull()
      .default({ name: '', relationship: '', phone: '' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('childrens_register_organisation_id_idx').on(t.organisationId),
    /** Register entries for a specific child */
    index('childrens_register_org_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Active residents (no discharge date) */
    index('childrens_register_org_active_idx').on(
      t.organisationId,
      t.dischargeDate,
    ),
  ],
);

export type ChildrensRegisterEntry = typeof childrensRegister.$inferSelect;
export type NewChildrensRegisterEntry = typeof childrensRegister.$inferInsert;

/**
 * Statement of Purpose section shape stored in the content JSONB.
 */
export type StatementOfPurposeSection = {
  id: string;
  title: string;
  content: string;
  order: number;
};

/**
 * Statement of Purpose — version-controlled document required by
 * Regulation 16 of the Children's Homes Regulations 2015.
 *
 * Stores structured document sections as JSONB. Supports draft/current/archived
 * lifecycle for version control.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const statementOfPurpose = pgTable(
  'statement_of_purpose',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Version number — incremented on each publish */
    version: integer('version').notNull().default(1),
    /** Structured content sections */
    content: jsonb('content')
      .$type<StatementOfPurposeSection[]>()
      .notNull()
      .default([]),
    /** Document lifecycle: draft | current | archived */
    status: text('status').notNull().default('draft'),
    /** User who approved/published this version */
    approvedById: uuid('approved_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** When this version was approved/published */
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('statement_of_purpose_organisation_id_idx').on(t.organisationId),
    /** Find current version for an org */
    index('statement_of_purpose_org_status_idx').on(
      t.organisationId,
      t.status,
    ),
  ],
);

export type StatementOfPurposeDoc = typeof statementOfPurpose.$inferSelect;
export type NewStatementOfPurposeDoc = typeof statementOfPurpose.$inferInsert;
