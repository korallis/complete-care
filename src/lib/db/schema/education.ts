import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  integer,
  boolean,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ── Enums ─────────────────────────────────────────────────────────────

export const pepTermEnum = pgEnum('pep_term', [
  'autumn',
  'spring',
  'summer',
]);

export const pepStatusEnum = pgEnum('pep_status', [
  'draft',
  'scheduled',
  'completed',
  'reviewed',
]);

export const senStatusEnum = pgEnum('sen_status', [
  'none',
  'sen_support',
  'ehcp',
  'assessment_pending',
]);

export const attendanceMarkEnum = pgEnum('attendance_mark', [
  'present',
  'late',
  'authorised_absent',
  'unauthorised_absent',
  'excluded',
  'not_required',
]);

export const exclusionTypeEnum = pgEnum('exclusion_type', [
  'fixed_term',
  'permanent',
]);

export const sdqRespondentEnum = pgEnum('sdq_respondent', [
  'self',
  'parent_carer',
  'teacher',
]);

// ── School records ────────────────────────────────────────────────────

export const schoolRecords = pgTable(
  'school_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The child / young person this record relates to */
    personId: uuid('person_id').notNull(),
    schoolName: text('school_name').notNull(),
    schoolAddress: text('school_address'),
    schoolPhone: text('school_phone'),
    yearGroup: text('year_group'),
    senStatus: senStatusEnum('sen_status').notNull().default('none'),
    ehcpInPlace: boolean('ehcp_in_place').notNull().default(false),
    designatedTeacherName: text('designated_teacher_name'),
    designatedTeacherEmail: text('designated_teacher_email'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    isCurrent: boolean('is_current').notNull().default(true),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('school_records_org_idx').on(t.organisationId),
    index('school_records_person_idx').on(t.organisationId, t.personId),
  ],
);

// ── PEPs (Personal Education Plans) ──────────────────────────────────

export const personalEducationPlans = pgTable(
  'personal_education_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    schoolRecordId: uuid('school_record_id')
      .notNull()
      .references(() => schoolRecords.id, { onDelete: 'cascade' }),
    /** Academic year e.g. "2025-2026" */
    academicYear: text('academic_year').notNull(),
    term: pepTermEnum('term').notNull(),
    version: integer('version').notNull().default(1),
    status: pepStatusEnum('status').notNull().default('draft'),
    /** Current attainment narrative */
    currentAttainment: text('current_attainment'),
    /** SMART targets */
    targets: text('targets'),
    /** Barriers to learning */
    barriersToLearning: text('barriers_to_learning'),
    /** Emotional wellbeing at school */
    emotionalWellbeing: text('emotional_wellbeing'),
    /** Attendance summary for the term */
    attendanceSummary: text('attendance_summary'),
    /** Extra-curricular activities */
    extraCurricular: text('extra_curricular'),
    /** Pupil Premium Plus allocation for this PEP period (in pence) */
    ppPlusAllocation: integer('pp_plus_allocation'),
    /** Planned use of Pupil Premium Plus */
    ppPlusPlannedUse: text('pp_plus_planned_use'),
    /** Actual spend (in pence) */
    ppPlusActualSpend: integer('pp_plus_actual_spend'),
    /** Meeting date for the PEP review */
    meetingDate: timestamp('meeting_date'),
    /** Notes / minutes from the meeting */
    meetingNotes: text('meeting_notes'),
    createdById: uuid('created_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('pep_org_idx').on(t.organisationId),
    index('pep_person_idx').on(t.organisationId, t.personId),
    index('pep_school_idx').on(t.schoolRecordId),
  ],
);

// ── PEP meeting attendees ─────────────────────────────────────────────

export const pepAttendees = pgTable(
  'pep_attendees',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    pepId: uuid('pep_id')
      .notNull()
      .references(() => personalEducationPlans.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    role: text('role').notNull(),
    email: text('email'),
    attended: boolean('attended').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('pep_attendees_pep_idx').on(t.pepId),
  ],
);

// ── Daily education attendance ────────────────────────────────────────

export const educationAttendance = pgTable(
  'education_attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    schoolRecordId: uuid('school_record_id')
      .notNull()
      .references(() => schoolRecords.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    amMark: attendanceMarkEnum('am_mark').notNull(),
    pmMark: attendanceMarkEnum('pm_mark').notNull(),
    notes: text('notes'),
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('edu_attendance_org_idx').on(t.organisationId),
    index('edu_attendance_person_date_idx').on(
      t.organisationId,
      t.personId,
      t.date,
    ),
  ],
);

