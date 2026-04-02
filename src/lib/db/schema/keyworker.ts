import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

/**
 * Key Worker Session Action — tracked action items arising from sessions.
 */
export type SessionAction = {
  action: string;
  deadline: string; // ISO YYYY-MM-DD
  completed: boolean;
};

/**
 * Session Goals — structured goal tracking in JSONB.
 */
export type SessionGoals = {
  shortTerm?: string[];
  longTerm?: string[];
  progress?: string;
};

/**
 * Key Worker Sessions — structured 1:1 sessions between key worker and child.
 *
 * Template covers: check-in, week review, goals, education, health, family,
 * wishes and feelings. Action items tracked with deadlines.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const keyworkerSessions = pgTable(
  'keyworker_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (child) this session is for */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** The key worker who conducted the session */
    keyworkerId: uuid('keyworker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Date of the session (ISO YYYY-MM-DD) */
    sessionDate: text('session_date').notNull(),
    /** Opening check-in: how is the child feeling? */
    checkIn: text('check_in'),
    /** Review of the past week */
    weekReview: text('week_review'),
    /** Structured goals (JSONB) */
    goals: jsonb('goals').$type<SessionGoals>().default({}),
    /** Education discussion */
    education: text('education'),
    /** Health discussion */
    health: text('health'),
    /** Family / contact discussion */
    family: text('family'),
    /** Wishes and feelings — child's voice */
    wishesAndFeelings: text('wishes_and_feelings'),
    /** Action items with deadlines (JSONB array) */
    actions: jsonb('actions').$type<SessionAction[]>().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('keyworker_sessions_organisation_id_idx').on(t.organisationId),
    index('keyworker_sessions_org_person_idx').on(t.organisationId, t.personId),
    index('keyworker_sessions_org_keyworker_idx').on(t.organisationId, t.keyworkerId),
    index('keyworker_sessions_org_date_idx').on(t.organisationId, t.sessionDate),
  ],
);

export type KeyworkerSession = typeof keyworkerSessions.$inferSelect;
export type NewKeyworkerSession = typeof keyworkerSessions.$inferInsert;

/**
 * Injury Check — structured record of post-restraint injury check.
 */
export type InjuryCheck = {
  childInjured: boolean;
  childInjuryDetails?: string;
  staffInjured: boolean;
  staffInjuryDetails?: string;
  medicalAttentionRequired: boolean;
  medicalAttentionDetails?: string;
};

/**
 * Restraints — records of physical interventions (restraints) used.
 *
 * Captures technique, duration, injury checks, debriefs, and management review.
 * Required for Ofsted inspection and safeguarding purposes.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const restraints = pgTable(
  'restraints',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (child) this restraint was applied to */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Date and time of the restraint (ISO datetime) */
    dateTime: text('date_time').notNull(),
    /** Duration in minutes */
    duration: integer('duration').notNull(),
    /** Technique used (e.g., PRICE, Team Teach) */
    technique: text('technique').notNull(),
    /** Reason for the restraint */
    reason: text('reason').notNull(),
    /** Injury check after restraint (JSONB) */
    injuryCheck: jsonb('injury_check').$type<InjuryCheck>().notNull(),
    /** Debrief with the child */
    childDebrief: text('child_debrief'),
    /** Debrief with staff involved */
    staffDebrief: text('staff_debrief'),
    /** Management review notes */
    managementReview: text('management_review'),
    /** User who reviewed this restraint record */
    reviewedById: uuid('reviewed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** User who recorded this restraint */
    recordedById: uuid('recorded_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('restraints_organisation_id_idx').on(t.organisationId),
    index('restraints_org_person_idx').on(t.organisationId, t.personId),
    index('restraints_org_date_idx').on(t.organisationId, t.dateTime),
  ],
);

export type Restraint = typeof restraints.$inferSelect;
export type NewRestraint = typeof restraints.$inferInsert;

