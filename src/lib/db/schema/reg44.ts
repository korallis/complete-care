import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  index,
  jsonb,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

// ---------------------------------------------------------------------------
// Regulation 44 — Monthly independent visitor visits
// ---------------------------------------------------------------------------

/**
 * reg44_visits — scheduled and completed Reg 44 monthly monitoring visits.
 * Each children's home must receive one independent visit per calendar month.
 */
export const reg44Visits = pgTable(
  'reg44_visits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Date the visit took place (or is scheduled for) */
    visitDate: date('visit_date').notNull(),
    /** UUID of the independent visitor (may or may not be a platform user) */
    visitorId: uuid('visitor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Visitor name — stored separately so external visitors are supported */
    visitorName: text('visitor_name').notNull(),
    /** Names / identifiers of children spoken to during the visit */
    childrenSpokenTo: jsonb('children_spoken_to')
      .$type<string[]>()
      .notNull()
      .default([]),
    /** Names / identifiers of staff spoken to during the visit */
    staffSpokenTo: jsonb('staff_spoken_to')
      .$type<string[]>()
      .notNull()
      .default([]),
    /** List of records reviewed */
    recordsReviewed: jsonb('records_reviewed')
      .$type<string[]>()
      .notNull()
      .default([]),
    /** Areas of the home inspected */
    areasInspected: jsonb('areas_inspected')
      .$type<string[]>()
      .notNull()
      .default([]),
    /** Visit lifecycle: scheduled | in-progress | completed | cancelled */
    status: text('status').notNull().default('scheduled'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('reg44_visits_org_idx').on(t.organisationId),
    index('reg44_visits_date_idx').on(t.visitDate),
    index('reg44_visits_status_idx').on(t.status),
  ],
);

export type Reg44Visit = typeof reg44Visits.$inferSelect;
export type NewReg44Visit = typeof reg44Visits.$inferInsert;

// ---------------------------------------------------------------------------
// Regulation 44 — Structured report linked to a visit
// ---------------------------------------------------------------------------

/**
 * Reg 44 report sections — each report follows a regulatory template.
 */
export interface Reg44ReportSections {
  qualityOfCare: string;
  viewsOfChildren: string;
  education: string;
  health: string;
  safeguarding: string;
  staffing: string;
  environment: string;
  complaintsAndConcerns: string;
  recommendations: string;
}

export const reg44Reports = pgTable(
  'reg44_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The visit this report belongs to */
    visitId: uuid('visit_id')
      .notNull()
      .references(() => reg44Visits.id, { onDelete: 'cascade' }),
    /** Structured report content following regulatory template */
    sections: jsonb('sections').$type<Reg44ReportSections>().notNull(),
    /** Overall summary / executive synopsis */
    summary: text('summary'),
    /** Report lifecycle: draft | submitted | approved */
    status: text('status').notNull().default('draft'),
    /** User who authored the report */
    authorId: uuid('author_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('reg44_reports_org_idx').on(t.organisationId),
    index('reg44_reports_visit_idx').on(t.visitId),
    index('reg44_reports_status_idx').on(t.status),
  ],
);

export type Reg44Report = typeof reg44Reports.$inferSelect;
export type NewReg44Report = typeof reg44Reports.$inferInsert;

// ---------------------------------------------------------------------------
// Recommendation tracking — actions arising from Reg 44 reports
// ---------------------------------------------------------------------------

export const reg44Recommendations = pgTable(
  'reg44_recommendations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The report this recommendation came from */
    reportId: uuid('report_id')
      .notNull()
      .references(() => reg44Reports.id, { onDelete: 'cascade' }),
    /** What needs to be done */
    description: text('description').notNull(),
    /** Priority: high | medium | low */
    priority: text('priority').notNull().default('medium'),
    /** User responsible for completing the recommendation */
    assignedToId: uuid('assigned_to_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Deadline for completion */
    dueDate: date('due_date'),
    /** Lifecycle: open | in-progress | completed | overdue */
    status: text('status').notNull().default('open'),
    /** Date the recommendation was completed */
    completedAt: timestamp('completed_at'),
    /** Notes on resolution or progress */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('reg44_recommendations_org_idx').on(t.organisationId),
    index('reg44_recommendations_report_idx').on(t.reportId),
    index('reg44_recommendations_status_idx').on(t.status),
    index('reg44_recommendations_due_idx').on(t.dueDate),
    index('reg44_recommendations_assigned_idx').on(t.assignedToId),
  ],
);

export type Reg44Recommendation = typeof reg44Recommendations.$inferSelect;
export type NewReg44Recommendation = typeof reg44Recommendations.$inferInsert;

// ---------------------------------------------------------------------------
// Regulation 40 — Notifiable events (must be reported to Ofsted)
// ---------------------------------------------------------------------------

/**
 * Notifiable event categories as defined by Regulation 40.
 */
export type NotifiableEventCategory =
  | 'death'
  | 'serious_injury'
  | 'serious_illness'
  | 'absconding'
  | 'allegation_against_staff'
  | 'serious_complaint'
  | 'other';

export const reg40NotifiableEvents = pgTable(
  'reg40_notifiable_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Category of notifiable event */
    category: text('category').$type<NotifiableEventCategory>().notNull(),
    /** Date the event occurred */
    eventDate: date('event_date').notNull(),
    /** Narrative description of the event */
    description: text('description').notNull(),
    /** Name / identifier of children involved (may be multiple) */
    childrenInvolved: jsonb('children_involved')
      .$type<string[]>()
      .notNull()
      .default([]),
    /** Name / identifier of staff involved */
    staffInvolved: jsonb('staff_involved')
      .$type<string[]>()
      .notNull()
      .default([]),
    /** Date Ofsted was notified */
    notificationDate: date('notification_date'),
    /** Reference number provided by Ofsted */
    ofstedReference: text('ofsted_reference'),
    /** Method of notification: phone | email | online_portal */
    notificationMethod: text('notification_method'),
    /** Actions taken in response */
    actionsTaken: text('actions_taken'),
    /** Outcome / resolution */
    outcome: text('outcome'),
    /** Event status: draft | notified | acknowledged | closed */
    status: text('status').notNull().default('draft'),
    /** User who reported the event internally */
    reportedById: uuid('reported_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('reg40_events_org_idx').on(t.organisationId),
    index('reg40_events_category_idx').on(t.category),
    index('reg40_events_date_idx').on(t.eventDate),
    index('reg40_events_status_idx').on(t.status),
  ],
);

export type Reg40NotifiableEvent = typeof reg40NotifiableEvents.$inferSelect;
export type NewReg40NotifiableEvent = typeof reg40NotifiableEvents.$inferInsert;

// ---------------------------------------------------------------------------
// Transition & Leaving Care — Pathway Plans for 16+ young people
// ---------------------------------------------------------------------------

export const pathwayPlans = pgTable(
  'pathway_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Optional direct person link for chronology / transition evidence */
    personId: uuid('person_id').references(() => persons.id, {
      onDelete: 'set null',
    }),
    /** Name or identifier of the young person */
    youngPersonName: text('young_person_name').notNull(),
    /** Date of birth */
    dateOfBirth: date('date_of_birth'),
    /** Social worker or personal adviser name */
    personalAdviser: text('personal_adviser'),
    /** Plan start date */
    planStartDate: date('plan_start_date').notNull(),
    /** Plan review date */
    planReviewDate: date('plan_review_date'),
    /** Structured plan sections stored as JSON */
    sections: jsonb('sections')
      .$type<{
        accommodation: string;
        education: string;
        employment: string;
        health: string;
        financialSupport: string;
        relationships: string;
        identity: string;
        practicalSkills: string;
      }>()
      .notNull(),
    /** Plan status: draft | active | reviewed | closed */
    status: text('status').notNull().default('draft'),
    /** User who created this plan */
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('pathway_plans_org_idx').on(t.organisationId),
    index('pathway_plans_person_idx').on(t.organisationId, t.personId),
    index('pathway_plans_status_idx').on(t.status),
    index('pathway_plans_review_idx').on(t.planReviewDate),
  ],
);

