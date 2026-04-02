import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  numeric,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ---------------------------------------------------------------------------
// SMART Goals
// ---------------------------------------------------------------------------

/**
 * SMART Goals — outcome-focused goals per person in supported living.
 * Each goal has a SMART breakdown, category, and baseline/target.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */
export const goals = pgTable(
  'goals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this goal belongs to */
    personId: uuid('person_id').notNull(),
    /** Short title for the goal */
    title: text('title').notNull(),
    description: text('description'),
    /**
     * Goal category:
     * independent_living | health_wellbeing | social_community |
     * communication | emotional_wellbeing
     */
    category: text('category').notNull(),
    /** SMART: Specific — what exactly will be accomplished */
    smartSpecific: text('smart_specific').notNull(),
    /** SMART: Measurable — how will progress be measured */
    smartMeasurable: text('smart_measurable').notNull(),
    /** SMART: Achievable — is the goal realistic */
    smartAchievable: text('smart_achievable').notNull(),
    /** SMART: Relevant — why does this goal matter */
    smartRelevant: text('smart_relevant').notNull(),
    /** SMART: Time-bound — target completion date */
    smartTimeBound: text('smart_time_bound').notNull(),
    /** Baseline assessment at goal creation */
    baselineAssessment: text('baseline_assessment'),
    /** Numeric baseline value for measurable tracking */
    baselineValue: numeric('baseline_value'),
    /** Target value to achieve */
    targetValue: numeric('target_value'),
    /** Next review date */
    reviewDate: date('review_date'),
    /** Goal lifecycle: active | completed | paused | cancelled */
    status: text('status').notNull().default('active'),
    /** Who participated in setting this goal (JSON array of {userId, name, role}) */
    participants: jsonb('participants'),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('goals_organisation_id_idx').on(t.organisationId),
    index('goals_person_id_idx').on(t.personId),
    index('goals_category_idx').on(t.category),
    index('goals_status_idx').on(t.status),
  ],
);

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

// ---------------------------------------------------------------------------
// Goal Progress Reviews (traffic-light system)
// ---------------------------------------------------------------------------

/**
 * Goal reviews — periodic traffic-light progress assessments.
 * red = regression, amber = maintaining, green = progressing.
 */
export const goalReviews = pgTable(
  'goal_reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    goalId: uuid('goal_id')
      .notNull()
      .references(() => goals.id, { onDelete: 'cascade' }),
    /** Date of this review */
    reviewDate: date('review_date').notNull(),
    /** The staff member who conducted the review */
    reviewerId: uuid('reviewer_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Traffic-light status: red | amber | green */
    status: text('status').notNull(),
    /** Current measured value at time of review */
    currentValue: numeric('current_value'),
    /** Narrative notes on progress */
    notes: text('notes'),
    /** Evidence supporting the assessment (e.g. file references, observations) */
    evidence: text('evidence'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('goal_reviews_organisation_id_idx').on(t.organisationId),
    index('goal_reviews_goal_id_idx').on(t.goalId),
    index('goal_reviews_review_date_idx').on(t.reviewDate),
  ],
);

export type GoalReview = typeof goalReviews.$inferSelect;
export type NewGoalReview = typeof goalReviews.$inferInsert;

// ---------------------------------------------------------------------------
// Skills Development Tracking
// ---------------------------------------------------------------------------

/**
 * Skill domains — groups of related skills (e.g. "Personal Care", "Cooking").
 */
export const skillDomains = pgTable(
  'skill_domains',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    /** Display order */
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('skill_domains_organisation_id_idx').on(t.organisationId)],
);

export type SkillDomain = typeof skillDomains.$inferSelect;
export type NewSkillDomain = typeof skillDomains.$inferInsert;

/**
 * Skills — individual competencies within a domain.
 */
export const skills = pgTable(
  'skills',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    domainId: uuid('domain_id')
      .notNull()
      .references(() => skillDomains.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('skills_organisation_id_idx').on(t.organisationId),
    index('skills_domain_id_idx').on(t.domainId),
  ],
);

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

/**
 * Skill assessments — competency level recordings per person per skill.
 * Levels: prompted | verbal_prompt | physical_prompt | independent
 */
export const skillAssessments = pgTable(
  'skill_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    /** Competency level: prompted | verbal_prompt | physical_prompt | independent */
    competencyLevel: text('competency_level').notNull(),
    /** Date of this assessment */
    assessmentDate: date('assessment_date').notNull(),
    assessorId: uuid('assessor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('skill_assessments_organisation_id_idx').on(t.organisationId),
    index('skill_assessments_person_id_idx').on(t.personId),
    index('skill_assessments_skill_id_idx').on(t.skillId),
    index('skill_assessments_date_idx').on(t.assessmentDate),
  ],
);

export type SkillAssessment = typeof skillAssessments.$inferSelect;
export type NewSkillAssessment = typeof skillAssessments.$inferInsert;

// ---------------------------------------------------------------------------
// Community Access Recording
// ---------------------------------------------------------------------------

/**
 * Community access logs — records of community activities per person.
 */
export const communityAccess = pgTable(
  'community_access',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Date of the activity */
    activityDate: date('activity_date').notNull(),
    /** Where they went */
    destination: text('destination').notNull(),
    /** Duration in minutes */
    durationMinutes: integer('duration_minutes').notNull(),
    /** Who accompanied the person */
    accompaniedBy: text('accompanied_by'),
    /** Outcome of the activity */
    outcomes: text('outcomes'),
    /** Skills practised during the activity (JSON array of skill names) */
    skillsPractised: jsonb('skills_practised'),
    notes: text('notes'),
    recordedBy: uuid('recorded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('community_access_organisation_id_idx').on(t.organisationId),
    index('community_access_person_id_idx').on(t.personId),
    index('community_access_date_idx').on(t.activityDate),
  ],
);

export type CommunityAccess = typeof communityAccess.$inferSelect;
export type NewCommunityAccess = typeof communityAccess.$inferInsert;

// ---------------------------------------------------------------------------
// Support Hour Logging
// ---------------------------------------------------------------------------

/**
 * Support hours — planned vs actual support time per person.
 * Used for variance reporting and commissioner reporting.
 */
export const supportHours = pgTable(
  'support_hours',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Week starting date (always a Monday) */
    weekStarting: date('week_starting').notNull(),
    /** Planned support hours for this week */
    plannedHours: numeric('planned_hours').notNull(),
    /** Actual support hours delivered */
    actualHours: numeric('actual_hours').notNull().default('0'),
    /** Reason for any variance */
    varianceNotes: text('variance_notes'),
    /** Commissioner reference / funding stream */
    commissionerRef: text('commissioner_ref'),
    recordedBy: uuid('recorded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('support_hours_organisation_id_idx').on(t.organisationId),
    index('support_hours_person_id_idx').on(t.personId),
    index('support_hours_week_idx').on(t.weekStarting),
  ],
);

export type SupportHour = typeof supportHours.$inferSelect;
export type NewSupportHour = typeof supportHours.$inferInsert;
