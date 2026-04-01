import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

/**
 * Incident / Accident Reports — regulatory incident tracking with investigation workflow.
 *
 * Each incident records an event involving a person with severity classification,
 * injury details (linked to body map entries), witnesses, and investigation outcomes.
 *
 * Workflow states: reported -> under_review -> investigating -> resolved -> closed
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing an incident by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */

// ---------------------------------------------------------------------------
// JSONB field type definitions
// ---------------------------------------------------------------------------

/** A person involved in the incident (not necessarily a care recipient) */
export type InvolvedPerson = {
  name: string;
  role: string; // e.g. 'resident', 'staff', 'visitor'
  personId?: string; // optional link to persons table
};

/** A witness to the incident */
export type IncidentWitness = {
  name: string;
  role: string;
  contactInfo?: string;
  statement?: string;
};

/** Injury details, optionally linked to body map entries */
export type InjuryDetail = {
  bodyRegion: string;
  description: string;
  severity: string;
  treatment?: string;
  bodyMapEntryId?: string;
};

export type IncidentSeverity = 'minor' | 'moderate' | 'serious' | 'death';
export type IncidentStatus = 'reported' | 'under_review' | 'investigating' | 'resolved' | 'closed';

export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this incident involves (primary subject) */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** The staff member who reported the incident */
    reportedById: uuid('reported_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised reporter name for display */
    reportedByName: text('reported_by_name'),
    /** When the incident occurred */
    dateTime: timestamp('date_time').notNull(),
    /** Location where the incident occurred */
    location: text('location').notNull(),
    /** Full description of what happened */
    description: text('description').notNull(),
    /** Actions taken immediately after the incident */
    immediateActions: text('immediate_actions'),
    /** Severity classification: minor | moderate | serious | death */
    severity: text('severity').notNull().default('minor'),
    /** Workflow status: reported | under_review | investigating | resolved | closed */
    status: text('status').notNull().default('reported'),
    /** Other persons involved in the incident */
    involvedPersons: jsonb('involved_persons').$type<InvolvedPerson[]>().default([]),
    /** Witnesses to the incident */
    witnesses: jsonb('witnesses').$type<IncidentWitness[]>().default([]),
    /** Injury details with optional body map links */
    injuryDetails: jsonb('injury_details').$type<InjuryDetail[]>().default([]),
    /** IDs of linked body map entries */
    linkedBodyMapEntryIds: jsonb('linked_body_map_entry_ids').$type<string[]>().default([]),
    /** Staff member assigned to investigate */
    investigatorId: uuid('investigator_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Investigation notes / findings */
    investigationNotes: text('investigation_notes'),
    /** Final outcome / conclusion */
    outcome: text('outcome'),
    /** When the incident was closed */
    closedAt: timestamp('closed_at'),
    /** Staff member who closed the incident */
    closedById: uuid('closed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Whether this incident is notifiable to a regulatory body */
    isNotifiable: text('is_notifiable').notNull().default('no'),
    /** Which regulatory body to notify: CQC | Ofsted | both | none */
    regulatoryBody: text('regulatory_body'),
    /** Whether Duty of Candour has been triggered */
    dutyOfCandourTriggered: text('duty_of_candour_triggered').notNull().default('no'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('incidents_organisation_id_idx').on(t.organisationId),
    /** List incidents for a specific person */
    index('incidents_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter by severity within an org */
    index('incidents_organisation_severity_idx').on(
      t.organisationId,
      t.severity,
    ),
    /** Filter by status within an org */
    index('incidents_organisation_status_idx').on(
      t.organisationId,
      t.status,
    ),
    /** Chronological ordering within an org */
    index('incidents_organisation_date_idx').on(
      t.organisationId,
      t.dateTime,
    ),
    /** Notifiable incidents filter */
    index('incidents_organisation_notifiable_idx').on(
      t.organisationId,
      t.isNotifiable,
    ),
  ],
);

export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
