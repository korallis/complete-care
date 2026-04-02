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
 * Care Notes — daily care records and observations for persons.
 *
 * Care notes are immutable once created (regulatory requirement).
 * Corrections are made by adding a new note that references the original.
 *
 * TENANT ISOLATION: Every query MUST filter by organisationId.
 * Accessing a care note by ID requires assertBelongsToOrg() check.
 *
 * Relations are defined in ./relations.ts to avoid circular imports.
 */

// ---------------------------------------------------------------------------
// JSONB field type definitions
// ---------------------------------------------------------------------------

export type CareNoteMood =
  | 'happy'
  | 'content'
  | 'anxious'
  | 'upset'
  | 'withdrawn';

export type PersonalCareItem = {
  washed: boolean;
  dressed: boolean;
  oralCare: boolean;
  notes?: string;
};

export type NutritionMeal = {
  offered: boolean;
  portionConsumed: 'none' | 'quarter' | 'half' | 'three_quarters' | 'all';
  notes?: string;
};

export type NutritionData = {
  breakfast?: NutritionMeal;
  lunch?: NutritionMeal;
  dinner?: NutritionMeal;
  fluidsNote?: string;
};

export type ChildrenHomeDetails = {
  activities?: string;
  incidents?: string;
  visitors?: string;
  contacts?: string;
  educationAttendance?: string;
  bedtime?: string;
};

export type CareNoteShift =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'waking_night';

export const careNotes = pgTable(
  'care_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Tenant scope — all queries MUST include this in WHERE clause */
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The person this note is about */
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    /** The staff member who created the note */
    authorId: uuid('author_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Denormalised author name for display (persists even if user is deleted) */
    authorName: text('author_name'),
    /** Note category: daily | handover | incident | safeguarding | medical */
    noteType: text('note_type').notNull().default('daily'),
    /** Shift period: morning | afternoon | evening | night | waking_night */
    shift: text('shift'),
    content: text('content').notNull(),

    // -----------------------------------------------------------------------
    // Structured observation fields (JSONB)
    // -----------------------------------------------------------------------
    /** Mood observation: happy | content | anxious | upset | withdrawn */
    mood: text('mood'),
    /** Personal care checklist */
    personalCare: jsonb('personal_care').$type<PersonalCareItem>(),
    /** Nutrition tracking per meal */
    nutrition: jsonb('nutrition').$type<NutritionData>(),
    /** Free-text mobility observations */
    mobility: text('mobility'),
    /** Free-text health observations */
    health: text('health'),
    /** Children-home specific running-record details */
    childrenHomeDetails: jsonb('children_home_details').$type<ChildrenHomeDetails>(),
    /** Handover points for next shift */
    handover: text('handover'),

    /** The care period this note covers (e.g. '07:00-14:00') */
    shiftPeriod: text('shift_period'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    /** Primary tenant isolation index */
    index('care_notes_organisation_id_idx').on(t.organisationId),
    /** Fetch notes for a specific person (timeline view) */
    index('care_notes_organisation_person_idx').on(
      t.organisationId,
      t.personId,
    ),
    /** Filter by note type within an org */
    index('care_notes_organisation_type_idx').on(
      t.organisationId,
      t.noteType,
    ),
    /** Chronological ordering within an org */
    index('care_notes_organisation_created_at_idx').on(
      t.organisationId,
      t.createdAt,
    ),
    /** Filter by shift */
    index('care_notes_organisation_shift_idx').on(
      t.organisationId,
      t.shift,
    ),
    /** Filter by author */
    index('care_notes_organisation_author_idx').on(
      t.organisationId,
      t.authorId,
    ),
  ],
);

export type CareNote = typeof careNotes.$inferSelect;
export type NewCareNote = typeof careNotes.$inferInsert;
