import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { persons } from './persons';
import { users } from './users';

export const complaints = pgTable(
  'childrens_complaints',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    personId: uuid('person_id')
      .notNull()
      .references(() => persons.id, { onDelete: 'cascade' }),
    complaintDate: text('complaint_date').notNull(),
    raisedBy: text('raised_by').notNull(),
    nature: text('nature').notNull(),
    desiredOutcome: text('desired_outcome'),
    status: text('status').notNull().default('received'),
    advocacyOffered: boolean('advocacy_offered').notNull().default(false),
    advocacyNotes: text('advocacy_notes'),
    investigationNotes: text('investigation_notes'),
    outcomeSummary: text('outcome_summary'),
    satisfaction: text('satisfaction'),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('childrens_complaints_org_idx').on(t.organisationId),
    index('childrens_complaints_org_person_idx').on(t.organisationId, t.personId),
    index('childrens_complaints_org_status_idx').on(t.organisationId, t.status),
  ],
);

export type Complaint = typeof complaints.$inferSelect;
export type NewComplaint = typeof complaints.$inferInsert;
