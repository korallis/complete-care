import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
  date,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * End-of-life care plans — captures preferred place of death, DNACPR,
 * ReSPECT form, ADRT, LPA, treatment escalation, spiritual needs,
 * key contacts, and anticipatory medications.
 */
export const eolCarePlans = pgTable(
  'eol_care_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (service user) this plan relates to */
    personId: uuid('person_id').notNull(),
    /** e.g. home, hospice, hospital, care_home */
    preferredPlaceOfDeath: text('preferred_place_of_death'),

    // DNACPR
    dnacprInPlace: boolean('dnacpr_in_place').notNull().default(false),
    dnacprFormReference: text('dnacpr_form_reference'),
    dnacprReviewDate: date('dnacpr_review_date'),

    // ReSPECT form
    respectFormCompleted: boolean('respect_form_completed').notNull().default(false),
    respectFormReference: text('respect_form_reference'),
    respectPrioritySummary: text('respect_priority_summary'),

    // ADRT (Advance Decision to Refuse Treatment)
    adrtInPlace: boolean('adrt_in_place').notNull().default(false),
    adrtDetails: text('adrt_details'),
    adrtReviewDate: date('adrt_review_date'),

    // LPA (Health & Welfare)
    lpaHealthWelfareInPlace: boolean('lpa_health_welfare_in_place').notNull().default(false),
    lpaAttorneyName: text('lpa_attorney_name'),
    lpaAttorneyContact: text('lpa_attorney_contact'),
    lpaRegistrationReference: text('lpa_registration_reference'),

    // Treatment escalation preferences
    treatmentEscalationPreferences: text('treatment_escalation_preferences'),

    // Spiritual / religious / cultural needs
    spiritualNeeds: text('spiritual_needs'),
    religiousPreferences: text('religious_preferences'),
    culturalNeeds: text('cultural_needs'),

    // Key contacts (structured JSON: name, relationship, phone, role)
    keyContacts: jsonb('key_contacts').$type<
      Array<{
        name: string;
        relationship: string;
        phone: string;
        role: string;
      }>
    >(),

    // Anticipatory medications (JSON list of medication objects)
    anticipatoryMedications: jsonb('anticipatory_medications').$type<
      Array<{
        medication: string;
        dose: string;
        route: string;
        indication: string;
        prescribedBy: string;
      }>
    >(),

    /** Overall plan status: draft | active | reviewed | archived */
    status: text('status').notNull().default('draft'),

    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('eol_care_plans_organisation_id_idx').on(t.organisationId),
    index('eol_care_plans_person_id_idx').on(t.personId),
  ],
);

export type EolCarePlan = typeof eolCarePlans.$inferSelect;
export type NewEolCarePlan = typeof eolCarePlans.$inferInsert;

/**
 * Duty of Candour incidents — CQC Regulation 20.
 * Tracks notifiable safety incidents through verbal notification,
 * written follow-up (within 10 days), investigation, and apology.
 */
export const dutyOfCandourIncidents = pgTable(
  'duty_of_candour_incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person affected by the incident */
    personId: uuid('person_id').notNull(),
    /** Brief title of the incident */
    incidentTitle: text('incident_title').notNull(),
    /** Full description of the notifiable safety incident */
    incidentDescription: text('incident_description').notNull(),
    /** Date/time the incident occurred */
    incidentDate: timestamp('incident_date').notNull(),
    /** Severity: moderate_harm | severe_harm | death | prolonged_psychological_harm */
    severity: text('severity').notNull(),

    // Step 1: Verbal notification
    verbalNotificationGiven: boolean('verbal_notification_given').notNull().default(false),
    verbalNotificationDate: timestamp('verbal_notification_date'),
    verbalNotificationBy: uuid('verbal_notification_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    verbalNotificationNotes: text('verbal_notification_notes'),

    // Step 2: Written follow-up (within 10 days)
    writtenFollowUpSent: boolean('written_follow_up_sent').notNull().default(false),
    writtenFollowUpDate: timestamp('written_follow_up_date'),
    writtenFollowUpBy: uuid('written_follow_up_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Deadline: 10 working days from incident date */
    writtenFollowUpDeadline: timestamp('written_follow_up_deadline'),
    writtenFollowUpContent: text('written_follow_up_content'),

    // Step 3: Investigation
    investigationStarted: boolean('investigation_started').notNull().default(false),
    investigationStartDate: timestamp('investigation_start_date'),
    investigationFindings: text('investigation_findings'),
    investigationCompletedDate: timestamp('investigation_completed_date'),
    investigationLeadId: uuid('investigation_lead_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    // Step 4: Apology
    apologyGiven: boolean('apology_given').notNull().default(false),
    apologyDate: timestamp('apology_date'),
    apologyMethod: text('apology_method'),
    apologyContent: text('apology_content'),

    /** Overall workflow status: open | verbal_given | written_sent | investigating | closed */
    status: text('status').notNull().default('open'),

    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('doc_incidents_organisation_id_idx').on(t.organisationId),
    index('doc_incidents_person_id_idx').on(t.personId),
    index('doc_incidents_status_idx').on(t.status),
    index('doc_incidents_deadline_idx').on(t.writtenFollowUpDeadline),
  ],
);

export type DutyOfCandourIncident = typeof dutyOfCandourIncidents.$inferSelect;
export type NewDutyOfCandourIncident = typeof dutyOfCandourIncidents.$inferInsert;