// ── Exclusion records ─────────────────────────────────────────────────

export const exclusionRecords = pgTable(
  'exclusion_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    schoolRecordId: uuid('school_record_id')
      .notNull()
      .references(() => schoolRecords.id, { onDelete: 'cascade' }),
    exclusionType: exclusionTypeEnum('exclusion_type').notNull(),
    reason: text('reason').notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date'),
    /** Duration in school days */
    durationDays: integer('duration_days'),
    notes: text('notes'),
    appealLodged: boolean('appeal_lodged').notNull().default(false),
    appealOutcome: text('appeal_outcome'),
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('exclusion_org_idx').on(t.organisationId),
    index('exclusion_person_idx').on(t.organisationId, t.personId),
  ],
);

// ── Pupil Premium Plus tracking ───────────────────────────────────────

export const pupilPremiumPlusRecords = pgTable(
  'pupil_premium_plus_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    /** Academic year e.g. "2025-2026" */
    academicYear: text('academic_year').notNull(),
    /** Total allocation (in pence) */
    allocationAmount: integer('allocation_amount').notNull(),
    /** Planned use description */
    plannedUse: text('planned_use').notNull(),
    /** Category of spend */
    category: text('category'),
    /** Actual amount spent (in pence) */
    actualSpend: integer('actual_spend').notNull().default(0),
    /** Evidence / impact notes */
    evidenceOfImpact: text('evidence_of_impact'),
    recordedById: uuid('recorded_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('pp_plus_org_idx').on(t.organisationId),
    index('pp_plus_person_year_idx').on(
      t.organisationId,
      t.personId,
      t.academicYear,
    ),
  ],
);

// ── SDQ (Strengths & Difficulties Questionnaire) ─────────────────────

export const sdqAssessments = pgTable(
  'sdq_assessments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id').notNull(),
    assessmentDate: date('assessment_date').notNull(),
    respondent: sdqRespondentEnum('respondent').notNull(),
    /** Emotional symptoms (0-10) */
    emotionalScore: integer('emotional_score').notNull(),
    /** Conduct problems (0-10) */
    conductScore: integer('conduct_score').notNull(),
    /** Hyperactivity/inattention (0-10) */
    hyperactivityScore: integer('hyperactivity_score').notNull(),
    /** Peer relationship problems (0-10) */
    peerScore: integer('peer_score').notNull(),
    /** Prosocial behaviour (0-10) */
    prosocialScore: integer('prosocial_score').notNull(),
    /** Total difficulties = emotional + conduct + hyperactivity + peer (0-40) */
    totalDifficulties: integer('total_difficulties').notNull(),
    /** Impact score (0-10) */
    impactScore: integer('impact_score'),
    notes: text('notes'),
    assessedById: uuid('assessed_by_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('sdq_org_idx').on(t.organisationId),
    index('sdq_person_idx').on(t.organisationId, t.personId),
    index('sdq_person_date_idx').on(t.organisationId, t.personId, t.assessmentDate),
  ],
);

// ── Type exports ──────────────────────────────────────────────────────

export type SchoolRecord = typeof schoolRecords.$inferSelect;
export type NewSchoolRecord = typeof schoolRecords.$inferInsert;

export type PersonalEducationPlan = typeof personalEducationPlans.$inferSelect;
export type NewPersonalEducationPlan = typeof personalEducationPlans.$inferInsert;

export type PepAttendee = typeof pepAttendees.$inferSelect;
export type NewPepAttendee = typeof pepAttendees.$inferInsert;

export type EducationAttendance = typeof educationAttendance.$inferSelect;
export type NewEducationAttendance = typeof educationAttendance.$inferInsert;

export type ExclusionRecord = typeof exclusionRecords.$inferSelect;
export type NewExclusionRecord = typeof exclusionRecords.$inferInsert;

export type PupilPremiumPlusRecord = typeof pupilPremiumPlusRecords.$inferSelect;
export type NewPupilPremiumPlusRecord = typeof pupilPremiumPlusRecords.$inferInsert;

export type SdqAssessment = typeof sdqAssessments.$inferSelect;
export type NewSdqAssessment = typeof sdqAssessments.$inferInsert;