export type PathwayPlan = typeof pathwayPlans.$inferSelect;
export type NewPathwayPlan = typeof pathwayPlans.$inferInsert;

// ---------------------------------------------------------------------------
// Transition milestones — tracked steps towards independence
// ---------------------------------------------------------------------------

export const transitionMilestones = pgTable(
  'transition_milestones',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The pathway plan this milestone belongs to */
    pathwayPlanId: uuid('pathway_plan_id')
      .notNull()
      .references(() => pathwayPlans.id, { onDelete: 'cascade' }),
    /** Milestone title */
    title: text('title').notNull(),
    /** Detailed description */
    description: text('description'),
    /** Category: accommodation | education | employment | health | finance | life_skills | relationships */
    category: text('category').notNull(),
    /** Target date for completion */
    targetDate: date('target_date'),
    /** Date actually completed */
    completedDate: date('completed_date'),
    /** Status: not-started | in-progress | completed | deferred */
    status: text('status').notNull().default('not-started'),
    /** Supporting notes or evidence */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('transition_milestones_org_idx').on(t.organisationId),
    index('transition_milestones_plan_idx').on(t.pathwayPlanId),
    index('transition_milestones_status_idx').on(t.status),
    index('transition_milestones_category_idx').on(t.category),
  ],
);

export type TransitionMilestone = typeof transitionMilestones.$inferSelect;
export type NewTransitionMilestone = typeof transitionMilestones.$inferInsert;