/**
 * Sanctions — records of sanctions applied to children.
 *
 * Includes prohibited measures safeguards: if isProhibited is true,
 * the record flags a regulatory breach.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const sanctions = pgTable(
  'sanctions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (child) the sanction was applied to */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Date and time of the sanction (ISO datetime) */
    dateTime: text('date_time').notNull(),
    /** Description of the sanction */
    description: text('description').notNull(),
    /** Type of sanction applied */
    sanctionType: text('sanction_type').notNull(),
    /** Whether this is a prohibited measure (regulatory safeguard flag) */
    isProhibited: boolean('is_prohibited').notNull().default(false),
    /** Justification for the sanction */
    justification: text('justification'),
    /** User who imposed the sanction */
    imposedById: uuid('imposed_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** User who reviewed the sanction (management oversight) */
    reviewedById: uuid('reviewed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('sanctions_organisation_id_idx').on(t.organisationId),
    index('sanctions_org_person_idx').on(t.organisationId, t.personId),
    index('sanctions_org_date_idx').on(t.organisationId, t.dateTime),
  ],
);

export type Sanction = typeof sanctions.$inferSelect;
export type NewSanction = typeof sanctions.$inferInsert;

/**
 * Visitor Log — Schedule 4 compliant visitor tracking.
 *
 * Records all visitors to the home including identity/DBS verification.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const visitorLog = pgTable(
  'visitor_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Visitor's full name */
    visitorName: text('visitor_name').notNull(),
    /** Relationship to the child or purpose of visit */
    relationship: text('relationship').notNull(),
    /** The person (child) being visited (optional — visitor may be for the home) */
    personVisitedId: uuid('person_visited_id').references(() => persons.id, {
      onDelete: 'set null',
    }),
    /** Date of the visit (ISO YYYY-MM-DD) */
    visitDate: text('visit_date').notNull(),
    /** Arrival time (HH:MM) */
    arrivalTime: text('arrival_time').notNull(),
    /** Departure time (HH:MM) */
    departureTime: text('departure_time'),
    /** Was photo ID checked? */
    idChecked: boolean('id_checked').notNull().default(false),
    /** Was DBS checked / verified? */
    dbsChecked: boolean('dbs_checked').notNull().default(false),
    /** Additional notes */
    notes: text('notes'),
    /** User who recorded the visit */
    recordedById: uuid('recorded_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('visitor_log_organisation_id_idx').on(t.organisationId),
    index('visitor_log_org_date_idx').on(t.organisationId, t.visitDate),
    index('visitor_log_org_person_idx').on(t.organisationId, t.personVisitedId),
  ],
);

export type VisitorLogEntry = typeof visitorLog.$inferSelect;
export type NewVisitorLogEntry = typeof visitorLog.$inferInsert;

/**
 * Children's Voice — records of children's views, opinions, and feedback.
 *
 * Captures the child's voice for care planning, reviews, and Ofsted evidence.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const childrensVoice = pgTable(
  'childrens_voice',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person (child) whose views are recorded */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** Date the views were recorded (ISO YYYY-MM-DD) */
    recordedDate: text('recorded_date').notNull(),
    /** Category of feedback */
    category: text('category').notNull(),
    /** The child's views/opinions in their own words */
    content: text('content').notNull(),
    /** How the views were gathered (e.g., direct conversation, survey, advocate) */
    method: text('method'),
    /** What action was taken in response */
    actionTaken: text('action_taken'),
    /** User who recorded the views */
    recordedById: uuid('recorded_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('childrens_voice_organisation_id_idx').on(t.organisationId),
    index('childrens_voice_org_person_idx').on(t.organisationId, t.personId),
    index('childrens_voice_org_date_idx').on(t.organisationId, t.recordedDate),
    index('childrens_voice_org_category_idx').on(t.organisationId, t.category),
  ],
);

export type ChildrensVoiceEntry = typeof childrensVoice.$inferSelect;
export type NewChildrensVoiceEntry = typeof childrensVoice.$inferInsert;
