import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  real,
  integer,
  index,
  jsonb,
  boolean,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ---------------------------------------------------------------------------
// Weight Monitoring
// ---------------------------------------------------------------------------

/**
 * Weight monitoring schedule — configurable frequency per person.
 * Supports weekly, fortnightly, or monthly weighing schedules.
 */
export const weightSchedules = pgTable(
  'weight_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person being monitored (references a person record) */
    personId: uuid('person_id').notNull(),
    /** Weighing frequency: weekly | fortnightly | monthly */
    frequency: text('frequency').notNull().default('monthly'),
    /** Percentage weight change that triggers a clinical alert (default 5) */
    changeAlertThreshold: real('change_alert_threshold').notNull().default(5),
    /** Number of days over which threshold is evaluated (default 30) */
    changeAlertDays: integer('change_alert_days').notNull().default(30),
    /** Standing height in cm — used for BMI if provided */
    heightCm: real('height_cm'),
    /** Whether the schedule is active */
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('weight_schedules_org_idx').on(t.organisationId),
    index('weight_schedules_person_idx').on(t.organisationId, t.personId),
  ],
);

/**
 * Individual weight recordings with optional height for BMI calculation.
 */
export const weightRecords = pgTable(
  'weight_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Date of the weighing */
    recordedDate: date('recorded_date').notNull(),
    /** Weight in kilograms */
    weightKg: real('weight_kg').notNull(),
    /** Height in cm at time of recording (optional, may differ from schedule height) */
    heightCm: real('height_cm'),
    /** Auto-calculated BMI (weight_kg / (height_m^2)) */
    bmi: real('bmi'),
    /** BMI category: underweight | normal | overweight | obese_class_1 | obese_class_2 | obese_class_3 */
    bmiCategory: text('bmi_category'),
    /** Free-text notes */
    notes: text('notes'),
    /** User who recorded the weight */
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('weight_records_org_idx').on(t.organisationId),
    index('weight_records_person_idx').on(t.organisationId, t.personId),
    index('weight_records_date_idx').on(t.organisationId, t.personId, t.recordedDate),
  ],
);

// ---------------------------------------------------------------------------
// Waterlow Score
// ---------------------------------------------------------------------------

/**
 * Waterlow pressure ulcer risk assessment.
 * Scores: age, BMI, skin type, mobility, nutrition, tissue malnutrition,
 * neurological deficit, surgery, medication.
 * Risk categories: at risk (10+), high risk (15+), very high risk (20+).
 */
export const waterlowAssessments = pgTable(
  'waterlow_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Assessment date */
    assessmentDate: date('assessment_date').notNull(),
    /** Individual component scores stored as JSON for auditability */
    scores: jsonb('scores').notNull().$type<{
      age: number;
      bmi: number;
      skinType: number;
      mobility: number;
      nutrition: number;
      tissueMalnutrition: number;
      neurologicalDeficit: number;
      surgery: number;
      medication: number;
    }>(),
    /** Total Waterlow score (sum of all components) */
    totalScore: integer('total_score').notNull(),
    /** Risk category: not_at_risk | at_risk | high_risk | very_high_risk */
    riskCategory: text('risk_category').notNull(),
    notes: text('notes'),
    assessedById: uuid('assessed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('waterlow_assessments_org_idx').on(t.organisationId),
    index('waterlow_assessments_person_idx').on(t.organisationId, t.personId),
  ],
);

// ---------------------------------------------------------------------------
// Wound Care
// ---------------------------------------------------------------------------

/**
 * Wound records — each row is a distinct wound on a person.
 * Progress is tracked through wound_assessments linked to this record.
 */
export const wounds = pgTable(
  'wounds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Body location description (e.g. "left heel", "sacrum") */
    location: text('location').notNull(),
    /** Body map coordinates for visual representation: { x, y, region } */
    bodyMapPosition: jsonb('body_map_position').$type<{
      x: number;
      y: number;
      region: string;
    }>(),
    /** Wound type */
    woundType: text('wound_type').notNull(),
    /** Date wound was first identified */
    dateIdentified: date('date_identified').notNull(),
    /** Date wound was resolved/healed (null if still open) */
    dateResolved: date('date_resolved'),
    /** Current status: open | healing | healed | deteriorating | referred */
    status: text('status').notNull().default('open'),
    /** Current treatment plan */
    dressingType: text('dressing_type'),
    dressingFrequency: text('dressing_frequency'),
    specialInstructions: text('special_instructions'),
    nextAssessmentDate: date('next_assessment_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('wounds_org_idx').on(t.organisationId),
    index('wounds_person_idx').on(t.organisationId, t.personId),
    index('wounds_status_idx').on(t.organisationId, t.status),
  ],
);

/**
 * Wound assessments — repeated evaluations of a wound over time.
 * Each assessment captures measurements, wound bed status, and progress.
 */
export const woundAssessments = pgTable(
  'wound_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    woundId: uuid('wound_id')
      .notNull()
      .references(() => wounds.id, { onDelete: 'cascade' }),
    /** Assessment date */
    assessmentDate: date('assessment_date').notNull(),
    /** Dimensions in cm */
    lengthCm: real('length_cm'),
    widthCm: real('width_cm'),
    depthCm: real('depth_cm'),
    /** Pressure ulcer grade: grade_1 | grade_2 | grade_3 | grade_4 | unstageable | null for non-pressure */
    pressureUlcerGrade: text('pressure_ulcer_grade'),
    /** Wound bed description: granulating | epithelialising | sloughy | necrotic | mixed */
    woundBed: text('wound_bed'),
    /** Exudate level: none | low | moderate | heavy */
    exudate: text('exudate'),
    /** Surrounding skin: healthy | inflamed | macerated | dry | oedematous */
    surroundingSkin: text('surrounding_skin'),
    /** Signs of infection */
    signsOfInfection: boolean('signs_of_infection').notNull().default(false),
    /** Pain level 0-10 */
    painLevel: integer('pain_level'),
    /** Photo documentation reference (file path or URL placeholder) */
    photoRef: text('photo_ref'),
    /** Treatment applied during this assessment */
    treatmentApplied: text('treatment_applied'),
    notes: text('notes'),
    assessedById: uuid('assessed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('wound_assessments_org_idx').on(t.organisationId),
    index('wound_assessments_wound_idx').on(t.woundId),
    index('wound_assessments_date_idx').on(t.woundId, t.assessmentDate),
  ],
);

// ---------------------------------------------------------------------------
// Type exports
// ---------------------------------------------------------------------------

export type WeightSchedule = typeof weightSchedules.$inferSelect;
export type NewWeightSchedule = typeof weightSchedules.$inferInsert;

export type WeightRecord = typeof weightRecords.$inferSelect;
export type NewWeightRecord = typeof weightRecords.$inferInsert;

export type WaterlowAssessment = typeof waterlowAssessments.$inferSelect;
export type NewWaterlowAssessment = typeof waterlowAssessments.$inferInsert;

export type Wound = typeof wounds.$inferSelect;
export type NewWound = typeof wounds.$inferInsert;

export type WoundAssessment = typeof woundAssessments.$inferSelect;
export type NewWoundAssessment = typeof woundAssessments.$inferInsert;
