import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  index,
  date,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

/**
 * Approved Contacts Register — every external person authorised
 * (or restricted) to have contact with a child in residential care.
 *
 * VAL-CHILD-014: Court order restrictions enforced at scheduling time.
 *
 * Relations defined in ./relations.ts.
 */
export const approvedContacts = pgTable(
  'approved_contacts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The child (person) this contact is approved for */
    personId: uuid('person_id').notNull(),
    /** Full name of the contact */
    name: text('name').notNull(),
    /** Relationship to the child: mother | father | sibling | grandparent | aunt_uncle | social_worker | other */
    relationship: text('relationship').notNull(),
    /** Phone number */
    phone: text('phone'),
    /** Email address */
    email: text('email'),
    /** Postal address */
    address: text('address'),
    /** Allowed contact types (JSON array): face_to_face | phone | video | letter */
    allowedContactTypes: text('allowed_contact_types').array().notNull(),
    /** Required frequency as free text from care plan, e.g. "Weekly", "Fortnightly" */
    frequency: text('frequency'),
    /** Supervision level: unsupervised | supervised_by_staff | supervised_by_sw */
    supervisionLevel: text('supervision_level').notNull().default('supervised_by_staff'),
    /** Whether this contact has active restrictions */
    hasRestrictions: boolean('has_restrictions').notNull().default(false),
    /** Court order reference number (if restricted) */
    courtOrderReference: text('court_order_reference'),
    /** Court order date (if restricted) */
    courtOrderDate: date('court_order_date', { mode: 'string' }),
    /** Court order conditions / restriction details */
    courtOrderConditions: text('court_order_conditions'),
    /** Whether this contact is currently active in the register */
    isActive: boolean('is_active').notNull().default(true),
    /** Staff member who approved this contact */
    approvedById: uuid('approved_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('approved_contacts_org_idx').on(t.organisationId),
    index('approved_contacts_person_idx').on(t.organisationId, t.personId),
  ],
);

export type ApprovedContact = typeof approvedContacts.$inferSelect;
export type NewApprovedContact = typeof approvedContacts.$inferInsert;

/**
 * Contact Schedule — planned visits/calls derived from the care plan.
 *
 * VAL-CHILD-014: Restricted contacts cannot be scheduled without manager override.
 * VAL-CHILD-015: Scheduling validates against approved register.
 */
export const contactSchedules = pgTable(
  'contact_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Reference to the approved contact */
    approvedContactId: uuid('approved_contact_id')
      .notNull()
      .references(() => approvedContacts.id, { onDelete: 'cascade' }),
    /** Contact type for this scheduled session */
    contactType: text('contact_type').notNull(),
    /** Scheduled date and time */
    scheduledAt: timestamp('scheduled_at').notNull(),
    /** Expected duration in minutes */
    durationMinutes: integer('duration_minutes'),
    /** Supervision level for this session */
    supervisionLevel: text('supervision_level').notNull(),
    /** Location (for face-to-face) */
    location: text('location'),
    /** Schedule status: scheduled | completed | cancelled | no_show */
    status: text('status').notNull().default('scheduled'),
    /** If a restricted contact was scheduled, manager override is required */
    managerOverride: boolean('manager_override').notNull().default(false),
    /** Manager who authorised the override */
    overrideById: uuid('override_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Logged justification for overriding restriction */
    overrideJustification: text('override_justification'),
    /** Staff member who created the schedule entry */
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('contact_schedules_org_idx').on(t.organisationId),
    index('contact_schedules_person_idx').on(t.organisationId, t.personId),
    index('contact_schedules_scheduled_at_idx').on(t.scheduledAt),
    index('contact_schedules_approved_contact_idx').on(t.approvedContactId),
  ],
);

export type ContactSchedule = typeof contactSchedules.$inferSelect;
export type NewContactSchedule = typeof contactSchedules.$inferInsert;

/**
 * Contact Records — record of each contact event that actually occurred.
 *
 * VAL-CHILD-015: Records emotional presentation before/during/after,
 * concerns, and disclosures.
 */
export const contactRecords = pgTable(
  'contact_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Reference to the approved contact */
    approvedContactId: uuid('approved_contact_id')
      .notNull()
      .references(() => approvedContacts.id, { onDelete: 'cascade' }),
    /** Optional link to the scheduled entry (null if ad-hoc) */
    contactScheduleId: uuid('contact_schedule_id').references(
      () => contactSchedules.id,
      { onDelete: 'set null' },
    ),
    /** Contact type: face_to_face | phone | video | letter */
    contactType: text('contact_type').notNull(),
    /** When the contact actually occurred */
    contactDate: timestamp('contact_date').notNull(),
    /** Actual duration in minutes */
    durationMinutes: integer('duration_minutes'),
    /** Supervision level that was applied */
    supervisionLevel: text('supervision_level').notNull(),
    /** Who was present during the contact (free text or comma-separated) */
    whoPresent: text('who_present'),
    /** Location of the contact */
    location: text('location'),
    /** Child's emotional presentation before contact */
    emotionalBefore: text('emotional_before'),
    /** Child's emotional presentation during contact */
    emotionalDuring: text('emotional_during'),
    /** Child's emotional presentation after contact */
    emotionalAfter: text('emotional_after'),
    /** General notes / observations */
    notes: text('notes'),
    /** Any concerns raised during the contact */
    concerns: text('concerns'),
    /** Any disclosures made by the child */
    disclosures: text('disclosures'),
    /** Staff member who recorded this */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('contact_records_org_idx').on(t.organisationId),
    index('contact_records_person_idx').on(t.organisationId, t.personId),
    index('contact_records_date_idx').on(t.contactDate),
    index('contact_records_approved_contact_idx').on(t.approvedContactId),
  ],
);

export type ContactRecord = typeof contactRecords.$inferSelect;
export type NewContactRecord = typeof contactRecords.$inferInsert;
