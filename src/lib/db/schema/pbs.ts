import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  index,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ---------------------------------------------------------------------------
// PBS Plans
// ---------------------------------------------------------------------------

/**
 * Positive Behaviour Support plans — versioned, per-person documents
 * containing functional assessment, behaviour descriptions, strategies,
 * and post-incident support protocols.
 *
 * Each row is a specific version of the plan. To "edit" a plan the app
 * creates a new row with an incremented version number and the same personId.
 */
export const pbsPlans = pgTable(
  'pbs_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this plan belongs to (loose FK — persons may live in another schema module). */
    personId: uuid('person_id').notNull(),
    /** Monotonically increasing version per person. */
    version: integer('version').notNull().default(1),
    /** draft | active | superseded | archived */
    status: text('status').notNull().default('draft'),

    // -- Functional assessment --
    functionalAssessmentSummary: text('functional_assessment_summary').notNull(),
    identifiedBehaviours: text('identified_behaviours').notNull(),
    hypothesisedFunction: text('hypothesised_function').notNull(),

    // -- Strategies --
    primaryStrategies: text('primary_strategies').notNull(),
    secondaryStrategies: text('secondary_strategies').notNull(),
    reactiveStrategies: text('reactive_strategies').notNull(),

    // -- Post-incident --
    postIncidentSupport: text('post_incident_support').notNull(),

    // -- Reduction plan --
    reductionPlan: text('reduction_plan'),

    /** Multi-disciplinary input tracking — array of {name, role, date, notes} */
    mdiContributions: jsonb('mdi_contributions').$type<
      Array<{ name: string; role: string; date: string; notes: string }>
    >(),

    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('pbs_plans_org_idx').on(t.organisationId),
    index('pbs_plans_person_idx').on(t.personId),
    index('pbs_plans_person_version_idx').on(t.personId, t.version),
  ],
);

export type PbsPlan = typeof pbsPlans.$inferSelect;
export type NewPbsPlan = typeof pbsPlans.$inferInsert;

// ---------------------------------------------------------------------------
// ABC Incidents
// ---------------------------------------------------------------------------

/**
 * Antecedent-Behaviour-Consequence incident records.
 * Structured data collection for behavioural analysis.
 */
export const abcIncidents = pgTable(
  'abc_incidents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    pbsPlanId: uuid('pbs_plan_id').references(() => pbsPlans.id, {
      onDelete: 'set null',
    }),

    /** When the incident occurred */
    occurredAt: timestamp('occurred_at').notNull(),

    // -- Antecedent --
    /** Structured category: demand | transition | sensory | social | denial | unstructured_time | pain_discomfort | unknown | other */
    antecedentCategory: text('antecedent_category').notNull(),
    antecedentDescription: text('antecedent_description').notNull(),

    // -- Behaviour --
    behaviourTopography: text('behaviour_topography').notNull(),
    /** Duration in minutes */
    behaviourDuration: integer('behaviour_duration'),
    /** 1-5 scale */
    behaviourIntensity: integer('behaviour_intensity').notNull(),

    // -- Consequence --
    consequenceStaffResponse: text('consequence_staff_response').notNull(),

    // -- Setting conditions --
    settingEnvironment: text('setting_environment'),
    settingPeoplePresent: text('setting_people_present'),
    settingActivity: text('setting_activity'),
    settingSensoryFactors: text('setting_sensory_factors'),

    recordedBy: uuid('recorded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('abc_incidents_org_idx').on(t.organisationId),
    index('abc_incidents_person_idx').on(t.personId),
    index('abc_incidents_occurred_at_idx').on(t.occurredAt),
    index('abc_incidents_category_idx').on(t.antecedentCategory),
  ],
);

export type AbcIncident = typeof abcIncidents.$inferSelect;
export type NewAbcIncident = typeof abcIncidents.$inferInsert;

// ---------------------------------------------------------------------------
// Restrictive Practices Register
// ---------------------------------------------------------------------------

/**
 * Immutable register of restrictive practice instances.
 * Editing creates a new version row — originals are never mutated.
 */
export const restrictivePractices = pgTable(
  'restrictive_practices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),

    /** physical | environmental | chemical | mechanical */
    type: text('type').notNull(),
    justification: text('justification').notNull(),
    /** Link to Mental Capacity Assessment */
    mcaLink: text('mca_link'),
    authorisedBy: text('authorised_by').notNull(),
    /** Duration of the restrictive practice in minutes */
    durationMinutes: integer('duration_minutes').notNull(),
    personResponse: text('person_response').notNull(),

    /** When the practice occurred */
    occurredAt: timestamp('occurred_at').notNull(),

    // -- Immutability / versioning --
    /** If this is an edited version, references the original entry */
    previousVersionId: uuid('previous_version_id'),
    /** Marks original entries that have been superseded */
    isSuperseded: boolean('is_superseded').notNull().default(false),
    /** Monotonically increasing version per logical entry chain */
    versionNumber: integer('version_number').notNull().default(1),

    recordedBy: uuid('recorded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('restrictive_practices_org_idx').on(t.organisationId),
    index('restrictive_practices_person_idx').on(t.personId),
    index('restrictive_practices_type_idx').on(t.type),
    index('restrictive_practices_occurred_at_idx').on(t.occurredAt),
  ],
);

export type RestrictivePractice = typeof restrictivePractices.$inferSelect;
export type NewRestrictivePractice = typeof restrictivePractices.$inferInsert;
