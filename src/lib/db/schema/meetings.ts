import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

export type MeetingActionItem = {
  action: string;
  owner: string;
  dueDate: string;
  completed: boolean;
};

export const meetings = pgTable(
  'childrens_meetings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    meetingDate: text('meeting_date').notNull(),
    title: text('title').notNull(),
    childAttendees: jsonb('child_attendees').$type<string[]>().default([]),
    staffAttendees: jsonb('staff_attendees').$type<string[]>().default([]),
    agendaItems: jsonb('agenda_items').$type<string[]>().default([]),
    discussionPoints: text('discussion_points').notNull(),
    decisions: text('decisions').notNull(),
    actions: jsonb('actions').$type<MeetingActionItem[]>().default([]),
    sharedWithReg44: boolean('shared_with_reg44').notNull().default(true),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('childrens_meetings_org_idx').on(t.organisationId),
    index('childrens_meetings_org_person_idx').on(t.organisationId, t.personId),
    index('childrens_meetings_org_date_idx').on(t.organisationId, t.meetingDate),
  ],
);

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