// ---------------------------------------------------------------------------
// Independent living skills assessment
// ---------------------------------------------------------------------------

export interface Reg44SkillAssessment {
  skill: string;
  rating: 1 | 2 | 3 | 4 | 5;
  notes: string;
}

export interface IndependentLivingSkillsData {
  /** Practical skills like cooking, cleaning, laundry */
  dailyLiving: Reg44SkillAssessment[];
  /** Budgeting, banking, managing money */
  financialCapability: Reg44SkillAssessment[];
  /** Maintaining physical and emotional health */
  healthAndWellbeing: Reg44SkillAssessment[];
  /** Building and maintaining relationships */
  socialAndRelationships: Reg44SkillAssessment[];
  /** Finding and sustaining education, training, or employment */
  educationAndWork: Reg44SkillAssessment[];
  /** Understanding tenancy agreements, paying rent, maintaining a home */
  housingKnowledge: Reg44SkillAssessment[];
}

export const independentLivingAssessments = pgTable(
  'independent_living_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The pathway plan this assessment supports */
    pathwayPlanId: uuid('pathway_plan_id')
      .notNull()
      .references(() => pathwayPlans.id, { onDelete: 'cascade' }),
    /** Date the assessment was carried out */
    assessmentDate: date('assessment_date').notNull(),
    /** Assessor name */
    assessorName: text('assessor_name').notNull(),
    /** Assessor user id (if platform user) */
    assessorId: uuid('assessor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Structured skills assessment data */
    skills: jsonb('skills').$type<IndependentLivingSkillsData>().notNull(),
    /** Overall score (computed / denormalised for dashboard queries) */
    overallScore: integer('overall_score'),
    /** General comments and observations */
    comments: text('comments'),
    /** Is this a baseline (first) assessment? */
    isBaseline: boolean('is_baseline').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('ila_org_idx').on(t.organisationId),
    index('ila_plan_idx').on(t.pathwayPlanId),
    index('ila_date_idx').on(t.assessmentDate),
  ],
);

export type IndependentLivingAssessment =
  typeof independentLivingAssessments.$inferSelect;
export type NewIndependentLivingAssessment =
  typeof independentLivingAssessments.$inferInsert;
